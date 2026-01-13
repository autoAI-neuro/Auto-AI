import requests
import sqlite3
import os

BASE_URL = "http://127.0.0.1:8000"
LOGIN_DATA = {"email": "raysanchezsolutions@gmail.com", "password": "123456"}

def get_db_path():
    return "app.db" # Running from backend dir

def test_deletion():
    print("--- TESTING DELETION PERSISTENCE ---")
    
    # 1. Login
    resp = requests.post(f"{BASE_URL}/auth/login", json=LOGIN_DATA)
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Dummy Client
    print("\n1. Creating Dummy Client...")
    dummy_data = {
        "name": "DELETE_ME_TEST",
        "phone": "999999999",
        "email": "delete@test.com",
        "status": "Lead"
    }
    resp = requests.post(f"{BASE_URL}/clients", json=dummy_data, headers=headers)
    if resp.status_code != 200:
        print(f"Creation failed: {resp.text}")
        return
    client_id = resp.json()["id"]
    print(f"Created client {client_id}")
    
    # 3. Verify in DB (Direct Check)
    conn = sqlite3.connect(get_db_path())
    c = conn.cursor()
    c.execute("SELECT id FROM clients WHERE id = ?", (client_id,))
    if c.fetchone():
        print("✅ Client confirmed in DB after creation")
    else:
        print("❌ Client NOT found in DB after creation")
        
    # 4. Delete Client via API
    print("\n2. Deleting Client via API...")
    resp = requests.delete(f"{BASE_URL}/clients/{client_id}", headers=headers)
    print(f"Delete Status: {resp.status_code}")
    
    # 5. Verify GONE in DB (Direct Check)
    c.execute("SELECT id FROM clients WHERE id = ?", (client_id,))
    if c.fetchone():
        print("❌ FAIL: Client STILL EXISTS in DB after delete!")
    else:
        print("✅ SUCCESS: Client is GONE from DB.")
        
    conn.close()

if __name__ == "__main__":
    test_deletion()
