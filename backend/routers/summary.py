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
    
    # Status counts - Optimize by fetching ONLY the status string to save memory
    all_statuses = [s[0] for s in db.query(Bot.status).all()]
    deployed_bots = sum(1 for s in all_statuses if is_bot_active(s))
    
    # Get today's date for run stats
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Aggregated Run Stats using native SQL
    from sqlalchemy import case
    run_stats = db.query(
        func.count(BotRun.id).label('total'),
        func.sum(case((BotRun.run_status.ilike('%completed%'), 1), else_=0)).label('completed'),
        func.sum(case((BotRun.run_status.ilike('%failed%'), 1), else_=0)).label('failed')
    ).filter(BotRun.report_date == today).first()
    
    total_runs_today = run_stats.total or 0
    successful_runs_today = run_stats.completed or 0
    failed_runs_today = run_stats.failed or 0
    
    # Distinct running bots (completed runs today)
    running_bots = db.query(func.count(func.distinct(BotRun.bot_id))).filter(
        BotRun.report_date == today,
        BotRun.run_status.ilike('%completed%')
    ).scalar() or 0
    
    idle_bots = deployed_bots - running_bots if deployed_bots > running_bots else 0
    
    # Distinct failed bots (failed runs today)
    failed_bots = db.query(func.count(func.distinct(BotRun.bot_id))).filter(
        BotRun.report_date == today,
        BotRun.run_status.ilike('%failed%')
    ).scalar() or 0
    
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
