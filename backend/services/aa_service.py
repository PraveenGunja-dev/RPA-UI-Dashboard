"""
Automation Anywhere Control Room API Service.

Connects to the AA Control Room, retrieves bot execution records for a
time window, filters to target devices, and exports the Bot Status Report
workbook (services/bot_status_report.py) that the dashboard's SharePoint
sync ingests and emails.

Reports cover fixed 12-hour slots so the two daily files never overlap:
    Morning  18:00 (previous day) -> 06:00 IST
    Evening  06:00 -> 18:00 IST

Usage (standalone):
    python -m services.aa_service                                 # latest completed slot
    python -m services.aa_service --date 2026-09-19 --slot evening
    python -m services.aa_service --hours 24                      # rolling window

When imported, call  aa_sync()  to run the full pipeline.
"""

import os
import json
import logging
import argparse
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, RetryError
from requests.exceptions import RequestException
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# ---------------------------------------------------------------------------
# Logger  (rotating file + console)
# ---------------------------------------------------------------------------
from logging.handlers import RotatingFileHandler

_log_dir = Path(__file__).resolve().parent.parent / "logs" / "aa_sync"
_log_dir.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("AASync")
logger.setLevel(logging.INFO)

_fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

if not logger.handlers:
    _fh = RotatingFileHandler(
        str(_log_dir / "aa_sync.log"), maxBytes=5 * 1024 * 1024, backupCount=5
    )
    _fh.setFormatter(_fmt)
    logger.addHandler(_fh)

    _ch = logging.StreamHandler()
    _ch.setFormatter(_fmt)
    logger.addHandler(_ch)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AA_BASE_URL = os.getenv(
    "AA_BASE_URL", "https://adani-crprod.my.automationanywhere.digital"
).rstrip("/")
AA_USERNAME = os.getenv("AA_USERNAME", "")
AA_PASSWORD = os.getenv("AA_PASSWORD", "")
AA_API_KEY = os.getenv("AA_API_KEY", "")

# Target devices (the 7 runner machines used by Cobot bots)
TARGET_DEVICES = [
    "DT-1001-7B3NM24",
    "DT-1001-G62J7W3",
    "gcp10wbtrpap01",
    "gcp10wbtrpap02",
    "gcp10wbtrpap03",
    "gcp10wbtrpap04",
    "gcp10wbtrpap05",
]

# Output directory for exports
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "uploads" / "aa_sync"

# After uploading, ask the dashboard server to sync right away so the runs
# appear (and the report is emailed) without waiting for the backup schedule.
SYNC_TRIGGER_TOKEN = os.getenv("SYNC_TRIGGER_TOKEN", "")
DASHBOARD_SYNC_URL = os.getenv(
    "DASHBOARD_SYNC_URL",
    f"{os.getenv('APP_BASE_URL', 'https://aegis.adani.com/cobot').rstrip('/')}/api/integration/trigger-sync",
)


# ===========================================================================
# Authentication
# ===========================================================================
class AuthenticationError(Exception):
    """Raised when AA authentication fails for non-retryable reasons."""


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(RequestException),
)
def _authenticate() -> str:
    """
    Authenticates with Automation Anywhere Control Room.
    Returns the bearer token string.
    """
    if not AA_USERNAME or not AA_PASSWORD:
        raise AuthenticationError(
            "Missing AA credentials. Set AA_USERNAME, AA_PASSWORD in .env"
        )

    url = f"{AA_BASE_URL}/v2/authentication"
    payload = {
        "username": AA_USERNAME,
        "password": AA_PASSWORD,
        "multipleLogin": False,
    }

    logger.info("Authenticating with Automation Anywhere Control Room...")
    resp = requests.post(url, json=payload, timeout=30)

    if resp.status_code == 200:
        token = resp.json().get("token")
        if token:
            logger.info("Authentication successful.")
            return token
        raise AuthenticationError("No token in authentication response.")
    elif resp.status_code in (401, 403):
        raise AuthenticationError(
            f"HTTP {resp.status_code} — check AA credentials or permissions."
        )
    else:
        resp.raise_for_status()  # let tenacity retry on 5xx


