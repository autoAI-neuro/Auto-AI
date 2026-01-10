from app.db.session import SessionLocal
from app.models import User, Client
from app.auth import SECRET_KEY

print(f"SECRET_KEY used: {SECRET_KEY}")

db = SessionLocal()
users = db.query(User).all()
print(f"Users found: {len(users)}")
for u in users:
    print(f"User: {u.email} ID: {u.id} WhatsApp: {u.whatsapp_linked}")

clients = db.query(Client).all()
print(f"Clients found: {len(clients)}")
clients = db.query(Client).all()
print(f"Clients found: {len(clients)}")
for c in clients:
    print(f"Client: {c.name} Phone: {c.phone} UserID: {c.user_id}")

# Read only verification
clients = db.query(Client).all()
print(f"Clients found: {len(clients)}")
for c in clients:
    print(f"Client: {c.name} Phone: {c.phone} UserID: {c.user_id}")
