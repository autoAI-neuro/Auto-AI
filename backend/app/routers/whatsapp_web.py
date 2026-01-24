from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
from typing import List
from app.db.session import get_db
from app.models import User, Client
from app.deps import get_current_user
from app.utils.reliability import message_rate_limiter
from app.routers.messages import save_outbound_message
from pydantic import BaseModel
import os

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# Use environment variable for production, fallback to localhost for development
WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://127.0.0.1:3005")
print(f"[Backend] WhatsApp Service URL: {WHATSAPP_SERVICE_URL}")

import socket
import requests

@router.get("/debug-connectivity")
def debug_connectivity():
    """Debug endpoint to test connectivity from within the server process"""
    results = {}
    
    # 1. Test TCP Trace
    try:
        host = "127.0.0.1"
        port = 3002
        sock = socket.create_connection((host, port), timeout=2)
        sock.close()
        results["tcp_127_0_0_1"] = "SUCCESS"
    except Exception as e:
        results["tcp_127_0_0_1"] = f"FAILED: {str(e)}"
        
    # 2. Test Requests (Sync)
    try:
        resp = requests.get(f"{WHATSAPP_SERVICE_URL}/health", timeout=2)
        results["requests_http"] = f"SUCCESS: {resp.status_code}"
    except Exception as e:
        results["requests_http"] = f"FAILED: {str(e)}"
        
    return {
        "config_url": WHATSAPP_SERVICE_URL,
        "results": results
    }

class SendMessageRequest(BaseModel):
    phone_number: str
    message: str
    client_id: str = None

@router.post("/init")
def initialize_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize WhatsApp client and generate QR code"""
    try:
        # Force local connection for desktop app stability
        # Force local connection for desktop app stability
        print(f"[Backend] Initializing WhatsApp for user: {current_user.id}")
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/init/{current_user.id}"
        print(f"[Backend] Calling URL: {url}")
        
        # Use simple Sync Client
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url)
            print(f"[Backend] Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        print(f"[Backend] HTTP error: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.RequestError as e:
        print(f"[Backend] Connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Cannot connect to WhatsApp service @ {url}: {str(e)}")

@router.get("/status")
def get_whatsapp_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get WhatsApp connection status and QR code"""
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/status/{current_user.id}"
        with httpx.Client(trust_env=False) as client:
            response = client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            print(f"[Backend] Status from Node for {current_user.id}: {data}")
        
        # Auto-restore session if backend says linked but service is not
        node_status = data.get('status')
        if current_user.whatsapp_linked and node_status in ['not_initialized', 'disconnected', 'error']:
            print(f"[Backend] Auto-restoring session for {current_user.id}")
            init_url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/init/{current_user.id}"
            with httpx.Client(trust_env=False) as client:
                # Fire and forget (or wait briefly)
                try:
                    client.post(init_url, timeout=5.0)
                    data['status'] = 'initializing'
                    data['message'] = 'Restoring session...'
                except Exception as e:
                    print(f"[Backend] Failed to restore session: {e}")

        # Update database if connected
        if node_status == 'connected' and not current_user.whatsapp_linked:
            current_user.whatsapp_linked = True
            db.commit()
            print(f"[Backend] Updated whatsapp_linked for user {current_user.id}")
        
        return data
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=f"WhatsApp service error: {str(e)}")



def send_message_internal(db: Session, user_id: str, phone: str, message: str, attachment: dict = None, client_id: str = None):
    """
    Internal helper to send messages via Node service and save to DB.
    Used by:
    - POST /send endpoint
    - Automation engine
    """
    WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://127.0.0.1:3005")
    
    url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send"
    payload = {
        "userId": user_id,
        "phoneNumber": phone,
        "message": message
    }
    
    # Send to Node Service
    print(f"[SendInternal] Sending to {phone} for {user_id}")
    with httpx.Client(trust_env=False) as client:
        response = client.post(url, json=payload, timeout=30.0)
        response.raise_for_status()
        result = response.json()
        
        # Save to DB
        save_outbound_message(
            db=db,
            user_id=user_id,
            phone=phone,
            content=message,
            whatsapp_message_id=result.get('messageId'),
            client_id=client_id
        )
        return result


