"""Check for missing daily bot status report data.
Runs daily at 11:00 AM IST. If yesterday's (or older) data is missing,
sends an email alert to all Admin users.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Ensure we can import from backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import BotRun, RegisteredUser
from mail_util import send_missing_data_notification
from sqlalchemy import func


def check_missing_data():
    """
    Check if daily report data is missing for the last few business days.
    If any date (excluding weekends) has no BotRun records, notify admins.
    """
    print(f"[{datetime.now().isoformat()}] Starting missing data check...")
    load_dotenv()

    db = SessionLocal()
    try:
        # Get Admin Emails from DB
        admins = db.query(RegisteredUser).filter(RegisteredUser.role == "Admin").all()
        admin_emails = [admin.email for admin in admins if admin.email]

        if not admin_emails:
            print("No admin emails found in database. Skipping alert.")
            return

        # Use IST
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        today = ist_now.date()

        # Get the latest report_date that has data
        latest_date_str = db.query(func.max(BotRun.report_date)).scalar()
        last_data_date = None

        if latest_date_str:
            try:
                last_data_date = datetime.strptime(latest_date_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    last_data_date = datetime.strptime(latest_date_str, '%d-%m-%Y').date()
                except ValueError:
                    print(f"Could not parse latest report date: {latest_date_str}")

        # Check the last 3 business days (to catch gaps from long weekends etc.)
        missing_dates = []
        for days_back in range(1, 5):  # Check yesterday through 4 days ago
            check_date = today - timedelta(days=days_back)

            check_date_str = check_date.strftime('%Y-%m-%d')

            # Check if any BotRun records exist for this date
            run_count = db.query(func.count(BotRun.id)).filter(
                BotRun.report_date == check_date_str
            ).scalar()

            if run_count == 0:
                missing_dates.append(check_date.strftime('%d %b %Y (%A)'))

        if missing_dates:
            last_data_display = last_data_date.strftime('%d %b %Y') if last_data_date else "No data available"
            print(f"ALERT: Missing data for dates: {missing_dates}")
            print(f"Last available data: {last_data_display}")
            print(f"Sending alert to: {admin_emails}")

            success = send_missing_data_notification(
                admin_emails=admin_emails,
                missing_dates=missing_dates,
                last_data_date=last_data_display
            )

            if success:
                print("Missing data alert email sent successfully.")
            else:
                print("Failed to send missing data alert email.")
        else:
            print("All recent business days have report data. No alert needed.")

    except Exception as e:
        print(f"Error in missing data check: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    check_missing_data()
