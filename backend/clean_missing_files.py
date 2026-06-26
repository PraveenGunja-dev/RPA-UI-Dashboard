
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import FileLog
import os

# Connect to database
SQLALCHEMY_DATABASE_URL = "sqlite:///./rpa_console.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Get all file logs
logs = db.query(FileLog).all()
cwd = os.getcwd()
deleted_count = 0

print(f"Checking {len(logs)} file logs...")

for log in logs:
    if log.file_path:
        # Construct absolute path
        # Normalize path separators for Windows
        file_path = log.file_path.replace('/', os.sep)
        abs_path = os.path.join(cwd, file_path)
        
        if not os.path.exists(abs_path):
            print(f"Deleting Log ID {log.id}: File missing at {abs_path}")
            db.delete(log)
            deleted_count += 1
        else:
            print(f"Log ID {log.id}: File exists at {abs_path}")

if deleted_count > 0:
    db.commit()
    print(f"Successfully deleted {deleted_count} logs with missing files.")
else:
    print("No missing files found.")

db.close()