# ===========================================================================
# Activity Retrieval (with pagination + device filtering)
# ===========================================================================
@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(RequestException),
)
def _fetch_page(token: str, offset: int, length: int,
                start_time: str, end_time: str) -> Dict[str, Any]:
    """Fetch a single page of activity records from the AA API."""
    url = f"{AA_BASE_URL}/v3/activity/list"
    headers = {"X-Authorization": token, "Content-Type": "application/json"}
    payload = {
        "filter": {
            "operator": "and",
            "filters": [
                {
                    "operator": "between",
                    "field": "endDateTime",
                    "value": [start_time, end_time],
                }
            ],
        },
        "sort": [{"field": "endDateTime", "direction": "desc"}],
        "page": {"length": length, "offset": offset},
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=60)

    # Handle token expiry mid-pagination
    if resp.status_code == 401:
        logger.warning("HTTP 401 — re-authenticating...")
        new_token = _authenticate()
        headers["X-Authorization"] = new_token
        resp = requests.post(url, headers=headers, json=payload, timeout=60)

    resp.raise_for_status()
    return resp.json()


def _get_all_activities(token: str, start_time: str,
                        end_time: str) -> List[Dict[str, Any]]:
    """
    Paginates through all AA activities in the time window and filters
    locally for the target devices.
    """
    target_set = set(TARGET_DEVICES)
    filtered: List[Dict[str, Any]] = []
    offset = 0
    page_size = 200  # max safe page size

    logger.info(f"Fetching activities from {start_time} to {end_time}")

    total_expected = None

    while True:
        try:
            data = _fetch_page(token, offset, page_size, start_time, end_time)
        except Exception as e:
            logger.error(
                f"Failed to fetch activities at offset {offset}: {e}"
            )
            break

        items = data.get("list", [])

        if total_expected is None:
            total_expected = data.get("page", {}).get("totalFilter", 0)
            logger.info(f"Total API records in time window: {total_expected}")

        if not items:
            break

        out_of_bounds = False
        for item in items:
            end_dt = item.get("endDateTime", "")
            if end_dt and end_dt < start_time:
                out_of_bounds = True
                continue
            # End is exclusive so a run ending exactly on a slot boundary is
            # reported in one slot only.
            if item.get("deviceName") in target_set and end_dt < end_time:
                filtered.append(item)

        if out_of_bounds:
            logger.info("Reached records older than start_time. Stopping.")
            break

        logger.info(f"Processed offset {offset}. Filtered so far: {len(filtered)}")

        if len(items) < page_size:
            break

        offset += page_size

    logger.info(
        f"Retrieval complete. {len(filtered)} records for "
        f"{len(target_set)} target devices."
    )
    return filtered


# ===========================================================================
# Report windows
# ===========================================================================
IST = timezone(timedelta(hours=5, minutes=30))
SLOT_END_HOURS = {"Morning": 6, "Evening": 18}
SLOT_HOURS = 12


