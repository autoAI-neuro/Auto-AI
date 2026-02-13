import sys
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.append(os.getcwd())

from app.db.base import Base
from app.app.utils.calendar_service import CalendarService
from app.app.models import User, Client

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Please set DATABASE_URL environment variable")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def test_manual_appointment():
    try:
        # 1. Get a user and client
        user = db.query(User).first()
        client = db.query(Client).first()
        
        if not user or not client:
            print("No user or client found to test with.")
            return

        print(f"Testing with User: {user.email}, Client: {client.name}")

        # 2. Create Appointment
        now_iso = datetime.now().isoformat()
        print(f"Scheduling for: {now_iso}")
        
        appt = CalendarService.create_appointment(
            db=db,
            client_id=client.id,
            user_id=user.id,
            start_time=now_iso,
            notes="Manual Test Appointment"
        )
        
        print(f"SUCCESS! Appointment created: ID={appt.id}, Time={appt.start_time}")
        
    except Exception as e:
        print(f"FAILED: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_manual_appointment()
