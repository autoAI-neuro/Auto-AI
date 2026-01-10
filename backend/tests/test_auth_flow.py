from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db
from app.db.base import Base
import os

# Use an in-memory SQLite db for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "strongpassword123",
            "company_name": "Test Motors",
            "phone": "1234567890"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    print("✅ Register User Test Passed")

def test_register_existing_user():
    # Try to register same user again
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password",
            "company_name": "Another One",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "El email ya está registrado"
    print("✅ Existing User Check Passed")

if __name__ == "__main__":
    try:
        test_register_user()
        test_register_existing_user()
        print("🎉 ALL AUTH TESTS PASSED")
        # Clean up
        os.remove("./test.db")
    except Exception as e:
        print(f"❌ TESTS FAILED: {e}")
        # Clean up even on fail
        if os.path.exists("./test.db"):
            os.remove("./test.db")