@router.post("/send")
def send_whatsapp_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send WhatsApp message to a client"""
    user_id_str = str(current_user.id)
    
    # Rate limiting check (100 messages per minute per user)
    if not message_rate_limiter.is_allowed(user_id_str):
        remaining = message_rate_limiter.get_remaining(user_id_str)
        raise HTTPException(
            status_code=429, 
            detail=f"Rate limit exceeded. Try again in a few seconds. Remaining: {remaining}"
        )
    
    if not current_user.whatsapp_linked:
         raise HTTPException(status_code=400, detail="WhatsApp not linked")

    try:
        return send_message_internal(
            db, 
            str(current_user.id), 
            request.phone_number, 
            request.message,
            client_id=request.client_id
        )
    except httpx.RequestError as e:
        print(f"[Send] RequestError: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         error_detail = f"WhatsApp service error: {e.response.text}"
         print(f"[Backend] {error_detail}")
         raise HTTPException(status_code=e.response.status_code, detail=error_detail)

@router.post("/webhook")
def whatsapp_webhook(
    payload: dict,
    db: Session = Depends(get_db)
):
    """Receive incoming messages from Node service"""
    print(f"[Webhook] Received payload: {payload}")
    
    user_id = payload.get("user_id")
    sender_phone = payload.get("sender")
    text = payload.get("text")
    
    if not user_id or not sender_phone:
        raise HTTPException(status_code=400, detail="Missing user_id or sender")

    # 1. Verify User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"[Webhook] User {user_id} not found")
        return {"status": "ignored"}

    # 2. Find or Create Client
    # Try exact match first
    client = db.query(Client).filter(
        Client.user_id == user_id,
        Client.phone == sender_phone
    ).first()
    
    # Try normalized match if not found
    if not client:
        from app.utils.phone import normalize_phone
        norm_sender = normalize_phone(sender_phone)
        all_clients = db.query(Client).filter(Client.user_id == user_id).all()
        for c in all_clients:
            if normalize_phone(c.phone) == norm_sender:
                client = c
                break
    
    if not client:
        # Create new client automatically (Lead Capture)
        from app.models import get_uuid
        client = Client(
            id=get_uuid(),
            user_id=user_id,
            name=f"Lead {sender_phone[-4:]}", # Placeholder name
            phone=sender_phone,
            status="Nuevo"
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        print(f"[Webhook] New client created: {client.id}")
        
        # Trigger Automation: CLIENT_CREATED
        try:
            from app.routers.automations import trigger_automations
            trigger_automations(
                db, user_id, "CLIENT_CREATED", "ANY", 
                {"client_id": client.id, "client_name": client.name, "client_phone": client.phone}
            )
        except Exception as e:
            print(f"[Webhook] Automation error: {e}")

    # 3. Save Message to DB
    from app.models import Message, get_uuid
    from datetime import datetime
    
    message = Message(
        id=get_uuid(),
        user_id=user_id,
        client_id=client.id,
        phone=sender_phone,
        direction="inbound",
        content=text,
        status="received"
    )
    db.add(message)
    db.commit()
    print(f"[Webhook] Message saved for client {client.name}")
    
    # 4. Trigger Automation: MESSAGE_RECEIVED
    try:
        from app.routers.automations import trigger_automations
        trigger_automations(
            db, user_id, "MESSAGE_RECEIVED", "ANY", 
            {"client_id": client.id, "client_name": client.name, "client_phone": client.phone, "message": text}
        )
    except Exception as e:
        print(f"[Webhook] Automation error: {e}")

    return {"status": "processed"}

@router.post("/logout")
def logout_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect WhatsApp session"""
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/logout/{current_user.id}"
        with httpx.Client(trust_env=False) as client:
            response = client.post(url, timeout=10.0)
            response.raise_for_status()
        
        # Update database
        current_user.whatsapp_linked = False
        db.commit()
        
        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=f"WhatsApp service error: {str(e)}")

from typing import Optional

class BulkMessageFilters(BaseModel):
    tag_id: Optional[str] = None
    status: Optional[str] = None
    search: Optional[str] = None

from fastapi import BackgroundTasks

class BulkMessageRequest(BaseModel):
    phones: List[str] = []
    filters: BulkMessageFilters = None
    message: str = "" # Optional if sending media only
    media_url: str = None
    media_type: str = None # image, video, document
    caption: str = None

