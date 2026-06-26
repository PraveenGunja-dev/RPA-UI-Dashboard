from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import Bot, Department, BotRun
from schemas import DepartmentSummary, BotListItem
from utils import is_bot_active, get_display_status, calculate_realized_savings


router = APIRouter(prefix="/api", tags=["departments"])


@router.get("/departments", response_model=List[DepartmentSummary])
def get_departments(db: Session = Depends(get_db)):
    """Get all departments with bot counts (only those with bots)."""
    
    departments = db.query(Department).all()
    # Dictionary to aggregate departments by normalized name
    # Key: Normalized Name, Value: DepartmentSummary
    aggregated_depts = {}
    
    # Use IST (UTC+5:30)
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = ist_now.strftime('%Y-%m-%d')
    yesterday = (ist_now - timedelta(days=1)).strftime('%Y-%m-%d')
    start_of_month = ist_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    
    for dept in departments:
        bots = db.query(Bot).filter(Bot.department_id == dept.id).all()
        
        if not bots:
            continue
            
        # Normalize Name
        d_name = dept.name.strip()
        if d_name == "BT":
            d_name = "Business Transformation"
            
        bot_ids = [b.id for b in bots]
        
        # Find latest run date for this department (or global latest)
        target_date = today
        global_latest = db.query(func.max(BotRun.report_date)).scalar()
        if global_latest:
            target_date = global_latest
            
        yesterday_runs_list = db.query(BotRun).filter(
            BotRun.bot_id.in_(bot_ids),
            BotRun.report_date == target_date
        ).all()
        
        today_runs = yesterday_runs_list # Alias for compatibility with rest of logic
        
        # Calculate UNIQUE COMPLETED runs (Align with Global Stats and Hours Saved)
        unique_run_ids = set(r.bot_id for r in yesterday_runs_list if r.run_status and 'completed' in r.run_status.lower())
        yesterday_runs = len(unique_run_ids)
        today_runs_count = yesterday_runs # Sync them for this view logic
        
        # Calculate YESTERDAY's hours saved using new logic
        hours_saved_yesterday = 0
        
        for b in bots:
            if b.id in unique_run_ids:
                # Count runs for this bot
                runs_for_bot = sum(1 for r in yesterday_runs_list if r.bot_id == b.id and r.run_status and 'completed' in r.run_status.lower())
                hours_saved_yesterday += calculate_realized_savings(b, yesterday, runs_for_bot)

        
        # FIXED: Robust status check via utils
        deployed = sum(1 for b in bots if is_bot_active(b.status))
                    
        running_ids = set(r.bot_id for r in today_runs if r.run_status and 'completed' in r.run_status.lower())
        failed_ids = set(r.bot_id for r in today_runs if r.run_status and 'failed' in r.run_status.lower())
        
        running = len(running_ids)
        failed = len(failed_ids)
        idle = deployed - running if deployed > running else 0
        
        total_hours = sum(b.hours_saved_monthly or 0 for b in bots)
        
        # Calculate NEW Metrics: Month & Till Date Savings using unified function
        dept_hours_saved_month = 0.0
        dept_hours_saved_till_date = 0.0
        
        # Import the unified calculation function
        from utils import calculate_fte_savings
        
        for b in bots:
            month_hours, till_date_hours = calculate_fte_savings(b, ist_now, db)
            dept_hours_saved_month += month_hours
            dept_hours_saved_till_date += till_date_hours


        # Calculate TODAY's hours saved using new logic
        hours_saved_today = 0
        for b in bots:
            if b.id in running_ids:
                runs_for_bot = sum(1 for r in today_runs if r.bot_id == b.id and r.run_status and 'completed' in r.run_status.lower())
                hours_saved_today += calculate_realized_savings(b, yesterday, runs_for_bot)

        
        today_runs_count = len(today_runs) # Raw runs count
        
        if d_name in aggregated_depts:
            # Aggregate with existing
            existing = aggregated_depts[d_name]
            existing.total_bots += len(bots)
            existing.deployed_bots += deployed
            existing.running_bots += running
            existing.idle_bots += idle
            existing.failed_bots += failed
            existing.total_hours_saved += total_hours
            existing.man_hours_saved = int(existing.total_hours_saved / 9 + 0.5)
            existing.run_count_yesterday += yesterday_runs
            
            # New metrics accumulation
            existing.run_count_today += today_runs_count
            existing.hours_saved_today += hours_saved_today
            existing.hours_saved_yesterday += hours_saved_yesterday
            existing.hours_saved_month += dept_hours_saved_month
            existing.hours_saved_till_date += dept_hours_saved_till_date
            existing.last_sync_date = target_date  # Update with latest synced date
            
            # Keep the ID that matches the normalized name if possible, else keep existing
            if dept.name.strip() == "Business Transformation":
                existing.id = dept.id
        else:
            # Create new
            aggregated_depts[d_name] = DepartmentSummary(
                id=dept.id,
                name=d_name,
                total_bots=len(bots),
                deployed_bots=deployed,
                running_bots=running,
                idle_bots=idle,
                failed_bots=failed,
                total_hours_saved=total_hours,
                man_hours_saved=int(total_hours / 9 + 0.5) if total_hours else 0,
                run_count_yesterday=yesterday_runs,
                run_count_today=today_runs_count,
                hours_saved_today=hours_saved_today,
                hours_saved_yesterday=hours_saved_yesterday,
                hours_saved_month=dept_hours_saved_month,
                hours_saved_till_date=dept_hours_saved_till_date,
                last_sync_date=target_date  # Include the synced date
            )
    
    result = list(aggregated_depts.values())
    return sorted(result, key=lambda x: x.name)