def _utc_str(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_cli_datetime(value: str) -> datetime:
    """ISO-8601; a value without a timezone is treated as UTC."""
    dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def resolve_window(hours: int = None, start: str = None, end: str = None,
                   date: str = None, slot: str = None,
                   now: datetime = None) -> Dict[str, str]:
    """
    Work out the report window. Returns start/end (UTC API strings), the
    report title, file stem and a human-readable IST window.

    Default: the latest completed slot (Morning ends 06:00 IST, Evening
    ends 18:00 IST), so a task that starts late still reports the right slot.
    """
    now = (now or datetime.now(timezone.utc)).astimezone(IST)

    if start or end or hours:
        if start and end:
            start_dt, end_dt = _parse_cli_datetime(start), _parse_cli_datetime(end)
        elif hours:
            end_dt = now
            start_dt = now - timedelta(hours=hours)
        else:
            raise ValueError("Pass both --start and --end, or --hours.")
        s, e = start_dt.astimezone(IST), end_dt.astimezone(IST)
        return {
            "start": _utc_str(start_dt),
            "end": _utc_str(end_dt),
            "title": f"Bot Status Report - {s:%d %b %Y %H:%M} to {e:%d %b %Y %H:%M} IST",
            "file_stem": f"{s:%d %b %Y %H%M} to {e:%d %b %Y %H%M} Bot Status Report",
            "window_text": f"{s:%d %b %Y %H:%M} - {e:%d %b %Y %H:%M} IST",
        }

    if date:
        if not slot:
            raise ValueError("--date needs --slot morning|evening.")
        day = datetime.strptime(date, "%Y-%m-%d")
        slot_name = slot.capitalize()
        boundary = datetime(day.year, day.month, day.day,
                            SLOT_END_HOURS[slot_name], tzinfo=IST)
    else:
        today = now.replace(minute=0, second=0, microsecond=0)
        candidates = [
            today.replace(hour=18), today.replace(hour=6),
            (today - timedelta(days=1)).replace(hour=18),
            (today - timedelta(days=1)).replace(hour=6),
        ]
        if slot:
            candidates = [c for c in candidates if c.hour == SLOT_END_HOURS[slot.capitalize()]]
        boundary = next(c for c in candidates if c <= now)
        slot_name = "Morning" if boundary.hour == 6 else "Evening"

    start_ist = boundary - timedelta(hours=SLOT_HOURS)
    return {
        "start": _utc_str(start_ist),
        "end": _utc_str(boundary),
        "title": f"Bot Status Report - {boundary:%d %b %Y} ({slot_name})",
        "file_stem": f"{boundary:%d %b %Y} Bot Status Report - {slot_name}",
        "window_text": f"{start_ist:%d %b %Y %H:%M} - {boundary:%d %b %Y %H:%M} IST",
    }


# ===========================================================================
# Excel Export  (Bot Status Report)
# ===========================================================================
def _schedule_lookup():
    """
    Returns lookup(automation_name) -> the bot's schedule from the master
    list (drives the Occurrence column), or None if the bot isn't in it.
    """
    try:
        from database import SessionLocal
        from services.excel_parser import _build_bot_matcher

        db = SessionLocal()
        try:
            match = _build_bot_matcher(db)
        finally:
            db.close()

        def lookup(name: str) -> Optional[str]:
            bot = match(name)
            return bot.schedule if bot else None

        return lookup
    except Exception as e:
        logger.warning(f"Bot master unavailable, Occurrence will show 'Unknown': {e}")
        return lambda name: "Unknown"


def _export_excel(records: List[Dict[str, Any]],
                  window: Dict[str, str]) -> Tuple[Optional[str], Dict[str, Any]]:
    """
    Writes the Bot Status Report workbook for the window.
    Returns (absolute path or None on failure, report stats).
    """
    if not records:
        logger.warning("No records to export.")
        return None, {}

    from services.bot_status_report import write_report

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    excel_path = str(OUTPUT_DIR / f"{window['file_stem']}.xlsx")

    try:
        stats = write_report(records, excel_path, window["title"],
                             window["window_text"], _schedule_lookup())
        logger.info(f"Excel saved: {excel_path}  ({stats['rows']} rows, "
                    f"status {stats['status_counts']}, overridden {stats['overridden']})")
        return excel_path, stats
    except Exception as e:
        logger.error(f"Failed to write Excel: {e}")
        return None, {}


# ===========================================================================
# JSON Export  (raw archive for debugging)
# ===========================================================================
def _export_json(records: List[Dict[str, Any]], start_time: str,
                 end_time: str) -> Optional[str]:
    """Saves the raw API records as a JSON archive."""
    if not records:
        return None

    json_dir = OUTPUT_DIR / "json"
    json_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    json_path = str(json_dir / f"aa_raw_{timestamp}.json")

    try:
        payload = {
            "query_start_time": start_time,
            "query_end_time": end_time,
            "retrieval_timestamp": datetime.now(timezone.utc).isoformat(),
            "total_records": len(records),
            "records": records,
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        logger.info(f"JSON archive saved: {json_path}")
        return json_path
    except Exception as e:
        logger.error(f"Failed to write JSON: {e}")
        return None


# ===========================================================================
# Dashboard trigger
# ===========================================================================
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=5, max=30),
    retry=retry_if_exception_type(RequestException),
)
def _post_sync_trigger(verify) -> requests.Response:
    resp = requests.post(
        DASHBOARD_SYNC_URL,
        headers={"X-Sync-Token": SYNC_TRIGGER_TOKEN},
        timeout=30,
        verify=verify,
    )
    if resp.status_code >= 500 and resp.status_code != 503:
        resp.raise_for_status()  # let tenacity retry while the server restarts
    return resp


