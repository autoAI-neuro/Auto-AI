from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, InventoryItem
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/inventory", tags=["inventory"])

class InventoryCreate(BaseModel):
    make: str
    model: str
    year: int
    price: float
    mileage: Optional[int] = None
    color: Optional[str] = None
    primary_image_url: Optional[str] = None
    description: Optional[str] = None

@router.get("/")
async def get_inventory(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all inventory items for current user"""
    return db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()

@router.post("/")
async def create_inventory_item(item: InventoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new inventory item"""
    new_item = InventoryItem(
        user_id=current_user.id,
        make=item.make,
        model=item.model,
        year=item.year,
        price=item.price,
        mileage=item.mileage,
        color=item.color,
        primary_image_url=item.primary_image_url,
        description=item.description,
        status="available"
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.post("/seed")
async def seed_inventory(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add sample cars for demo"""
    # Check if already seeded
    existing = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).count()
    if existing > 0:
        return {"message": f"Inventory already has {existing} items"}
    
    sample_cars = [
        {
            "make": "Toyota", "model": "Corolla", "year": 2023, "price": 25000, 
            "mileage": 15000, "color": "Blanco",
            "primary_image_url": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
            "description": "Excelente estado, único dueño. Mantenimiento al día."
        },
        {
            "make": "Honda", "model": "Civic", "year": 2022, "price": 28000, 
            "mileage": 22000, "color": "Negro",
            "primary_image_url": "https://images.unsplash.com/photo-1606611013016-969c19ba27da?w=800",
            "description": "Sport Edition. Línea premium con sensores de reversa."
        },
        {
            "make": "Ford", "model": "Mustang", "year": 2021, "price": 42000, 
            "mileage": 8000, "color": "Rojo",
            "primary_image_url": "https://images.unsplash.com/photo-1584345604476-8ec5f452d1f2?w=800",
            "description": "V8 5.0L. Potencia pura. Garantía extendida incluida."
        }
    ]
    
    for car in sample_cars:
        new_item = InventoryItem(user_id=current_user.id, **car, status="available")
        db.add(new_item)
        
    db.commit()
    return {"message": f"Seeded {len(sample_cars)} cars"}

@router.post("/resync")
async def resync_inventory(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Force re-sync inventory from Vercel catalog.json"""
    import requests
    import uuid
    
    catalog_url = "https://auto-ai-beta.vercel.app/inventory/catalog.json"
    
    try:
        res = requests.get(catalog_url, timeout=15)
        res.raise_for_status()
        data = res.json()
        
        updated = 0
        created = 0
        
        for brand_data in data.get("brands", []):
            make = brand_data["name"]
            for model_data in brand_data.get("models", []):
                model_name = model_data["name"]
                
                item = db.query(InventoryItem).filter(
                    InventoryItem.user_id == current_user.id,
                    InventoryItem.make == make,
                    InventoryItem.model == model_name
                ).first()
                
                if not item:
                    item = InventoryItem(
                        id=str(uuid.uuid4()),
                        user_id=current_user.id,
                        make=make,
                        model=model_name
                    )
                    db.add(item)
                    created += 1
                else:
                    updated += 1
                
                item.year = model_data.get("year", 2025)
                item.primary_image_url = model_data.get("image")
                item.description = model_data.get("qualities")
                item.price = 30000.0
                item.status = "available"
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Synced inventory: {created} created, {updated} updated",
            "total_catalog_models": sum(len(b.get("models", [])) for b in data.get("brands", []))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
