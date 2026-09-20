import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from database import SessionLocal
from models import Bot, BotRun
from utils import calculate_realized_savings, get_per_run_value

db = SessionLocal()
date = '2026-09-05'

runs = db.query(BotRun).filter(BotRun.report_date == date).all()
completed = [r for r in runs if r.run_status and 'completed' in r.run_status.lower()]

bot_runs = {}
for r in completed:
    bot_runs[r.bot_id] = bot_runs.get(r.bot_id, 0) + 1

card_total = 0.0
trend_total = 0.0

print(f"Date: {date}, Completed runs: {len(completed)}, Unique bots: {len(bot_runs)}")
print(f"{'Bot':<40} {'Sched':<15} {'Freq':<6} {'Month':<8} {'PerDay':<7} {'Runs':<5} {'Card':<8} {'Trend':<8}")
print("-" * 107)

for bot_id, cnt in sorted(bot_runs.items()):
    bot = db.query(Bot).get(bot_id)
    if not bot: continue
    card_val = calculate_realized_savings(bot, date, cnt)
    per_run = get_per_run_value(bot)
    trend_val = per_run * cnt
    card_total += card_val
    trend_total += trend_val
    name = (bot.bot_name or bot.use_case_name or "?")[:39]
    sched = (bot.schedule or "")[:14]
    freq = str(bot.frequency or "")[:5]
    monthly = round(bot.hours_saved_monthly or 0, 1)
    perday = round(bot.per_day_saving_hours or 0, 1)
    diff = "<<< DIFF" if abs(card_val - trend_val) > 0.01 else ""
    print(f"{name:<40} {sched:<15} {freq:<6} {monthly:<8} {perday:<7} {cnt:<5} {round(card_val,2):<8} {round(trend_val,2):<8} {diff}")

print("-" * 107)
print(f"{'TOTAL':<40} {'':15} {'':6} {'':8} {'':7} {'':5} {round(card_total,2):<8} {round(trend_total,2):<8}")
db.close()
