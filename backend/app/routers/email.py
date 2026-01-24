from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Client, User
from app.deps import get_current_user
from app.utils.email import send_email

router = APIRouter(prefix="/email", tags=["email"])

@router.post("/send-bulk")
def send_bulk_email(
    client_ids: List[int] = Body(...),
    subject: str = Body(...),
    message: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends email to selected clients.
    Reply-To is set to the current user's email.
    """
    clients = db.query(Client).filter(Client.id.in_(client_ids)).all()
    
    success_count = 0
    fail_count = 0
    
    for client in clients:
        if not client.email:
            fail_count += 1
            continue
            
        # Replace placeholders if needed (e.g. {nombre})
        personalized_body = message.replace("{nombre}", client.name)
        
        # Helper footer
        footer = f"<br><br><small>Enviado por {current_user.name} vía AutoAI</small>"
        
        if send_email(client.email, subject, personalized_body + footer, reply_to=current_user.email):
            success_count += 1
        else:
            fail_count += 1
            
    return {
        "message": f"Emails enviados: {success_count}. Fallidos: {fail_count}",
        "success_count": success_count,
        "fail_count": fail_count
    }
