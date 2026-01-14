from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Client, Message
from app.services.ai_service import analyze_message, generate_smart_reply, categorize_client

router = APIRouter(prefix="/ai", tags=["ai"])


# ============================================
# SCHEMAS
# ============================================
class AnalyzeMessageRequest(BaseModel):
    message: str
    client_id: Optional[str] = None

class SmartReplyRequest(BaseModel):
    message: str
    client_id: Optional[str] = None

class CategorizeRequest(BaseModel):
    client_id: str


# ============================================
# ANALYZE MESSAGE
# ============================================
@router.post("/analyze")
async def analyze_client_message(
    request: AnalyzeMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a message and extract client data using AI"""
    
    # Get client context if provided
    context = None
    if request.client_id:
        client = db.query(Client).filter(
            Client.id == request.client_id,
            Client.user_id == current_user.id
        ).first()
        if client:
            context = {
                "name": client.name,
                "phone": client.phone,
                "notes": client.notes
            }
    
    # Analyze with AI
    result = analyze_message(request.message, context)
    
    return {
        "status": "success",
        "analysis": result.dict()
    }


# ============================================
# SMART REPLY
# ============================================
@router.post("/smart-reply")
async def get_smart_reply(
    request: SmartReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a smart reply suggestion for a message"""
    
    client_name = None
    context = None
    
    if request.client_id:
        client = db.query(Client).filter(
            Client.id == request.client_id,
            Client.user_id == current_user.id
        ).first()
        if client:
            client_name = client.name
            context = client.notes
    
    reply = generate_smart_reply(request.message, client_name, context)
    
    return {
        "status": "success",
        "suggested_reply": reply
    }


# ============================================
# AUTO-CATEGORIZE CLIENT
# ============================================
@router.post("/categorize")
async def auto_categorize_client(
    request: CategorizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze conversation history and suggest category for client"""
    
    # Verify client
    client = db.query(Client).filter(
        Client.id == request.client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get message history
    messages = db.query(Message).filter(
        Message.client_id == request.client_id
    ).order_by(Message.sent_at.desc()).limit(20).all()
    
    if not messages:
        return {
            "status": "no_data",
            "message": "No message history to analyze"
        }
    
    # Get message contents
    message_contents = [
        f"[{'→' if m.direction == 'outbound' else '←'}] {m.content}" 
        for m in messages if m.content
    ]
    
    # Get current tags (simplified - just using status for now)
    current_tags = [client.status] if client.status else []
    
    # Categorize with AI
    result = categorize_client(message_contents, current_tags)
    
    return {
        "status": "success",
        "client_id": request.client_id,
        "current_status": client.status,
        "suggestion": result
    }


# ============================================
# ANALYZE AND UPDATE CLIENT
# ============================================
@router.post("/analyze-and-update/{client_id}")
async def analyze_and_update_client(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze latest messages and update client profile with extracted data"""
    
    # Verify client
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get latest inbound message
    latest_message = db.query(Message).filter(
        Message.client_id == client_id,
        Message.direction == "inbound"
    ).order_by(Message.sent_at.desc()).first()
    
    if not latest_message or not latest_message.content:
        return {
            "status": "no_data",
            "message": "No inbound messages to analyze"
        }
    
    # Analyze the message
    context = {
        "name": client.name,
        "phone": client.phone,
        "notes": client.notes
    }
    analysis = analyze_message(latest_message.content, context)
    
    # Update client with extracted data
    updates = []
    
    if analysis.email and not client.email:
        client.email = analysis.email
        updates.append(f"email: {analysis.email}")
    
    # Add analysis to notes
    if analysis.summary:
        new_note = f"[AI] {analysis.summary}"
        if analysis.intent:
            new_note += f" | Intent: {analysis.intent}"
        if analysis.interest_level:
            new_note += f" | Interest: {analysis.interest_level}"
        
        client.notes = f"{new_note}\n{client.notes or ''}"
        updates.append("notes updated")
    
    if updates:
        db.commit()
    
    return {
        "status": "success",
        "client_id": client_id,
        "analysis": analysis.dict(),
        "updates_made": updates
    }
