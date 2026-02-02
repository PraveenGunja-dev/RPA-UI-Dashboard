import sqlite3

def check_schema():
    conn = sqlite3.connect('rpa_console.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("PRAGMA table_info(bots)")
        columns = cursor.fetchall()
        print("Columns in 'bots' table:")
        found_sr_no = False
        for col in columns:
            print(f"- {col[1]} ({col[2]})")
            if col[1] == 'sr_no':
                found_sr_no = True
        
        if found_sr_no:
            print("\n✅ 'sr_no' column FOUND.")
        else:
            print("\n❌ 'sr_no' column MISSING.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
