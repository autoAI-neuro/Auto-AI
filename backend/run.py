
import uvicorn
import os
import sys

# Ensure current directory is in path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Starting Uvicorn programmatically...")
    # Load env vars manually if needed, but uvicorn should handle it or os environment
    # force host/port
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
