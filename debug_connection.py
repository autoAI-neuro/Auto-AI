import httpx
import asyncio
import sys

async def test_connection():
    urls = [
        "http://localhost:3005/health",
        "http://127.0.0.1:3005/health",
        "http://0.0.0.0:3005/health"
    ]
    
    print("--- Testing Connection to WhatsApp Service (Port 3005) ---")
    
    success = False
    for url in urls:
        try:
            print(f"Trying {url}...", end=" ")
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    print(f"SUCCESS! (Status: {resp.status_code})")
                    print(f"Response: {resp.json()}")
                    success = True
                else:
                    print(f"FAILED (Status: {resp.status_code})")
        except Exception as e:
            print(f"ERROR: {str(e)}")
            
    if not success:
        print("\n[CRITICAL] Could not connect to WhatsApp Service on any address.")
        print("Possible causes:")
        print("1. Service is NOT running.")
        print("2. Crash on startup (check the black terminal window for errors).")
        print("3. Firewall blocking port 3002.")
    else:
        print("\n[INFO] Service is reachable. Backend configuration might be wrong if app still fails.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_connection())
