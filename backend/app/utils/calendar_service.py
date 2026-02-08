from datetime import datetime, timedelta
from app.models import Appointment, get_uuid
from sqlalchemy.orm import Session

class CalendarService:
    
    @staticmethod
    def check_calendar():
        """
        Simulate checking calendar. 
        In future: Check real slots in DB.
        """
        # For now, just return generic availability as before
        # The frontend will eventually query real slots
        slots = [
            "Mañana 10:00 AM",
            "Mañana 2:00 PM",
            "Mañana 5:00 PM"
        ]
        return f"Turnos disponibles: {', '.join(slots)}"

    @staticmethod
    def create_appointment(db: Session, client_id: str, user_id: str, start_time: str, notes: str = ""):
        """
        Create a real appointment in the database.
        start_time: ISO format string or datetime object
        """
        try:
            # Parse start_time
            if isinstance(start_time, str):
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            else:
                start_dt = start_time
                
            # Assume 1 hour duration
            end_dt = start_dt + timedelta(hours=1)
            
            # Create Appointment Record
            new_appt = Appointment(
                id=get_uuid(),
                user_id=user_id,
                client_id=client_id,
                title="Cita de Ventas (IA)",
                start_time=start_dt,
                end_time=end_dt,
                notes=notes,
                status="scheduled"
            )
            
            db.add(new_appt)
            db.commit()
            db.refresh(new_appt)
            
            print(f"[CalendarService] Appointment created: {new_appt.id} at {start_dt}")
            return new_appt
            
        except Exception as e:
            print(f"[CalendarService] Error creating appointment: {e}")
            db.rollback()
            raise e
