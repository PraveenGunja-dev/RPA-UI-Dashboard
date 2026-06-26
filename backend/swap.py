import sqlite3
import os

db_path = r"E:\RPA_Dashboard\backend\rpa_console.db"

def swap_admins():
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Remove admin@example.com
        cursor.execute("DELETE FROM registered_users WHERE email = 'admin@example.com'")
        print("Removed admin@example.com (if existed).")

        # 2. Add or Update praveen.gunja@adani.com to Admin
        search_email = 'praveen.gunja@adani.com'
        cursor.execute("SELECT id FROM registered_users WHERE email = ?", (search_email,))
        user = cursor.fetchone()

        if user:
            # Update existing user to Admin
            cursor.execute("UPDATE registered_users SET role = 'Admin', is_active = 1 WHERE email = ?", (search_email,))
            print(f"Updated existing user {search_email} to Admin.")
        else:
            # Insert new Admin user
            cursor.execute(
                "INSERT INTO registered_users (email, name, role, is_active) VALUES (?, ?, ?, ?)",
                (search_email, 'Praveen Gunja', 'Admin', 1)
            )
            print(f"Created new Admin user: {search_email}")

        conn.commit()
        print("Changes committed successfully.")

        # Verify
        cursor.execute("SELECT name, email, role FROM registered_users WHERE role = 'Admin'")
        admins = cursor.fetchall()
        print("\nCurrent Admins:")
        for admin in admins:
            print(f"- {admin[0]} ({admin[1]}) [{admin[2]}]")

    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    swap_admins()
