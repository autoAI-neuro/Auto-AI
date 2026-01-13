import sqlite3

def migrate_missing():
    print("Migrating missing Phase 1 fields...")
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    columns = [
        ("email", "VARCHAR"),
        ("status", "VARCHAR DEFAULT 'new'"),
        ("tags", "VARCHAR"),
        ("notes", "VARCHAR"),
        ("updated_at", "DATETIME")
    ]
    
    for col_name, col_type in columns:
        try:
            print(f"Adding column {col_name}...", end=" ")
            cursor.execute(f"ALTER TABLE clients ADD COLUMN {col_name} {col_type}")
            print("DONE")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ALREADY EXISTS")
            else:
                print(f"ERROR: {e}")
        
    conn.commit()
    conn.close()
    print("Migration fix complete.")

if __name__ == "__main__":
    migrate_missing()
