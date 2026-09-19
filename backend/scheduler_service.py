#!/usr/bin/env python
"""
CoBot job scheduler - runs as a Windows service under NSSM
(install_nssm_scheduler.bat), so jobs run without anyone logged in and the
service restarts itself if it stops.

Roles (which jobs this machine runs):
    aa      the machine that can reach the Automation Anywhere Control Room
    server  the dashboard server (it owns the database and sends the emails)
    all     both, on one machine

Timeline (IST):
    06:00, 18:00   aa_sync           AA report for the slot that just ended -> SharePoint,
                                     then the dashboard is triggered (email ~06:05 / ~18:05)
    06:30, 18:30   sharepoint_sync   backup sync in case the trigger did not reach the server
    09:00 daily    missing_data      alert admins if a recent day has no runs
    17:00 Friday   weekly_report     weekly performance email + PPT
    09:00 1st      monthly_report    monthly performance email + PPT

Each run is recorded in logs/scheduler/state.json. If the machine was off
at a run time, the job runs when the service starts again, as long as it is
within the job's catch-up window (AA sync: 36h, each missed slot is
regenerated oldest first). Nothing runs twice for the same scheduled time;
a failed AA sync / backup sync is retried after 10 minutes (3 attempts).

Usage:
    python scheduler_service.py --role aa            # run (what NSSM starts)
    python scheduler_service.py --role server --list # show jobs, last and next runs
    python scheduler_service.py --role aa --run aa_sync   # run one job now (testing)
"""

import argparse
import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from logging.handlers import RotatingFileHandler
from typing import List, Optional

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.getenv("SCHEDULER_LOG_DIR", os.path.join(BACKEND_DIR, "logs", "scheduler"))
STATE_PATH = os.path.join(LOG_DIR, "state.json")
IST = timezone(timedelta(hours=5, minutes=30))
POLL_SECONDS = 30
RETRY_DELAY = timedelta(minutes=10)


@dataclass
class Job:
    name: str
    role: str
    times: List[str]                      # "HH:MM" IST
    args: List[str]                       # script and arguments, relative to backend/
    catch_up: timedelta                   # run a missed time if we are this late or less
    timeout_minutes: int = 30
    max_attempts: int = 1                 # >1: retry a failed run (non-zero exit)
    weekday: Optional[int] = None         # 0 = Monday ... 6 = Sunday
    monthday: Optional[int] = None        # 1..28
    description: str = ""
    pass_slot: bool = False               # add --date/--slot for the scheduled time (AA sync)

    def command_args(self, occ: datetime) -> List[str]:
        if not self.pass_slot:
            return list(self.args)
        # Explicit slot, so a late or catch-up run still reports the right window
        slot = "morning" if occ.hour < 12 else "evening"
        return list(self.args) + ["--date", occ.strftime("%Y-%m-%d"), "--slot", slot]

    def matches_day(self, day) -> bool:
        if self.weekday is not None and day.weekday() != self.weekday:
            return False
        if self.monthday is not None and day.day != self.monthday:
            return False
        return True

    def occurrences_between(self, start: datetime, end: datetime):
        """Scheduled times in (start, end], oldest first."""
        out = []
        day = start.date()
        while day <= end.date():
            if self.matches_day(day):
                for t in self.times:
                    h, m = map(int, t.split(":"))
                    occ = datetime(day.year, day.month, day.day, h, m, tzinfo=IST)
                    if start < occ <= end:
                        out.append(occ)
            day += timedelta(days=1)
        return sorted(out)

    def latest_occurrence(self, now: datetime) -> Optional[datetime]:
        occ = self.occurrences_between(now - timedelta(days=40), now)
        return occ[-1] if occ else None

    def next_occurrence(self, now: datetime) -> Optional[datetime]:
        occ = self.occurrences_between(now, now + timedelta(days=40))
        return occ[0] if occ else None


