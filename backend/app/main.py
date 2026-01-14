from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import httpx
from datetime import datetime
from app.routers import auth, whatsapp_web, clients, files
from app.db.session import engine, get_db
from app.db.base import Base
from app.models import User  # Import models so SQLAlchemy can detect them

# Create Tables
Base.metadata.create_all(bind=engine)

APP_VERSION = os.getenv("APP_VERSION", "2.1.0")  # Bumped for Phase 2
WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://127.0.0.1:3005")

app = FastAPI(title="AUTOAI API", version=APP_VERSION)

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
app.include_router(clients.router)
app.include_router(files.router)

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
        db.execute("SELECT 1")
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

