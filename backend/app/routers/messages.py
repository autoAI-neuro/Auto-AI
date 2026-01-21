from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Message, Client, User, get_uuid

router = APIRouter(prefix="/messages", tags=["messages"])


# ============================================
# SCHEMAS
# ============================================
class MessageResponse(BaseModel):
    id: str
    user_id: str
    client_id: Optional[str]
    phone: str
    direction: str
    content: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    status: str
    sent_at: datetime
    
    class Config:
        from_attributes = True


class ConversationSummary(BaseModel):
    client_id: Optional[str]
    client_name: Optional[str]
    phone: str
    last_message: str
    last_message_time: datetime
    unread_count: int


# ============================================
# GET CONVERSATION WITH CLIENT
# ============================================
@router.get("/conversation/{client_id}", response_model=List[MessageResponse])
def get_conversation(
    client_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get message history with a specific client"""
    # Verify client belongs to user
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    messages = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.client_id == client_id
    ).order_by(Message.sent_at.desc()).limit(limit).all()
    
    # Reverse to get chronological order
    return list(reversed(messages))


# ============================================
# GET CONVERSATION BY PHONE
# ============================================
@router.get("/conversation/phone/{phone}", response_model=List[MessageResponse])
def get_conversation_by_phone(
    phone: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get message history with a phone number"""
    messages = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.phone == phone
    ).order_by(Message.sent_at.desc()).limit(limit).all()
    
    return list(reversed(messages))


# ============================================
# GET ALL CONVERSATIONS (INBOX)
# ============================================
@router.get("/inbox")
def get_inbox(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of all conversations with last message preview"""
    from sqlalchemy import func, distinct
    
    # Get distinct phones with their latest message
    subquery = db.query(
        Message.phone,
        func.max(Message.sent_at).label('last_time')
    ).filter(
        Message.user_id == current_user.id
    ).group_by(Message.phone).subquery()
    
    # Get the actual messages
    latest_messages = db.query(Message).join(
        subquery,
        and_(
            Message.phone == subquery.c.phone,
            Message.sent_at == subquery.c.last_time
        )
    ).filter(Message.user_id == current_user.id).all()
    
    # Build response with client info
    conversations = []
    for msg in latest_messages:
        # Get client if linked
        client = None
        if msg.client_id:
            client = db.query(Client).filter(Client.id == msg.client_id).first()
        
        conversations.append({
            "client_id": msg.client_id,
            "client_name": client.name if client else None,
            "phone": msg.phone,
            "last_message": msg.content[:50] + "..." if msg.content and len(msg.content) > 50 else msg.content,
            "last_message_time": msg.sent_at,
            "direction": msg.direction,
            "is_media": msg.media_type is not None
        })
    
    # Sort by most recent
    conversations.sort(key=lambda x: x["last_message_time"], reverse=True)
    
    return conversations


# ============================================
# SEARCH MESSAGES
# ============================================
@router.get("/search")
def search_messages(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search through message history"""
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")
    
    messages = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.content.ilike(f"%{q}%")
    ).order_by(Message.sent_at.desc()).limit(50).all()
    
    return messages


# ============================================
# HELPER: SAVE OUTBOUND MESSAGE
# ============================================
def save_outbound_message(
    db: Session,
    user_id: str,
    phone: str,
    content: str = None,
    media_url: str = None,
    media_type: str = None,
    client_id: str = None,
    whatsapp_message_id: str = None
) -> Message:
    """Save an outbound message to the database"""
    # If no client_id, try to find by phone
    if not client_id:
        # 1. Try exact match
        client = db.query(Client).filter(
            Client.user_id == user_id,
            Client.phone == phone
        ).first()
        
        # 2. Try normalized match
        if not client:
            from app.utils.phone import normalize_phone
            norm_phone = normalize_phone(phone)
            # Fetch all clients for user and check in python (inefficient but safe for now)
            # OR use basic SQL wildcard if possible. For now, strict normalized match if DB stores normalized?
            # Better: strip non-digits from DB side or just iterate.
            # Let's iterate for safety as list shouldn't be huge per user yet.
            all_clients = db.query(Client).filter(Client.user_id == user_id).all()
            for c in all_clients:
                if normalize_phone(c.phone) == norm_phone:
                    client = c
                    break
        
        if client:
            client_id = client.id
    
    message = Message(
        id=get_uuid(),
        user_id=user_id,
        client_id=client_id,
        phone=phone,
        direction="outbound",
        content=content,
        media_url=media_url,
        media_type=media_type,
        status="sent",
        whatsapp_message_id=whatsapp_message_id
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message
