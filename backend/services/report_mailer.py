"""
Emails Bot Status Reports and records every attempt in email_logs, so admins
can see whether each report went out (Admin > Email Reports).

Recipients: all Admins (active Admin users + ADMIN_EMAILS) in To, plus the
SPOC of every bot that failed in the report window in Cc.
"""

import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from mail_util import send_bot_status_report_notification, resolve_recipients
from models import EmailLog, RegisteredUser
from services.bot_status_report import summarize_report
from services.excel_parser import _build_bot_matcher

# Reports older than this when first ingested (e.g. a backfill) are stored
# but not emailed automatically; admins can still send them with Resend.
AUTO_EMAIL_MAX_AGE_HOURS = 24
# Automatic attempts per report before giving up (admins can still Resend)
MAX_AUTO_ATTEMPTS = 3

AUTO = "Auto"
AUTO_RETRY = "Auto (retry)"

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _ist_now() -> datetime:
    return datetime.utcnow() + timedelta(hours=5, minutes=30)


def resolve_report_path(file_path: str) -> str:
    """FileLog paths are relative to the backend's working directory."""
    if os.path.isabs(file_path):
        return file_path
    for base in (os.getcwd(), BACKEND_DIR):
        candidate = os.path.join(base, file_path)
        if os.path.exists(candidate):
            return candidate
    return os.path.join(os.getcwd(), file_path)


def admin_emails(db: Session) -> List[str]:
    emails = {
        u.email.strip().lower()
        for u in db.query(RegisteredUser).filter(
            RegisteredUser.role == "Admin", RegisteredUser.is_active == 1
        ).all()
        if u.email
    }
    emails.update(e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip())
    return sorted(emails)


def failed_bot_spoc_emails(db: Session, failed_runs) -> List[str]:
    if not failed_runs:
        return []
    match = _build_bot_matcher(db)
    emails = set()
    for run in failed_runs:
        bot = match(str(run.get("automation_name") or ""))
        if bot and bot.spoc and bot.spoc.email:
            emails.update(e.strip().lower() for e in bot.spoc.email.replace(";", ",").split(",") if e.strip())
    return sorted(emails)


def send_report_email(db: Session, report_name: str, file_path: str,
                      report_date: Optional[str], triggered_by: str) -> EmailLog:
    """Email one report now and log the attempt. Never raises for mail errors."""
    log = EmailLog(
        report_name=report_name,
        report_date=report_date,
        file_path=file_path,
        triggered_by=triggered_by,
        sent_at=_ist_now().isoformat(),
    )
    abs_path = resolve_report_path(file_path) if file_path else None

    try:
        if not abs_path or not os.path.exists(abs_path):
            raise FileNotFoundError(f"Report file not found: {file_path}")
        summary = summarize_report(abs_path)
        to = admin_emails(db)
        cc = [e for e in failed_bot_spoc_emails(db, summary["failed_runs"]) if e not in to]
        ok, error, subject = send_bot_status_report_notification(
            to, cc, summary, abs_path, attachment_name=report_name)
        log.subject = subject
        # TEST_EMAIL_OVERRIDE (mail_util.resolve_recipients) may have redirected
        # the actual send elsewhere; log what was really sent, not the
        # real admin/SPOC list, so Admin > Email Reports isn't misleading.
        actual_to, actual_cc = resolve_recipients(to, cc)
        log.recipients = ", ".join(actual_to)
        log.cc = ", ".join(actual_cc)
        log.status = "Sent" if ok else "Failed"
        log.error_message = error
    except Exception as e:
        log.status = "Failed"
        log.error_message = str(e)

    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def _parse_utc(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def auto_email_report(db: Session, report_name: str, file_path: str,
                      report_date: Optional[str], file_modified=None) -> Optional[EmailLog]:
    """
    Called after a report is ingested: emails it once. Returns the new log,
    or None when the report was already emailed.
    """
    already_sent = db.query(EmailLog).filter(
        EmailLog.report_name == report_name, EmailLog.status == "Sent"
    ).first()
    if already_sent:
        return None
    auto_failures = db.query(EmailLog).filter(
        EmailLog.report_name == report_name,
        EmailLog.status == "Failed",
        EmailLog.triggered_by.in_([AUTO, AUTO_RETRY]),
    ).count()
    if auto_failures >= MAX_AUTO_ATTEMPTS:
        return None

    modified = _parse_utc(file_modified)
    if modified and datetime.now(timezone.utc) - modified > timedelta(hours=AUTO_EMAIL_MAX_AGE_HOURS):
        if db.query(EmailLog).filter(EmailLog.report_name == report_name,
                                     EmailLog.status == "Skipped").first():
            return None
        log = EmailLog(
            report_name=report_name,
            report_date=report_date,
            file_path=file_path,
            triggered_by=AUTO,
            sent_at=_ist_now().isoformat(),
            status="Skipped",
            error_message=(f"Report was more than {AUTO_EMAIL_MAX_AGE_HOURS}h old when it "
                           "reached the dashboard, so it was not emailed automatically. "
                           "Use Resend to send it."),
        )
        db.add(log)
        db.commit()
        return log

    return send_report_email(db, report_name, file_path, report_date, AUTO)


def retry_failed_report_emails(db: Session) -> List[EmailLog]:
    """
    Retry automatic sends that failed (e.g. SMTP unavailable) for reports
    first attempted in the last AUTO_EMAIL_MAX_AGE_HOURS, up to
    MAX_AUTO_ATTEMPTS attempts per report.
    """
    by_report = defaultdict(list)
    for log in db.query(EmailLog).filter(EmailLog.triggered_by.in_([AUTO, AUTO_RETRY])).all():
        by_report[log.report_name].append(log)

    cutoff = _ist_now() - timedelta(hours=AUTO_EMAIL_MAX_AGE_HOURS)
    retried = []
    for report_name, logs in by_report.items():
        if any(l.status in ("Sent", "Skipped") for l in logs):
            continue
        if db.query(EmailLog).filter(EmailLog.report_name == report_name,
                                     EmailLog.status == "Sent").first():
            continue  # sent manually
        failed = [l for l in logs if l.status == "Failed"]
        if not failed or len(failed) >= MAX_AUTO_ATTEMPTS:
            continue
        first_attempt = min(l.sent_at for l in failed)
        try:
            if datetime.fromisoformat(first_attempt) < cutoff:
                continue
        except (TypeError, ValueError):
            continue
        latest = max(failed, key=lambda l: l.sent_at)
        retried.append(send_report_email(db, report_name, latest.file_path,
                                         latest.report_date, AUTO_RETRY))
    return retried
