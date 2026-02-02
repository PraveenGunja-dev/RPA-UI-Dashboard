from database import engine, Base, SessionLocal
from services.excel_parser import parse_master_excel
from models import Bot, Department, SPOC, BotRun, VisitCount
import sys

def seed():
    print("Starting database seeding...")
    
    # Verify file exists
    file_path = r"d:\Adani_projects\RPA_Dashboard\data\Updated RPA.xlsx"
    
    # Reset Database
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed
    print(f"Parsing file: {file_path}")
    db = SessionLocal()
    try:
        # Initialize Visit Count
        db.add(VisitCount(id=1, count=0))
        db.commit()
        
        # Parse Excel
        records, depts, spocs, bots, errors = parse_master_excel(file_path, db)
        
        print("\nSeeding Complete!")
        print(f"Records Processed: {records}")
        print(f"Departments Created: {depts}")
        print(f"SPOCs Created: {spocs}")
        print(f"Bots Created: {bots}")
        
        if errors:
            print(f"\nEncountered {len(errors)} errors:")
            for err in errors[:5]:
                print(f" - {err}")
            if len(errors) > 5:
                print(f" ... and {len(errors)-5} more.")
        
    except Exception as e:
        print(f"Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
