from database import SessionLocal
from models import Department

db = SessionLocal()
depts = db.query(Department).all()

print("ID | Name")
print("-" * 20)
for d in depts:
    print(f"{d.id} | {d.name}")
    
db.close()
