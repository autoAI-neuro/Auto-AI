"""
Memory Router - API endpoints for managing client memory.
Allows viewing and manual updating of client memory.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Client
from app.services.memory_service import MemoryService


router = APIRouter(prefix="/memory", tags=["memory"])


# ============================================
# SCHEMAS
# ============================================

class MemoryResponse(BaseModel):
    """Response schema for client memory"""
    id: str
    client_id: str
    
    # Vehicle preferences
    vehicles_interested: Optional[List[dict]] = None
    vehicles_rejected: Optional[List[dict]] = None
    preferred_body_type: Optional[str] = None
    
    # Budget
    preferred_budget_monthly: Optional[int] = None
    preferred_budget_down: Optional[int] = None
    preferred_plan: Optional[str] = None
    
    # Communication
    communication_style: Optional[str] = None
    preferred_language: Optional[str] = None
    
    # Objections
    objections: Optional[List[dict]] = None
    concerns: Optional[List[str]] = None
    
    # Credit
    credit_score_mentioned: Optional[int] = None
    credit_tier: Optional[str] = None
    document_type: Optional[str] = None
    
    # Metrics
    interaction_count: Optional[int] = None
    relationship_score: Optional[int] = None
    buying_timeline: Optional[str] = None
    
    # AI
    ai_summary: Optional[str] = None
    key_insights: Optional[List[str]] = None
    
    # Timestamps
    last_interaction_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MemoryUpdate(BaseModel):
    """Schema for updating memory fields"""
    preferred_budget_monthly: Optional[int] = None
    preferred_budget_down: Optional[int] = None
    preferred_plan: Optional[str] = None
    communication_style: Optional[str] = None
    preferred_language: Optional[str] = None
    credit_score_mentioned: Optional[int] = None
    credit_tier: Optional[str] = None
    document_type: Optional[str] = None
    occupation: Optional[str] = None
    buying_timeline: Optional[str] = None
    personal_notes: Optional[str] = None


class ObjectionCreate(BaseModel):
    """Schema for adding an objection"""
    objection: str
    response_given: Optional[str] = None
    resolved: bool = False


class VehicleInterestCreate(BaseModel):
    """Schema for adding vehicle interest"""
    model: str
    trim: Optional[str] = None
    color: Optional[str] = None
    reason: Optional[str] = None


# ============================================
# ENDPOINTS
# ============================================

@router.get("/{client_id}", response_model=MemoryResponse)
def get_client_memory(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get memory for a specific client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    memory = MemoryService.get_or_create_memory(db, client_id, current_user.id)
    return memory


@router.put("/{client_id}", response_model=MemoryResponse)
def update_client_memory(
    client_id: str,
    updates: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update specific fields in client memory"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Ensure memory exists
    MemoryService.get_or_create_memory(db, client_id, current_user.id)
    
    # Update with provided fields
    update_data = updates.model_dump(exclude_unset=True)
    if update_data:
        memory = MemoryService.update_memory(db, client_id, update_data)
        return memory
    
    return MemoryService.get_memory(db, client_id)


@router.post("/{client_id}/objection", response_model=MemoryResponse)
def add_objection(
    client_id: str,
    objection_data: ObjectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an objection to client memory"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Ensure memory exists
    MemoryService.get_or_create_memory(db, client_id, current_user.id)
    
    memory = MemoryService.add_objection(
        db,
        client_id,
        objection_data.objection,
        objection_data.response_given,
        objection_data.resolved
    )
    
    return memory


@router.post("/{client_id}/vehicle", response_model=MemoryResponse)
def add_vehicle_interest(
    client_id: str,
    vehicle_data: VehicleInterestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a vehicle of interest to client memory"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Ensure memory exists
    MemoryService.get_or_create_memory(db, client_id, current_user.id)
    
    memory = MemoryService.add_vehicle_interest(
        db,
        client_id,
        vehicle_data.model,
        vehicle_data.trim,
        vehicle_data.color,
        vehicle_data.reason
    )
    
    return memory


@router.delete("/{client_id}")
def clear_client_memory(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear/reset memory for a client (keeps the record but clears all data)"""
    from app.models import ClientMemory
    
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Delete existing memory
    db.query(ClientMemory).filter(
        ClientMemory.client_id == client_id
    ).delete()
    db.commit()
    
    return {"message": "Memoria del cliente reiniciada", "success": True}


@router.get("/{client_id}/context")
def get_memory_context(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the formatted context string that Ray sees for this client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    memory = MemoryService.get_or_create_memory(db, client_id, current_user.id)
    context = MemoryService.generate_context_for_ray(memory)
    
    return {
        "client_id": client_id,
        "client_name": client.name,
        "context": context,
        "relationship_score": memory.relationship_score
    }
