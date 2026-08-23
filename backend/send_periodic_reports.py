import os
import sys
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import func

# Ensure we can import from backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Bot, BotRun, RegisteredUser
from mail_util import send_performance_report_notification

def generate_report_data(report_type="Weekly"):
    """
    Generates statistics for the performance report based on the report_type.
    """
    db = SessionLocal()
    try:
        # 1. Determine Date Range
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        today_date = ist_now.date()
        
        if report_type.lower() == "monthly":
            # Last 30 days
            start_date = today_date - timedelta(days=30)
            period_str = f"{start_date.strftime('%d %b %Y')} - {today_date.strftime('%d %b %Y')}"
        else:
            # Last 7 days
            start_date = today_date - timedelta(days=7)
            period_str = f"{start_date.strftime('%d %b %Y')} - {today_date.strftime('%d %b %Y')}"
            
        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = today_date.strftime('%Y-%m-%d')

        # 2. Get All Runs in Period
        runs_query = db.query(BotRun, Bot).join(Bot, BotRun.bot_id == Bot.id).filter(
            BotRun.report_date >= start_date_str,
            BotRun.report_date <= end_date_str
        ).all()

        if not runs_query:
            print(f"No run data found for period: {period_str}")
            return None, period_str

        total_runs = len(runs_query)
        successful_runs = sum(1 for r, b in runs_query if r.run_status and r.run_status.lower() == 'completed')
        success_rate_pct = (successful_runs / total_runs * 100) if total_runs > 0 else 0
        success_rate = f"{success_rate_pct:.1f}%"

        # Calculate Total Hours Saved (sum of per_day_saving_hours for each successful run)
        # Assuming per_day_saving_hours represents savings per run in this context
        total_hours = sum(b.per_day_saving_hours or 0 for r, b in runs_query if r.run_status and r.run_status.lower() == 'completed')

        # 3. Generate Trend Data (Runs per day)
        trend_dict = {}
        # Initialize all days to 0
        curr = start_date
        while curr <= today_date:
            trend_dict[curr.strftime('%Y-%m-%d')] = 0
            curr += timedelta(days=1)
            
        for r, b in runs_query:
            if r.report_date in trend_dict:
                trend_dict[r.report_date] += 1
                
        # Format for chart (e.g. "Oct 12")
        labels = [datetime.strptime(d, '%Y-%m-%d').strftime('%b %d') for d in sorted(trend_dict.keys())]
        data = [trend_dict[d] for d in sorted(trend_dict.keys())]

        # 4. Top Bots (by successful runs)
        bot_stats = {}
        for r, b in runs_query:
            if b.id not in bot_stats:
                bot_stats[b.id] = {'name': b.bot_name or b.use_case_name, 'runs': 0, 'failed': 0, 'hours': 0}
            
            bot_stats[b.id]['runs'] += 1
            if r.run_status and r.run_status.lower() != 'completed':
                bot_stats[b.id]['failed'] += 1
            else:
                bot_stats[b.id]['hours'] += (b.per_day_saving_hours or 0)
                
        # Sort for top bots
        sorted_bots = sorted(bot_stats.values(), key=lambda x: x['runs'] - x['failed'], reverse=True)
        top_bots = []
        for bot in sorted_bots[:5]:
            if bot['runs'] - bot['failed'] > 0:
                top_bots.append({
                    'name': bot['name'],
                    'runs': bot['runs'] - bot['failed'],
                    'hours': round(bot['hours'], 1)
                })

        # 5. Failing Bots (Attention Required)
        sorted_failing = sorted(bot_stats.values(), key=lambda x: x['failed'], reverse=True)
        failing_bots = []
        for bot in sorted_failing[:5]:
            if bot['failed'] > 0:
                bot_success_rate = ((bot['runs'] - bot['failed']) / bot['runs'] * 100) if bot['runs'] > 0 else 0
                failing_bots.append({
                    'name': bot['name'],
                    'failed_runs': bot['failed'],
                    'success_rate': f"{bot_success_rate:.1f}%"
                })

        stats = {
            'total_runs': total_runs,
            'success_rate': success_rate,
            'hours_saved': int(total_hours),
            'labels': labels,
            'data': data,
            'top_bots': top_bots,
            'failing_bots': failing_bots
        }
        
        return stats, period_str
        
    finally:
        db.close()

def send_reports(report_type="Weekly"):
    print(f"[{datetime.now().isoformat()}] Preparing {report_type} Performance Report...")
    load_dotenv()
    
    db = SessionLocal()
    try:
        # Get Admin Emails
        admins = db.query(RegisteredUser).filter(RegisteredUser.role == "Admin").all()
        admin_emails = [admin.email for admin in admins if admin.email]
        
        if not admin_emails:
            print("No admin emails found. Exiting.")
            return

        stats, period_str = generate_report_data(report_type)
        if not stats:
            print("Not enough data to send report. Exiting.")
            return

        success = send_performance_report_notification(admin_emails, stats, report_type, period_str)
        if success:
            print(f"Successfully sent {report_type} report to admins.")
        else:
            print("Failed to send report email.")

    except Exception as e:
        print(f"Error executing {report_type} report job: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send periodic RPA performance reports")
    parser.add_argument("--type", choices=["weekly", "monthly"], default="weekly", help="Type of report to send")
    args = parser.parse_args()
    
    report_type_str = "Monthly" if args.type == "monthly" else "Weekly"
    send_reports(report_type_str)
