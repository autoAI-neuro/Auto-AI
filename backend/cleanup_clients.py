"""
Script to delete all clients from the Railway PostgreSQL database
"""
import psycopg2

# Railway Public URL
DATABASE_URL = "postgresql://postgres:xgBVLnQAnqKObBLhdrMRdACOexovRpzU@mainline.proxy.rlwy.net:20852/railway"

def cleanup():
    print("Connecting to Railway PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Count clients before
    cur.execute("SELECT COUNT(*) FROM clients")
    count_before = cur.fetchone()[0]
    print(f"Clients before cleanup: {count_before}")
    
    # Delete all clients
    print("Deleting all clients...")
    cur.execute("DELETE FROM clients")
    deleted = cur.rowcount
    
    # Also delete client_tags to avoid orphans
    cur.execute("DELETE FROM client_tags")
    
    conn.commit()
    
    # Count after
    cur.execute("SELECT COUNT(*) FROM clients")
    count_after = cur.fetchone()[0]
    print(f"Clients after cleanup: {count_after}")
    print(f"Deleted: {deleted} clients")
    
    cur.close()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    cleanup()
