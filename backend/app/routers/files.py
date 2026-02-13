from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Client
import pandas as pd
import io
import datetime
import traceback
import os
import json
from openai import OpenAI

def log_debug(msg):
    log_path = r"c:\Users\RAYSA\Documents\autoai\backend\debug_import.log"
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"{datetime.datetime.now()} - {msg}\n")
    except Exception as e:
        print(f"FAILED TO LOG: {e}")

router = APIRouter(prefix="/files", tags=["files"])

# Helper functions defined at module level to avoid redefinition
def safe_date(val):
    if pd.isna(val) or val is None: return None
    s = str(val).strip()
    if not s: return None
    try:
        # Try pandas first (handles most formats automatically)
        dt = pd.to_datetime(s, errors='coerce')
        if pd.notnull(dt):
            return dt.date() # Return python date object
        return None
    except:
        return None

def safe_int(val):
    if pd.isna(val) or val is None: return None
    s = str(val).strip()
    if not s: return None
    try:
        return int(float(s))
    except:
        return None

@router.post("/import-clients")
def import_clients(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import clients from CSV/Excel file (Bulk mode)"""
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    allowed_extensions = {'.csv', '.xlsx', '.xls'}
    ext = "." + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Invalid file. Use: {', '.join(allowed_extensions)}")

    count = 0
    errors = []
    
    try:
        # Read file synchronously (safe in 'def' route running in threadpool)
        content = file.file.read()
        
        # Load DataFrame
        if ext == '.csv':
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        else:
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        
        df = df.fillna('')  # Handle NaNs
        
        if df.empty:
            return {"imported_count": 0, "errors": ["File is empty"]}

        # 1. AI Column Mapping
        headers = list(df.columns)
        prompt = f"""
        Map these CSV headers to my database columns.
        CSV Headers: {json.dumps(headers)}
        
        Target Columns:
        - name (Required. If multiple, choose the one with full name)
        - phone (Required)
        - email
        - address
        - notes (or description/comments)
        - car_make
        - car_model
        - car_year
        - birth_date (Format: YYYY-MM-DD or similar)
        - purchase_date (Date of vehicle purchase)
        
        Return JSON Key-Value pair: {{"target_column": "csv_header_name"}}
        Only include found mappings. ignore others.
        """
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a data mapping assistant. Return strict JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        mapping = json.loads(completion.choices[0].message.content)
        print(f"[Import] Column Mapping: {mapping}")
        
        # Validate critical columns
        if 'name' not in mapping or 'phone' not in mapping:
            # Fallback: exact match try
            lower_headers = {h.lower(): h for h in headers}
            if 'name' not in mapping and 'name' in lower_headers: mapping['name'] = lower_headers['name']
            if 'name' not in mapping and 'nombre' in lower_headers: mapping['name'] = lower_headers['nombre']
            if 'phone' not in mapping and 'phone' in lower_headers: mapping['phone'] = lower_headers['phone']
            if 'phone' not in mapping and 'telefono' in lower_headers: mapping['phone'] = lower_headers['telefono']
            
            if 'name' not in mapping or 'phone' not in mapping:
                 return {"imported_count": 0, "errors": [f"Could not find Name/Phone columns. Headers: {headers}"]}

        # 2. Process Rows
        for index, row in df.iterrows():
            try:
                # Extract data using mapping
                name = str(row[mapping['name']]).strip()
                phone_raw = str(row[mapping['phone']]).strip()
                
                if not name or not phone_raw:
                    continue
                    
                # Clean Phone
                phone_clean = ''.join(filter(lambda x: x.isdigit() or x == '+', phone_raw))
                if len(phone_clean) < 7: # Basic validation
                    continue

                # Check Duplicate
                existing = db.query(Client).filter(Client.user_id == current_user.id, Client.phone == phone_clean).first()
                if existing:
                    # Update info if found in import (Upsert Logic)
                    updated = False
                    
                    # Update Name if different (and not empty)
                    if name and existing.name != name:
                        existing.name = name
                        updated = True
                        
                    # Helper to update if new val is present
                    def update_if_present(obj, attr, val):
                        if val and getattr(obj, attr) != val:
                            setattr(obj, attr, val)
                            return True
                        return False

                    # Update fields
                    if 'email' in mapping: updated |= update_if_present(existing, 'email', str(row[mapping['email']]).strip())
                    if 'address' in mapping: updated |= update_if_present(existing, 'address', str(row[mapping['address']]).strip())
                    if 'notes' in mapping: 
                        new_note = str(row[mapping['notes']]).strip()
                        if new_note and new_note not in (existing.notes or ""):
                            existing.notes = (existing.notes or "") + f"\n[{datetime.date.today()}] {new_note}"
                            updated = True

                    # Car Details
                    if 'car_make' in mapping: updated |= update_if_present(existing, 'car_make', str(row[mapping['car_make']]).strip())
                    if 'car_model' in mapping: updated |= update_if_present(existing, 'car_model', str(row[mapping['car_model']]).strip())
                    if 'car_year' in mapping: updated |= update_if_present(existing, 'car_year', safe_int(row[mapping['car_year']]))
                    
                    # Dates
                    if 'birth_date' in mapping:
                         bdate = safe_date(row[mapping.get('birth_date')])
                         if bdate: 
                             existing.birth_date = bdate
                             updated = True
                    
                    if 'purchase_date' in mapping:
                         pdate = safe_date(row[mapping.get('purchase_date')])
                         if pdate: 
                             existing.purchase_date = pdate
                             updated = True
                    
                    if updated:
                        count += 1
                    continue

                # Create Client
                new_client = Client(
                    user_id=current_user.id,
                    name=name,
                    phone=phone_clean,
                    email=str(row[mapping.get('email', '')]).strip() if 'email' in mapping else None,
                    address=str(row[mapping.get('address', '')]).strip() if 'address' in mapping else None,
                    car_make=str(row[mapping.get('car_make', '')]).strip() if 'car_make' in mapping else None,
                    car_model=str(row[mapping.get('car_model', '')]).strip() if 'car_model' in mapping else None,
                    car_year=safe_int(row[mapping.get('car_year')]) if 'car_year' in mapping else None,
                    notes=str(row[mapping.get('notes', '')]).strip() if 'notes' in mapping else f"Imported {datetime.date.today()}",
                    status="imported",
                    birth_date=safe_date(row[mapping.get('birth_date')]) if 'birth_date' in mapping else None,
                    purchase_date=safe_date(row[mapping.get('purchase_date')]) if 'purchase_date' in mapping else None,
                    created_at=datetime.datetime.utcnow()
                )
                db.add(new_client)
                count += 1
                
                # Batch commit every 50 to avoid memory issues
                if count % 50 == 0:
                    db.commit()

            except Exception as row_e:
                errors.append(f"Row {index}: {str(row_e)}")

        db.commit() # Final commit

    except Exception as e:
        print(f"Import Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    return {
        "imported_count": count,
        "errors": errors[:10] # Return first 10 errors
    }

@router.get("/export-backup")
async def export_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download all my clients as CSV"""
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    
    writer = pd.DataFrame([
        {
            "ID": c.id,
            "Name": c.name,
            "Last Name": c.last_name,
            "Phone": c.phone,
            "Email": c.email,
            "Address": c.address,
            "Car Make": c.car_make,
            "Car Model": c.car_model,
            "Car Year": c.car_year,
            "Status": c.status,
            "Notes": c.notes,
            "Created At": c.created_at
        } for c in clients
    ])
    
    # Use pandas to write CSV to string buffer
    output = io.StringIO()
    writer.to_csv(output, index=False)
    output.seek(0)
    
    response = StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=backup_clientes_{datetime.date.today()}.csv"
    return response


# ============================================
# MEDIA UPLOAD FOR WHATSAPP
# ============================================
import uuid
import shutil
import subprocess
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Media storage directory
MEDIA_DIR = Path("uploads/media")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Allowed media types
ALLOWED_MEDIA_TYPES = {
    "image/jpeg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
    "video/mp4": "video",
    "video/quicktime": "video",
    "audio/mpeg": "audio",
    "audio/mp4": "audio",
    "audio/ogg": "audio",
    "audio/webm": "audio",
    "application/pdf": "document",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
}

@router.post("/upload-media")
async def upload_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload media file for WhatsApp sending. Returns public URL."""
    
    # Validate file type
    content_type = file.content_type.split(';')[0].strip().lower()
    if content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {content_type}. Allowed: images, videos, audio, documents"
        )
    
    media_type = ALLOWED_MEDIA_TYPES[content_type]
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = MEDIA_DIR / unique_name
    
    # Save file
    try:
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Convert WebM Audio to MP4 (AAC) - More compatible
        if content_type == 'audio/webm':
            if shutil.which('ffmpeg') is None:
                print("🚨 CRITICAL: FFMPEG NOT INSTALLED IN CONTAINER")
            
            try:
                mp4_name = f"{uuid.uuid4()}.mp4"
                mp4_path = MEDIA_DIR / mp4_name
                
                # FFmpeg conversion to AAC (MP4)
                subprocess.run([
                    'ffmpeg', '-i', str(file_path),
                    '-vn', # No video
                    '-acodec', 'aac',
                    '-y',
                    str(mp4_path)
                ], check=True, capture_output=True)
                
                # If successful, use the new file
                if mp4_path.exists():
                    os.remove(file_path) # Delete original webm
                    unique_name = mp4_name
                    final_mime = "audio/mp4" # Force MP4 mime
                    
            except Exception as e:
                print(f"Audio conversion failed: {e}")
                # Continue with original file if conversion fails
                pass

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Get base URL from environment or use Railway URL
    base_url = os.getenv("BACKEND_PUBLIC_URL", "https://auto-ai-production-b99a.up.railway.app")
    media_url = f"{base_url}/files/media/{unique_name}"
    
    # Determine final mimetype (if not set by conversion)
    if 'final_mime' not in locals():
        final_mime = content_type

    return {
        "status": "uploaded",
        "media_url": media_url,
        "media_type": media_type,
        "mimetype": final_mime,
        "filename": unique_name,
        "size": Path(MEDIA_DIR / unique_name).stat().st_size
    }


@router.get("/media/{filename}")
async def serve_media(filename: str):
    """Serve uploaded media files"""
    file_path = MEDIA_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type from extension
    ext = filename.split('.')[-1].lower()
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    
    media_type = content_types.get(ext, 'application/octet-stream')
    
    return StreamingResponse(
        open(file_path, 'rb'),
        media_type=media_type
    )
