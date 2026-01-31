"""
Calendar Integration Service for Ray
Checks availability against ConversationState appointments.
"""
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models import ConversationState

class CalendarService:
    
    @staticmethod
    def get_available_slots(days_ahead: int = 3):
        """
        Returns a list of available appointment slots for the next few days.
        Format: ["Mañana 10:00 AM", "Jueves 4:00 PM"]
        """
        db = SessionLocal()
        try:
            # 1. Get existing appointments to exclude
            start_date = datetime.now()
            end_date = start_date + timedelta(days=days_ahead)
            
            existing_appts = db.query(ConversationState.appointment_datetime).filter(
                ConversationState.appointment_datetime >= start_date,
                ConversationState.appointment_datetime <= end_date
            ).all()
            
            taken_slots = {appt[0].replace(minute=0, second=0, microsecond=0) for appt in existing_appts if appt[0]}
            
            # 2. Generate standard slots (9, 11, 14, 16)
            available_slots = []
            param_slots = [] # For return
            
            labels = ["Hoy", "Mañana", "Pasado mañana"]
            weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
            
            for i in range(1, days_ahead + 1): # Start from tomorrow
                day = start_date + timedelta(days=i)
                day_label = labels[i] if i < len(labels) else weekdays[day.weekday()]
                
                # Standard hours: 10 AM, 2 PM, 5 PM
                hours = [10, 14, 17]
                
                for h in hours:
                    slot_dt = day.replace(hour=h, minute=0, second=0, microsecond=0)
                    
                    if slot_dt not in taken_slots:
                        ampm = "AM" if h < 12 else "PM"
                        h_fmt = h if h <= 12 else h - 12
                        friendly = f"{day_label} {h_fmt}:00 {ampm}"
                        available_slots.append(friendly)
            
            # Return max 3 slots to not overwhelm
            return available_slots[:3]
            
        finally:
            db.close()

    @staticmethod
    def check_calendar():
        """Helper for AI Tool"""
        slots = CalendarService.get_available_slots()
        if not slots:
            return "No hay turnos disponibles pronto. Por favor consultar manualmente."
        return f"Turnos disponibles encontrados: {', '.join(slots)}"
