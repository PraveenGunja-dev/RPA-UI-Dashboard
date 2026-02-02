from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import shutil
import os
from datetime import datetime

from database import get_db
from services.excel_parser import parse_master_excel, parse_daily_report
from schemas import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-master", response_model=UploadResponse)
async def upload_master_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and process the master bot list Excel file."""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"master_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse and store data
        records, depts, spocs, bots, errors = parse_master_excel(file_path, db)
        
        return UploadResponse(
            success=len(errors) == 0,
            message=f"Processed {records} records from master file",
            records_processed=records,
            departments_created=depts,
            spocs_created=spocs,
            bots_created=bots,
            errors=errors[:10]  # Limit errors in response
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()


@router.post("/upload-daily-report", response_model=dict)
async def upload_daily_report(
    file: UploadFile = File(...),
    report_date: str = None,
    db: Session = Depends(get_db)
):
    """Upload and process the daily bot status report."""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    if not report_date:
        report_date = datetime.now().strftime('%Y-%m-%d')
    
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"daily_{report_date}_{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse and store data
        runs, bots_matched, errors = parse_daily_report(file_path, db, report_date)
        
        return {
            "success": len(errors) == 0,
            "message": f"Processed {runs} bot runs, matched {bots_matched} bots",
            "runs_processed": runs,
            "bots_matched": bots_matched,
            "report_date": report_date,
            "errors": errors[:10]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()
