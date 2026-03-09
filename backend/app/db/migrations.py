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

        # 3. Check 'clients' for 'automation_enabled'
        if inspector.has_table("clients"):
            columns = [col["name"] for col in inspector.get_columns("clients")]
            if "automation_enabled" not in columns:
                print("[Migration] Adding missing column: clients.automation_enabled")
                try:
                    # Default True for existing clients
                    conn.execute(text("ALTER TABLE clients ADD COLUMN automation_enabled BOOLEAN DEFAULT TRUE"))
                    conn.commit()
                except Exception as e:
                    print(f"[Migration] Error adding automation_enabled: {e}")

        # 4. Check 'sales_clones' for 'dealer_city'
        if inspector.has_table("sales_clones"):
            columns = [col["name"] for col in inspector.get_columns("sales_clones")]
            if "dealer_city" not in columns:
                print("[Migration] Adding missing column: sales_clones.dealer_city")
                try:
                    conn.execute(text("ALTER TABLE sales_clones ADD COLUMN dealer_city VARCHAR"))
                    conn.commit()
                    print("[Migration] ✅ dealer_city added.")
                except Exception as e:
                    print(f"[Migration] Error adding dealer_city: {e}")

        # 5. Check 'sales_clones' for 'shipping_info'
        if inspector.has_table("sales_clones"):
            columns = [col["name"] for col in inspector.get_columns("sales_clones")]
            if "shipping_info" not in columns:
                print("[Migration] Adding missing column: sales_clones.shipping_info")
                try:
                    conn.execute(text("ALTER TABLE sales_clones ADD COLUMN shipping_info TEXT"))
                    conn.commit()
                    print("[Migration] ✅ shipping_info added.")
                except Exception as e:
                    print(f"[Migration] Error adding shipping_info: {e}")

        # 6. Normalize phone numbers (add +1 to 10/11 digit US numbers)
        if inspector.has_table("clients"):
            try:
                # Fix 10-digit numbers (missing country code entirely)
                result = conn.execute(text(
                    "UPDATE clients SET phone = '+1' || phone WHERE phone ~ '^[0-9]{10}$'"
                ))
                if result.rowcount > 0:
                    print(f"[Migration] ✅ Normalized {result.rowcount} phones (10-digit → +1)")
                
                # Fix 11-digit numbers starting with 1 (missing + prefix)
                result2 = conn.execute(text(
                    "UPDATE clients SET phone = '+' || phone WHERE phone ~ '^1[0-9]{10}$'"
                ))
                if result2.rowcount > 0:
                    print(f"[Migration] ✅ Normalized {result2.rowcount} phones (11-digit → +)")
                
                conn.commit()
            except Exception as e:
                print(f"[Migration] Phone normalization: {e}")

    print("[Migration] Schema check complete.")