@router.get("/departments/{dept_id}/summary", response_model=DepartmentSummary)
def get_department_summary(dept_id: int, db: Session = Depends(get_db)):
    """Get summary for a specific department."""
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Normalize Department Name for logic
    normalized_name = dept.name.strip()
    if normalized_name == "BT":
        normalized_name = "Business Transformation"
    
    # Identify duplicate department IDs to merge
    target_ids = [dept_id]
    
    # Logic to find siblings: check if this is a "special" department
    if normalized_name == "Business Transformation":
        # Find all IDs for BT and Business Transformation
        siblings = db.query(Department).filter(Department.name.in_(["BT", "Business Transformation"])).all()
        target_ids = [s.id for s in siblings]
    
    bots = db.query(Bot).filter(Bot.department_id.in_(target_ids)).all()
    # Use IST (UTC+5:30)
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = ist_now.strftime('%Y-%m-%d')
    yesterday = (ist_now - timedelta(days=1)).strftime('%Y-%m-%d')
    
    bot_ids = [b.id for b in bots]
    today_runs = db.query(BotRun).filter(
        BotRun.bot_id.in_(bot_ids),
        BotRun.report_date == today
    ).all() if bot_ids else []
    
    yesterday_runs = db.query(BotRun).filter(
        BotRun.bot_id.in_(bot_ids),
        BotRun.report_date == yesterday
    ).count() if bot_ids else 0
    
    # FIXED: Robust status check via utils
    deployed = sum(1 for b in bots if is_bot_active(b.status))

    running_ids = set(r.bot_id for r in today_runs if r.run_status and 'completed' in r.run_status.lower())
    failed_ids = set(r.bot_id for r in today_runs if r.run_status and 'failed' in r.run_status.lower())
    
    running = len(running_ids)
    failed = len(failed_ids)
    idle = deployed - running if deployed > running else 0
    
    total_hours = sum(b.hours_saved_monthly or 0 for b in bots)
    
    return DepartmentSummary(
        id=dept.id,
        name=normalized_name,
        total_bots=len(bots),
        deployed_bots=deployed,
        running_bots=running,
        idle_bots=idle,
        failed_bots=failed,
        total_hours_saved=total_hours,
        man_hours_saved=int(total_hours / 9 + 0.5) if total_hours else 0,
        run_count_yesterday=yesterday_runs
    )


@router.get("/departments/{dept_id}/bots", response_model=List[BotListItem])
def get_department_bots(dept_id: int, db: Session = Depends(get_db)):
    """Get all bots for a specific department."""
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Normalize Department Name
    d_name = dept.name.strip()
    if d_name == "BT":
        d_name = "Business Transformation"
    
    # Identify duplicate department IDs to merge
    target_ids = [dept_id]
    if d_name == "Business Transformation":
        # Find all IDs for BT and Business Transformation
        siblings = db.query(Department).filter(Department.name.in_(["BT", "Business Transformation"])).all()
        target_ids = [s.id for s in siblings]
        
    bots = db.query(Bot).filter(Bot.department_id.in_(target_ids)).all()
    result = []
    
    for bot in bots:
        # Get latest run
        latest_run = db.query(BotRun).filter(
            BotRun.bot_id == bot.id
        ).order_by(BotRun.report_date.desc(), BotRun.id.desc()).first()
        
        spoc_name = None
        if bot.spoc:
            spoc_name = bot.spoc.name
        
        # Calculate hours fields
        hours_monthly = bot.hours_saved_monthly or 0
        hours_per_day = hours_monthly / 30 if hours_monthly else 0
        
        # Calculate hours till now using unified utility
        from utils import calculate_fte_savings
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        
        # Calculate savings
        _, hours_till_now = calculate_fte_savings(bot, ist_now, db)
        
        # Format deployed date for display if possible
        clean_deploy_date = bot.deployed_date
        if bot.deployed_date:
            try:
                # Try parsing different date formats just for display formatting
                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%m-%d-%Y', '%Y/%m/%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                    try:
                        dt = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                        clean_deploy_date = dt.strftime('%Y-%m-%d')
                        break
                    except ValueError:
                        continue
            except Exception:
                pass
        
        man_hours_till_now = int(hours_till_now / 8 + 0.5) if hours_till_now else 0
        
        result.append(BotListItem(
            id=bot.id,
            use_case_name=bot.use_case_name,
            bot_name=bot.bot_name,
            department_name=d_name,
            status=get_display_status(bot.status),
            developer=bot.developer,
            hours_saved_monthly=bot.hours_saved_monthly,
            deployed_date=clean_deploy_date,
            spoc_name=spoc_name,
            last_run_status=latest_run.run_status if latest_run else None,
            last_run_time=latest_run.report_date if latest_run else None,
            pdd_location=bot.pdd_location,
            pdd_link=bot.pdd_link,
            use_case_no=bot.use_case_no,
            schedule_time=bot.schedule_time,
            team=bot.team,
            hours_per_day=round(hours_per_day, 2),
            hours_till_now=round(hours_till_now, 1),
            man_hours_till_now=man_hours_till_now,
            sr_no=bot.sr_no,
            description=bot.description,
            key_benefits=bot.key_benefits
        ))
    
    return result
