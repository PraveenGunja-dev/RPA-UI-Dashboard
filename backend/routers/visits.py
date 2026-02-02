from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer
from database import get_db, Base, engine

from models import VisitCount

router = APIRouter(prefix="/api", tags=["visits"])


@router.get("/visits/count")
def get_visit_count(db: Session = Depends(get_db)):
    """Get current visit count."""
    visit = db.query(VisitCount).first()
    if not visit:
        visit = VisitCount(id=1, count=0)
        db.add(visit)
        db.commit()
        db.refresh(visit)
    return {"count": visit.count}


@router.post("/visits/increment")
def increment_visit_count(db: Session = Depends(get_db)):
    """Increment visit count."""
    visit = db.query(VisitCount).first()
    if not visit:
        visit = VisitCount(id=1, count=1)
        db.add(visit)
    else:
        visit.count += 1
    db.commit()
    db.refresh(visit)
    return {"new_count": visit.count}
