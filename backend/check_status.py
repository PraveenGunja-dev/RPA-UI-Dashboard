from database import SessionLocal
from models import Bot
from sqlalchemy import func

def check_statuses():
    db = SessionLocal()
    try:
        # Get unique statuses and their counts
        results = db.query(Bot.status, func.count(Bot.status)).group_by(Bot.status).all()
        print("\n--- Bot Status Counts ---")
        for status, count in results:
            print(f"'{status}': {count}")
            
        # Also check for any bots with 'Unknown' status
        unknowns = db.query(Bot).filter(Bot.status == 'Unknown').count()
        print(f"\nBots with 'Unknown' status: {unknowns}")
        
    finally:
        db.close()

if __name__ == "__main__":
    check_statuses()
