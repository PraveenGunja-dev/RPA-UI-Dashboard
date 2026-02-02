from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import Bot, Department, BotRun
from schemas import DepartmentSummary, BotListItem

router = APIRouter(prefix="/api", tags=["departments"])


@router.get("/departments", response_model=List[DepartmentSummary])
def get_departments(db: Session = Depends(get_db)):
    """Get all departments with bot counts (only those with bots)."""
    
    departments = db.query(Department).all()
    # Dictionary to aggregate departments by normalized name
    # Key: Normalized Name, Value: DepartmentSummary
    aggregated_depts = {}
    
    today = datetime.now().strftime('%Y-%m-%d')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    for dept in departments:
        bots = db.query(Bot).filter(Bot.department_id == dept.id).all()
        
        if not bots:
            continue
            
        # Normalize Name
        d_name = dept.name.strip()
        if d_name == "BT":
            d_name = "Business Transformation"
            
        bot_ids = [b.id for b in bots]
        today_runs = db.query(BotRun).filter(
            BotRun.bot_id.in_(bot_ids),
            BotRun.report_date == today
        ).all()
        
        yesterday_runs = db.query(BotRun).filter(
            BotRun.bot_id.in_(bot_ids),
            BotRun.report_date == yesterday
        ).count()
        
        # FIXED: Robust status check
        deployed = 0
        for b in bots:
            if b.status:
                s = b.status.lower().strip()
                if 'deployed' in s or 'live' in s or 'active' in s:
                    deployed += 1
                    
        running_ids = set(r.bot_id for r in today_runs if r.run_status and 'completed' in r.run_status.lower())
        failed_ids = set(r.bot_id for r in today_runs if r.run_status and 'failed' in r.run_status.lower())
        
        running = len(running_ids)
        failed = len(failed_ids)
        idle = deployed - running if deployed > running else 0
        
        total_hours = sum(b.hours_saved_monthly or 0 for b in bots)
        
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
                run_count_yesterday=yesterday_runs
            )
    
    result = list(aggregated_depts.values())
    return sorted(result, key=lambda x: x.total_bots, reverse=True)


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
    today = datetime.now().strftime('%Y-%m-%d')
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    bot_ids = [b.id for b in bots]
    today_runs = db.query(BotRun).filter(
        BotRun.bot_id.in_(bot_ids),
        BotRun.report_date == today
    ).all() if bot_ids else []
    
    yesterday_runs = db.query(BotRun).filter(
        BotRun.bot_id.in_(bot_ids),
        BotRun.report_date == yesterday
    ).count() if bot_ids else 0
    
    # FIXED: Robust status check
    deployed = 0
    for b in bots:
        if b.status:
            s = b.status.lower().strip()
            if 'deployed' in s or 'live' in s or 'active' in s:
                deployed += 1

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
        
        # Calculate hours till now based on deployed_date
        hours_till_now = 0
        clean_deploy_date = bot.deployed_date # Default fallback
        
        if bot.deployed_date:
            try:
                # Try parsing different date formats
                deploy_date = None
                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                    try:
                        deploy_date = datetime.strptime(str(bot.deployed_date).split(' ')[0], fmt)
                        break
                    except ValueError:
                        continue
                
                if deploy_date:
                    # UPDATED: Use the parsed date for consistency
                    clean_deploy_date = deploy_date.strftime('%Y-%m-%d')
                    
                    if hours_monthly:
                        days_since_deploy = (datetime.now() - deploy_date).days
                        if days_since_deploy > 0:
                            hours_till_now = days_since_deploy * hours_per_day
            except Exception:
                hours_till_now = 0
        
        man_hours_till_now = int(hours_till_now / 9 + 0.5) if hours_till_now else 0
        
        result.append(BotListItem(
            id=bot.id,
            use_case_name=bot.use_case_name,
            bot_name=bot.bot_name,
            department_name=d_name,
            status=bot.status,
            developer=bot.developer,
            hours_saved_monthly=bot.hours_saved_monthly,
            deployed_date=clean_deploy_date,
            spoc_name=spoc_name,
            last_run_status=latest_run.run_status if latest_run else None,
            last_run_time=latest_run.started_on if latest_run else None,
            pdd_location=bot.pdd_location,
            team=bot.team,
            hours_per_day=round(hours_per_day, 2),
            hours_till_now=round(hours_till_now, 1),
            man_hours_till_now=man_hours_till_now
        ))
    
    return result
