from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header, Request
from sqlalchemy.orm import Session
from database import get_db
from services.sharepoint_service import SharePointService, SHAREPOINT_AA_FOLDER
from services.excel_parser import parse_aa_report, ingest_manual_file
from models import BotRun, FileLog, Bot
from sqlalchemy import func
from contextlib import contextmanager
from typing import Optional
import asyncio
import hmac
import os
import re
import shutil
import calendar
import time
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_
from utils import get_per_run_value, calculate_fte_savings, calculate_realized_savings



router = APIRouter(
    prefix="/api/integration",
    tags=["integration"]
)

def _archive_file(temp_path: str, filename: str) -> str:
    """Copy a downloaded file into uploads/archive; returns the path relative to backend."""
    archive_dir = os.path.join(os.getcwd(), "uploads", "archive")
    os.makedirs(archive_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    archive_filename = f"{timestamp}_{filename}"
    shutil.copy2(temp_path, os.path.join(archive_dir, archive_filename))
    return f"uploads/archive/{archive_filename}"


def _sync_aa_folder(sp_service: SharePointService, db: Session):
    """
    Ingest Automation Anywhere exports (services/aa_service.py) from their
    dedicated SharePoint folder. Every .xlsx in that folder is treated as an
    AA export; the run dates come from the file contents, not the filename.
    A file changed in SharePoint after it was processed (e.g. a re-run slot)
    is processed again. Each new report is emailed once (services/report_mailer.py).
    Returns (processed, skipped, errors, files_found).
    """
    from services.report_mailer import auto_email_report, retry_failed_report_emails

    try:
        all_files = sp_service.list_files(folder_path=SHAREPOINT_AA_FOLDER)
    except Exception as e:
        print(f"SYNC ERROR: AA folder list failed ({SHAREPOINT_AA_FOLDER}): {str(e)}")
        return 0, 0, [f"AA folder '{SHAREPOINT_AA_FOLDER}': {str(e)}"], 0

    aa_files = [f for f in all_files if f["Name"].lower().endswith(".xlsx")]
    aa_files.sort(key=lambda x: x["TimeLastModified"])

    processed_count = 0
    skipped_count = 0
    errors_summary = []

    # Retry earlier failed sends first, so a report that fails in this run
    # isn't immediately retried (each automatic attempt counts)
    try:
        for email_log in retry_failed_report_emails(db):
            if email_log.status == "Failed":
                errors_summary.append(f"{email_log.report_name}: email retry failed: {email_log.error_message}")
    except Exception as e:
        db.rollback()
        errors_summary.append(f"Email retry: {str(e)}")

    for file_info in aa_files:
        filename = file_info["Name"]

        # Row-level errors won't change unless the file does, so a
        # Partial_Success file is also only reprocessed when modified.
        last_success = db.query(FileLog).filter(
            FileLog.filename == filename,
            FileLog.status.in_(["Success", "Partial_Success"])
        ).order_by(FileLog.id.desc()).first()
        if last_success and not _modified_since(file_info["TimeLastModified"], last_success.upload_date):
            skipped_count += 1
            continue

        try:
            temp_path = sp_service.download_file(file_info["ServerRelativeUrl"], save_dir="uploads")
            result = parse_aa_report(temp_path, db)
            rel_archive_path = _archive_file(temp_path, filename)

            errors = result["errors"]
            if not errors:
                status = "Success"
            elif result["runs_inserted"] or result["duplicates_skipped"]:
                status = "Partial_Success"
            else:
                status = "Failed"

            ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
            db.add(FileLog(
                filename=filename,
                upload_date=ist_now.isoformat(),
                file_date=result["report_dates"][-1] if result["report_dates"] else "Unknown",
                processed_count=result["runs_inserted"],
                unique_bots_count=result["unique_bots"],
                hours_saved_estimate=result["hours_saved"],
                file_path=rel_archive_path,
                status=status,
                error_message="; ".join(errors) if errors else None
            ))
            db.commit()

            processed_count += 1
            print(f"SYNC: AA file {filename}: {result['runs_inserted']} runs added, "
                  f"{result['duplicates_skipped']} already present, dates {result['report_dates']}")

            if os.path.exists(temp_path):
                try: os.remove(temp_path)
                except: pass

            if status != "Failed":
                email_log = auto_email_report(db, filename, rel_archive_path,
                                              result["report_dates"][-1] if result["report_dates"] else None,
                                              file_info["TimeLastModified"])
                if email_log and email_log.status == "Failed":
                    errors_summary.append(f"{filename}: email failed: {email_log.error_message}")

        except Exception as e:
            db.rollback()
            errors_summary.append(f"{filename}: {str(e)}")

    return processed_count, skipped_count, errors_summary, len(aa_files)


def _modified_since(sharepoint_modified: str, processed_at_ist: str) -> bool:
    """True if the SharePoint file changed after we processed it."""
    try:
        modified = datetime.fromisoformat(sharepoint_modified.replace("Z", "+00:00"))
        if modified.tzinfo:
            modified = modified.astimezone(timezone.utc).replace(tzinfo=None)
        processed_utc = datetime.fromisoformat(processed_at_ist) - timedelta(hours=5, minutes=30)
        return modified > processed_utc
    except (TypeError, ValueError, AttributeError):
        return False


def _date_from_filename(filename: str):
    """'3 Sep Control Room Dump.xlsx' / '30Jan Bot Status Report.xlsx' -> 'YYYY-MM-DD' or None."""
    match = re.search(r"(\d{1,2})\s*([A-Za-z]{3})", filename, re.IGNORECASE)
    if not match:
        return None
    months = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
    }
    month = months.get(match.group(2).lower())
    if not month:
        return None
    ist_today = (datetime.utcnow() + timedelta(hours=5, minutes=30)).date()
    try:
        dated = datetime(ist_today.year, month, int(match.group(1))).date()
    except ValueError:
        return None
    # A December file processed in January belongs to last year
    if dated > ist_today + timedelta(days=1):
        dated = dated.replace(year=dated.year - 1)
    return dated.strftime('%Y-%m-%d')


