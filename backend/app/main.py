from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
from app.routers import auth, whatsapp_web, clients, files
from app.db.session import engine
from app.db.base import Base
from app.models import User  # Import models so SQLAlchemy can detect them

# Create Tables
Base.metadata.create_all(bind=engine)

APP_VERSION = os.getenv("APP_VERSION", "2.0.0")
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
def health():
    return {"status": "ok", "version": APP_VERSION}

@app.get("/")
def root():
    return {"message": "🚀 AUTOAI Backend is running successfully!", "version": APP_VERSION}

@app.get("/api/ping")
def ping():
    return {"pong": True}

@app.get("/api/version")
def version():
    return {"version": APP_VERSION}
