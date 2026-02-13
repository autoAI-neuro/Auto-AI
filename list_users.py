import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.db.session import SessionLocal
from app.models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"--- Usuarios Registrados ({len(users)}) ---")
        for user in users:
            print(f"- {user.email} (Nombre: {user.name})")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
