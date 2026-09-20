import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure we can import from backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from services.aa_service import aa_sync
from services.excel_parser import parse_daily_report

def run_historical():
    db = SessionLocal()
    # The gap is Sept 4th to Sept 16th
    start_dt = datetime(2026, 9, 4)
    end_dt = datetime(2026, 9, 16)
    
    current_dt = start_dt
    while current_dt <= end_dt:
        date_str = current_dt.strftime('%Y-%m-%d')
        print(f"\n{'='*40}")
        print(f"--- Processing {date_str} ---")
        print(f"{'='*40}")
        
        day_start = current_dt.strftime('%Y-%m-%dT00:00:00Z')
        day_end = current_dt.strftime('%Y-%m-%dT23:59:59Z')
        
        result = aa_sync(start=day_start, end=day_end, upload_to_sharepoint=False)
        
        if result['status'] == 'success' and result.get('excel_path'):
            print(f"Sync complete. Parsing {result['excel_path']} for date: {date_str}...")
            try:
                runs, bots, hours, errors = parse_daily_report(
                    file_path=result['excel_path'],
                    db=db,
                    report_date=date_str
                )
                print(f"Parsed: {runs} runs matched, {bots} unique bots matched, {hours} hours saved.")
                if errors:
                    print(f"Errors during parsing: {errors[:5]}")
            except Exception as e:
                print(f"Failed to parse for {date_str}: {str(e)}")
        else:
            print(f"Failed or no records: {result.get('message', 'No excel generated')}")
            
        current_dt += timedelta(days=1)
        
    db.close()
    print("\n--- Done historical sync. ---")

if __name__ == '__main__':
    run_historical()
