from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.sharepoint_service import SharePointService
from services.excel_parser import parse_daily_report
from models import BotRun, FileLog, Bot
from sqlalchemy import func
import os
import shutil
import calendar
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_
from utils import get_per_run_value, calculate_fte_savings, calculate_realized_savings



router = APIRouter(
    prefix="/api/integration",
    tags=["integration"]
)

async def run_sync_sharepoint(db: Session):
    """
    Downloads and processes pending SharePoint files.
    This internal function can be called by routers or background tasks.
    """
    try:
        sp_service = SharePointService()
        
        # 1. List all files
        try:
            all_files = sp_service.list_files()
        except Exception as e:
            print(f"SYNC ERROR: SharePoint List Failed: {str(e)}")
            return {"status": "error", "message": f"SharePoint List Failed: {str(e)}"}
            
        # 2. Filter for relevant Excel files
        dump_files = [
            f for f in all_files 
            if ("dump" in f["Name"].lower() or 
                "control room" in f["Name"].lower() or 
                "bot status report" in f["Name"].lower()) 
            and f["Name"].endswith(".xlsx")
        ]
        
        if not dump_files:
             return {"status": "error", "message": "No 'Dump' or 'Status Report' files found in SharePoint."}

        # Sort by Modification time (chronological)
        dump_files.sort(key=lambda x: x["TimeLastModified"], reverse=False)

        processed_count = 0
        skipped_count = 0
        errors_summary = []
        
        # 3. Iterate and Process
        for file_info in dump_files:
            filename = file_info["Name"]
            
            # Check if already processed successfully
            existing_log = db.query(FileLog).filter(
                FileLog.filename == filename,
                FileLog.status == "Success"
            ).first()
            
            if existing_log:
                skipped_count += 1
                continue
                
            # --- Process File ---
            try:
                # Download
                temp_path = sp_service.download_file(file_info["ServerRelativeUrl"], save_dir="uploads")
                
                # Extract Date logic
                report_date = None
                import re
                
                # Pattern for "30Jan" or "28Feb"
                match = re.search(r"(\d{1,2})\s*([A-Za-z]{3})", filename, re.IGNORECASE)
                if match:
                    day = int(match.group(1))
                    month_str = match.group(2).lower()
                    
                    months = {
                        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
                    }
                    
                    if month_str in months:
                        month = months[month_str]
                        current_year = datetime.now().year
                        try:
                            extracted_date = datetime(current_year, month, day)
                            report_date = extracted_date.strftime('%Y-%m-%d')
                        except ValueError: pass
                
                # Parse
                parse_result = parse_daily_report(temp_path, db, report_date=report_date)
                
                # Robust unpacking
                if isinstance(parse_result, tuple) and len(parse_result) >= 4:
                    runs_processed = parse_result[0]
                    unique_bots_count = parse_result[1]
                    hours_saved = parse_result[2]
                    errors = parse_result[3]
                else:
                    msg = f"Parser returned unexpected format: {type(parse_result)}"
                    errors_summary.append(f"{filename}: {msg}")
                    runs_processed, unique_bots_count, hours_saved = 0, 0, 0.0
                    errors = []

                archive_dir = os.path.join(os.getcwd(), "uploads", "archive")
                os.makedirs(archive_dir, exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                archive_filename = f"{timestamp}_{filename}"
                archive_path = os.path.join(archive_dir, archive_filename)
                shutil.copy2(temp_path, archive_path)
                
                rel_archive_path = f"uploads/archive/{archive_filename}"
                
                # Log
                ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
                file_log = FileLog(
                    filename=filename,
                    upload_date=ist_now.isoformat(),
                    file_date=report_date or "Unknown",
                    processed_count=runs_processed,
                    unique_bots_count=unique_bots_count,
                    hours_saved_estimate=hours_saved,
                    file_path=rel_archive_path,
                    status="Partial_Success" if errors else "Success",
                    error_message="; ".join(errors) if errors else None
                )
                db.add(file_log)
                db.commit()
                
                processed_count += 1
                
                # Cleanup
                if os.path.exists(temp_path):
                    try: os.remove(temp_path)
                    except: pass
                        
            except Exception as e:
                errors_summary.append(f"{filename}: {str(e)}")
                
        return {
            "status": "success",
            "message": f"Sync completed. Processed: {processed_count}, Skipped: {skipped_count}, Errors: {len(errors_summary)}",
            "details": {
                "processed": processed_count,
                "skipped": skipped_count,
                "errors": errors_summary
            }
        }
            
    except Exception as e:
        print(f"SYNC EXCEPTION: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/sync-sharepoint")
async def sync_sharepoint_data(db: Session = Depends(get_db)):
    """
    Triggers synchronization with SharePoint via the POST endpoint.
    Downloads ALL pending dump files, parses them, archives them, and logs the process.
    Skips files that have already been successfully processed.
    """
    result = await run_sync_sharepoint(db)
    
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
    
    return result


@router.get("/daily-stats")
async def get_daily_stats(db: Session = Depends(get_db)):
    """
    Get aggregated statistics for the dashboard.
    """
    # Total runs for today (or latest available date)
    # Find latest date
    latest_date_result = db.query(func.max(BotRun.report_date)).scalar()
    
    if not latest_date_result:
        return {
            "date": None,
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "hours_saved": 0
        }
        
    runs = db.query(BotRun).filter(BotRun.report_date == latest_date_result).all()
    
    total_runs = len(runs)
    successful_runs = sum(1 for r in runs if r.run_status and r.run_status.lower() == 'completed')
    failed_runs = sum(1 for r in runs if r.run_status and r.run_status.lower() == 'failed')
    
    # Calculate daily hours saved based on UNIQUE bots and their frequency
    # Count runs per bot
    bot_run_counts = {}
    for run in runs:
        if run.bot_id and run.run_status and 'completed' in str(run.run_status).lower():
            bot_run_counts[run.bot_id] = bot_run_counts.get(run.bot_id, 0) + 1
            
    total_hours_saved = 0
    for bot_id, runs_count in bot_run_counts.items():
        bot = db.query(Bot).get(bot_id)
        if bot:
            total_hours_saved += calculate_realized_savings(bot, latest_date_result, runs_count)
            
    unique_bots = len(bot_run_counts)

    # Get the latest data date (logic: Find success log with latest file_date)
    # Since file_date is string YYYY-MM-DD, we can sort by it.
    last_sync = db.query(FileLog).filter(FileLog.status == "Success").order_by(FileLog.file_date.desc()).first()
    
    if not last_sync:
         # Fallback to upload_date if file_date is missing in all logs (unlikely if parser works)
         last_sync = db.query(FileLog).filter(FileLog.status == "Success").order_by(FileLog.upload_date.desc()).first()

    last_sync_time = last_sync.upload_date if last_sync else None

    # Format if needed (assuming upload_date is string datetime)
    # If using formatted string in DB, assume it's good.
    # If not, might need parsing. Using raw string from DB for now.



    # --- New Logic for Aggregate Metrics (Month & Till Date) ---
    # Use IST time for consistency
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    start_of_month = ist_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    start_of_month_str = start_of_month.strftime('%Y-%m-%d')
    
    # Fetch all bots for calculation context
    all_bots = db.query(Bot).all()
    bot_map = {b.id: b for b in all_bots}
    
    # Fetch ALL successful runs for Till Date
    all_runs = db.query(BotRun).filter(BotRun.run_status.ilike('%completed%')).all()
    
    total_hours_month = 0.0
    total_hours_till_date = 0.0
    
    # Import unified calculation function
    from utils import calculate_fte_savings
    
    # FIX: "Total FTE Saved (Till Date)" decreasing issue.
    # The issue is that 'ist_now' keeps advancing, increasing the denominator (days) in the average calculation,
    # while the numerator (runs) stays constant if no new data is uploaded.
    # Solution: Anchor the calculation end date to the LAST AVAILABLE DATA DATE (or ist_now, whichever is earlier/relevant).
    # If we have data up to Feb 13, we calculate "Till Feb 13".
    
    effective_now = ist_now
    try:
        latest_run_str = db.query(func.max(BotRun.report_date)).scalar()
        if latest_run_str:
            # Parse YYYY-MM-DD
            l_date = datetime.strptime(latest_run_str, '%Y-%m-%d')
            # Set to end of that day to capture full day's runs
            l_date_end = l_date.replace(hour=23, minute=59, second=59)
            
            # Use this as the effective "Now" for calculation purposes
            # Always anchor to the end of the last reported day to prevent intra-day fluctuations
            # caused by 'ist_now' advancing while the run count remains static.
            effective_now = l_date_end
    except Exception as e:
        print(f"Error determining effective_now: {e}")
        # Fallback to ist_now
    
    for bot_id, bot in bot_map.items():
        month_hours, till_date_hours = calculate_fte_savings(bot, effective_now, db)
        total_hours_month += month_hours
        total_hours_till_date += till_date_hours

    
    # -------------------------------------------------------------
    # Find the oldest deployed date for "Since <Date>" display
    # -------------------------------------------------------------
    oldest_dt = None
    for b in all_bots:
        cand = b.deployed_date
        # If deployed_date missing, try start_date or end_date as proxy?
        # User requested "deployed date we had in the db", implying deployed_date specifically.
        # But if missing, fallback?
        # Let's stick to deployed_date first as primary.
        
        dt_obj = None
        if cand:
            if isinstance(cand, datetime):
                dt_obj = cand
            else:
                try:
                    # Try common formats
                     date_str = str(cand).split(' ')[0].strip()
                     for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y']:
                         try: 
                             dt_obj = datetime.strptime(date_str, fmt)
                             break
                         except: pass
                except: pass
        
        if dt_obj:
            if oldest_dt is None or dt_obj < oldest_dt:
                oldest_dt = dt_obj
                
    oldest_date_str = oldest_dt.strftime('%d %b %Y') if oldest_dt else "Inception"

    return {
        "date": latest_date_result,
        "last_sync_time": last_sync_time,
        "total_runs": total_runs,
        "unique_bots": unique_bots,
        "successful_runs": successful_runs,
        "failed_runs": failed_runs,
        "hours_saved": round(total_hours_saved, 2),
        "man_hours_saved": round(total_hours_saved / 8.0, 2),
        "month_hours_saved": round(total_hours_month, 2),
        "till_date_hours_saved": round(total_hours_till_date, 2),
        "oldest_bot_date": oldest_date_str
    }

@router.get("/fte-trend")
async def get_fte_trend(department_id: int = None, cumulative: bool = False, db: Session = Depends(get_db)):
    """
    Get Monthly FTE savings for the last 12 months.
    Optional: Filter by department_id and return cumulative totals.
    """
    # Use IST time
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    
    if department_id:
        all_bots = db.query(Bot).filter(Bot.department_id == department_id).all()
    else:
        all_bots = db.query(Bot).all()
    
    # ... rest of setup ...
    from utils import get_per_run_value
    CUTOFF_DATE = datetime(2026, 1, 28)
    
    trend_data = []
    all_runs_rows = db.query(BotRun.bot_id, BotRun.report_date, BotRun.run_status).filter(
        or_(
            BotRun.run_status.ilike('%completed%'),
            BotRun.run_status.ilike('%success%'),
            BotRun.run_status.ilike('%pass%'),
            BotRun.run_status.ilike('%processed%'),
            BotRun.run_status.ilike('%done%')
        )
    ).all()
    
    bot_runs_map = {}
    for r in all_runs_rows:
        if not r.report_date: continue
        try:
            dt = datetime.strptime(r.report_date, '%Y-%m-%d').date()
        except ValueError:
            try: dt = datetime.strptime(r.report_date, '%d-%m-%Y').date()
            except ValueError: continue
            
        if r.bot_id not in bot_runs_map:
            bot_runs_map[r.bot_id] = []
        bot_runs_map[r.bot_id].append(dt)

    bot_meta = []
    for bot in all_bots:
        deploy_dt = None
        if bot.deployed_date:
            if isinstance(bot.deployed_date, datetime): deploy_dt = bot.deployed_date
            else:
                try:
                     date_str = str(bot.deployed_date).split(' ')[0].strip()
                     for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y']:
                         try: deploy_dt = datetime.strptime(date_str, fmt); break
                         except: pass
                except: pass

        per_run = get_per_run_value(bot)
        schedule = (bot.schedule or "").lower()
        is_uncapped = 'on demand' in schedule or 'multiple' in schedule or (not bot.hours_saved_monthly)
        daily_rate = (bot.hours_saved_monthly or 0) / 30.0
        
        bot_meta.append({
            'id': bot.id,
            'deploy_dt': deploy_dt,
            'per_run': per_run,
            'is_uncapped': is_uncapped,
            'daily_rate': daily_rate,
            'runs': bot_runs_map.get(bot.id, [])
        })

    # Running totals for cumulative mode
    running_total_savings = 0.0
    running_total_runs = 0.0

    # If cumulative, we need to know what happened BEFORE our 12-month window
    if cumulative:
        window_start_date = ist_now.replace(day=1, hour=0, minute=0, second=0) - relativedelta(months=11)
        for b in bot_meta:
            # Historical Phase BEFORE window
            hist_end = min(window_start_date, CUTOFF_DATE)
            if b['deploy_dt'] and b['deploy_dt'] < hist_end:
                days = (hist_end - b['deploy_dt']).total_seconds() / 86400.0
                running_total_savings += days * b['daily_rate']
                if b['per_run'] > 0: running_total_runs += (b['daily_rate'] / b['per_run']) * days

            # Recent Phase BEFORE window
            rec_start = max(window_start_date, CUTOFF_DATE)
            # This only applies if the window starts AFTER the cutoff
            if CUTOFF_DATE < window_start_date:
                pre_window_runs = [d for d in b['runs'] if d >= CUTOFF_DATE.date() and d < window_start_date.date()]
                running_total_runs += len(pre_window_runs)
                running_total_savings += len(pre_window_runs) * b['per_run']

    for i in range(11, -1, -1):
        target_month_date = ist_now.replace(day=1) - relativedelta(months=i)
        year, month = target_month_date.year, target_month_date.month
        month_start = datetime(year, month, 1)
        _, last_day = calendar.monthrange(year, month)
        month_end = datetime(year, month, last_day, 23, 59, 59)
        
        if month_start > ist_now: continue
            
        month_savings = 0.0
        month_runs = 0.0
        bots_active_this_month = 0
        
        for b in bot_meta:
            if b['deploy_dt'] and b['deploy_dt'] <= month_end:
                bots_active_this_month += 1

            # Historical Phase in this month
            hist_period_end = min(month_end, CUTOFF_DATE)
            if b['deploy_dt'] and b['deploy_dt'] < hist_period_end:
                eff_start = max(month_start, b['deploy_dt'])
                if eff_start < hist_period_end:
                    days = (hist_period_end - eff_start).total_seconds() / 86400.0
                    month_savings += days * b['daily_rate']
                    if b['per_run'] > 0: month_runs += (b['daily_rate'] / b['per_run']) * days
            
            # Recent Phase in this month
            rec_period_start = max(month_start, CUTOFF_DATE)
            if rec_period_start < month_end:
                 relevant_runs = [d for d in b['runs'] if d >= rec_period_start.date() and d <= month_end.date()]
                 month_runs += len(relevant_runs)
                 month_savings += len(relevant_runs) * b['per_run']
        
        if cumulative:
            running_total_savings += month_savings
            running_total_runs += month_runs
            val_to_report = running_total_savings
            runs_to_report = running_total_runs
        else:
            val_to_report = month_savings
            runs_to_report = month_runs

        m_label = month_start.strftime("%b")
        trend_data.append({
            "month": m_label,
            "year": year,
            "full_label": f"{m_label} {str(year)[-2:]}",
            "savings": round(val_to_report, 2),
            "man_hours": round(val_to_report / 8.0, 2),
            "runs": round(runs_to_report, 0),
            "bots": bots_active_this_month
        })

        
    return trend_data

@router.get("/daily-trend")
async def get_daily_trend(department_id: int = None, db: Session = Depends(get_db)):
    """
    Get daily statistics for the last 30 days.
    """
    ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
    
    if department_id:
        all_bots = db.query(Bot).filter(Bot.department_id == department_id).all()
    else:
        all_bots = db.query(Bot).all()
        
    from utils import get_per_run_value
    
    # Pre-fetch runs
    all_runs_rows = db.query(BotRun.bot_id, BotRun.report_date, BotRun.run_status).filter(
        or_(
            BotRun.run_status.ilike('%completed%'),
            BotRun.run_status.ilike('%success%'),
            BotRun.run_status.ilike('%pass%')
        )
    ).all()
    
    bot_runs_map = {}
    for r in all_runs_rows:
        if not r.report_date: continue
        try:
            dt = datetime.strptime(r.report_date, '%Y-%m-%d').date()
        except ValueError:
            try: dt = datetime.strptime(r.report_date, '%d-%m-%Y').date()
            except ValueError: continue
        
        if r.bot_id not in bot_runs_map:
            bot_runs_map[r.bot_id] = {}
        bot_runs_map[r.bot_id][dt] = bot_runs_map[r.bot_id].get(dt, 0) + 1

    bot_meta = []
    for bot in all_bots:
        per_run = get_per_run_value(bot)
        bot_meta.append({
            'id': bot.id,
            'per_run': per_run,
            'runs': bot_runs_map.get(bot.id, {})
        })

    trend_data = []
    for i in range(29, -1, -1):
        target_date = (ist_now - timedelta(days=i)).date()
        
        total_savings = 0.0
        total_runs = 0
        bots_active_today = 0
        
        for b in bot_meta:
            runs_today = b['runs'].get(target_date, 0)
            if runs_today > 0:
                total_runs += runs_today
                total_savings += runs_today * b['per_run']
                bots_active_today += 1
                
        trend_data.append({
            "date": target_date.strftime('%Y-%m-%d'),
            "label": target_date.strftime('%d %b'),
            "savings": round(total_savings, 2),
            "runs": total_runs,
            "bots": bots_active_today
        })
        
    return trend_data
