from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Bot, BotRun
from schemas import BotListItem, BotDetail

router = APIRouter(prefix="/api", tags=["bots"])


@router.get("/bots", response_model=List[BotListItem])
def get_all_bots(
    status: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """Get all bots with optional filtering."""
    
    query = db.query(Bot)
    
    if status:
        query = query.filter(Bot.status.ilike(f"%{status}%"))
    
    if department_id:
        query = query.filter(Bot.department_id == department_id)
    
    if search:
        query = query.filter(
            (Bot.use_case_name.ilike(f"%{search}%")) |
            (Bot.bot_name.ilike(f"%{search}%")) |
            (Bot.developer.ilike(f"%{search}%"))
        )
    
    bots = query.offset(skip).limit(limit).all()
    result = []
    
    for bot in bots:
        # Get latest run
        latest_run = db.query(BotRun).filter(
            BotRun.bot_id == bot.id
        ).order_by(BotRun.report_date.desc(), BotRun.id.desc()).first()
        
        dept_name = bot.department.name if bot.department else None
        # Normalize BT -> Business Transformation
        if dept_name and dept_name.strip() == "BT":
            dept_name = "Business Transformation"

        spoc_name = bot.spoc.name if bot.spoc else None
        
        # Standardize deployed_date
        formatted_date = bot.deployed_date
        if bot.deployed_date:
            try:
                # Try parsing common formats
                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                    try:
                        d_obj = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                        formatted_date = d_obj.strftime('%Y-%m-%d')
                        break
                    except ValueError:
                        continue
            except Exception:
                pass

        result.append(BotListItem(
            id=bot.id,
            use_case_name=bot.use_case_name,
            bot_name=bot.bot_name,
            department_name=dept_name,
            status=bot.status,
            developer=bot.developer,
            hours_saved_monthly=bot.hours_saved_monthly,
            deployed_date=formatted_date,
            spoc_name=spoc_name,
            last_run_status=latest_run.run_status if latest_run else None,
            last_run_time=latest_run.started_on if latest_run else None,
            pdd_location=bot.pdd_location,
            bu_name=bot.bu_name,
            description=bot.description,
            sr_no=bot.sr_no
        ))
    
    return result


@router.get("/bots/{bot_id}", response_model=BotDetail)
def get_bot_detail(bot_id: int, db: Session = Depends(get_db)):
    """Get detailed information for a specific bot."""
    
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Get run statistics
    runs = db.query(BotRun).filter(BotRun.bot_id == bot_id).all()
    total_runs = len(runs)
    successful_runs = len([r for r in runs if r.run_status and 'completed' in r.run_status.lower()])
    failed_runs = len([r for r in runs if r.run_status and 'failed' in r.run_status.lower()])
    
    # Get latest run
    latest_run = db.query(BotRun).filter(
        BotRun.bot_id == bot_id
    ).order_by(BotRun.report_date.desc(), BotRun.id.desc()).first()
    
    dept_name = bot.department.name if bot.department else None
    # Normalize BT -> Business Transformation
    if dept_name and dept_name.strip() == "BT":
        dept_name = "Business Transformation"

    dept_id = bot.department.id if bot.department else None
    spoc_name = bot.spoc.name if bot.spoc else None
    spoc_id = bot.spoc.id if bot.spoc else None
    
    # Standardize deployed_date
    formatted_date = bot.deployed_date
    if bot.deployed_date:
        try:
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    d_obj = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                    formatted_date = d_obj.strftime('%Y-%m-%d')
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    return BotDetail(
        id=bot.id,
        use_case_name=bot.use_case_name,
        bot_name=bot.bot_name,
        department_name=dept_name,
        department_id=dept_id,
        status=bot.status,
        developer=bot.developer,
        hours_saved_monthly=bot.hours_saved_monthly,
        deployed_date=formatted_date,
        schedule=bot.schedule,
        description=bot.description,
        bu_name=bot.bu_name,
        spoc_name=spoc_name,
        spoc_id=spoc_id,
        pdd_location=bot.pdd_location,
        created_at=bot.created_at,
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        last_run_status=latest_run.run_status if latest_run else None,
        last_run_time=latest_run.started_on if latest_run else None
    )


@router.get("/bots/{bot_id}/runs")
def get_bot_runs(
    bot_id: int,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get run history for a specific bot."""
    
    bot = db.query(Bot).filter(Bot.id == bot_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    runs = db.query(BotRun).filter(
        BotRun.bot_id == bot_id
    ).order_by(BotRun.report_date.desc(), BotRun.id.desc()).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "run_status": r.run_status,
            "started_on": r.started_on,
            "ended_on": r.ended_on,
            "device_name": r.device_name,
            "report_date": r.report_date
        }
        for r in runs
    ]
