from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import msal
import os
import httpx
from pathlib import Path
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta

from database import get_db
from models import RegisteredUser
from mail_util import send_admin_notification
from database import SessionLocal
from .integration import run_sync_sharepoint

load_dotenv()

# Fixed SSL cert issue for corporate Windows environments
if "SSL_CERT_FILE" in os.environ:
    cert_file = os.environ["SSL_CERT_FILE"]
    if not os.path.exists(cert_file):
        print(f"AUTH MODULE WARNING: SSL_CERT_FILE points to non-existent file: {cert_file}")
        print("AUTH MODULE: Removing SSL_CERT_FILE environment variable to use default certs.")
        del os.environ["SSL_CERT_FILE"]


router = APIRouter(prefix="/api/auth", tags=["auth"])

# Azure Config
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET")
TENANT_ID = os.getenv("AZURE_TENANT_ID")
REDIRECT_URI = os.getenv("AZURE_REDIRECT_URI", "https://login.microsoftonline.com/common/oauth2/nativeclient")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

# Debug: Print loaded values at startup
print(f"AUTH MODULE: Client ID = {CLIENT_ID}")
print(f"AUTH MODULE: Tenant ID = {TENANT_ID}")
print(f"AUTH MODULE: Redirect URI = {REDIRECT_URI}")
print(f"AUTH MODULE: Secret loaded = {'YES' if CLIENT_SECRET else 'NO'} (length: {len(CLIENT_SECRET) if CLIENT_SECRET else 0})")

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day

# MSAL app (used only for generating the login URL)
msal_app = msal.ConfidentialClientApplication(
    CLIENT_ID,
    authority=AUTHORITY,
    client_credential=CLIENT_SECRET
)

@router.get("/login")
async def login():
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=REDIRECT_URI,
        state="cobot"
    )
    return RedirectResponse(auth_url)

async def background_sync_wrapper():
    """Wrapper to run sync in background with its own DB session."""
    print("BACKGROUND SYNC: Starting auto-sync after login...")
    db = SessionLocal()
    try:
        await run_sync_sharepoint(db)
        print("BACKGROUND SYNC: Auto-sync completed.")
    except Exception as e:
        print(f"BACKGROUND SYNC ERROR: {e}")
    finally:
        db.close()

@router.get("/callback")
async def callback(code: str, background_tasks: BackgroundTasks, state: str = None, session_state: str = None, response: Response = None, db: Session = Depends(get_db)):
    print(f"AUTH CALLBACK: Received callback with state={state}")
    try:
        # Manual OAuth2.0 Token Exchange to bypass MSAL limitations/abstraction
        token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
        token_data = {
            "client_id": CLIENT_ID,
            "scope": "openid profile email User.Read",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
            "client_secret": CLIENT_SECRET,
        }
        
        print(f"AUTH DEBUG: Exchanging code for token at {token_url}")
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(token_url, data=token_data)
            print(f"AUTH DEBUG: Token endpoint returned status {resp.status_code}")
            
            if resp.status_code != 200:
                try:
                    error_json = resp.json()
                    print(f"AUTH CALLBACK ERROR: {error_json}")
                    raise HTTPException(status_code=400, detail=error_json.get("error_description", "Token exchange failed"))
                except Exception as e:
                    print(f"AUTH CALLBACK RAW ERROR: {resp.text}")
                    raise HTTPException(status_code=400, detail=f"Token exchange failed: {resp.text}")
            
            result = resp.json()

        # Extract claims from ID Token
        id_token = result.get("id_token")
        if not id_token:
            print("AUTH CALLBACK ERROR: No id_token in response")
            raise HTTPException(status_code=400, detail="Authentication failed (no id_token)")
            
        # Decode claims (unverified for simplicity in this bridge)
        from jose import jwt as jose_jwt
        user_info = jose_jwt.get_unverified_claims(id_token)
        email = (user_info.get("preferred_username") or user_info.get("email")).lower()
        name = user_info.get("name")
        print(f"AUTH CALLBACK: User authenticated: {email}")
        
        # Auto-registration
        user = db.query(RegisteredUser).filter(RegisteredUser.email == email).first()
        if not user:
            user = RegisteredUser(
                email=email,
                name=name,
                role="User",
                is_active=1
            )
            db.add(user)
            db.commit()
            print(f"AUTH CALLBACK: New user registered: {email}")
            
            # Send notification to admins
            try:
                send_admin_notification(email, name)
            except Exception as e:
                print(f"AUTH CALLBACK WARNING: Failed to send admin email: {e}")
        
        # Create our own JWT session
        token_data = {
            "sub": email,
            "name": name,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }
        encoded_jwt = jwt.encode(token_data, JWT_SECRET, algorithm=ALGORITHM)
        
        # Set cookie and redirect to home
        response = RedirectResponse(url="/cobot/home")
        
        # Trigger background sync "right at that time" as requested
        background_tasks.add_task(background_sync_wrapper)
        
        response.set_cookie(
            key="auth_token",
            value=encoded_jwt,
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=True,
            path="/"  # Cookie available across all paths
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"AUTH CALLBACK EXCEPTION: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    # Add Cache-Control to prevent browser from caching old role status
    token = request.cookies.get("auth_token")
    if not token:
        return {"authenticated": False}
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        email = payload.get("sub", "").lower().strip()
        
        if not email:
            print("AUTH ERROR: Token payload has no 'sub' claim")
            return {"authenticated": False}

        # Look up role from database
        user = db.query(RegisteredUser).filter(RegisteredUser.email == email, RegisteredUser.is_active == 1).first()
        
        role = user.role if user else "User"
        
        # Secondary check: If email is in ADMIN_EMAILS list, promote to Admin
        # Re-fetch from env to be sure it's fresh
        raw_admin_emails = os.getenv("ADMIN_EMAILS", "")
        current_admin_emails = [e.strip().lower() for e in raw_admin_emails.split(",") if e.strip()]
        
        if email in current_admin_emails:
            if role != "Admin":
                print(f"AUTH: Promoting {email} to Admin based on ADMIN_EMAILS config.")
            role = "Admin"
            
        print(f"AUTH CHECK: {email} -> Identified as {role}")
        
        return {
            "authenticated": True,
            "user": {
                "email": email,
                "name": payload.get("name"),
                "role": role
            }
        }
    except Exception as e:
        print(f"AUTH ERROR in /me for token: {str(e)}")
        return {"authenticated": False}

@router.get("/logout")
async def logout(response: Response):
    response = RedirectResponse(url="/cobot/")
    response.delete_cookie("auth_token")
    return response