JOBS = [
    Job("aa_sync", "aa", ["06:00", "18:00"], ["run_aa_sync.py"],
        # Each run names its slot, so missed slots (PC off overnight) are
        # regenerated oldest first within 36h
        catch_up=timedelta(hours=36), timeout_minutes=60, max_attempts=3, pass_slot=True,
        description="AA report -> SharePoint -> dashboard trigger (email)"),
    Job("sharepoint_sync", "server", ["06:30", "18:30"], ["run_sharepoint_sync.py"],
        catch_up=timedelta(hours=11), timeout_minutes=30, max_attempts=3,
        description="Backup sync: store new SharePoint files, send pending emails"),
    Job("missing_data", "server", ["09:00"], ["check_missing_data.py"],
        catch_up=timedelta(hours=12), description="Alert admins about days with no runs"),
    Job("weekly_report", "server", ["17:00"], ["send_periodic_reports.py", "--type", "weekly"],
        weekday=4, catch_up=timedelta(hours=24), timeout_minutes=45,
        description="Weekly performance email + PPT (Fridays)"),
    Job("monthly_report", "server", ["09:00"], ["send_periodic_reports.py", "--type", "monthly"],
        monthday=1, catch_up=timedelta(hours=48), timeout_minutes=45,
        description="Monthly performance email + PPT (1st of the month)"),
]


# ---------------------------------------------------------------------------
# State and logging
# ---------------------------------------------------------------------------
def setup_logging():
    os.makedirs(LOG_DIR, exist_ok=True)
    logger = logging.getLogger("scheduler")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        fh = RotatingFileHandler(os.path.join(LOG_DIR, "scheduler.log"),
                                 maxBytes=5 * 1024 * 1024, backupCount=5, encoding="utf-8")
        fh.setFormatter(fmt)
        logger.addHandler(fh)
        ch = logging.StreamHandler()
        ch.setFormatter(fmt)
        logger.addHandler(ch)
    return logger


log = setup_logging()


def load_state() -> dict:
    try:
        with open(STATE_PATH, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return {}


def save_state(state: dict):
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, STATE_PATH)


def now_ist() -> datetime:
    return datetime.now(timezone.utc).astimezone(IST)


def fmt(dt: Optional[datetime]) -> str:
    return dt.strftime("%a %d %b %Y %H:%M IST") if dt else "-"


# ---------------------------------------------------------------------------
# Running jobs
# ---------------------------------------------------------------------------
def run_job(job: Job, occ: datetime) -> int:
    args = job.command_args(occ)
    cmd = [sys.executable, os.path.join(BACKEND_DIR, args[0])] + args[1:]
    log.info(f"[{job.name}] START  {' '.join(args)}  (scheduled {fmt(occ)})")
    started = time.monotonic()
    try:
        proc = subprocess.run(cmd, cwd=BACKEND_DIR, capture_output=True, text=True,
                              encoding="utf-8", errors="replace",
                              timeout=job.timeout_minutes * 60)
        output, code = (proc.stdout or "") + (proc.stderr or ""), proc.returncode
    except subprocess.TimeoutExpired as e:
        output = str(e.stdout or "") + str(e.stderr or "")
        code = -1
        log.error(f"[{job.name}] TIMED OUT after {job.timeout_minutes} min")
    except Exception as e:
        output, code = "", -2
        log.error(f"[{job.name}] could not start: {e}")

    for line in output.strip().splitlines()[-60:]:  # tail is enough; full detail is in each job's own log
        log.info(f"[{job.name}]   {line}")
    log.info(f"[{job.name}] END    exit={code} in {time.monotonic() - started:.0f}s")
    return code


def next_run(job: Job, entry: dict, now: datetime):
    """
    (scheduled time, attempt number) to run now, or None. Marks scheduled
    times that are past the catch-up window as missed.
    """
    done = datetime.fromisoformat(entry["occurrence"]) if entry.get("occurrence") else now - timedelta(days=40)
    newer = job.occurrences_between(done, now)

    for occ in [o for o in newer if now - o > job.catch_up]:
        log.warning(f"[{job.name}] MISSED {fmt(occ)} (machine/service was down longer "
                    f"than the {job.catch_up} catch-up window)")
        entry.update({"occurrence": occ.isoformat(), "attempts": 0, "result": "missed", "retry_at": None})

    pending = [o for o in newer if now - o <= job.catch_up]
    if pending:
        return pending[0], 1  # oldest first; the rest follow on the next ticks

    retry_at = entry.get("retry_at")
    if retry_at and datetime.fromisoformat(retry_at) <= now and now - done <= job.catch_up:
        return done, entry.get("attempts", 0) + 1
    return None