# How long a triggered sync waits for a running one (it must not be skipped:
# the running sync may have listed SharePoint before the new file arrived)
TRIGGER_SYNC_WAIT_SECONDS = 10 * 60

SYNC_LOCK_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                              "uploads", ".sharepoint_sync.lock")
# A lock older than this is from a crashed sync and is taken over
STALE_SYNC_LOCK_SECONDS = 30 * 60


class SyncBusy(Exception):
    """Another SharePoint sync is running."""


@contextmanager
def _sync_lock(wait_seconds: float):
    """
    Only one sync at a time, across the web server and the scheduled CLI
    (a lock file), so concurrent syncs can't store or email a report twice.
    """
    os.makedirs(os.path.dirname(SYNC_LOCK_PATH), exist_ok=True)
    deadline = time.monotonic() + wait_seconds
    while True:
        try:
            fd = os.open(SYNC_LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, f"{os.getpid()} {datetime.now().isoformat()}".encode())
            os.close(fd)
            break
        except FileExistsError:
            try:
                if time.time() - os.path.getmtime(SYNC_LOCK_PATH) > STALE_SYNC_LOCK_SECONDS:
                    os.remove(SYNC_LOCK_PATH)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() >= deadline:
                raise SyncBusy()
            time.sleep(2)
    try:
        yield
    finally:
        try:
            os.remove(SYNC_LOCK_PATH)
        except FileNotFoundError:
            pass


async def run_sync_sharepoint(db: Session, wait_seconds: float = 0):
    """
    Downloads and processes pending SharePoint files.
    If another sync is running, waits up to wait_seconds for it to finish,
    then returns status "busy". Waiting sleeps the calling thread, so only
    pass wait_seconds from a worker thread or a separate process.
    """
    try:
        with _sync_lock(wait_seconds):
            return await _run_sync_sharepoint_unlocked(db)
    except SyncBusy:
        print("SYNC: Skipped, another SharePoint sync is already running.")
        return {"status": "busy", "message": "Another SharePoint sync is already running. Try again in a minute."}


