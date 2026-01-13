import requests
import os

BASE_URL = "http://127.0.0.1:8000"
LOGIN_DATA = {"email": "raysanchezsolutions@gmail.com", "password": "123456"}

def debug_api():
    print("-" * 50)
    print("DEBUG API START")
    
    # 1. Login
    try:
        print("1. Attempting Login...")
        resp = requests.post(f"{BASE_URL}/auth/login", json=LOGIN_DATA)
        print(f"Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            return
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login SUCCESS. Token acquired.")
    except Exception as e:
        print(f"Login Exception: {e}")
        return

    # 2. Add Client
    print("\n2. Attempting to Add Client...")
    client_data = {
        "name": "Test Client API",
        "phone": "+15550009999",
        "email": "testapi@example.com",
        "notes": "Created via debug script"
    }
    try:
        resp = requests.post(f"{BASE_URL}/clients/", json=client_data, headers=headers)
        print(f"Add Client Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Add Client Exception: {e}")

    # 3. Import Clients (Mock File)
    print("\n3. Attempting Import...")
    try:
        # Create dummy csv
        with open("test_import.csv", "w") as f:
            f.write("Name,Phone\nTest Import API,+15558887777")
        
        files = {'file': ('test_import.csv', open('test_import.csv', 'rb'), 'text/csv')}
        resp = requests.post(f"{BASE_URL}/files/import-clients", files=files, headers=headers)
        print(f"Import Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Import Exception: {e}")

if __name__ == "__main__":
    debug_api()
