from database import SessionLocal
from models import Bot
from sqlalchemy import func

def inspect_bots():
    db = SessionLocal()
    try:
        # Total bots
        total = db.query(Bot).count()
        print(f"Total Bots: {total}")
        
        # Status distribution
        print("\nStatus Distribution:")
        results = db.query(Bot.status, func.count(Bot.status)).group_by(Bot.status).all()
        for status, count in results:
            print(f"  '{status}': {count}")
            
        # Sample of bots
        print("\nSample Bots (First 10):")
        bots = db.query(Bot).limit(10).all()
        for b in bots:
            print(f"  ID: {b.id} | Name: {b.bot_name} | Status: '{b.status}'")

    finally:
        db.close()

if __name__ == "__main__":
    inspect_bots()
