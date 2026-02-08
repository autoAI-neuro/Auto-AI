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
    
    # Relationship Score
    relationship_score = Column(Float, default=50.0)  # 0-100 warmth score
    
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


# ============================================
# RAY CLON V2.0 - State Machine Models
# ============================================

class ConversationState(Base):
    """
    Tracks the state of a sales conversation for the RAY agent.
    This enables stage-based progression (INTAKE → APPOINTMENT).
    """
    __tablename__ = "conversation_states"
    
    id = Column(String, primary_key=True, default=get_uuid)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), unique=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # ===== STATE MACHINE =====
    stage = Column(String, default="INTAKE")  
    # Stages: INTAKE, CREDIT_PROFILE, DEAL_TYPE, OFFER_BUILD, RECOMMENDATION, APPOINTMENT, WRAP
    
    status_color = Column(String, default="yellow")  # green, yellow, red
    # 🟢 green = appointment scheduled
    # 🟡 yellow = in progress, needs follow-up
    # 🔴 red = lost, unqualified, no response
    
    # ===== LEAD PROFILE (extracted from conversation) =====
    vehicle_interest = Column(JSON, nullable=True)  # {model, year, body_type, trim}
    deal_intent = Column(String, default="unknown")  # purchase, lease, unknown
    
    # Credit
    credit_score = Column(Integer, nullable=True)  # Approximate score
    credit_tier = Column(String, nullable=True)  # tier1_plus, tier1, tier2, tier3, first_buyer
    credit_history_years = Column(Integer, nullable=True)
    first_time_buyer = Column(Boolean, default=False)
    
    # Trade-in
    has_trade_in = Column(Boolean, default=False)
    trade_in_details = Column(JSON, nullable=True)  # {vehicle_desc, is_lease, payoff_est, vin}
    
    # Budget signals
    monthly_target = Column(Integer, nullable=True)  # Target monthly payment
    downpayment_available = Column(Integer, nullable=True)  # Cash available for down
    
    # Timeline
    buying_timeline = Column(String, nullable=True)  # "now", "this_week", "exploring"
    
    # ===== APPOINTMENT =====
    appointment_datetime = Column(DateTime(timezone=True), nullable=True)
    appointment_location = Column(String, nullable=True)
    appointment_notes = Column(Text, nullable=True)
    
    # ===== FOLLOW-UP SCHEDULING =====
    next_action = Column(String, nullable=True)  # What to do next
    next_action_eta = Column(DateTime(timezone=True), nullable=True)  # When to follow up
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    
    # ===== CONVERSATION SUMMARY =====
    conversation_summary = Column(Text, nullable=True)  # "Moraleja" for human seller
    key_objections = Column(JSON, nullable=True)  # List of objections raised
    
    # ===== CALCULATED OFFERS =====
    last_offer = Column(JSON, nullable=True)  # Last calculated payment scenario
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Stage constants for reference
CONVERSATION_STAGES = [
    "INTAKE",           # 0 - Identify what they want + first buyer?
    "CREDIT_PROFILE",   # 1 - Get credit score/tier
    "DEAL_TYPE",        # 2 - Purchase vs Lease
    "OFFER_BUILD",      # 3 - Use tools to calculate real numbers
    "RECOMMENDATION",   # 4 - Ray's strategic advice
    "APPOINTMENT",      # 5 - Schedule visit
    "WRAP"              # 6 - Confirmation + follow-up
]


# ============================================
# CLIENT MEMORY - Memory System for Ray V2.0
# ============================================

class ClientMemory(Base):
    """
    Memoria persistente para cada cliente - usada por Ray.
    Almacena preferencias, objeciones, historial de ofertas y contexto personal.
    """
    __tablename__ = "client_memories"
    
    id = Column(String, primary_key=True, default=get_uuid)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # === PREFERENCIAS DE VEHÍCULO ===
    vehicles_interested = Column(JSON, nullable=True)    # [{model, trim, color, reason, date}]
    vehicles_rejected = Column(JSON, nullable=True)      # [{model, reason, date}]
    preferred_body_type = Column(String, nullable=True)  # "sedan", "suv", "truck", etc.
    
    # === PRESUPUESTO ===
    preferred_budget_monthly = Column(Integer, nullable=True)
    preferred_budget_down = Column(Integer, nullable=True)
    preferred_plan = Column(String, nullable=True)       # "lease" | "finance" | None
    max_budget_mentioned = Column(Integer, nullable=True)
    
    # === PERFIL DE COMUNICACIÓN ===
    communication_style = Column(String, nullable=True)  # "formal" | "casual" | "direct" | "friendly"
    preferred_language = Column(String, default="es")    # "es" | "en" | "spanglish"
    response_speed = Column(String, nullable=True)       # "fast" | "slow" | "variable"
    best_contact_times = Column(JSON, nullable=True)     # ["morning", "afternoon", "evening"]
    prefers_calls = Column(Boolean, default=False)
    prefers_text = Column(Boolean, default=True)
    
    # === OBJECIONES Y CONCERNS ===
    objections = Column(JSON, nullable=True)             # [{objection, response_given, resolved, date}]
    concerns = Column(JSON, nullable=True)               # ["price", "credit", "timing", "spouse_approval"]
    
    # === CONTEXTO PERSONAL ===
    family_info = Column(JSON, nullable=True)            # {spouse_name, kids_count, pet_type, etc}
    occupation = Column(String, nullable=True)
    income_type = Column(String, nullable=True)          # "w2", "1099", "self_employed", "uber"
    important_dates = Column(JSON, nullable=True)        # [{type, date, note}]
    personal_notes = Column(Text, nullable=True)         # Notas manuales del vendedor
    
    # === CRÉDITO ===
    credit_score_mentioned = Column(Integer, nullable=True)
    credit_tier = Column(String, nullable=True)          # "tier1_plus", "tier1", "tier2", "tier3"
    has_cosigner = Column(Boolean, default=False)
    document_type = Column(String, nullable=True)        # "ssn", "itin", "passport"
    first_time_buyer = Column(Boolean, default=False)
    
    # === HISTORIAL DE OFERTAS ===
    offers_given = Column(JSON, nullable=True)           # [{date, vehicle, payment, down, term, accepted}]
    last_offer = Column(JSON, nullable=True)             # Última oferta dada
    
    # === TRADE-IN ===
    has_trade_in = Column(Boolean, default=False)
    trade_in_details = Column(JSON, nullable=True)       # {make, model, year, payoff, condition}
    
    # === MÉTRICAS DE ENGAGEMENT ===
    interaction_count = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    messages_received = Column(Integer, default=0)
    avg_response_time_minutes = Column(Integer, nullable=True)
    last_interaction_at = Column(DateTime(timezone=True), nullable=True)
    relationship_score = Column(Integer, default=50)     # 0-100 (warmth of relationship)
    
    # === AI INSIGHTS ===
    ai_summary = Column(Text, nullable=True)             # Resumen generado por AI
    key_insights = Column(JSON, nullable=True)           # ["price_sensitive", "ready_to_buy", etc]
    buying_signals = Column(JSON, nullable=True)         # ["asked_for_appointment", "mentioned_urgency"]
    
    # === TIMELINE ===
    buying_timeline = Column(String, nullable=True)      # "now", "this_week", "this_month", "exploring"
    last_timeline_update = Column(DateTime(timezone=True), nullable=True)
    
    # === TIMESTAMPS ===
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
