from database import SessionLocal
from models import Bot

def check_data():
    db = SessionLocal()
    try:
        bots = db.query(Bot).limit(5).all()
        print(f"Found {len(bots)} bots.")
        for bot in bots:
            print(f"  Bot: {bot.bot_name}")
            print(f"  BU Name: {bot.bu_name}")
            print(f"  Schedule: {bot.schedule}")
            print(f"  SR No: {bot.sr_no}")
            print(f"  Status: {bot.status}")
            print(f"  Start Date: {bot.start_date}")
            print(f"  End Date: {bot.end_date}")
            print(f"  Comments: {bot.comments}")
            print(f"  Machine IP: {bot.machine_ip}")
            print(f"  Execution Time: {bot.execution_time}")
            print(f"  Running Status: {bot.bot_running_status}")
            print(f"  Last Run Status: {bot.last_run_status}")
            print("-" * 20)
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
