from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, SalesClone, get_uuid

router = APIRouter(prefix="/sales-clone", tags=["sales-clone"])

# ============================================
# SCHEMAS
# ============================================

class SalesCloneUpdate(BaseModel):
    name: Optional[str] = None
    personality: Optional[str] = None
    sales_logic: Optional[str] = None
    tone_keywords: Optional[List[str]] = None
    avoid_keywords: Optional[List[str]] = None
    example_responses: Optional[List[dict]] = None  # [{question: str, answer: str}]

class SalesCloneResponse(BaseModel):
    id: str
    name: str
    personality: Optional[str]
    sales_logic: Optional[str]
    tone_keywords: Optional[List[str]]
    avoid_keywords: Optional[List[str]]
    example_responses: Optional[List[dict]]
    is_active: bool
    is_trained: bool
    
    class Config:
        from_attributes = True

class TestMessage(BaseModel):
    message: str  # User pretending to be buyer
    conversation_history: Optional[List[dict]] = None  # Previous messages [{role: "buyer"|"clone", text: str}]

class TestResponse(BaseModel):
    response: str  # AI clone's response
    confidence: float

# ============================================
# ENDPOINTS
# ============================================

@router.get("", response_model=SalesCloneResponse)
def get_sales_clone(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the user's sales clone configuration"""
    clone = db.query(SalesClone).filter(SalesClone.user_id == current_user.id).first()
    
    if not clone:
        # Create a new empty clone for the user
        clone = SalesClone(
            id=get_uuid(),
            user_id=current_user.id,
            name="Mi Clon de Ventas",
            is_active=False,
            is_trained=False
        )
        db.add(clone)
        db.commit()
        db.refresh(clone)
    
    return clone


@router.put("", response_model=SalesCloneResponse)
def update_sales_clone(
    clone_data: SalesCloneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the user's sales clone configuration"""
    try:
        clone = db.query(SalesClone).filter(SalesClone.user_id == current_user.id).first()
        
        if not clone:
            # Create new clone
            clone = SalesClone(
                id=get_uuid(),
                user_id=current_user.id
            )
            db.add(clone)
        
        # Update fields
        update_data = clone_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(clone, field, value)
        
        # Check if trained (has enough data)
        has_personality = bool(clone.personality and len(clone.personality) > 50)
        has_logic = bool(clone.sales_logic and len(clone.sales_logic) > 50)
        has_examples = bool(clone.example_responses and len(clone.example_responses) >= 3)
        
        clone.is_trained = has_personality and has_logic and has_examples
        
        db.commit()
        db.refresh(clone)
        
        return clone
    except Exception as e:
        print(f"[SalesClone] Error saving: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")


@router.post("/toggle")
def toggle_sales_clone(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle the sales clone active status (ON/OFF auto-replies)"""
    clone = db.query(SalesClone).filter(SalesClone.user_id == current_user.id).first()
    
    if not clone:
        raise HTTPException(status_code=404, detail="Sales clone not configured")
    
    # Can only activate if trained
    if not clone.is_active and not clone.is_trained:
        raise HTTPException(
            status_code=400, 
            detail="Debes completar el entrenamiento antes de activar el clon"
        )
    
    clone.is_active = not clone.is_active
    db.commit()
    
    return {
        "is_active": clone.is_active,
        "message": "Respuestas automáticas activadas" if clone.is_active else "Respuestas automáticas desactivadas"
    }


@router.post("/test", response_model=TestResponse)
def test_sales_clone(
    test_msg: TestMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test the sales clone with a simulated buyer message - Uses RAY CLON V2.0"""
    clone = db.query(SalesClone).filter(SalesClone.user_id == current_user.id).first()
    
    if not clone:
        raise HTTPException(status_code=404, detail="Sales clone not configured")
    
    if not clone.personality and not clone.sales_logic:
        raise HTTPException(
            status_code=400,
            detail="Configura la personalidad y lógica de ventas primero"
        )
    
    # For testing, create or get a test client to track state
    from app.models import Client
    
    test_client = db.query(Client).filter(
        Client.user_id == current_user.id,
        Client.phone == "TEST_ARENA"
    ).first()
    
    if not test_client:
        test_client = Client(
            id=get_uuid(),
            user_id=current_user.id,
            name="Cliente Prueba",
            phone="TEST_ARENA",
            status="new"
        )
        db.add(test_client)
        db.commit()
        db.refresh(test_client)
    
    # Use the new RAY CLON V2.0 agent
    from app.utils.sales_agent import process_message_with_agent
    
    try:
        result = process_message_with_agent(
            db=db,
            clone=clone,
            client_id=test_client.id,
            buyer_message=test_msg.message,
            conversation_history=test_msg.conversation_history
        )
        
        return {
            "response": result["response"],
            "confidence": result["confidence"]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno en agente V2: {str(e)}"
        )


@router.get("/status")
def get_clone_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick check if user has active sales clone (for webhook use)"""
    clone = db.query(SalesClone).filter(
        SalesClone.user_id == current_user.id,
        SalesClone.is_active == True
    ).first()
    
    return {
        "has_clone": clone is not None,
        "is_active": clone.is_active if clone else False,
        "is_trained": clone.is_trained if clone else False
    }


@router.post("/test/reset")
def reset_test_arena(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset the test arena conversation state to start fresh"""
    from app.models import Client, ConversationState
    
    # Find test client
    test_client = db.query(Client).filter(
        Client.user_id == current_user.id,
        Client.phone == "TEST_ARENA"
    ).first()
    
    if test_client:
        # Delete conversation state
        db.query(ConversationState).filter(
            ConversationState.client_id == test_client.id
        ).delete()
        db.commit()
        
        return {"message": "Arena de pruebas reiniciada", "success": True}
    
    return {"message": "No había estado previo", "success": True}
