from models import BotRun
from datetime import datetime, timedelta

def normalize_status_string(status: str) -> str:
    """Normalize status string to lowercase with no spaces for comparison."""
    if not status:
        return ""
    return status.lower().strip().replace(' ', '')

def is_bot_active(status: str) -> bool:
    """
    Determine if a bot status represents an Active/Deployed state.
    Robustly handles variations like "In Active" (Inactive) vs "Active".
    """
    if not status:
        return False
        
    s_clean = normalize_status_string(status)
    
    # Negative checks first (take precedence)
    if any(x in s_clean for x in ['inactive', 'hold', 'suspended', 'stop', 'pending', 'tbd', 'notstarted']):
        return False
        
    # Positive checks
    if any(x in s_clean for x in ['deployed', 'live', 'active', 'production', 'running']):
        return True
        
    # Default to False if unknown
    return False

def get_display_status(status: str) -> str:
    """
    Get a standardized status string for UI display.
    Normalizes 'In Active' -> 'Inactive', 'Deployed' -> 'Active'.
    """
    if not status:
        return "Unknown"
        
    if is_bot_active(status):
        return "Active"
    
    s_clean = normalize_status_string(status)
    
    if 'hold' in s_clean:
        return "Hold"
    if 'pending' in s_clean:
        return "Pending"
    if 'suspend' in s_clean:
        return "Suspended"
        
    return status.title()

def get_per_run_value(bot) -> float:
    """
    Determine the 'Hours Optimization per run' for a bot.
    Priority:
    1. Explicit per_day_saving_hours (if treated as per-run)
    2. Derived from Monthly Hours / Frequency
    """
    # If per_day_saving_hours is populated and legitimate (e.g., > 0), use it.
    # Assumption: User puts "Optimization per RUN" in this field or we derive it.
    # Based on previous context, per_day might be 0.
    if bot.per_day_saving_hours and bot.per_day_saving_hours > 0:
        return float(bot.per_day_saving_hours)
    
    # Fallback: Monthly / Frequency
    monthly = bot.hours_saved_monthly or 0
    if monthly <= 0:
        return 0.0
        
    freq_str = (bot.frequency or "").lower()
    divisor = 30.0 # Default Daily
    
    if 'weekly' in freq_str:
        divisor = 4.0
    elif 'monthly' in freq_str:
        divisor = 1.0
    elif 'daily' in freq_str:
        divisor = 30.0
    elif 'demand' in freq_str:
        # For On Demand, if we lack per_run, we assume Monthly is an aggregate estimate?
        # Or implies 1 run? Hard to guess.
        # Let's assume standard Daily divisor if unknown, to be safe.
        divisor = 30.0 
        
    return monthly / divisor if divisor else 0.0

def calculate_realized_savings(bot, report_date: str, runs_count: int = 1) -> float:
    """
    Calculate realized savings for a bot based on its schedule and frequency.
    
    Logic:
    - On Demand / Multiple Time in a Day: per_day_saving_hours (value from Excel)
    - All other schedules: monthly_hours / frequency
    """
    monthly_hours = bot.hours_saved_monthly or 0
    per_day_hours = bot.per_day_saving_hours or 0
    schedule = (bot.schedule or "").lower().strip()
    
    # Get frequency as number (default to 1 if not set or invalid)
    try:
        frequency = float(bot.frequency) if bot.frequency else 1
        if frequency <= 0:
            frequency = 1
    except (ValueError, TypeError):
        frequency = 1
    
    # Case 1: On Demand or Multiple Time in a Day -> use per_day_saving_hours * runs
    if 'on demand' in schedule or 'multiple' in schedule:
        return per_day_hours * runs_count
    
    # Case 2: All other schedules -> (monthly / frequency) * runs_count
    # Calculate value per run
    if frequency > 0:
        value_per_run = monthly_hours / frequency
    else:
        value_per_run = 0
        
    return value_per_run * runs_count

