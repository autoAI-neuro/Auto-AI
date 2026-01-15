from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Client
import pandas as pd
import io
import datetime
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

@router.post("/import-clients")
async def import_clients(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import clients from CSV/Excel file"""
    import os
    import json
    # Debug removed, using actual authenticated user

    allowed_extensions = {'.csv', '.xlsx', '.xls'}
    ext = "." + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Use: {', '.join(allowed_extensions)}")
    # Create debug log list
    debug_logs = []
    def log_capture(msg):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        debug_logs.append(f"{timestamp} - {msg}")
        print(f"DEBUG_IMPORT: {msg}") 

    count = 0
    errors = []

    try:
        log_capture("Starting AI import process...")
        log_capture(f"CWD: {os.getcwd()}")
        log_capture(f"DB Path: {os.path.abspath('app.db')}")
        
        # Check existing clients
        total_clients = db.query(Client).count()
        user_clients = db.query(Client).filter(Client.user_id == current_user.id).count()
        log_capture(f"Total Clients in DB: {total_clients}")
        log_capture(f"Clients for user {current_user.id}: {user_clients}")

        content = await file.read()
        log_capture(f"File read. Size: {len(content)} bytes")
        
        # Read file to string just for context (or DataFrame first)
        if ext == '.csv':
            df = pd.read_csv(io.BytesIO(content), dtype=str)
        else:
            df = pd.read_excel(io.BytesIO(content), dtype=str)
        
        # Convert first 10 rows to CSV string for the AI
        csv_preview = df.head(15).to_csv(index=False)
        log_capture(f"Preview generated for AI (Rows: {len(df)})")

        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured in environment")

        client = OpenAI()

        prompt = f"""
        You are a data extraction expert. I have a raw CSV/Excel export of clients.
        I need you to extract the client data into a strict JSON format.
        
        The known columns I need are:
        - name (string, required)
        - phone (string, required, include country code if possible, default to +1 if US, or just digits)
        - email (string, optional)
        - address (string, optional)
        - birth_date (YYYY-MM-DD, optional)
        - purchase_date (YYYY-MM-DD, optional)
        - car_make (string, optional)
        - car_model (string, optional)
        - car_year (int, optional)
        - notes (string, optional)

        Here is the data snippet:
        {csv_preview}

        INSTRUCTIONS:
        1. Identify the header row likely containing "Name", "Phone", etc.
        2. Extract each row as a JSON object.
        3. Normalize column names to the keys above.
        4. If a field is missing, set it to null.
        5. Return ONLY a JSON object with a key "clients" containing the list of objects. No markdown formatting.
        """

        log_capture("Sending to OpenAI...")
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful data extraction assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        response_content = completion.choices[0].message.content
        log_capture("AI Response received.")
        
        data = json.loads(response_content)
        ai_clients = data.get("clients", [])
        log_capture(f"AI identified {len(ai_clients)} candidates.")

        for i, c in enumerate(ai_clients):
            try:
                name = c.get('name')
                phone = c.get('phone')
                
                if not name or not phone:
                    log_capture(f"AI Row {i} SKIP: Missing name/phone.")
                    continue

                phone_clean = ''.join(filter(lambda x: x.isdigit() or x == '+', str(phone)))

                # Handle dates safely
                b_date = None
                if c.get('birth_date'):
                    try: b_date = datetime.datetime.strptime(c['birth_date'], '%Y-%m-%d').date()
                    except: pass
                
                p_date = None
                if c.get('purchase_date'):
                    try: p_date = datetime.datetime.strptime(c['purchase_date'], '%Y-%m-%d').date()
                    except: pass

                new_client = Client(
                    user_id=current_user.id,
                    name=str(name),
                    last_name=None, # AI usually puts full name in 'name'
                    phone=phone_clean,
                    email=c.get('email'),
                    address=c.get('address'),
                    birth_date=b_date,
                    purchase_date=p_date,
                    car_make=c.get('car_make'),
                    car_model=c.get('car_model'),
                    car_year=c.get('car_year'),
                    notes=c.get('notes') or f"AI Imported {datetime.date.today()}",
                    status="imported",
                    created_at=datetime.datetime.utcnow()
                )

                existing = db.query(Client).filter(Client.user_id == current_user.id, Client.phone == phone_clean).first()
                if not existing:
                    db.add(new_client)
                    count += 1
                else:
                    log_capture(f"Row {i} SKIP: Duplicate phone {phone_clean}")
            
            except Exception as row_e:
                 errors.append(f"AI Row {i}: {row_e}")

        db.commit()
        log_capture(f"AI Import finished. Count: {count}")

    except Exception as e:
        log_capture(f"CRITICAL ERROR: {str(e)}")
        log_capture(traceback.format_exc())
        errors.append(str(e))
    
    return {
        "imported_count": count,
        "errors": errors,
        "debug_info": debug_logs
    }

@router.get("/export-backup")
async def export_backup(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download all my clients as CSV"""
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    
    output = io.StringIO()
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

