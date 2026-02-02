from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import SPOC, Bot, BotRun
from schemas import SPOCResponse, SPOCWithBots, BotBasic

router = APIRouter(prefix="/api", tags=["spocs"])


@router.get("/spocs", response_model=List[SPOCResponse])
def get_all_spocs(db: Session = Depends(get_db)):
    """Get all SPOCs with bot counts."""
    
    spocs = db.query(SPOC).all()
    result = []
    
    for spoc in spocs:
        bots_count = db.query(Bot).filter(Bot.spoc_id == spoc.id).count()
        
        result.append(SPOCResponse(
            id=spoc.id,
            name=spoc.name,
            email=spoc.email,
            phone=spoc.phone,
            bots_count=bots_count
        ))
    
    return sorted(result, key=lambda x: x.bots_count, reverse=True)


@router.get("/spocs/{spoc_id}", response_model=SPOCWithBots)
def get_spoc_with_bots(spoc_id: int, db: Session = Depends(get_db)):
    """Get SPOC details with their bots."""
    
    spoc = db.query(SPOC).filter(SPOC.id == spoc_id).first()
    if not spoc:
        raise HTTPException(status_code=404, detail="SPOC not found")
    
    bots = db.query(Bot).filter(Bot.spoc_id == spoc_id).all()
    today = datetime.now().strftime('%Y-%m-%d')
    
    bot_list = []
    for bot in bots:
        # Get latest run status
        latest_run = db.query(BotRun).filter(
            BotRun.bot_id == bot.id,
            BotRun.report_date == today
        ).order_by(BotRun.id.desc()).first()
        
        bot_list.append(BotBasic(
            id=bot.id,
            use_case_name=bot.use_case_name,
            bot_name=bot.bot_name,
            status=bot.status,
            run_status=latest_run.run_status if latest_run else None
        ))
    
    return SPOCWithBots(
        id=spoc.id,
        name=spoc.name,
        email=spoc.email,
        phone=spoc.phone,
        bots=bot_list
    )


@router.get("/organisation")
def get_organisation_view(db: Session = Depends(get_db)):
    """Get organisation view with SPOC -> Bots hierarchy."""
    
    spocs = db.query(SPOC).all()
    today = datetime.now().strftime('%Y-%m-%d')
    result = []
    
    for spoc in spocs:
        bots = db.query(Bot).filter(Bot.spoc_id == spoc.id).all()
        
        if not bots:
            continue
        
        bot_list = []
        for bot in bots:
            latest_run = db.query(BotRun).filter(
                BotRun.bot_id == bot.id,
                BotRun.report_date == today
            ).order_by(BotRun.id.desc()).first()
            
            dept_name = bot.department.name if bot.department else None
            
            bot_list.append({
                "id": bot.id,
                "use_case_name": bot.use_case_name,
                "bot_name": bot.bot_name,
                "department": dept_name,
                "status": bot.status,
                "developer": bot.developer,
                "run_status": latest_run.run_status if latest_run else None,
                "hours_saved": bot.hours_saved_monthly or 0
            })
        
        result.append({
            "spoc_id": spoc.id,
            "spoc_name": spoc.name,
            "email": spoc.email,
            "bots_count": len(bot_list),
            "bots": bot_list
        })
    
    return sorted(result, key=lambda x: x["bots_count"], reverse=True)
