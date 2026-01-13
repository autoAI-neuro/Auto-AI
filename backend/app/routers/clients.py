from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Client, User
from app.schemas.crm import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("", response_model=List[ClientResponse])
async def get_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clients for the current user"""
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    return clients

@router.post("", response_model=ClientResponse)
async def create_client(
    client_in: ClientCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new client"""
    # Create client
    try:
        new_client = Client(
            user_id=current_user.id,
            name=client_in.name,
            phone=client_in.phone,
            email=client_in.email,
            status=client_in.status,
            tags=client_in.tags,
            notes=client_in.notes,
            # Phase 2
            last_name=client_in.last_name,
            address=client_in.address,
            birth_date=client_in.birth_date,
            purchase_date=client_in.purchase_date,
            car_make=client_in.car_make,
            car_model=client_in.car_model,
            car_year=client_in.car_year,
            interest_rate=client_in.interest_rate,
            created_at=datetime.utcnow()
        )
        db.add(new_client)
        db.commit()
        db.refresh(new_client)
        # Success
        return new_client
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_in: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a client"""
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Update fields provided in request
    update_data = client_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
        
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}")
async def delete_client(
    client_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a client"""
    # Delete request
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        # Not found
        raise HTTPException(status_code=404, detail="Client not found")
        
    db.delete(client)
    db.commit()
    # Success
    return {"message": "Client deleted"}

