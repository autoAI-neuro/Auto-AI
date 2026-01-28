"""
Migration script to create the sales_clones table if it doesn't exist.
Run this once on Railway to add the new table.
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine, SessionLocal

def create_sales_clones_table():
    """Create the sales_clones table if it doesn't exist"""
    
    create_sql = """
    CREATE TABLE IF NOT EXISTS sales_clones (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id),
        name VARCHAR(255) DEFAULT 'Mi Clon de Ventas',
        personality TEXT,
        sales_logic TEXT,
        tone_keywords JSONB,
        avoid_keywords JSONB,
        example_responses JSONB,
        voice_samples JSONB,
        is_active BOOLEAN DEFAULT FALSE,
        is_trained BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
    );
    """
    
    try:
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales_clones')"
            ))
            exists = result.scalar()
            
            if exists:
                print("✅ Table 'sales_clones' already exists")
            else:
                print("📦 Creating table 'sales_clones'...")
                conn.execute(text(create_sql))
                conn.commit()
                print("✅ Table 'sales_clones' created successfully!")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    print("=" * 50)
    print("Sales Clone Migration Script")
    print("=" * 50)
    create_sales_clones_table()
    print("Done!")
