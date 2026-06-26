from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from models import Bot, BotRun
from schemas import BotListItem, BotDetail
from utils import get_display_status, calculate_fte_savings, calculate_realized_savings

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
    today = datetime.utcnow().date() # simplified check
    
    # helper to find global latest date - matches Department Logic
    global_latest_date = db.query(func.max(BotRun.report_date)).scalar()
    target_date_str = global_latest_date if global_latest_date else today.strftime('%Y-%m-%d')

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
        
        # Calculate hours fields
        hours_monthly = bot.hours_saved_monthly or 0
        hours_per_day = hours_monthly / 30 if hours_monthly else 0
        
        # Calculate hours till now using unified utility
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        
        hours_saved_month_calc, hours_till_now = calculate_fte_savings(bot, ist_now, db)
        
        # Format deployed date for display
        formatted_date = bot.deployed_date
        if bot.deployed_date:
            try:
                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                    try:
                        deploy_date = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                        formatted_date = deploy_date.strftime('%Y-%m-%d')
                        break
                    except ValueError:
                        continue
            except Exception:
                pass
        
        # Use 8 hours for man-day calc as per Frontend Dashboard
        man_hours_till_now = int(hours_till_now / 8 + 0.5) if hours_till_now else 0

        # Calculate Hours Saved Today
        today_str = ist_now.strftime('%Y-%m-%d')
        # We need to check if there are any successful runs for TODAY
        # Optimized: Fetch runs for this bot for today
        today_runs_count = db.query(BotRun).filter(
            BotRun.bot_id == bot.id,
            BotRun.report_date == today_str,
            BotRun.run_status.ilike('%completed%')
        ).count()

        hours_saved_today = 0.0
        if today_runs_count > 0:
            hours_saved_today = calculate_realized_savings(bot, today_str, today_runs_count)

        # Calculate Hours Saved on LATEST SYNC DATE (Target Date)
        # matches "FTE Saved (Yesterday/Last Date)" logic in Departments
        latest_runs_count = 0
        hours_saved_latest_run = 0.0
        
        if target_date_str:
             latest_runs_count = db.query(BotRun).filter(
                BotRun.bot_id == bot.id,
                BotRun.report_date == target_date_str,
                BotRun.run_status.ilike('%completed%')
            ).count()
             
             if latest_runs_count > 0:
                 hours_saved_latest_run = calculate_realized_savings(bot, target_date_str, latest_runs_count)

        result.append(BotListItem(
            id=bot.id,
            use_case_name=bot.use_case_name,
            bot_name=bot.bot_name,
            department_name=dept_name,
            department_id=bot.department_id,
            status=get_display_status(bot.status),
            developer=bot.developer,
            hours_saved_monthly=bot.hours_saved_monthly,
            deployed_date=formatted_date,
            spoc_name=spoc_name,
            spoc_id=bot.spoc_id,
            last_run_status=latest_run.run_status if latest_run else None,
            last_run_time=latest_run.report_date if latest_run else None,
            pdd_location=bot.pdd_location,
            pdd_link=bot.pdd_link,
            use_case_no=bot.use_case_no,
            schedule_time=bot.schedule_time,
            bu_name=bot.bu_name,
            description=bot.description,
            sr_no=bot.sr_no,
            team=bot.team,
            hours_till_now=round(hours_till_now, 1),
            man_hours_till_now=man_hours_till_now,
            hours_per_day=round(hours_per_day, 2),
            hours_saved_month=round(hours_saved_month_calc, 2),
            hours_saved_today=round(hours_saved_today, 2),
            hours_saved_latest_run=round(hours_saved_latest_run, 2),
            key_benefits=bot.key_benefits
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
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d', '%m/%d/%Y', '%m-%d-%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    d_obj = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                    formatted_date = d_obj.strftime('%Y-%m-%d')
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    # --- NEW CALCULATION LOGIC ---
    from utils import calculate_fte_savings, calculate_realized_savings
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today_str = ist_now.strftime('%Y-%m-%d')
    
    # 1. Total Savings (Unified Logic)
    _, total_hours_saved = calculate_fte_savings(bot, ist_now, db)
    
    # 2. Daily Savings (Unified Logic)
    # Get today's runs from already fetched 'runs' list?
    # No, 'runs' fetches all runs. 'today_runs' was filtered earlier.
    # Re-filtering to be safe and consistent with ist_now
    
    today_runs = [r for r in runs if r.report_date == today_str]
    successful_today_count = len([r for r in today_runs if r.run_status and 'completed' in r.run_status.lower()])
    
    hours_saved_today = calculate_realized_savings(bot, today_str, successful_today_count)
    
    # 3. Man Hours
    total_man_hours_saved = total_hours_saved / 8
    
    # 4. Values for display
    # Keep value_per_run for UI if needed
    monthly_hours = bot.hours_saved_monthly or 0
    per_day_hours = bot.per_day_saving_hours or 0
    schedule = (bot.schedule or "").lower().strip()
    try:
        freq = float(bot.frequency) if bot.frequency and float(bot.frequency) > 0 else 1.0
    except (ValueError, TypeError):
        freq = 1.0

    value_per_run = 0.0
    is_on_demand = 'on demand' in schedule or 'multiple' in schedule
    
    if is_on_demand:
        value_per_run = per_day_hours
    else:
        value_per_run = monthly_hours / freq
        
    # 5. Run Status Today
    run_status_today = "Not Run"
    if today_runs:
        if any('completed' in (r.run_status or '').lower() for r in today_runs):
             run_status_today = "Success"
        elif any('failed' in (r.run_status or '').lower() for r in today_runs):
             run_status_today = "Failed"
        else:
             latest_today = sorted(today_runs, key=lambda x: x.id, reverse=True)[0]
             run_status_today = latest_today.run_status

    return BotDetail(
        id=bot.id,
        use_case_name=bot.use_case_name,
        bot_name=bot.bot_name,
        department_name=dept_name,
        department_id=dept_id,
        status=get_display_status(bot.status),
        developer=bot.developer,
        hours_saved_monthly=bot.hours_saved_monthly,
        deployed_date=formatted_date,
        schedule=bot.schedule,
        description=bot.description,
        bu_name=bot.bu_name,
        spoc_name=spoc_name,
        spoc_id=spoc_id,
        pdd_location=bot.pdd_location,
        pdd_link=bot.pdd_link,
        use_case_no=bot.use_case_no,
        schedule_time=bot.schedule_time,
        created_at=bot.created_at,
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        last_run_status=latest_run.run_status if latest_run else None,
        last_run_time=latest_run.report_date if latest_run else None,
        start_date=bot.start_date,
        end_date=bot.end_date,
        comments=bot.comments,
        machine_ip=bot.machine_ip,
        execution_time=bot.execution_time,
        bot_running_status=bot.bot_running_status,
        sr_no=bot.sr_no,
        key_benefits=bot.key_benefits,
        hours_saved_today=hours_saved_today,
        run_status_today=run_status_today,
        total_hours_saved=total_hours_saved,
        total_man_hours_saved=total_man_hours_saved,
        value_per_run=round(value_per_run, 4) if value_per_run else 0.0
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
