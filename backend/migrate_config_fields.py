"""
Migration: Add dealer_city and shipping_info to sales_clones table.
Also normalizes existing client phone numbers to include +1.
Run: python migrate_config_fields.py
"""
import os
from sqlalchemy import create_engine, text

# Get DB URL from environment or use local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Local SQLite fallback
    DB_PATH = os.path.join(os.path.dirname(__file__), "autoai.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"

print(f"[Migration] Using DB: {DATABASE_URL[:50]}...")

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        is_postgres = "postgresql" in DATABASE_URL
        
        # 1. Add dealer_city column
        try:
            if is_postgres:
                conn.execute(text("ALTER TABLE sales_clones ADD COLUMN IF NOT EXISTS dealer_city VARCHAR;"))
            else:
                conn.execute(text("ALTER TABLE sales_clones ADD COLUMN dealer_city VARCHAR;"))
            print("[Migration] ✅ Added dealer_city column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("[Migration] ✅ dealer_city already exists")
            else:
                print(f"[Migration] dealer_city: {e}")
        
        # 2. Add shipping_info column
        try:
            if is_postgres:
                conn.execute(text("ALTER TABLE sales_clones ADD COLUMN IF NOT EXISTS shipping_info TEXT;"))
            else:
                conn.execute(text("ALTER TABLE sales_clones ADD COLUMN shipping_info TEXT;"))
            print("[Migration] ✅ Added shipping_info column")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("[Migration] ✅ shipping_info already exists")
            else:
                print(f"[Migration] shipping_info: {e}")
        
        # 3. Normalize existing phone numbers
        try:
            if is_postgres:
                # PostgreSQL: fix 10-digit numbers (missing country code)
                result = conn.execute(text("""
                    UPDATE clients SET phone = '+1' || phone 
                    WHERE phone ~ '^[0-9]{10}$'
                """))
                print(f"[Migration] ✅ Normalized {result.rowcount} phone numbers (10-digit → +1)")
                
                # Fix 11-digit numbers starting with 1
                result2 = conn.execute(text("""
                    UPDATE clients SET phone = '+' || phone 
                    WHERE phone ~ '^1[0-9]{10}$'
                """))
                print(f"[Migration] ✅ Normalized {result2.rowcount} phone numbers (11-digit → +)")
            else:
                print("[Migration] ⚠️ SQLite: Phone normalization skipped (run on production PostgreSQL)")
        except Exception as e:
            print(f"[Migration] Phone normalization: {e}")
        
        conn.commit()
        print("[Migration] ✅ All migrations complete!")

if __name__ == "__main__":
    migrate()
