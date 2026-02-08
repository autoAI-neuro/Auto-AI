"""
Migration script to create the client_memories table.
Run this script after deploying the new code.
"""
import sys
sys.path.insert(0, '.')

from app.db.session import engine
from app.db.base import Base
from app.models import ClientMemory

def migrate():
    """Create the client_memories table if it doesn't exist."""
    print("[Migration] Creating client_memories table...")
    
    # Create only the ClientMemory table
    ClientMemory.__table__.create(bind=engine, checkfirst=True)
    
    print("[Migration] ✅ client_memories table created successfully!")
    print("[Migration] Migration complete.")

if __name__ == "__main__":
    migrate()
