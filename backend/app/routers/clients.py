from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user

# Pydantic models for request and response
class ClientBase(BaseModel):
    name: str
    phone: str

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: str  # Changed to str to match UUID
    
    class Config:
        orm_mode = True

router = APIRouter(prefix="/clients", tags=["clients"])

from app.models import Client

@router.get("", response_model=List[ClientResponse])
async def get_clients(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clients for the current user"""
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    return clients

@router.post("", response_model=ClientResponse)
async def create_client(
    client: ClientCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new client"""
    new_client = Client(
        user_id=current_user.id,
        name=client.name,
        phone=client.phone
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.delete("/{client_id}")
async def delete_client(
    client_id: str, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a client"""
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    db.delete(client)
    db.commit()
    return {"message": "Client deleted"}
