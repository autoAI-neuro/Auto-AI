from app.db.session import SessionLocal
from app.models import InventoryItem, User

def verify():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total Users: {len(users)}")
        
        for user in users:
            items = db.query(InventoryItem).filter(InventoryItem.user_id == user.id).all()
            print(f"User {user.email} ({user.id}) has {len(items)} items.")
            if items:
                print(f"  Sample: {items[0].year} {items[0].make} {items[0].model} - {items[0].primary_image_url[:30]}...")
            
            # Check for Corolla specifically
            corolla = db.query(InventoryItem).filter(
                InventoryItem.user_id == user.id, 
                InventoryItem.model.ilike("%Corolla%")
            ).first()
            
            if corolla:
                print(f"  ✅ Corolla FOUND for {user.email}")
            else:
                print(f"  ❌ Corolla NOT found for {user.email}")
                
    finally:
        db.close()

if __name__ == "__main__":
    verify()
