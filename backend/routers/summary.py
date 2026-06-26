from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from database import get_db
from models import Bot, Department, SPOC, BotRun, FileLog
from schemas import OrgSummary
from utils import is_bot_active

router = APIRouter(prefix="/api", tags=["summary"])


@router.get("/summary", response_model=OrgSummary)
def get_org_summary(db: Session = Depends(get_db)):
    """Get organization-level summary metrics."""
    
    # Total bots
    total_bots = db.query(func.count(Bot.id)).scalar() or 0
    
    # Status counts
    # Status counts - Robust check via utils
    all_bots = db.query(Bot).all()
    deployed_bots = sum(1 for b in all_bots if is_bot_active(b.status))
    
    # Get today's date for run stats
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Bot runs today
    today_runs = db.query(BotRun).filter(BotRun.report_date == today).all()
    
    total_runs_today = len(today_runs)
    successful_runs_today = len([r for r in today_runs if r.run_status and 'completed' in r.run_status.lower()])
    failed_runs_today = len([r for r in today_runs if r.run_status and 'failed' in r.run_status.lower()])
    
    # Count running bots (bots with runs today that completed)
    running_bot_ids = set(r.bot_id for r in today_runs if r.run_status and 'completed' in r.run_status.lower())
    running_bots = len(running_bot_ids)
    
    # Idle bots (deployed but not run today)
    idle_bots = deployed_bots - running_bots if deployed_bots > running_bots else 0
    
    # Failed bots (bots with failed runs today)
    failed_bot_ids = set(r.bot_id for r in today_runs if r.run_status and 'failed' in r.run_status.lower())
    failed_bots = len(failed_bot_ids)
    
    # Department and SPOC counts
    total_departments = db.query(func.count(Department.id)).scalar() or 0
    total_spocs = db.query(func.count(SPOC.id)).scalar() or 0
    
    # Total hours saved
    total_hours_saved = db.query(func.sum(Bot.hours_saved_monthly)).scalar() or 0
    
    # Total realized savings
    total_realized_savings = db.query(func.sum(FileLog.hours_saved_estimate)).filter(FileLog.status != "Failed").scalar() or 0.0

    return OrgSummary(
        total_bots=total_bots,
        deployed_bots=deployed_bots,
        running_bots=running_bots,
        idle_bots=idle_bots,
        failed_bots=failed_bots,
        total_departments=total_departments,
        total_spocs=total_spocs,
        total_hours_saved_monthly=float(total_hours_saved),
        total_realized_savings=float(total_realized_savings),
        total_runs_today=total_runs_today,
        successful_runs_today=successful_runs_today,
        failed_runs_today=failed_runs_today
    )