def tick(jobs: List[Job], state: dict, now: datetime):
    for job in jobs:
        entry = state.setdefault(job.name, {})

        if "occurrence" not in entry:
            # First start: begin with the next scheduled time, don't replay history
            latest = job.latest_occurrence(now)
            entry.update({"occurrence": latest.isoformat() if latest else None,
                          "attempts": 0, "result": "not run (service installed)"})
            save_state(state)
            log.info(f"[{job.name}] first start - next run {fmt(job.next_occurrence(now))}")
            continue

        found = next_run(job, entry, now)
        save_state(state)
        if not found:
            continue
        occ, attempts = found
        if attempts == 1 and now - occ > timedelta(minutes=5):
            log.info(f"[{job.name}] catching up {fmt(occ)} (late by {now - occ})")
        code = run_job(job, occ)
        retry_at = None
        if code != 0 and attempts < job.max_attempts:
            retry_at = (now_ist() + RETRY_DELAY).isoformat()
            log.warning(f"[{job.name}] failed (attempt {attempts}/{job.max_attempts}), "
                        f"retrying at {fmt(datetime.fromisoformat(retry_at))}")
        entry.update({
            "occurrence": occ.isoformat(),
            "attempts": attempts,
            "result": "ok" if code == 0 else f"failed (exit {code})",
            "finished_at": now_ist().isoformat(),
            "retry_at": retry_at,
        })
        save_state(state)
        log.info(f"[{job.name}] next run {fmt(job.next_occurrence(now_ist()))}")


def jobs_for(role: str) -> List[Job]:
    return [j for j in JOBS if role == "all" or j.role == role]


def print_list(jobs: List[Job]):
    state = load_state()
    now = now_ist()
    print(f"Now: {fmt(now)}   state: {STATE_PATH}\n")
    for job in jobs:
        entry = state.get(job.name, {})
        last = entry.get("occurrence")
        print(f"{job.name:16} {job.description}")
        print(f"{'':16} times {', '.join(job.times)} IST"
              f"{' on ' + 'Mon Tue Wed Thu Fri Sat Sun'.split()[job.weekday] if job.weekday is not None else ''}"
              f"{' on day ' + str(job.monthday) if job.monthday else ''}"
              f" | catch-up {job.catch_up} | attempts {job.max_attempts}")
        print(f"{'':16} last {fmt(datetime.fromisoformat(last)) if last else '-'} -> {entry.get('result', '-')}"
              f" | next {fmt(job.next_occurrence(now))}\n")


def main():
    parser = argparse.ArgumentParser(description="CoBot job scheduler (NSSM service)")
    parser.add_argument("--role", required=True, choices=["aa", "server", "all"])
    parser.add_argument("--list", action="store_true", help="show jobs, last and next runs, then exit")
    parser.add_argument("--run", metavar="JOB", help="run one job now and exit (testing)")
    args = parser.parse_args()

    jobs = jobs_for(args.role)
    if args.list:
        print_list(jobs)
        return 0
    if args.run:
        job = next((j for j in jobs if j.name == args.run), None)
        if not job:
            parser.error(f"unknown job for role {args.role}: {args.run} "
                         f"(choose from {', '.join(j.name for j in jobs)})")
        occ = job.latest_occurrence(now_ist())
        return 0 if run_job(job, occ) == 0 else 1

    log.info(f"Scheduler started: role={args.role}, jobs={', '.join(j.name for j in jobs)}, "
             f"python={sys.executable}")
    state = load_state()
    try:
        while True:
            try:
                tick(jobs, state, now_ist())
            except Exception as e:  # keep the service alive; NSSM restarts it if it dies anyway
                log.exception(f"Scheduler error: {e}")
            time.sleep(POLL_SECONDS)
    except KeyboardInterrupt:
        log.info("Scheduler stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
