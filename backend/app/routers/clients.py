from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Client, User, Tag, ClientTag, Appointment
from app.schemas.crm import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter(prefix="/clients", tags=["clients"])

@router.get("")
def get_clients(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    tag_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated clients for the current user"""
    # Base query
    query = db.query(Client).filter(Client.user_id == current_user.id)
    
    # Apply search filter (name or phone)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_term)) | 
            (Client.phone.ilike(search_term))
        )
    
    # Apply status filter
    if status:
        query = query.filter(Client.status == status)

    # Apply tag filter
    if tag_id:
        query = query.join(ClientTag).filter(ClientTag.tag_id == tag_id)
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    clients = query.order_by(Client.created_at.desc()).offset(offset).limit(limit).all()
    
    # Calculate total pages
    pages = (total + limit - 1) // limit if total > 0 else 1
    
    # Get client IDs for tag fetching
    client_ids = [c.id for c in clients]
    
    # Fetch tags efficiently (Defensive: prevent crash if table missing)
    if client_ids:
        try:
            # Get all client-tag associations
            associations = db.query(ClientTag).filter(ClientTag.client_id.in_(client_ids)).all()
            
            # Get all tag details
            tag_ids = [a.tag_id for a in associations]
            if tag_ids:
                tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
                tag_map = {t.id: t for t in tags}
                
                # Map client_id -> list of tags
                client_tags_map = {}
                for assoc in associations:
                    if assoc.client_id not in client_tags_map:
                        client_tags_map[assoc.client_id] = []
                    if assoc.tag_id in tag_map:
                        client_tags_map[assoc.client_id].append(tag_map[assoc.tag_id])
                
                # Assign to client objects
                for client in clients:
                    client.active_tags = client_tags_map.get(client.id, [])
        except Exception as e:
            print(f"Warning: Failed to load tags: {e}")
            # Continue without tags
            pass
    
    return {
        "clients": clients,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit
    }

@router.post("", response_model=ClientResponse)
def create_client(
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
def update_client(
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
def delete_client(
    client_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a client and all related data (appointments, etc.)"""
    # Find client
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # 1. Delete all appointments for this client
    deleted_appts = db.query(Appointment).filter(
        Appointment.client_id == client_id
    ).delete()
    print(f"[Clients API] Deleted {deleted_appts} appointments for client {client_id}")
    
    # 2. Delete the client
    db.delete(client)
    db.commit()
    
    return {"message": f"Client and {deleted_appts} appointments deleted"}


@router.get("/calendar-events")
def get_calendar_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clients with dates for calendar (Lightweight)"""
    clients = db.query(Client.id, Client.name, Client.phone, Client.birth_date, Client.purchase_date).filter(
        Client.user_id == current_user.id,
        (Client.birth_date.isnot(None)) | (Client.purchase_date.isnot(None))
    ).all()
    
    # Convert Row objects to dicts
    return [
        {
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "birth_date": c.birth_date.isoformat() if c.birth_date else None,
            "purchase_date": c.purchase_date.isoformat() if c.purchase_date else None
        }
        for c in clients
    ]