def calculate_fte_savings(
    bot,
    ist_now=None,
    db=None 
):
    """
    Calculate FTE Savings based on strict logic:
    - Cutoff: Jan 28, 2026.
    - Pre-Cutoff: Formula (Fixed) or Back-Calculated Average (On-Demand).
    - Post-Cutoff: Strict Actuals (Run Count * Per Run Value).
    """
    from datetime import datetime, timedelta
    
    if ist_now is None:
        ist_now = datetime.utcnow() + timedelta(hours=5, minutes=30)
        
    # 1. Define Cutoff
    CUTOFF_DATE = datetime(2026, 1, 28)
    
    hours_saved_month = 0.0
    hours_saved_till_date = 0.0
    
    try:
        # 2. Determine Deployment/Start Date
        # "If deployment date missing -> use end date" (?)
        start_date = None
        
        # Try fields in order
        candidates = [bot.deployed_date, bot.start_date, bot.end_date]
        
        for cand in candidates:
            if not cand: continue
            if isinstance(cand, datetime):
                start_date = cand
                break
            # Try parse string
            c_str = str(cand).split(' ')[0].strip()
            found = False
            for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%Y/.%m/%d']:
                try:
                    start_date = datetime.strptime(c_str, fmt)
                    found = True
                    break
                except ValueError:
                    continue
            if found: break
            
        if not start_date:
            # Cannot calculate history without start date.
            # But can calculate recent actuals?
            # Let's assume start_date is required for Till Date.
            start_date = ist_now # Fallback to 0 duration
            
        # 3. Helpers
        per_run_value = get_per_run_value(bot)
        schedule = (bot.schedule or "").lower()
        is_fixed = any(x in schedule for x in ['daily', 'date_of_month', 'day_of_week', 'monthly'])
        is_on_demand_type = 'on demand' in schedule or 'multiple' in schedule
        # Default to Fixed if ambiguous?
        if not is_fixed and not is_on_demand_type:
            is_fixed = True 
            
        # 4. Phase 2: Recent Savings (Jan 28, 2026 -> Now)
        # "Use actual run data from dump" for EVERYONE.
        
        recent_savings = 0.0
        avg_runs_per_day = 0.0
        active_days_calc = 0
        
        # We only look at recent period if we are past cutoff
        if ist_now > CUTOFF_DATE:
            # Start of recent period is Cutoff (or Start Date if later)
            recent_start = max(CUTOFF_DATE, start_date)
            
            if recent_start < ist_now:
                # Calculate Duration of Recent Period (for Average calc)
                recent_duration = ist_now - recent_start
                active_days_calc = recent_duration.total_seconds() / 86400.0
                
                if db:
                    from sqlalchemy import or_
                    # Fetch all successful runs
                    all_runs = db.query(BotRun).filter(
                        BotRun.bot_id == bot.id,
                        or_(
                            BotRun.run_status.ilike('%completed%'),
                            BotRun.run_status.ilike('%success%'),
                            BotRun.run_status.ilike('%pass%'),
                            BotRun.run_status.ilike('%processed%'),
                            BotRun.run_status.ilike('%done%')
                        )
                    ).all()
                    
                    # Filter for Recent Period
                    recent_run_count = 0
                    month_run_count = 0
                    
                    recent_dates = set()
                    month_dates = set()
                    
                    target_month = ist_now.month
                    target_year = ist_now.year
                    
                    for r in all_runs:
                        if not r.report_date: continue
                        try:
                            dt = None
                            try: dt = datetime.strptime(r.report_date, '%Y-%m-%d')
                            except ValueError: dt = datetime.strptime(r.report_date, '%d-%m-%Y')
                        except ValueError: continue
                        if not dt: continue
                        
                        # Check Recent (>= recent_start)
                        if dt >= recent_start and dt <= ist_now:
                            recent_run_count += 1
                            recent_dates.add(dt.date())
                        
                        # Check Month
                        if dt.year == target_year and dt.month == target_month:
                            month_run_count += 1
                            month_dates.add(dt.date())
                            
                    # Calculate Phase 2 Savings
                    # EXACT VALUE STRATEGY:
                    # We count EVERY successful run from the dump for EVERY bot.
                    # Start Date is strictly respected to avoid pre-deployment artifacts.
                    # No capping for "Daily" bots - if they ran twice, they saved twice.
                    
                    recent_savings = recent_run_count * per_run_value
                    hours_saved_month = month_run_count * per_run_value
                    
                    # Calculate Average (for Phase 1 estimation)
                    if active_days_calc > 0:
                        avg_runs_per_day = recent_run_count / active_days_calc
                        
        hours_saved_till_date += recent_savings
        
        # 5. Phase 1: Historical Savings (Start -> Jan 28, 2026)
        hist_savings = 0.0
        
        # Calculate Intersection of [Start, Now] and [Start, Cutoff]
        hist_end = min(ist_now, CUTOFF_DATE)
        
        if start_date < hist_end:
            time_diff = hist_end - start_date
            days_hist = time_diff.total_seconds() / 86400.0
            
            if days_hist > 0:
                # Use Monthly Hours Saved as a stable baseline for historical estimation.
                # This ensures that "Till Date" savings only increase as new actual runs are recorded,
                # rather than decreasing due to average dilution over time.
                daily_rate = (bot.hours_saved_monthly or 0) / 30.0
                hist_savings = days_hist * daily_rate
                        
        hours_saved_till_date += hist_savings
        
    except Exception as e:
        print(f"Error calculating FTE savings for bot {bot.id}: {e}")
        return (0.0, 0.0)
        
    return (hours_saved_month, hours_saved_till_date)
