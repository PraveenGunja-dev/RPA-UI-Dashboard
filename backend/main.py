from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import upload, summary, departments, bots, spocs, visits

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RPA Console API",
    description="Backend API for RPA Automation Console",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(summary.router)
app.include_router(departments.router)
app.include_router(bots.router)
app.include_router(spocs.router)
app.include_router(visits.router)


@app.get("/")
def root():
    return {"message": "RPA Console API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "api": "online"}
