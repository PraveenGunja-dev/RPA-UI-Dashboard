import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Ensure we can import from backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Bot, RegisteredUser
from mail_util import send_weekly_summary_notification

def run_weekly_summary():
    print("Starting weekly bot summary job...")
    load_dotenv()
    
    db = SessionLocal()
    try:
        # Get Admin Emails
        admins = db.query(RegisteredUser).filter(RegisteredUser.role == "Admin").all()
        admin_emails = [admin.email for admin in admins if admin.email]
        
        if not admin_emails:
            print("No admin emails found in database. Exiting.")
            return

        # Fetch bots
        bots = db.query(Bot).all()
        
        active_count = 0
        inactive_count = 0
        new_count = 0
        
        now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        seven_days_ago = now - timedelta(days=7)
        
        for bot in bots:
            # Check status
            status = str(bot.status).strip().lower() if bot.status else ""
            if status in ["hold", "inactive", "in active"]:
                inactive_count += 1
            else:
                active_count += 1
                
            # Check if new (created within last 7 days)
            if bot.created_at:
                try:
                    # e.g., '2023-10-27T10:00:00'
                    created_date = datetime.fromisoformat(str(bot.created_at).split('.')[0])
                    if created_date >= seven_days_ago:
                        new_count += 1
                except ValueError:
                    pass
                    
        print(f"Stats -> Active: {active_count}, Inactive: {inactive_count}, New: {new_count}")
        
        # Send Notification
        success = send_weekly_summary_notification(admin_emails, active_count, new_count, inactive_count)
        if success:
            print("Weekly summary email sent successfully.")
        else:
            print("Failed to send weekly summary email.")
            
    except Exception as e:
        print(f"Error executing weekly summary job: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    run_weekly_summary()
