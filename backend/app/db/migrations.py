from sqlalchemy import text, inspect
from app.db.session import engine

def check_and_migrate_tables():
    """
    Checks for missing columns in existing tables and adds them.
    This is a lightweight migration system for critical hotfixes.
    """
    print("[Migration] Checking database schema...")
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        # 1. Check 'clients' table for 'relationship_score'
        if inspector.has_table("clients"):
            columns = [col["name"] for col in inspector.get_columns("clients")]
            if "relationship_score" not in columns:
                print("[Migration] Adding missing column: clients.relationship_score")
                try:
                    conn.execute(text("ALTER TABLE clients ADD COLUMN relationship_score INTEGER DEFAULT 50"))
                    conn.commit()
                    print("[Migration] Column added successfully.")
                except Exception as e:
                    print(f"[Migration] Error adding column: {e}")
            else:
                print("[Migration] Column clients.relationship_score exists.")
        
        # 2. Check 'clients' table for 'interaction_count' (Just in case)
        if inspector.has_table("clients"):
            columns = [col["name"] for col in inspector.get_columns("clients")]
            if "interaction_count" not in columns:
                print("[Migration] Adding missing column: clients.interaction_count")
                try:
                    conn.execute(text("ALTER TABLE clients ADD COLUMN interaction_count INTEGER DEFAULT 0"))
                    conn.commit()
                except Exception as e:
                    print(f"[Migration] Error adding interaction_count: {e}")

    print("[Migration] Schema check complete.")
