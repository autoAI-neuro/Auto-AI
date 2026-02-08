from datetime import datetime, timedelta
from app.models import Appointment, Client, get_uuid
from sqlalchemy.orm import Session
import re

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
    def parse_flexible_datetime(date_str: str) -> datetime:
        """
        Parse various date formats that OpenAI might send.
        Handles: ISO 8601, natural language ("tomorrow 10am"), etc.
        """
        print(f"[CalendarService] Parsing date string: '{date_str}'")
        
        # 1. Try standard ISO format first
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            pass
        
        # 2. Try common patterns
        patterns = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M",
            "%m/%d/%Y %H:%M",
        ]
        for pattern in patterns:
            try:
                return datetime.strptime(date_str, pattern)
            except ValueError:
                continue
        
        # 3. Handle relative dates (tomorrow, next monday, etc.)
        now = datetime.now()
        lower_str = date_str.lower()
        
        # Extract time if present (e.g., "10:00", "10am", "2pm")
        time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', lower_str, re.IGNORECASE)
        hour = 10  # Default to 10 AM
        if time_match:
            hour = int(time_match.group(1))
            if time_match.group(3) and time_match.group(3).lower() == 'pm' and hour < 12:
                hour += 12
        
        # Parse relative date
        if "mañana" in lower_str or "tomorrow" in lower_str:
            target = now + timedelta(days=1)
        elif "lunes" in lower_str or "monday" in lower_str:
            days_ahead = (0 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "martes" in lower_str or "tuesday" in lower_str:
            days_ahead = (1 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "miércoles" in lower_str or "wednesday" in lower_str:
            days_ahead = (2 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "jueves" in lower_str or "thursday" in lower_str:
            days_ahead = (3 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "viernes" in lower_str or "friday" in lower_str:
            days_ahead = (4 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "sábado" in lower_str or "saturday" in lower_str:
            days_ahead = (5 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        elif "domingo" in lower_str or "sunday" in lower_str:
            days_ahead = (6 - now.weekday()) % 7 or 7
            target = now + timedelta(days=days_ahead)
        else:
            # Default to tomorrow if we can't parse
            target = now + timedelta(days=1)
        
        result = target.replace(hour=hour, minute=0, second=0, microsecond=0)
        print(f"[CalendarService] Parsed relative date: {result}")
        return result

    @staticmethod
    def create_appointment(db: Session, client_id: str, user_id: str, start_time: str, notes: str = "", client_name: str = None):
        """
        Create a real appointment in the database.
        start_time: ISO format string, datetime object, or natural language
        client_name: If provided and client is a "Lead", updates the client record
        """
        try:
            # If client_name provided, update the client record
            if client_name:
                client = db.query(Client).filter(Client.id == client_id).first()
                if client and (client.name.startswith("Lead") or client.name.startswith("lead")):
                    old_name = client.name
                    client.name = client_name
                    db.commit()
                    print(f"[CalendarService] 📝 Updated client name: '{old_name}' → '{client_name}'")
            
            # Parse start_time with flexible parser
            if isinstance(start_time, str):
                start_dt = CalendarService.parse_flexible_datetime(start_time)
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
            
            print(f"[CalendarService] ✅ Appointment created: {new_appt.id} at {start_dt}")
            return new_appt
            
        except Exception as e:
            print(f"[CalendarService] ❌ Error creating appointment: {e}")
            db.rollback()
            raise e

