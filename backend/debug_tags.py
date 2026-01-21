
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models import ClientTag, Tag, Client
from sqlalchemy import text

def debug_tags():
    db = SessionLocal()
    try:
        print("Checking ClientTag table...")
        # Check if table exists by querying it
        count = db.query(ClientTag).count()
        print(f"ClientTag table exists. Count: {count}")
        
        print("Checking Tags...")
        tags = db.query(Tag).all()
        print(f"Tags found: {len(tags)}")
        for t in tags:
            print(f" - {t.name} ({t.id})")
            
        print("Checking Clients...")
        clients = db.query(Client).limit(5).all()
        print(f"Clients found: {len(clients)}")
        
        print("Everything seems accessible.")
        
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_tags()