def process_bulk_send(
    target_phones: List[str], 
    message: str, 
    user_id: str, 
    media_url: str = None, 
    media_type: str = None, 
    caption: str = None
):
    """
    Background task to process bulk sending.
    This runs after the response is returned to the client.
    """
    WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://127.0.0.1:3005")
    print(f"[BulkWorker] Starting bulk send to {len(target_phones)} recipients for user {user_id}")
    
    success_count = 0
    fail_count = 0
    
    import time
    import random

    with httpx.Client(trust_env=False, timeout=60.0) as client:
        for phone in target_phones:
            try:
                # 1. Send Text if present
                if message:
                    url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send"
                    payload = {
                        "userId": user_id,
                        "phoneNumber": phone,
                        "message": message
                    }
                    client.post(url, json=payload).raise_for_status()
                
                # 2. Send Media if present
                if media_url and media_type:
                    url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send-media"
                    payload = {
                        "userId": user_id,
                        "phoneNumber": phone,
                        "mediaUrl": media_url,
                        "mediaType": media_type,
                        "caption": caption or ""
                    }
                    client.post(url, json=payload).raise_for_status()
                
                success_count += 1
                
                # Rate limit / Stability delay
                time.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                print(f"[BulkWorker] Error sending to {phone}: {e}")
                fail_count += 1
                
    print(f"[BulkWorker] Completed. Success: {success_count}, Failed: {fail_count}")

@router.post("/send-bulk")
def send_bulk_messages(
    request: BulkMessageRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send WhatsApp message (text or media) to multiple clients via Background Task"""
    
    target_phones = []
    
    # CASE A: Standard list of phones provided
    if request.phones:
        target_phones = request.phones
        
    # CASE B: Filters provided (Server-side selection)
    elif request.filters:
        print(f"[SendBulk] Resolving filters: {request.filters}")
        from app.models import Client, ClientTag
        
        query = db.query(Client).filter(Client.user_id == current_user.id)
        
        # Apply filters (Same logic as get_clients)
        if request.filters.search:
            term = f"%{request.filters.search}%"
            query = query.filter((Client.name.ilike(term)) | (Client.phone.ilike(term)))
            
        if request.filters.status:
            query = query.filter(Client.status == request.filters.status)
            
        if request.filters.tag_id:
            query = query.join(ClientTag).filter(ClientTag.tag_id == request.filters.tag_id)
            
        clients = query.all()
        target_phones = [c.phone for c in clients if c.phone]
        print(f"[SendBulk] Resolved {len(target_phones)} clients from filters")
        
    if not target_phones:
        raise HTTPException(status_code=400, detail="No valid recipients found")
    
    if not request.message and not request.media_url:
         raise HTTPException(status_code=400, detail="Must provide either message or media_url")

    print(f"[SendBulk] Queuing {len(target_phones)} messages. User: {current_user.id}")
    
    # Add to background queue
    background_tasks.add_task(
        process_bulk_send,
        target_phones=target_phones,
        message=request.message,
        user_id=str(current_user.id),
        media_url=request.media_url,
        media_type=request.media_type,
        caption=request.caption
    )
    
    return {
        "status": "queued",
        "message": f"Sending to {len(target_phones)} recipients in background",
        "count": len(target_phones)
    }


class SendMediaRequest(BaseModel):
    phone_number: str
    media_url: str
    media_type: str  # image, video, audio, document
    caption: str = ""

@router.post("/send-media")
def send_whatsapp_media(
    request: SendMediaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send media (image/video/document) via WhatsApp"""
    print(f"[SendMedia] User {current_user.id} sending {request.media_type}")
    
    # Smart linked check
    if not current_user.whatsapp_linked:
        try:
            check_url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/status/{current_user.id}"
            with httpx.Client(trust_env=False) as client:
                check_resp = client.get(check_url, timeout=5.0)
                node_status = check_resp.json().get('status')
                if node_status == 'connected':
                    current_user.whatsapp_linked = True
                    db.commit()
                else:
                    raise HTTPException(status_code=400, detail=f"WhatsApp not linked (status: {node_status})")
        except httpx.RequestError as e:
            raise HTTPException(status_code=400, detail="WhatsApp not linked")
    
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send-media"
        payload = {
            "userId": str(current_user.id),
            "phoneNumber": request.phone_number,
            "mediaUrl": request.media_url,
            "mediaType": request.media_type,
            "caption": request.caption
        }
        with httpx.Client(trust_env=False) as client:
            response = client.post(url, json=payload, timeout=60.0)  # Longer timeout for media
            response.raise_for_status()
            print(f"[SendMedia] SUCCESS for {current_user.id}")
            return response.json()
    except httpx.RequestError as e:
        print(f"[SendMedia] RequestError: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
        error_detail = f"WhatsApp service error: {e.response.text}"
        print(f"[SendMedia] {error_detail}")
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
