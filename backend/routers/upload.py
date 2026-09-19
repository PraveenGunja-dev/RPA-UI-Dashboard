from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import shutil
import os
from datetime import datetime

from database import get_db
from services.excel_parser import parse_master_excel, ingest_manual_file
from schemas import UploadResponse
from .auth import require_admin

# Uploads change dashboard data, so they need a signed-in Admin
router = APIRouter(prefix="/api", tags=["upload"], dependencies=[Depends(require_admin)])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-master", response_model=UploadResponse)
async def upload_master_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and process the master bot list Excel file."""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be an Excel file (.xlsx or .xls)")
    
    # Save uploaded file
    # basename: keep a crafted name like "../x.xlsx" inside UPLOAD_DIR
    file_path = os.path.join(UPLOAD_DIR, os.path.basename(f"master_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"))
    
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
    file_path = os.path.join(UPLOAD_DIR, os.path.basename(f"daily_{report_date}_{file.filename}"))
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Merge: only runs missing from the dashboard are added, so a manual
        # upload never replaces or double-counts Automation Anywhere data
        result = ingest_manual_file(file_path, db)
        errors = result["errors"]

        return {
            "success": len(errors) == 0,
            "message": (f"Added {result['runs_inserted']} missing bot runs "
                        f"({result['duplicates_skipped']} already on the dashboard), "
                        f"matched {result['unique_bots']} bots"),
            "runs_processed": result["runs_inserted"],
            "bots_matched": result["unique_bots"],
            "hours_saved_estimate": result["hours_saved"],
            "report_date": ", ".join(result["report_dates"]) or report_date,
            "errors": errors[:10]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()
