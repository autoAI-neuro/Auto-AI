from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import httpx
from datetime import datetime
from sqlalchemy import text
from app.routers import auth, whatsapp_web, clients, files, tags, messages, ai, analytics, automations, inventory, email, sales_clone, memory
from app.db.session import engine, get_db
from app.db.base import Base
from app.models import User, Client, Tag, ClientTag, Message, Automation, AutomationAction, InventoryItem, SalesClone, ConversationState, ClientMemory  # Import models so SQLAlchemy can detect them

# Create Tables
Base.metadata.create_all(bind=engine)

APP_VERSION = os.getenv("APP_VERSION", "3.1.0")  # Bumped for Phase 3.1
WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://127.0.0.1:3005")

app = FastAPI(title="AUTOAI API", version=APP_VERSION)

@app.on_event("startup")
async def startup_event():
    from app.services.scheduler import start_scheduler
    start_scheduler()

# CORS Configuration - Must be added BEFORE including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(whatsapp_web.router)
# Fix for Node.js service calling /api/whatsapp/webhook
app.include_router(whatsapp_web.router, prefix="/api") 
app.include_router(clients.router)
app.include_router(files.router)
app.include_router(tags.router)
app.include_router(messages.router)
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(automations.router)
app.include_router(inventory.router)
app.include_router(email.router)
app.include_router(sales_clone.router)
app.include_router(memory.router)

@app.get("/health")
async def health():
    """Comprehensive health check for all services"""
    status = {
        "status": "ok",
        "version": APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check Database
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        status["services"]["database"] = {"status": "ok"}
    except Exception as e:
        status["services"]["database"] = {"status": "error", "message": str(e)}
        status["status"] = "degraded"
    
    # Check WhatsApp Service
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{WHATSAPP_SERVICE_URL}/health", timeout=5.0)
            wa_data = resp.json()
            status["services"]["whatsapp"] = {
                "status": "ok",
                "activeClients": wa_data.get("activeClients", 0)
            }
    except Exception as e:
        status["services"]["whatsapp"] = {"status": "error", "message": str(e)}
        status["status"] = "degraded"
    
    return status

@app.get("/")
def root():
    return {"message": "🚀 AUTOAI Backend is running!", "version": APP_VERSION}

@app.get("/api/ping")
def ping():
    return {"pong": True, "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/version")
def version():
    return {"version": APP_VERSION}

