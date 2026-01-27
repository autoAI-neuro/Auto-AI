from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Date, Float, JSON
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


class Message(Base):
    """WhatsApp message history for CRM"""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=True)
    phone = Column(String, nullable=False)  # Phone number (for messages without client)
    
    # Message direction
    direction = Column(String, nullable=False)  # 'outbound' or 'inbound'
    
    # Content
    content = Column(Text, nullable=True)  # Text content
    media_url = Column(String, nullable=True)  # URL for media messages
    media_type = Column(String, nullable=True)  # image, video, audio, document
    
    # Status
    status = Column(String, default="sent")  # sent, delivered, read, failed
    whatsapp_message_id = Column(String, nullable=True)  # ID from WhatsApp
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)


class Automation(Base):
    """Automation Rules (If X then Y)"""
    __tablename__ = "automations"
    
    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Trigger Config
    trigger_type = Column(String, nullable=False)  # TAG_ADDED, CLIENT_CREATED
    trigger_value = Column(String, nullable=True)  # e.g., tag_id
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    actions = relationship("AutomationAction", backref="automation", cascade="all, delete-orphan", order_by="AutomationAction.order_index")


class AutomationAction(Base):
    """Actions to execute when automation triggers"""
    __tablename__ = "automation_actions"
    
    id = Column(String, primary_key=True, default=get_uuid)
    automation_id = Column(String, ForeignKey("automations.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, default=0)
    
    action_type = Column(String, nullable=False)  # SEND_MESSAGE, WAIT, ADD_TAG
    action_payload = Column(JSON, nullable=True)  # {"message": "top", "delay_minutes": 60}


class InventoryItem(Base):
    """Inventory items (Cars) for the dealership"""
    __tablename__ = "inventory_items"

    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    
    make = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    mileage = Column(Integer, nullable=True)
    color = Column(String, nullable=True)
    
    primary_image_url = Column(String, nullable=True)
    
    status = Column(String, default="available")
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SalesClone(Base):
    """AI Sales Clone for automated personalized responses"""
    __tablename__ = "sales_clones"
    
    id = Column(String, primary_key=True, default=get_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Clone Identity
    name = Column(String, default="Mi Clon de Ventas")
    
    # AI Configuration
    personality = Column(Text, nullable=True)        # User's sales personality description
    sales_logic = Column(Text, nullable=True)        # Sales strategy and approach
    tone_keywords = Column(JSON, nullable=True)      # Keywords/phrases to use
    avoid_keywords = Column(JSON, nullable=True)     # Words to avoid
    example_responses = Column(JSON, nullable=True)  # Example Q&A pairs for training
    
    # Training Data
    voice_samples = Column(JSON, nullable=True)      # Paths to voice notes (future)
    
    # Status Flags
    is_active = Column(Boolean, default=False)       # Auto-reply ON/OFF (OFF by default!)
    is_trained = Column(Boolean, default=False)      # Has user completed basic training
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

