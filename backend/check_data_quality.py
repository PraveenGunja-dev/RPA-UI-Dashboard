from database import SessionLocal
from models import Bot

db = SessionLocal()
bots = db.query(Bot).all()

print(f"Total Bots: {len(bots)}")
count_with_hours = 0
count_with_date = 0

for bot in bots:
    has_hours = bot.hours_saved_monthly is not None and bot.hours_saved_monthly > 0
    has_date = bot.deployed_date is not None and len(str(bot.deployed_date)) > 5
    
    if has_hours: count_with_hours += 1
    if has_date: count_with_date += 1
    
    if bot.department and bot.department.name in ["BT", "Business Transformation"]:
         print(f"Bot: {bot.bot_name}, Hours: {bot.hours_saved_monthly}, Date: {bot.deployed_date}")

print(f"\nSummary:")
print(f"Bots with Hours Saved Monthly > 0: {count_with_hours}")
print(f"Bots with Valid Deployed Date: {count_with_date}")

db.close()
