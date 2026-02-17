from app.db.session import SessionLocal
from app.utils.sales_agent import process_message_with_agent
from app.models import SalesClone, Client, get_uuid
from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

db = SessionLocal()

db = SessionLocal()
user_id = "test_user_id"

# Mock clone
clone = SalesClone(user_id=user_id, personality="Vendedor Senior")

# Mock client
client = db.query(Client).filter(Client.user_id == user_id).first()
if not client:
    print("Creating dummy client for test user...")
    from app.models import get_uuid
    client = Client(
        id=get_uuid(),
        user_id=user_id,
        name="Test Client",
        phone="1234567890",
        status="New"
    )
    db.add(client)
    db.commit()
    print(f"Created client: {client.id}")

print(f"Testing with Client: {client.name} ({client.phone})")

# Test 1: Direct Photo Request
msg = "Mándame una foto de la Honda Pilot"
print(f"\n--- USER: {msg} ---")
res = process_message_with_agent(db, clone, client.id, msg)
print(f"AI RESPONSE: {res['response']}")
print(f"MEDIA URL: {res.get('media_url')}")

# Test 2: Ambiguous Photo Request (Context dependent)
msg2 = "Y tienes passport?"
print(f"\n--- USER: {msg2} ---")
res2 = process_message_with_agent(db, clone, client.id, msg2)
print(f"AI RESPONSE: {res2['response']}")
