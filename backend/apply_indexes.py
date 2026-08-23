import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'rpa_console.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

indexes = [
    "CREATE INDEX IF NOT EXISTS ix_bot_runs_bot_id ON bot_runs(bot_id);",
    "CREATE INDEX IF NOT EXISTS ix_bot_runs_report_date ON bot_runs(report_date);",
    "CREATE INDEX IF NOT EXISTS ix_bot_runs_run_status ON bot_runs(run_status);"
]

for idx in indexes:
    print(f"Executing: {idx}")
    cursor.execute(idx)

conn.commit()
conn.close()
print("Indexes created successfully.")
