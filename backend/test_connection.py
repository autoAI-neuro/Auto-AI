
import requests
import socket
import os

def test_url(url):
    print(f"Testing {url}...")
    try:
        response = requests.get(f"{url}/health", timeout=5)
        print(f"✅ Success: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"❌ Error: {e}")

def check_port(host, port):
    print(f"Checking socket {host}:{port}...")
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    try:
        result = s.connect_ex((host, port))
        if result == 0:
            print(f"✅ Port {port} is OPEN on {host}")
        else:
            print(f"❌ Port {port} is CLOSED on {host} (Error: {result})")
    except Exception as e:
        print(f"❌ Socket Error: {e}")
    finally:
        s.close()

print("--- Environment ---")
print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY')}")
print(f"HTTPS_PROXY: {os.environ.get('HTTPS_PROXY')}")
print("-------------------")

print("\n--- Socket Checks ---")
check_port('127.0.0.1', 3002)
check_port('localhost', 3002)

print("\n--- Requests Checks ---")
test_url("http://127.0.0.1:3002")
test_url("http://localhost:3002")