def _trigger_dashboard_sync() -> str:
    """
    Ask the dashboard to ingest and email the new report now. Returns a
    short status; failure is not fatal - the server's scheduled
    run_sharepoint_sync.py picks the file up later.
    """
    if not SYNC_TRIGGER_TOKEN:
        return "skipped (SYNC_TRIGGER_TOKEN not set)"
    from services.sharepoint_service import _resolve_ssl_verify

    try:
        resp = _post_sync_trigger(_resolve_ssl_verify())
    except RetryError as e:
        return f"failed after retries: {e.last_attempt.exception()}"
    except Exception as e:
        return f"failed: {e}"
    if resp.status_code == 202:
        return "triggered"
    return f"failed: HTTP {resp.status_code} {resp.text[:200]}"


# ===========================================================================
# Public API — the single entry-point for the sync pipeline
# ===========================================================================
def aa_sync(
    hours: int = None,
    start: str = None,
    end: str = None,
    upload_to_sharepoint: bool = True,
    date: str = None,
    slot: str = None,
) -> Dict[str, Any]:
    """
    Runs the full Automation Anywhere sync pipeline:
      1. Authenticate with AA Control Room
      2. Fetch activity records (paginated, device-filtered)
      3. Export the Bot Status Report workbook + JSON archive
      4. Optionally upload the workbook to the SharePoint AA folder

    With no window arguments, reports the latest completed Morning/Evening
    slot (see resolve_window). Returns a summary dict with status and file paths.
    """
    result: Dict[str, Any] = {
        "status": "error",
        "records": 0,
        "excel_path": None,
        "json_path": None,
        "sharepoint_upload": None,
    }

    # --- Resolve time window ---
    try:
        window = resolve_window(hours=hours, start=start, end=end, date=date, slot=slot)
    except (ValueError, KeyError) as e:
        result["message"] = f"Invalid report window: {e}"
        logger.error(result["message"])
        return result
    start_time, end_time = window["start"], window["end"]
    result["report_title"] = window["title"]

    logger.info("=" * 60)
    logger.info("Automation Anywhere Sync -- Starting")
    logger.info(f"Report: {window['title']}  ({window['window_text']})")
    logger.info(f"Time window: {start_time} -> {end_time}")
    logger.info("=" * 60)

    # --- 1. Authenticate ---
    try:
        token = _authenticate()
    except AuthenticationError as e:
        logger.error(f"Authentication failed: {e}")
        result["message"] = str(e)
        return result

    # --- 2. Fetch activities ---
    records = _get_all_activities(token, start_time, end_time)
    result["records"] = len(records)

    if not records:
        logger.warning("No execution records found for target devices.")
        result["status"] = "success"
        result["message"] = "No records found in time window."
        return result

    # Log summary
    status_counts = Counter(r.get("status", "UNKNOWN") for r in records)
    device_counts = Counter(r.get("deviceName", "UNKNOWN") for r in records)
    logger.info(f"Status breakdown: {dict(status_counts)}")
    logger.info(f"Device breakdown: {dict(device_counts)}")

    # --- 3. Export ---
    result["excel_path"], result["report"] = _export_excel(records, window)
    result["json_path"] = _export_json(records, start_time, end_time)
    if not result["excel_path"]:
        result["message"] = "Report workbook could not be written (see log)."
        return result

    # --- 4. Upload to SharePoint ---
    if upload_to_sharepoint and result["excel_path"]:
        try:
            from services.sharepoint_service import SharePointService, SHAREPOINT_AA_FOLDER

            sp = SharePointService()
            upload_ok = sp.upload_file(result["excel_path"], folder_path=SHAREPOINT_AA_FOLDER)
            result["sharepoint_upload"] = "success" if upload_ok else "failed"
            if upload_ok:
                logger.info("SharePoint upload: SUCCESS")
                result["dashboard_sync"] = _trigger_dashboard_sync()
                if result["dashboard_sync"] == "triggered":
                    logger.info("Dashboard sync: TRIGGERED (runs and email follow within minutes)")
                else:
                    logger.warning(f"Dashboard sync: {result['dashboard_sync']} "
                                   "- the server's scheduled sync will pick the report up")
            else:
                logger.warning("SharePoint upload: FAILED (see logs above)")
        except Exception as e:
            result["sharepoint_upload"] = f"error: {e}"
            logger.error(f"SharePoint upload error: {e}")
    else:
        result["sharepoint_upload"] = "skipped"

    result["status"] = "success"
    logger.info("=" * 60)
    logger.info("Automation Anywhere Sync -- Complete")
    logger.info(f"Records: {result['records']}  |  Excel: {result['excel_path']}")
    logger.info(f"SharePoint: {result['sharepoint_upload']}")
    logger.info("=" * 60)

    return result


