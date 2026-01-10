from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])

# In-memory storage for demo (replace with DB model later)
_demo_clients = [
    {"id": 1, "name": "Juan Pérez", "phone": "+584141234567"},
    {"id": 2, "name": "María García", "phone": "+584149876543"},
    {"id": 3, "name": "Carlos López", "phone": "+584145551234"}
]

class ClientCreate(BaseModel):
    name: str
    phone: str

class ClientResponse(BaseModel):
    id: int
    name: str
    phone: str

@router.get("", response_model=List[ClientResponse])
async def get_clients(current_user = Depends(get_current_user)):
    """Get all clients for the current user"""
    return _demo_clients

@router.post("", response_model=ClientResponse)
async def create_client(client: ClientCreate, current_user = Depends(get_current_user)):
    """Create a new client"""
    new_id = max([c["id"] for c in _demo_clients], default=0) + 1
    new_client = {"id": new_id, "name": client.name, "phone": client.phone}
    _demo_clients.append(new_client)
    return new_client

@router.delete("/{client_id}")
async def delete_client(client_id: int, current_user = Depends(get_current_user)):
    """Delete a client"""
    global _demo_clients
    _demo_clients = [c for c in _demo_clients if c["id"] != client_id]
    return {"message": "Client deleted"}
