import requests
import time

BASE_URL = "http://127.0.0.1:8000"
# Login credentials - ensure these match the user currently connected in WhatsApp
LOGIN_DATA = {"email": "raysanchezsolutions@gmail.com", "password": "123456"}
TEST_PHONE = "+17865557845" # Retrieved from DB
TEST_MESSAGE = "Hello from AutoAI Debugger"

def debug_message_sending():
    print("-" * 50)
    print("DEBUG WHATSAPP SEND START")
    
    # 1. Login
    try:
        print("1. Attempting Login...")
        resp = requests.post(f"{BASE_URL}/auth/login", json=LOGIN_DATA)
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login SUCCESS.")
    except Exception as e:
        print(f"Login Exception: {e}")
        return

    # 2. Check Status
    print("\n2. Checking WhatsApp Status...")
    try:
        resp = requests.get(f"{BASE_URL}/whatsapp/status", headers=headers)
        print(f"Status Response: {resp.json()}")
        if resp.json().get("status") != "connected":
            print("WARNING: WhatsApp is NOT connected in the backend view.")
    except Exception as e:
        print(f"Status Exception: {e}")

    # 3. Send Message
    print("\n3. Attempting to Send Message...")
    payload = {
        "phone_number": TEST_PHONE,
        "message": TEST_MESSAGE
    }
    try:
        resp = requests.post(f"{BASE_URL}/whatsapp/send", json=payload, headers=headers)
        print(f"Send Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Send Exception: {e}")

if __name__ == "__main__":
    debug_message_sending()
