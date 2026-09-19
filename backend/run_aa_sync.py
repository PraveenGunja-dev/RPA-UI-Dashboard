#!/usr/bin/env python
"""
Automation Anywhere → SharePoint Sync  (CLI Entry Point)

This script is the single command you schedule in Windows Task Scheduler.
It pulls bot execution data from the Automation Anywhere Control Room API,
generates the Bot Status Report workbook, and uploads it to the SharePoint
AA folder, where the dashboard picks it up, stores the runs and emails it.

Usage:
    python run_aa_sync.py                                  # latest completed slot
    python run_aa_sync.py --date 2026-09-19 --slot evening # re-run a specific slot
    python run_aa_sync.py --no-upload                      # export only, skip SharePoint upload
    python run_aa_sync.py --help                           # show all options

Slots (IST): Morning = 18:00 previous day -> 06:00, Evening = 06:00 -> 18:00.

Scheduling:
    Run daily at 06:00 and 18:00 with no arguments; each run reports the
    slot that just ended, even if the task starts late.
"""

import sys
import os

# Ensure the backend directory is on sys.path so that
# "from services.aa_service import ..." resolves correctly
# regardless of the working directory at invocation time.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.aa_service import _cli

if __name__ == "__main__":
    _cli()
