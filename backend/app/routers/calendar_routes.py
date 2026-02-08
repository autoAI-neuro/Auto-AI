from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models import Appointment, Client, User, get_uuid
from app.deps import get_current_user

router = APIRouter(prefix="/appointments", tags=["appointments"])

class AppointmentCreate(BaseModel):
    client_id: str
    title: str
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    title: str
    start: datetime
    end: datetime
    status: str
    client_name: str

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments for the calendar view"""
    query = db.query(Appointment).filter(Appointment.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    if end_date:
        query = query.filter(Appointment.start_time <= end_date)
        
    appointments = query.all()
    
    # Enrich with client names
    result = []
    for appt in appointments:
        client = db.query(Client).filter(Client.id == appt.client_id).first()
        client_name = client.name if client else "Cliente Desconocido"
        
        result.append({
            "id": appt.id,
            "title": appt.title,
            "start": appt.start_time,
            "end": appt.end_time,
            "status": appt.status,
            "client_name": client_name
        })
        
    return result

@router.post("/", response_model=AppointmentResponse)
def create_appointment(
    appt: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    new_appt = Appointment(
        id=get_uuid(),
        user_id=current_user.id,
        client_id=appt.client_id,
        title=appt.title,
        start_time=appt.start_time,
        end_time=appt.end_time,
        notes=appt.notes,
        status="scheduled"
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    client = db.query(Client).filter(Client.id == appt.client_id).first()
    client_name = client.name if client else "Cliente"
    
    return {
        "id": new_appt.id,
        "title": new_appt.title,
        "start": new_appt.start_time,
        "end": new_appt.end_time,
        "status": new_appt.status,
        "client_name": client_name
    }
