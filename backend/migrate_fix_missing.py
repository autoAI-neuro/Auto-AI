from app.models import Base
from app.db.session import engine

def migrate_tables():
    print("Creating missing tables via SQLAlchemy...")
    try:
        # This will create any table that is defined in Base but missing in DB
        Base.metadata.create_all(bind=engine)
        print("Success: Checked and created missing tables (like 'appointments').")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    migrate_tables()
