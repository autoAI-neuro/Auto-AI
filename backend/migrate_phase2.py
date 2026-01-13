import sqlite3

def migrate():
    print("Migrating database for Phase 2 CRM Expansion...")
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    
    columns = [
        ("last_name", "TEXT"),
        ("address", "TEXT"),
        ("birth_date", "DATE"),
        ("purchase_date", "DATE"),
        ("car_make", "TEXT"),
        ("car_model", "TEXT"),
        ("car_year", "INTEGER"),
        ("interest_rate", "FLOAT"),
        ("document_path", "TEXT")
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

    # Create message_templates table
    print("Creating message_templates table...", end=" ")
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS message_templates (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR,
            title VARCHAR,
            content VARCHAR,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)
        print("DONE")
    except Exception as e:
        print(f"ERROR: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
