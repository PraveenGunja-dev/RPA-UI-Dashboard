import openpyxl
from sqlalchemy.orm import Session
from typing import Tuple, List, Any
import re
from models import Department, SPOC, Bot, BotRun
from datetime import datetime

def normalize_column_name(col: Any) -> str:
    """Normalize column names for consistent mapping."""
    if col is None:
        return ""
    col = str(col).lower().strip()
    col = re.sub(r'\s+', '_', col)
    col = re.sub(r'[^\w_]', '', col)
    return col

def get_sheet_data(sheet) -> List[dict]:
    """Helper to convert sheet to list of dicts based on header row."""
    rows = list(sheet.rows)
    if not rows:
        return []
    
    headers = [cell.value for cell in rows[0]]
    data = []
    
    for row in rows[1:]:
        row_data = {}
        has_data = False
        for i, cell in enumerate(row):
            if i < len(headers):
                val = cell.value
                # Normalize empty strings/spaces to None to match pandas behavior roughly
                if val is not None and isinstance(val, str) and not val.strip():
                    val = None
                
                if val is not None:
                    has_data = True
                
                row_data[headers[i]] = val
        
        if has_data:
            data.append(row_data)
            
    return data, headers

def parse_master_excel(file_path: str, db: Session) -> Tuple[int, int, int, int, List[str]]:
    """
    Parse the master bot list Excel file and store in database.
    Returns: (records_processed, departments_created, spocs_created, bots_created, errors)
    """
    errors = []
    records_processed = 0
    departments_created = 0
    spocs_created = 0
    bots_created = 0
    
    try:
        # Read Excel file
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Try to read AGEL sheet first, fall back to first sheet
        if 'AGEL' in wb.sheetnames:
            sheet = wb['AGEL']
        else:
            sheet = wb.active
        
        # Create column mapping
        rows = list(sheet.rows)
        if not rows:
            return 0, 0, 0, 0, ["Empty file"]
            
        header_row = rows[0]
        col_map = {} # normalized -> current_header_name
        header_index_map = {} # normalized -> column_index (0-based)
        
        for idx, cell in enumerate(header_row):
            val = cell.value
            if val:
                normalized = normalize_column_name(val)
                col_map[normalized] = val
                header_index_map[normalized] = idx
        
        # Process each row
        # Skip header
        for row_idx, row in enumerate(rows[1:], start=2):
            try:
                # Helper to safely get value by normalized column name
                def get_val(norm_key):
                    if norm_key in header_index_map:
                        col_idx = header_index_map[norm_key]
                        if col_idx < len(row):
                            val = row[col_idx].value
                            if val is not None and isinstance(val, str) and not val.strip():
                                return None
                            return val
                    return None

                # Get use case name
                use_case_name = None
                for key in ['use_case_name_/_bot_name', 'use_case_name', 'bot_name', 'usecase_name']:
                    val = get_val(key)
                    if val is not None:
                        use_case_name = str(val).strip()
                        break
                
                if not use_case_name or use_case_name.lower() == 'nan':
                    continue
                
                records_processed += 1
                
                # Get or create department
                dept_name = None
                val = get_val('department')
                if val is not None:
                    dept_name = str(val).strip()
                
                department = None
                if dept_name and dept_name.lower() != 'nan':
                    department = db.query(Department).filter(Department.name == dept_name).first()
                    if not department:
                        department = Department(name=dept_name)
                        db.add(department)
                        db.flush()
                        departments_created += 1
                
                # Get or create SPOC
                spoc_name = None
                val = get_val('business_spoc')
                if val is not None:
                    spoc_name = str(val).strip()
                
                spoc = None
                if spoc_name and spoc_name.lower() != 'nan':
                    spoc = db.query(SPOC).filter(SPOC.name == spoc_name).first()
                    if not spoc:
                        spoc = SPOC(name=spoc_name)
                        db.add(spoc)
                        db.flush()
                        spocs_created += 1
                
                # Check if bot already exists
                existing_bot = db.query(Bot).filter(Bot.use_case_name == use_case_name).first()
                
                # Helper to get string val
                def get_str(key):
                    v = get_val(key)
                    if v is not None:
                        return str(v).strip()
                    return None

                # Get other fields
                status = get_str('status') or 'Unknown'
                developer = get_str('developer')
                
                hours_saved = get_val('hours_optimization_per_month')
                if hours_saved is None:
                    hours_saved = 0
                else:
                    try:
                        hours_saved = float(hours_saved)
                    except:
                        hours_saved = 0
                
                deployed_date = get_str('deployed_date')
                if deployed_date and isinstance(get_val('deployed_date'), datetime):
                     deployed_date = get_val('deployed_date').strftime('%Y-%m-%d')

                schedule = get_str('schedule')
                description = get_str('comments_/_pending_actions') # Mapping Comments to description/comments
                bu_name = get_str('bu_name')
                team = get_str('team')
                pdd_location = get_str('pdd_location_/_release_notes_location')
                
                # New fields
                sr_no_val = get_val('srno')
                sr_no = int(sr_no_val) if sr_no_val and str(sr_no_val).isdigit() else None
                
                start_date = get_str('startdate')
                if start_date and isinstance(get_val('startdate'), datetime):
                     start_date = get_val('startdate').strftime('%Y-%m-%d')
                     
                end_date = get_str('enddate')
                if end_date and isinstance(get_val('enddate'), datetime):
                     end_date = get_val('enddate').strftime('%Y-%m-%d')

                comments = get_str('comments_/_pending_actions')
                machine_ip = get_str('botrunnermachine/_ip')
                execution_time = get_str('execution_time')
                bot_running_status = get_str('bot_running_status')
                last_run_status = get_str('last_run_status')
                key_benefits = get_str('key_benefits')
                bot_name = get_str('use_case_name_/_bot_name') or use_case_name

                if existing_bot:
                    # Update existing bot
                    existing_bot.bot_name = bot_name
                    existing_bot.status = status
                    existing_bot.developer = developer
                    existing_bot.hours_saved_monthly = hours_saved
                    existing_bot.deployed_date = deployed_date
                    existing_bot.schedule = schedule
                    existing_bot.description = description
                    existing_bot.bu_name = bu_name
                    existing_bot.team = team
                    existing_bot.pdd_location = pdd_location
                    
                    # New fields update
                    existing_bot.sr_no = sr_no
                    existing_bot.start_date = start_date
                    existing_bot.end_date = end_date
                    existing_bot.comments = comments
                    existing_bot.machine_ip = machine_ip
                    existing_bot.execution_time = execution_time
                    existing_bot.bot_running_status = bot_running_status
                    existing_bot.last_run_status = last_run_status
                    existing_bot.key_benefits = key_benefits

                    if department:
                        existing_bot.department_id = department.id
                    if spoc:
                        existing_bot.spoc_id = spoc.id
                else:
                    # Create new bot
                    bot = Bot(
                        use_case_name=use_case_name,
                        bot_name=bot_name,
                        department_id=department.id if department else None,
                        spoc_id=spoc.id if spoc else None,
                        status=status,
                        developer=developer,
                        hours_saved_monthly=hours_saved,
                        deployed_date=deployed_date,
                        schedule=schedule,
                        description=description,
                        bu_name=bu_name,
                        team=team,
                        pdd_location=pdd_location,
                        created_at=datetime.now().isoformat(),
                        
                        # New fields
                        sr_no=sr_no,
                        start_date=start_date,
                        end_date=end_date,
                        comments=comments,
                        machine_ip=machine_ip,
                        execution_time=execution_time,
                        bot_running_status=bot_running_status,
                        last_run_status=last_run_status,
                        key_benefits=key_benefits
                    )
                    db.add(bot)
                    bots_created += 1
                
            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")
        
        db.commit()
        
    except Exception as e:
        errors.append(f"File processing error: {str(e)}")
        db.rollback()
    
    return records_processed, departments_created, spocs_created, bots_created, errors