def run_sync_sharepoint_in_thread(wait_seconds: float = 0) -> dict:
    """Run a sync with its own DB session (for background tasks / threads)."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        return asyncio.run(run_sync_sharepoint(db, wait_seconds))
    finally:
        db.close()


async def _run_sync_sharepoint_unlocked(db: Session):
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
                "status report" in f["Name"].lower()) 
            and f["Name"].endswith(".xlsx")
        ]

        # Sort by Modification time (chronological)
        dump_files.sort(key=lambda x: x["TimeLastModified"], reverse=False)

        # 3. Automation Anywhere reports first, so the manual files below only
        #    fill runs the AA sync missed
        processed_count, skipped_count, errors_summary, aa_found = _sync_aa_folder(sp_service, db)

        # 4. Manually kept files (backup for days the AA sync failed)
        for file_info in dump_files:
            filename = file_info["Name"]

            # Reprocess only if the file changed since (the team may update it)
            last_log = db.query(FileLog).filter(
                FileLog.filename == filename,
                FileLog.status.in_(["Success", "Partial_Success"])
            ).order_by(FileLog.id.desc()).first()
            if last_log and not _modified_since(file_info["TimeLastModified"], last_log.upload_date):
                skipped_count += 1
                continue

            # --- Process File ---
            try:
                temp_path = sp_service.download_file(file_info["ServerRelativeUrl"], save_dir="uploads")
                report_date = _date_from_filename(filename)

                result = ingest_manual_file(temp_path, db)
                rel_archive_path = _archive_file(temp_path, filename)

                errors = result["errors"]
                if not errors:
                    status = "Success"
                elif result["runs_inserted"] or result["duplicates_skipped"]:
                    status = "Partial_Success"
                else:
                    status = "Failed"

                ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
                db.add(FileLog(
                    filename=filename,
                    upload_date=ist_now.isoformat(),
                    file_date=report_date or (result["report_dates"][-1] if result["report_dates"] else "Unknown"),
                    processed_count=result["runs_inserted"],
                    unique_bots_count=result["unique_bots"],
                    hours_saved_estimate=result["hours_saved"],
                    file_path=rel_archive_path,
                    status=status,
                    error_message="; ".join(errors) if errors else None
                ))
                db.commit()

                processed_count += 1
                print(f"SYNC: Manual file {filename}: {result['runs_inserted']} missing runs added, "
                      f"{result['duplicates_skipped']} already present, "
                      f"{result['other_devices_skipped']} from other devices ignored")

                # Cleanup
                if os.path.exists(temp_path):
                    try: os.remove(temp_path)
                    except: pass

            except Exception as e:
                db.rollback()
                errors_summary.append(f"{filename}: {str(e)}")

        if not dump_files and not aa_found:
            return {
                "status": "error",
                "message": "No 'Dump' or 'Status Report' files found in SharePoint, "
                           "and no Automation Anywhere files found in the AA folder.",
                "details": {"errors": errors_summary}
            }

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

def _require_admin(request: Request, db: Session = Depends(get_db)) -> str:
    # Imported here: routers.auth imports this module
    from .auth import require_admin
    return require_admin(request, db)


@router.post("/sync-sharepoint")
async def sync_sharepoint_data(db: Session = Depends(get_db), current_user: str = Depends(_require_admin)):
    """
    Triggers synchronization with SharePoint via the POST endpoint.
    Downloads ALL pending dump files, parses them, archives them, and logs the process.
    Skips files that have already been successfully processed.
    """
    result = await run_sync_sharepoint(db)

    if result.get("status") == "busy":
        raise HTTPException(status_code=409, detail=result.get("message"))
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))

    return result


@router.post("/trigger-sync", status_code=202)
def trigger_sync(background_tasks: BackgroundTasks, x_sync_token: Optional[str] = Header(None)):
    """
    Called by run_aa_sync.py right after it uploads a report, so the runs
    reach the dashboard (and the report is emailed) immediately. Needs the
    X-Sync-Token header to match SYNC_TRIGGER_TOKEN. If a sync is already
    running, this one waits for it and then runs, so the new file is picked up.
    """
    expected = os.getenv("SYNC_TRIGGER_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="SYNC_TRIGGER_TOKEN is not configured on the server")
    if not x_sync_token or not hmac.compare_digest(x_sync_token, expected):
        raise HTTPException(status_code=401, detail="Invalid sync token")

    background_tasks.add_task(run_sync_sharepoint_in_thread, TRIGGER_SYNC_WAIT_SECONDS)
    return {"status": "accepted", "message": "Sync started"}


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
    successful_runs = 0
    failed_runs = 0
    bot_run_counts = {}
    
    for run in runs:
        if not run.run_status:
            continue
        
        status_lower = str(run.run_status).lower()
        if 'completed' in status_lower or 'success' in status_lower or 'pass' in status_lower:
            successful_runs += 1
            if run.bot_id:
                bot_run_counts[run.bot_id] = bot_run_counts.get(run.bot_id, 0) + 1
        elif 'fail' in status_lower:
            failed_runs += 1
            
    total_hours_saved = 0
    from utils import get_per_run_value
    for bot_id, runs_count in bot_run_counts.items():
        bot = db.query(Bot).get(bot_id)
        if bot:
            total_hours_saved += get_per_run_value(bot) * runs_count
            
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
        
    from utils import calculate_realized_savings
    
    bot_map = {b.id: b for b in all_bots}
    bot_ids = list(bot_map.keys())
    
    # Pre-fetch all successful runs
    all_runs_rows = db.query(BotRun).filter(
        BotRun.bot_id.in_(bot_ids),
        or_(
            BotRun.run_status.ilike('%completed%'),
            BotRun.run_status.ilike('%success%'),
            BotRun.run_status.ilike('%pass%'),
            BotRun.run_status.ilike('%processed%'),
            BotRun.run_status.ilike('%done%')
        )
    ).all()
    
    # Group runs by date -> bot_id -> count
    date_bot_runs = {}
    for r in all_runs_rows:
        if not r.report_date: continue
        try:
            dt = datetime.strptime(r.report_date, '%Y-%m-%d').date()
        except ValueError:
            try: dt = datetime.strptime(r.report_date, '%d-%m-%Y').date()
            except ValueError: continue
        
        if dt not in date_bot_runs:
            date_bot_runs[dt] = {}
        date_bot_runs[dt][r.bot_id] = date_bot_runs[dt].get(r.bot_id, 0) + 1

    trend_data = []
    for i in range(29, -1, -1):
        target_date = (ist_now - timedelta(days=i)).date()
        target_date_str = target_date.strftime('%Y-%m-%d')
        
        total_savings = 0.0
        total_runs = 0
        bots_active_today = 0
        
        bot_runs_today = date_bot_runs.get(target_date, {})
        for bot_id, runs_count in bot_runs_today.items():
            bot = bot_map.get(bot_id)
            if bot:
                total_runs += runs_count
                total_savings += calculate_realized_savings(bot, target_date_str, runs_count)
                bots_active_today += 1
                
        trend_data.append({
            "date": target_date_str,
            "label": target_date.strftime('%d %b'),
            "savings": round(total_savings, 2),
            "runs": total_runs,
            "bots": bots_active_today
        })
        
    return trend_data
