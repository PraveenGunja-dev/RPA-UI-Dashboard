#!/usr/bin/env python
"""
SharePoint -> Dashboard Sync  (CLI Entry Point, run on the dashboard server)

Pulls new files from SharePoint into the dashboard database - including the
Automation Anywhere Bot Status Reports - and emails each new report to the
admins and the SPOCs of failed bots. Every email attempt is visible in
Admin > Email Reports.

Normally run_aa_sync.py triggers the sync on the server right after each
upload (POST /api/integration/trigger-sync), and it also runs when someone
signs in. Schedule this as a backup in case that trigger can't reach the
server: daily at 06:30 and 18:30 IST. Nothing is stored or emailed twice.

Usage:
    python run_sharepoint_sync.py
"""

import asyncio
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)
# File paths in the database (uploads/archive/...) are relative to backend/
os.chdir(BACKEND_DIR)

from database import SessionLocal, engine, Base  # noqa: E402
import models  # noqa: E402,F401  (registers tables, incl. email_logs)
from routers.integration import run_sync_sharepoint  # noqa: E402


def main() -> int:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Wait for a sync the web server may be running, rather than skip
        result = asyncio.run(run_sync_sharepoint(db, wait_seconds=10 * 60))
    finally:
        db.close()

    print(result.get("message"))
    for error in (result.get("details") or {}).get("errors", []):
        print(f"  - {error}")
    return 0 if result.get("status") == "success" else 1


if __name__ == "__main__":
    sys.exit(main())
