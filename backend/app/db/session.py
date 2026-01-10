from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Use environment variable or default to local SQLite
# Forcing SQLite for development
DATABASE_URL = "sqlite:///./app.db"

check_same_thread = False
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
