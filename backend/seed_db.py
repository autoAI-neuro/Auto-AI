from app.db.session import SessionLocal
from app.models import User, SalesClone, InventoryItem, get_uuid
from datetime import datetime

db = SessionLocal()

def seed():
    # 1. User
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(
            id="test_user_id",
            email="test@example.com",
            password_hash="hash",
            name="Tester",
            whatsapp_linked=True,
            onboarding_completed=True
        )
        db.add(user)
        db.commit()
        print("Created User: test_user_id")
    else:
        print(f"User Exists: {user.id}")

    # 2. Sales Clone
    clone = db.query(SalesClone).filter(SalesClone.user_id == user.id).first()
    if not clone:
        clone = SalesClone(
            id=get_uuid(),
            user_id=user.id,
            name="Ray V2",
            personality="Soy Ray, un vendedor experto de Toyota. Amable, directo y enfocado en cerrar ventas. Uso emojis.",
            is_active=True,
            is_trained=True
        )
        db.add(clone)
        db.commit()
        print("Created SalesClone")
    else:
        # Ensure active
        clone.is_active = True
        clone.is_trained = True
        db.commit()
        print("SalesClone Exists & Activated")

    # 3. Inventory
    inventory = [
        {
            "make": "Toyota", "model": "Corolla", "year": 2024, "price": 25000, 
            "primary_image_url": "https://media.toyota.co.uk/vehicles/corolla-hatchback/2023/exterior-3-4-front-facing-right-static.jpg",
            "description": "El Toyota Corolla 2024 es eficiente, confiable y lleno de tecnología. Perfecto para la ciudad."
        },
        {
            "make": "Toyota", "model": "Camry", "year": 2025, "price": 30000, 
            "primary_image_url": "https://media.toyota.co.uk/vehicles/camry/2021/exterior-3-4-front-facing-right-static.jpg",
            "description": "El Toyota Camry 2025 combina estilo deportivo con un interior lujoso y espacioso."
        },
        {
            "make": "Toyota", "model": "RAV4", "year": 2024, "price": 35000, 
            "primary_image_url": "https://media.toyota.co.uk/vehicles/rav4/2023/exterior-3-4-front-facing-right-static.jpg",
            "description": "La Toyota RAV4 2024 es la SUV más vendida, lista para cualquier aventura con gran espacio de carga."
        }
    ]

    for item_data in inventory:
        exists = db.query(InventoryItem).filter(
            InventoryItem.user_id == user.id,
            InventoryItem.model == item_data["model"]
        ).first()
        
        if not exists:
            item = InventoryItem(
                id=get_uuid(),
                user_id=user.id,
                **item_data
            )
            db.add(item)
            print(f"Added {item_data['model']}")
    
    db.commit()
    print("Seeding Complete!")

if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
