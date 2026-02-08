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
    client_phone: Optional[str] = ""
    notes: Optional[str] = ""

@router.get("/", response_model=List[AppointmentResponse])
def get_appointments(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments for the calendar view"""
    print(f"[Appointments API] Fetching for user_id: {current_user.id}")
    
    # Debug: Check ALL appointments in DB first
    all_appts = db.query(Appointment).all()
    print(f"[Appointments API] Total appointments in DB: {len(all_appts)}")
    for a in all_appts[:5]:  # Show first 5
        print(f"  - ID: {a.id}, user_id: {a.user_id}, client_id: {a.client_id}, time: {a.start_time}")
    
    query = db.query(Appointment).filter(Appointment.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    if end_date:
        query = query.filter(Appointment.start_time <= end_date)
        
    appointments = query.all()
    print(f"[Appointments API] Found {len(appointments)} for current user")
    
    # Enrich with client names
    result = []
    for appt in appointments:
        client = db.query(Client).filter(Client.id == appt.client_id).first()
        client_name = client.name if client else "Cliente Desconocido"
        client_phone = client.phone if client else ""
        
        # Debug: Log what we're returning
        print(f"[Appointments API] Appt {appt.id}: client={client_name}, phone={client_phone}, time={appt.start_time}")
        
        result.append({
            "id": appt.id,
            "title": appt.title,
            "start": appt.start_time,
            "end": appt.end_time,
            "status": appt.status,
            "client_name": client_name,
            "client_phone": client_phone,
            "notes": appt.notes or ""
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

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete/Cancel an appointment"""
    # Find the appointment
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.user_id == current_user.id  # Security: only own appointments
    ).first()
    
    if not appt:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    # Delete it
    db.delete(appt)
    db.commit()
    
    print(f"[Appointments API] Deleted appointment: {appointment_id}")
    
    return {"status": "deleted", "id": appointment_id}

