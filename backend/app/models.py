from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, index=True, nullable=False)  # Foreign Key to User
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    
    email = Column(String, nullable=True)
    status = Column(String, default="new")  # new, contacted, interested, closed, lost
    tags = Column(String, nullable=True)    # Comma-separated tags
    notes = Column(String, nullable=True)
    
    # Phase 2: Expanded Fields
    last_name = Column(String, nullable=True)
    address = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    purchase_date = Column(Date, nullable=True)
    car_make = Column(String, nullable=True)
    car_model = Column(String, nullable=True)
    car_year = Column(Integer, nullable=True)
    interest_rate = Column(Float, nullable=True)
    document_path = Column(String, nullable=True) # Path to uploaded ID
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MessageTemplate(Base):
    __tablename__ = "message_templates"

    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String) # e.g., "Feliz Cumpleaños"
    content = Column(String) # e.g., "Hola {name}, feliz cumple!"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Tag(Base):
    """Tags for categorizing clients in a sales pipeline"""
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Interesado", "Compró"
    color = Column(String, default="#6366f1")  # Hex color for UI
    icon = Column(String, nullable=True)  # Optional emoji/icon
    order = Column(Integer, default=0)  # For sorting in UI
    is_default = Column(Boolean, default=False)  # Pre-defined tags
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClientTag(Base):
    """Many-to-many relationship between clients and tags"""
    __tablename__ = "client_tags"

    id = Column(String, primary_key=True, default=get_uuid)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())


# Default pipeline tags (created per user on first login)
DEFAULT_TAGS = [
    {"name": "Nuevo", "color": "#6b7280", "icon": "🆕", "order": 0},
    {"name": "Interesado", "color": "#3b82f6", "icon": "👀", "order": 1},
    {"name": "Seguimiento", "color": "#f59e0b", "icon": "📞", "order": 2},
    {"name": "Negociando", "color": "#8b5cf6", "icon": "🤝", "order": 3},
    {"name": "Compró", "color": "#10b981", "icon": "✅", "order": 4},
    {"name": "Perdido", "color": "#ef4444", "icon": "❌", "order": 5},
]
