from sqlalchemy import Column, String, Boolean, DateTime
import uuid
from datetime import datetime
from app.db.base import Base

def get_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=get_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)  # New field for user's name
    company_name = Column(String, nullable=True)  # Now optional
    phone = Column(String, nullable=True)
    
    # Flags
    whatsapp_linked = Column(Boolean, default=False)
    onboarding_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
