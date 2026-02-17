from app.db.session import SessionLocal
from app.models import InventoryItem, User

db = SessionLocal()

# List Users
users = db.query(User).all()
print("Users in DB:")
for u in users:
    print(f"- User: {u.email} (ID: {u.id})")

# Check Pilot Items
pilots = db.query(InventoryItem).filter(InventoryItem.model.ilike("%Pilot%")).all()
print(f"\nFound {len(pilots)} Pilot items:")
for item in pilots:
    print(f"- {item.year} {item.make} {item.model} | Owner_ID: {item.user_id} | Img: {bool(item.primary_image_url)}")

