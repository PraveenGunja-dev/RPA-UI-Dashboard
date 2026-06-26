from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel
import os

from database import get_db
from models import FileLog, Bot, Department, SPOC, RegisteredUser


router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

# Pydantic schemas for bot management
class BotCreate(BaseModel):
    use_case_name: str
    use_case_no: Optional[str] = None
    bot_name: Optional[str] = None
    department_id: Optional[int] = None
    spoc_id: Optional[int] = None
    status: Optional[str] = "Active"
    developer: Optional[str] = None
    hours_saved_monthly: Optional[float] = 0
    pdd_link: Optional[str] = None
    schedule_time: Optional[str] = None
    description: Optional[str] = None

class BotUpdate(BotCreate):
    pass

class SPOCOut(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = "User"

class UserUpdate(UserCreate):
    is_active: Optional[int] = 1

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: str
    is_active: int
    
    class Config:
        from_attributes = True

# File Logs endpoints
@router.get("/logs")
def get_file_logs(db: Session = Depends(get_db)):
    """Fetch all file process logs."""
    logs = db.query(FileLog).order_by(FileLog.file_date.desc(), FileLog.id.desc()).all()
    return logs

@router.get("/download/{log_id}")
def download_file(log_id: int, db: Session = Depends(get_db)):
    """Download the archived Excel file."""
    log = db.query(FileLog).filter(FileLog.id == log_id).first()
    if not log or not log.file_path:
        raise HTTPException(status_code=404, detail="File log not found or file not available")
    
    abs_path = os.path.join(os.getcwd(), log.file_path)
    
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="Physical file not found")
        
    return FileResponse(
        path=abs_path,
        filename=os.path.basename(abs_path),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

# SPOC endpoints
@router.get("/spocs", response_model=List[SPOCOut])
def get_all_spocs(db: Session = Depends(get_db)):
    """Get all SPOCs for dropdown selection."""
    spocs = db.query(SPOC).order_by(SPOC.name).all()
    return spocs

# Bot CRUD endpoints
@router.post("/bots")
def create_bot(bot_data: BotCreate, db: Session = Depends(get_db)):
    """Create a new bot."""
    # Check if bot with same name already exists
    existing = db.query(Bot).filter(Bot.use_case_name == bot_data.use_case_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bot with this use case name already exists")
    
    new_bot = Bot(
        use_case_name=bot_data.use_case_name,
        use_case_no=bot_data.use_case_no,
        bot_name=bot_data.bot_name or bot_data.use_case_name,
        department_id=bot_data.department_id,
        spoc_id=bot_data.spoc_id,
        status=bot_data.status,
        developer=bot_data.developer,
        hours_saved_monthly=bot_data.hours_saved_monthly,
        pdd_link=bot_data.pdd_link,
        schedule_time=bot_data.schedule_time,
        description=bot_data.description
    )
    db.add(new_bot)
    db.commit()
    db.refresh(new_bot)
    return {"id": new_bot.id, "message": "Bot created successfully"}

@router.put("/bots/{bot_id}")
def update_bot(bot_id: int, bot_data: BotUpdate, db: Session = Depends(get_db)):
    """Update an existing bot."""
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Update fields
    bot.use_case_name = bot_data.use_case_name
    bot.use_case_no = bot_data.use_case_no
    bot.bot_name = bot_data.bot_name or bot_data.use_case_name
    bot.department_id = bot_data.department_id if bot_data.department_id else bot.department_id
    bot.spoc_id = bot_data.spoc_id if bot_data.spoc_id else None
    bot.status = bot_data.status
    bot.developer = bot_data.developer
    bot.hours_saved_monthly = bot_data.hours_saved_monthly
    bot.pdd_link = bot_data.pdd_link
    bot.schedule_time = bot_data.schedule_time
    bot.description = bot_data.description
    
    db.commit()
    return {"message": "Bot updated successfully"}

@router.delete("/bots/{bot_id}")
def delete_bot(bot_id: int, db: Session = Depends(get_db)):
    """Delete a bot."""
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    db.delete(bot)
    db.commit()
    return {"message": "Bot deleted successfully"}


# User Management endpoints
@router.get("/users", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db)):
    """Fetch all registered users."""
    users = db.query(RegisteredUser).all()
    return users

@router.post("/users")
def add_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    existing = db.query(RegisteredUser).filter(RegisteredUser.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already registered")
    
    new_user = RegisteredUser(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Update user details or status."""
    user = db.query(RegisteredUser).filter(RegisteredUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email = user_data.email
    user.name = user_data.name
    user.role = user_data.role
    user.is_active = user_data.is_active
    
    db.commit()
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Remove a registered user."""
    user = db.query(RegisteredUser).filter(RegisteredUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/check-user/{email}")
def check_user_registration(email: str, db: Session = Depends(get_db)):
    """Check if an email is registered and active."""
    user = db.query(RegisteredUser).filter(RegisteredUser.email == email, RegisteredUser.is_active == 1).first()
    if not user:
        return {"registered": False}
    return {"registered": True, "role": user.role}

