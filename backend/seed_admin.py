from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from models import Base, RegisteredUser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'rpa_console.db')}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed_admin():
    # Ensure table exists
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Replace with a real email if known, using a placeholder for now
    admin_email = "cogn208685@adani.com" 
    
    existing = db.query(RegisteredUser).filter(RegisteredUser.email == admin_email).first()
    if not existing:
        admin = RegisteredUser(
            email=admin_email,
            name="System Admin",
            role="Admin",
            is_active=1
        )
        db.add(admin)
        db.commit()
        print(f"Admin user {admin_email} seeded.")
    else:
        print(f"Admin user {admin_email} already exists.")
    db.close()

if __name__ == "__main__":
    seed_admin()
