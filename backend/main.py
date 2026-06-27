from fastapi import FastAPI, Request
# Force reload trigger
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import os
from routers import departments, integration, admin, bots, spocs, visits, upload, summary, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RPA Console API",
    description="Backend API for RPA Automation Console",
    version="1.0.0"
)

# Robust .env loading
from dotenv import load_dotenv
from pathlib import Path
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Startup Debug
print(f"MAIN STARTUP: CWD = {os.getcwd()}")
print(f"MAIN STARTUP: .env path = {env_path}")
print(f"MAIN STARTUP: .env exists: {env_path.exists()}")
if env_path.exists():
    print(f"MAIN STARTUP: ADMIN_EMAILS: {os.getenv('ADMIN_EMAILS')}")


# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for UAT/Dev simplicity, or restrict to domain if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to handle /cobot subpath and basic logging
@app.middleware("http")
async def subpath_middleware(request: Request, call_next):
    try:
        # Debug print the incoming request path
        print(f"DEBUG: Incoming request path: {request.url.path}")
        
        # Rewrite /cobot/api requests to /api so they match routers
        if request.url.path.startswith("/cobot/api"):
            request.scope["path"] = request.url.path.replace("/cobot/api", "/api", 1)
            print(f"DEBUG: Rewritten path: {request.scope['path']}")
            
        response = await call_next(request)
        return response
    except Exception as e:
        import traceback
        print(f"ERROR in middleware: {str(e)}")
        traceback.print_exc()
        raise e

# Include routers
app.include_router(upload.router)
app.include_router(summary.router)
app.include_router(departments.router)
app.include_router(bots.router)
app.include_router(integration.router)
app.include_router(admin.router)
app.include_router(spocs.router)
app.include_router(visits.router)
app.include_router(auth.router)

# --- Scheduler Setup ---
from apscheduler.schedulers.background import BackgroundScheduler
from send_weekly_summary import run_weekly_summary

scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    # Run every Friday at 17:00 (5:00 PM)
    scheduler.add_job(run_weekly_summary, 'cron', day_of_week='fri', hour=17, minute=0)
    scheduler.start()
    print("Weekly summary scheduler started: Scheduled for every Friday at 17:00.")

@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()
# -----------------------

# Mount frontend static files
from pathlib import Path

# Build path to frontend/dist
frontend_dist = (Path(__file__).parent / "../frontend/dist").resolve()
print(f"Frontend dist path: {frontend_dist}")
print(f"Assets exist: {(frontend_dist / 'assets').exists()}")

# Mount /cobot/assets to match frontend requests
assets_path = frontend_dist / "assets"
if assets_path.exists():
    app.mount("/cobot/assets", StaticFiles(directory=str(assets_path)), name="assets")
else:
    print(f"WARNING: Assets directory not found at {assets_path}")

@app.get("/", include_in_schema=False)
async def home_root():
    """Serve the SPA index.html at root (Nginx strips /cobot/ prefix)."""
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend build not found."}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API requests are already handled by routers above
    if full_path.startswith("api"):
        return {"error": "API endpoint not found", "path": full_path}
    
    # Clean the path: Remove 'cobot/' prefix if Nginx didn't strip it,
    # or handle the path if Nginx already stripped it.
    target_path = full_path
    if target_path.startswith("cobot"):
        if target_path.startswith("cobot/"):
            target_path = target_path.replace("cobot/", "", 1)
        else:
            target_path = target_path.replace("cobot", "", 1)
    
    # Basic normalization
    if target_path.startswith("/"):
        target_path = target_path[1:]

    # 1. Check if it's the root or a folder request
    if not target_path or target_path == "" or target_path == "/":
        index_path = frontend_dist / "index.html"
        if index_path.exists():
            return FileResponse(index_path)

    # 2. Check if it's a physical file (CSS, JS, Images)
    file_path = (frontend_dist / target_path).resolve(strict=False)
    
    # Security check: Ensure the file is inside the dist directory
    if file_path.exists() and file_path.is_file() and str(file_path).startswith(str(frontend_dist)):
        if target_path.endswith(".pdf"):
            return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(target_path))
        return FileResponse(file_path)
    
    # 3. Fallback to index.html for SPA routing (e.g. /home, /admin)
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
        
    return {"message": "Frontend build not found. Please run 'npm run build' in the frontend directory."}
