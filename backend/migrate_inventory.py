import json
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models import InventoryItem, User, get_uuid

def migrate():
    db = SessionLocal()
    try:
        # 1. Get ALL Users (Fix: Seed for everyone so the bot works for any logged in user)
        users = db.query(User).all()
        if not users:
            print("No users found in DB. Skipping inventory migration.")
            return

        # 2. Load JSON from URL
        catalog_url = "https://auto-ai-beta.vercel.app/inventory/catalog.json"
        # ... fetch logic ...
        import requests
        try:
            res = requests.get(catalog_url)
            res.raise_for_status()
            data = res.json()
        except Exception as e:
            print(f"Error fetching catalog from URL: {e}")
            return

        # 3. Process Items for EACH user
        total_count = 0
        for user in users:
            print(f"Processing inventory for user: {user.email} ({user.id})")
            for brand_data in data.get("brands", []):
                make = brand_data["name"]
                
                for model_data in brand_data.get("models", []):
                    model_name = model_data["name"]
                    
                    # Check if exists for THIS user
                    item = db.query(InventoryItem).filter(
                        InventoryItem.user_id == user.id,
                        InventoryItem.make == make,
                        InventoryItem.model == model_name
                    ).first()
                    
                    if not item:
                        item = InventoryItem(
                            id=get_uuid(),
                            user_id=user.id,
                            make=make,
                            model=model_name
                        )
                        db.add(item)
                    
                    # Update attributes
                    item.year = model_data.get("year", 2025)
                    item.primary_image_url = model_data.get("image")
                    item.description = model_data.get("qualities")
                    item.price = 30000.0
                    item.status = "available"
                    
                    total_count += 1
        
        db.commit()
        print(f"Migration Complete! Processed {total_count} items across {len(users)} users.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
