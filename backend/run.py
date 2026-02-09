
import uvicorn
import os
import sys

# Ensure current directory is in path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Starting Uvicorn programmatically...")
    
    # --- AUTO-MIGRATION ON STARTUP ---
    try:
        print("[Startup] Running inventory migration...")
        from migrate_inventory import migrate
        migrate()
        print("[Startup] Migration completed successfully.")
    except Exception as e:
        print(f"[Startup] WARNING: Inventory migration failed: {e}")
        # Build might fail if we crash here, better to log and continue so app starts
    # ---------------------------------

    # Load env vars manually if needed, but uvicorn should handle it or os environment
    # force host/port
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
