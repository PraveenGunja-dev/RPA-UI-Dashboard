#!/usr/bin/env python
"""
Automation Anywhere → SharePoint Sync  (CLI Entry Point)

This script is the single command you schedule in Windows Task Scheduler.
It pulls bot execution data from the Automation Anywhere Control Room API,
generates an Excel file matching the SharePoint daily-report format, and
uploads it to the configured SharePoint folder automatically.

Usage:
    python run_aa_sync.py              # last 12 hours (default)
    python run_aa_sync.py --hours 24   # last 24 hours
    python run_aa_sync.py --no-upload  # export only, skip SharePoint upload
    python run_aa_sync.py --help       # show all options

Scheduling:
    This is automatically scheduled to run every 12 hours by setup_schedules.bat.
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
