import sqlite3
import datetime

def fix_created_at():
    print("Fixing NULL created_at values...")
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    now = datetime.datetime.utcnow()
    cursor.execute("UPDATE clients SET created_at = ? WHERE created_at IS NULL", (now,))
    rows = cursor.rowcount
    
    conn.commit()
    conn.close()
    print(f"Fixed {rows} records.")

if __name__ == "__main__":
    fix_created_at()
