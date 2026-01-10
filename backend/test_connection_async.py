
import httpx
import asyncio
import os

async def test_url(url):
    print(f"Testing {url} with httpx...")
    try:
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.get(f"{url}/health", timeout=5)
            print(f"✅ Success: {response.status_code}")
            print(response.json())
    except Exception as e:
        print(f"❌ Error: {e}")

async def main():
    print("--- Environment ---")
    print(f"HTTP_PROXY: {os.environ.get('HTTP_PROXY')}")
    print("-------------------")
    
    await test_url("http://localhost:3002")
    await test_url("http://127.0.0.1:3002")

if __name__ == "__main__":
    asyncio.run(main())
