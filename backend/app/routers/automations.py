from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Automation, AutomationAction, get_uuid

router = APIRouter(prefix="/automations", tags=["automations"])

# ============================================
# SCHEMAS
# ============================================
class ActionCreate(BaseModel):
    action_type: str
    action_payload: dict
    order_index: int

class AutomationCreate(BaseModel):
    name: str
    trigger_type: str
    trigger_value: Optional[str] = None
    actions: List[ActionCreate]

class ActionResponse(ActionCreate):
    id: str
    class Config:
        from_attributes = True

class AutomationResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    trigger_type: str
    trigger_value: Optional[str]
    actions: List[ActionResponse]
    class Config:
        from_attributes = True


# ============================================
# CRUD ENDPOINTS
# ============================================
@router.post("/", response_model=AutomationResponse)
async def create_automation(
    automation_in: AutomationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new automation rule with actions"""
    
    # Create Automation
    db_automation = Automation(
        id=get_uuid(),
        user_id=current_user.id,
        name=automation_in.name,
        trigger_type=automation_in.trigger_type,
        trigger_value=automation_in.trigger_value,
        is_active=True
    )
    db.add(db_automation)
    db.flush()  # Get ID before committing
    
    # Create Actions
    for action in automation_in.actions:
        db_action = AutomationAction(
            id=get_uuid(),
            automation_id=db_automation.id,
            action_type=action.action_type,
            action_payload=action.action_payload,
            order_index=action.order_index
        )
        db.add(db_action)
    
    db.commit()
    db.refresh(db_automation)
    return db_automation


@router.get("/", response_model=List[AutomationResponse])
async def get_automations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all automations for user"""
    return db.query(Automation).filter(Automation.user_id == current_user.id).all()


@router.delete("/{automation_id}")
async def delete_automation(
    automation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an automation"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.user_id == current_user.id
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    db.delete(automation)
    db.commit()
    return {"status": "success", "message": "Automation deleted"}


@router.put("/{automation_id}/toggle")
async def toggle_automation(
    automation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle automation active status"""
    automation = db.query(Automation).filter(
        Automation.id == automation_id,
        Automation.user_id == current_user.id
    ).first()
    
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    automation.is_active = not automation.is_active
    db.commit()
    return {"status": "success", "is_active": automation.is_active}


# ============================================
# AUTOMATION ENGINE LOGIC
# ============================================
def trigger_automations(db: Session, user_id: str, trigger_type: str, trigger_value: str, context: dict):
    """
    Core function to check and execute automations.
    Call this from other routers (e.g., when a tag is added).
    """
    print(f"[Automation] Checking triggers for {trigger_type} = {trigger_value}")
    
    # 1. Find matching active automations
    automations = db.query(Automation).filter(
        Automation.user_id == user_id,
        Automation.is_active == True,
        Automation.trigger_type == trigger_type,
        Automation.trigger_value == trigger_value
    ).all()
    
    if not automations:
        print("[Automation] No matching rules found.")
        return
    
    # 2. Execute actions for each matched automation
    import asyncio
    from app.routers.whatsapp_web import send_message_internal # We will need to refactor send logic to be reusable
    
    for auto in automations:
        print(f"[Automation] Executing rule: {auto.name}")
        for action in auto.actions:
            execute_action(db, user_id, action, context)



async def execute_action(db: Session, user_id: str, action: AutomationAction, context: dict):
    """Execute a single action"""
    try:
        if action.action_type == "SEND_MESSAGE":
            message_template = action.action_payload.get("message", "")
            client_phone = context.get("client_phone")
            
            if not client_phone or not message_template:
                print("[Automation] Error: Missing phone or message template")
                return

            # Replace variables (e.g. {name})
            client_name = context.get("client_name", "")
            final_message = message_template.replace("{name}", client_name).replace("{nombre}", client_name)

            print(f"[Automation] Action: Sending message to {client_phone}")
            
            # Use the internal helper to send
            from app.routers.whatsapp_web import send_message_internal
            await send_message_internal(db, user_id, client_phone, final_message)
            
            # Use the internal helper to send
            from app.routers.whatsapp_web import send_message_internal
            await send_message_internal(db, user_id, client_phone, final_message)
            
        elif action.action_type == "WAIT":
             delay_minutes = int(action.action_payload.get("delay_minutes", 0))
             if delay_minutes > 0:
                 from app.services.scheduler import schedule_action_execution
                 from datetime import datetime, timedelta
                 
                 run_date = datetime.now() + timedelta(minutes=delay_minutes)
                 
                 # Determine next action in the chain
                 next_action = db.query(AutomationAction).filter(
                     AutomationAction.automation_id == action.automation_id,
                     AutomationAction.order_index > action.order_index
                 ).order_by(AutomationAction.order_index).first()
                 
                 if next_action:
                     print(f"[Automation] Scheduling next action {next_action.id} in {delay_minutes} mins")
                     # We need a wrapper to execute action from scheduler context
                     # Since we can't pass DB session easily, the scheduled job needs to create its own session
                     await schedule_action_execution(execute_action_job, run_date, args=[user_id, next_action.id, context])
                 else:
                     print("[Automation] Wait finished, but no further actions.")

    except Exception as e:
        print(f"[Automation] Error executing action {action.id}: {e}")

async def execute_action_job(user_id: str, action_id: str, context: dict):
    """Wrapper for scheduled execution that manages DB session"""
    from app.db.session import SessionLocal
    from app.models import AutomationAction
    
    db = SessionLocal()
    try:
        action = db.query(AutomationAction).filter(AutomationAction.id == action_id).first()
        if action:
            print(f"[Scheduler] Executing deferred action {action_id}")
            await execute_action(db, user_id, action, context)
        else:
            print(f"[Scheduler] Action {action_id} not found (might have been deleted)")
    except Exception as e:
         print(f"[Scheduler] Error executing job: {e}")
    finally:
        db.close()


