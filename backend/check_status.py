from database import SessionLocal
from models import Bot
from sqlalchemy import func

db = SessionLocal()
statuses = db.query(Bot.status, func.count(Bot.status)).group_by(Bot.status).all()

print("Distinct Statuses found in DB:")
for status, count in statuses:
    print(f"'{status}': {count}")
    
# Also check for 'BT' department specifically
print("\nStatuses in 'Business Transformation' (or BT) department:")
bots = db.query(Bot).all()
for bot in bots:
     dept_name = bot.department.name if bot.department else "No Dept"
     if dept_name in ["BT", "Business Transformation"]:
         print(f"Bot: {bot.bot_name}, Status: '{bot.status}'")

db.close()
