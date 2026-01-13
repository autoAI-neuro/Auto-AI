from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Railway provides DATABASE_URL for PostgreSQL
# Fall back to local SQLite for development
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Railway PostgreSQL - fix URL scheme if needed
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(
        DATABASE_URL,
        pool_recycle=3600,
        pool_pre_ping=True
    )
else:
    # Local development - SQLite
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    APP_DIR = os.path.dirname(BASE_DIR)
    BACKEND_DIR = os.path.dirname(APP_DIR)
    DB_PATH = os.path.join(BACKEND_DIR, "app.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False},
        pool_recycle=3600,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