def parse_daily_report(file_path: str, db: Session, report_date: str = None) -> Tuple[int, int, List[str]]:
    """
    Parse the daily bot status report and store run records.
    Returns: (runs_processed, bots_matched, errors)
    """
    errors = []
    runs_processed = 0
    bots_matched = 0
    matched_bot_ids = set()
    
    if not report_date:
        report_date = datetime.now().strftime('%Y-%m-%d')
    
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        
        # Look for Control Room Dump sheet
        sheet_name = None
        for name in wb.sheetnames:
            if 'control room' in name.lower() or 'dump' in name.lower():
                sheet_name = name
                break
        
        if not sheet_name:
            sheet_name = wb.sheetnames[0]
            
        sheet = wb[sheet_name]
        
        # Create column mapping
        rows = list(sheet.rows)
        if not rows:
             return 0, 0, ["Empty file"]

        header_row = rows[0]
        col_map = {} 
        header_index_map = {}
        
        for idx, cell in enumerate(header_row):
            val = cell.value
            if val:
                normalized = normalize_column_name(val)
                col_map[normalized] = val
                header_index_map[normalized] = idx
        
        # Delete existing runs for this report date
        db.query(BotRun).filter(BotRun.report_date == report_date).delete()
        
        for row_idx, row in enumerate(rows[1:], start=2):
            try:
                def get_val(norm_key):
                    if norm_key in header_index_map:
                        col_idx = header_index_map[norm_key]
                        if col_idx < len(row):
                            val = row[col_idx].value
                            if val is not None and isinstance(val, str) and not val.strip():
                                return None
                            return val
                    return None

                # Get activity name
                activity_name = None
                for key in ['activity_name', 'automation_name', 'bot_name']:
                    val = get_val(key)
                    if val is not None:
                        activity_name = str(val).strip()
                        break
                
                if not activity_name or activity_name.lower() == 'nan':
                    continue
                
                # Try to match with existing bot
                # First try exact match
                bot = db.query(Bot).filter(Bot.use_case_name == activity_name).first()
                
                if not bot:
                    # Try to find bot by partial match
                    # Extract base name (before version numbers)
                    base_name = re.split(r'\.\d+', activity_name)[0]
                    bot = db.query(Bot).filter(Bot.use_case_name.like(f"{base_name}%")).first()
                
                if not bot:
                    # Try matching by checking if activity contains bot name
                    bots = db.query(Bot).all()
                    for b in bots:
                        if b.use_case_name in activity_name or activity_name.startswith(b.use_case_name.split('_')[0]):
                            bot = b
                            break
                
                if not bot:
                    continue
                
                runs_processed += 1
                if bot.id not in matched_bot_ids:
                    bots_matched += 1
                    matched_bot_ids.add(bot.id)
                
                # Get run status
                run_status = get_val('status')
                if run_status is not None:
                    run_status = str(run_status).strip()
                else:
                    run_status = 'Unknown'
                
                # Get timing info
                started_on = get_val('started_on')
                if started_on is not None:
                    started_on = str(started_on)
                else:
                    started_on = None
                
                ended_on = get_val('ended_on')
                if ended_on is not None:
                    ended_on = str(ended_on)
                else:
                    ended_on = None
                
                device_name = get_val('device_name')
                if device_name is not None:
                    device_name = str(device_name).strip()
                else:
                    device_name = None
                
                automation_type = get_val('automation_type')
                if automation_type is not None:
                    automation_type = str(automation_type).strip()
                else:
                    automation_type = None
                
                # Create bot run record
                bot_run = BotRun(
                    bot_id=bot.id,
                    run_status=run_status,
                    started_on=started_on,
                    ended_on=ended_on,
                    device_name=device_name,
                    report_date=report_date,
                    automation_type=automation_type
                )
                db.add(bot_run)
                
            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")
        
        db.commit()
        
    except Exception as e:
        errors.append(f"File processing error: {str(e)}")
        db.rollback()
    
    return runs_processed, bots_matched, errors
