from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Tag, ClientTag, Client, User, DEFAULT_TAGS, get_uuid

router = APIRouter(prefix="/tags", tags=["tags"])


# ============================================
# SCHEMAS
# ============================================
class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: Optional[str] = None

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None

class TagResponse(BaseModel):
    id: str
    name: str
    color: str
    icon: Optional[str]
    order: int
    is_default: bool
    
    class Config:
        from_attributes = True

class ClientTagAssign(BaseModel):
    tag_id: str


# ============================================
# INITIALIZE DEFAULT TAGS FOR NEW USER
# ============================================
def ensure_default_tags(user_id: str, db: Session):
    """Create default tags for user if they don't exist"""
    existing = db.query(Tag).filter(Tag.user_id == user_id).count()
    if existing == 0:
        for tag_data in DEFAULT_TAGS:
            tag = Tag(
                id=get_uuid(),
                user_id=user_id,
                name=tag_data["name"],
                color=tag_data["color"],
                icon=tag_data["icon"],
                order=tag_data["order"],
                is_default=True
            )
            db.add(tag)
        db.commit()


# ============================================
# GET ALL TAGS
# ============================================
@router.get("", response_model=List[TagResponse])
async def get_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tags for current user"""
    # Ensure default tags exist
    ensure_default_tags(current_user.id, db)
    
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.order).all()
    return tags


# ============================================
# CREATE CUSTOM TAG
# ============================================
@router.post("", response_model=TagResponse)
async def create_tag(
    tag_in: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a custom tag"""
    # Get max order
    max_order = db.query(Tag).filter(Tag.user_id == current_user.id).count()
    
    tag = Tag(
        id=get_uuid(),
        user_id=current_user.id,
        name=tag_in.name,
        color=tag_in.color,
        icon=tag_in.icon,
        order=max_order,
        is_default=False
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


# ============================================
# UPDATE TAG
# ============================================
@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: str,
    tag_in: TagUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a tag"""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    update_data = tag_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tag, field, value)
    
    db.commit()
    db.refresh(tag)
    return tag


# ============================================
# DELETE TAG
# ============================================
@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a tag (also removes from all clients)"""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted"}


# ============================================
# ASSIGN TAG TO CLIENT
# ============================================
@router.post("/client/{client_id}/assign")
async def assign_tag_to_client(
    client_id: str,
    assign: ClientTagAssign,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a tag to a client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Verify tag belongs to user
    tag = db.query(Tag).filter(
        Tag.id == assign.tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if already assigned
    existing = db.query(ClientTag).filter(
        ClientTag.client_id == client_id,
        ClientTag.tag_id == assign.tag_id
    ).first()
    
    if existing:
        return {"message": "Tag already assigned"}
    
    client_tag = ClientTag(
        id=get_uuid(),
        client_id=client_id,
        tag_id=assign.tag_id
    )
    db.add(client_tag)
    db.commit()
    
    return {"message": "Tag assigned", "tag": tag.name}


# ============================================
# REMOVE TAG FROM CLIENT
# ============================================
@router.delete("/client/{client_id}/remove/{tag_id}")
async def remove_tag_from_client(
    client_id: str,
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a tag from a client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client_tag = db.query(ClientTag).filter(
        ClientTag.client_id == client_id,
        ClientTag.tag_id == tag_id
    ).first()
    
    if client_tag:
        db.delete(client_tag)
        db.commit()
    
    return {"message": "Tag removed"}


# ============================================
# GET CLIENT'S TAGS
# ============================================
@router.get("/client/{client_id}", response_model=List[TagResponse])
async def get_client_tags(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tags for a specific client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get tag IDs for this client
    client_tag_ids = db.query(ClientTag.tag_id).filter(
        ClientTag.client_id == client_id
    ).all()
    
    tag_ids = [ct[0] for ct in client_tag_ids]
    
    if not tag_ids:
        return []
    
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).order_by(Tag.order).all()
    return tags


# ============================================
# GET CLIENTS BY TAG
# ============================================
@router.get("/{tag_id}/clients")
async def get_clients_by_tag(
    tag_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clients that have a specific tag"""
    # Verify tag belongs to user
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Get client IDs with this tag
    client_ids = db.query(ClientTag.client_id).filter(
        ClientTag.tag_id == tag_id
    ).all()
    
    if not client_ids:
        return []
    
    clients = db.query(Client).filter(
        Client.id.in_([c[0] for c in client_ids])
    ).all()
    
    return clients
