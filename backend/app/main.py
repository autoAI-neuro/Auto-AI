from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os

APP_VERSION = os.getenv("APP_VERSION", "2.0.0")
app = FastAPI(title="AUTOAI API", version=APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