# ===========================================================================
# CLI entry-point  (python -m services.aa_service)
# ===========================================================================
def _cli():
    parser = argparse.ArgumentParser(
        description="Automation Anywhere -> SharePoint Sync. With no window "
                    "options, reports the latest completed Morning/Evening slot."
    )
    parser.add_argument(
        "--slot", choices=["morning", "evening"],
        help="Morning = 18:00 (previous day) to 06:00 IST, Evening = 06:00 to 18:00 IST"
    )
    parser.add_argument(
        "--date", type=str,
        help="Report date YYYY-MM-DD (the day the slot ends); requires --slot"
    )
    parser.add_argument("--hours", type=int, help="Rolling hours window ending now")
    parser.add_argument("--start", type=str, help="Start ISO-8601 datetime (UTC if no offset)")
    parser.add_argument("--end", type=str, help="End ISO-8601 datetime (UTC if no offset)")
    parser.add_argument(
        "--no-upload", action="store_true",
        help="Skip SharePoint upload (export only)"
    )
    args = parser.parse_args()

    result = aa_sync(
        hours=args.hours,
        start=args.start,
        end=args.end,
        upload_to_sharepoint=not args.no_upload,
        date=args.date,
        slot=args.slot,
    )

    # Print human-readable summary
    print("\n" + "=" * 55)
    print("  Automation Anywhere -> SharePoint Sync  Summary")
    print("=" * 55)
    print(f"  Status:            {result['status']}")
    print(f"  Report:            {result.get('report_title', 'N/A')}")
    print(f"  Records fetched:   {result['records']}")
    print(f"  Excel file:        {result.get('excel_path', 'N/A')}")
    print(f"  JSON archive:      {result.get('json_path', 'N/A')}")
    print(f"  SharePoint upload: {result.get('sharepoint_upload', 'N/A')}")
    print(f"  Dashboard sync:    {result.get('dashboard_sync', 'N/A')}")
    if result.get("message"):
        print(f"  Message:           {result['message']}")
    print("=" * 55 + "\n")

    # Non-zero exit so Task Scheduler shows the run as failed
    raise SystemExit(0 if result["status"] == "success" else 1)


if __name__ == "__main__":
    _cli()
