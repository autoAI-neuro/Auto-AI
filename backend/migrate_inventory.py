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
        # 1. Get User
        user = db.query(User).first()
        if not user:
            print("No user found. Run seed_db.py first or create a user.")
            return

        print(f"Migrating inventory for user: {user.email}")

        # 2. Load JSON
        json_path = os.path.join("..", "frontend", "public", "inventory", "catalog.json")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error loading JSON from {json_path}: {e}")
            return

        # 3. Process Items
        count = 0
        for brand_data in data.get("brands", []):
            make = brand_data["name"]
            print(f"Processing {make}...")
            
            for model_data in brand_data.get("models", []):
                model_name = model_data["name"]
                
                # Check if exists
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
                    print(f"  Creating {model_name}")
                else:
                    print(f"  Updating {model_name}")
                
                # Update attributes
                item.year = model_data.get("year", 2025)
                item.primary_image_url = model_data.get("image")
                item.description = model_data.get("qualities")
                item.price = 30000.0 # Default price as JSON doesn't have it
                item.status = "available"
                
                count += 1
        
        db.commit()
        print(f"Migration Complete! Processed {count} vehicle models.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
