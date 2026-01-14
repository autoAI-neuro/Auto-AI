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

@router.post("/init")
async def initialize_whatsapp(
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
        
        # Use simple AsyncClient without proxies parameter (not supported in newer httpx)
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url)
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
async def get_whatsapp_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get WhatsApp connection status and QR code"""
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/status/{current_user.id}"
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            print(f"[Backend] Status from Node for {current_user.id}: {data}")
        
        # Auto-restore session if backend says linked but service is not
        node_status = data.get('status')
        if current_user.whatsapp_linked and node_status in ['not_initialized', 'disconnected', 'error']:
            print(f"[Backend] Auto-restoring session for {current_user.id}")
            init_url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/init/{current_user.id}"
            async with httpx.AsyncClient(trust_env=False) as client:
                # Fire and forget (or wait briefly)
                try:
                    await client.post(init_url, timeout=5.0)
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

@router.post("/send")
async def send_whatsapp_message(
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
    
    print(f"[Send] User {current_user.id} attempting to send. whatsapp_linked={current_user.whatsapp_linked}")
    
    # If DB says not linked, double-check with Node service (DB might be stale)
    if not current_user.whatsapp_linked:
        print(f"[Send] DB says not linked. Checking Node service directly...")
        try:
            check_url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/status/{current_user.id}"
            async with httpx.AsyncClient(trust_env=False) as client:
                check_resp = await client.get(check_url, timeout=5.0)
                node_status = check_resp.json().get('status')
                print(f"[Send] Node status for {current_user.id}: {node_status}")
                if node_status == 'connected':
                    # Update DB to match reality
                    current_user.whatsapp_linked = True
                    db.commit()
                    print(f"[Send] Updated DB whatsapp_linked=True for {current_user.id}")
                else:
                    raise HTTPException(status_code=400, detail=f"WhatsApp not linked (Node status: {node_status})")
        except httpx.RequestError as e:
            print(f"[Send] Failed to check Node status: {e}")
            raise HTTPException(status_code=400, detail="WhatsApp not linked and cannot verify")
    
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send"
        payload = {
            "userId": str(current_user.id),
            "phoneNumber": request.phone_number,
            "message": request.message
        }
        print(f"[Send] Calling Node: {url} with payload userId={current_user.id}")
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            result = response.json()
            print(f"[Send] SUCCESS for {current_user.id}")
            
            # Save message to database for CRM history
            try:
                save_outbound_message(
                    db=db,
                    user_id=str(current_user.id),
                    phone=request.phone_number,
                    content=request.message,
                    whatsapp_message_id=result.get('messageId')
                )
            except Exception as save_err:
                print(f"[Send] Warning: Failed to save message to DB: {save_err}")
            
            return result
    except httpx.RequestError as e:
        print(f"[Send] RequestError: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         error_detail = f"WhatsApp service error: {e.response.text}"
         print(f"[Backend] {error_detail}")
         raise HTTPException(status_code=e.response.status_code, detail=error_detail)

@router.post("/logout")
async def logout_whatsapp(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect WhatsApp session"""
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/logout/{current_user.id}"
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, timeout=10.0)
            response.raise_for_status()
        
        # Update database
        current_user.whatsapp_linked = False
        db.commit()
        
        return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=f"WhatsApp service error: {str(e)}")

class BulkMessageRequest(BaseModel):
    phones: List[str]
    message: str

@router.post("/send-bulk")
async def send_bulk_messages(
    request: BulkMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send WhatsApp message to multiple clients"""
    print(f"[SendBulk] User {current_user.id} attempting bulk send. whatsapp_linked={current_user.whatsapp_linked}")
    
    # Smart check: verify with Node if DB says not linked
    if not current_user.whatsapp_linked:
        try:
            check_url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/status/{current_user.id}"
            async with httpx.AsyncClient(trust_env=False) as client:
                check_resp = await client.get(check_url, timeout=5.0)
                node_status = check_resp.json().get('status')
                if node_status == 'connected':
                    current_user.whatsapp_linked = True
                    db.commit()
                    print(f"[SendBulk] Updated DB whatsapp_linked=True for {current_user.id}")
                else:
                    raise HTTPException(status_code=400, detail=f"WhatsApp not linked (status: {node_status})")
        except httpx.RequestError as e:
            raise HTTPException(status_code=400, detail="WhatsApp not linked")
    
    results = {
        "total": len(request.phones),
        "sent": 0,
        "failed": 0,
        "errors": []
    }
    
    url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send"
    
    async with httpx.AsyncClient(trust_env=False) as client:
        for phone in request.phones:
            try:
                payload = {
                    "userId": str(current_user.id),
                    "phoneNumber": phone,
                    "message": request.message
                }
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                results["sent"] += 1
            except Exception as e:
                print(f"[Backend] Error sending to {phone}: {e}")
                results["failed"] += 1
                results["errors"].append({"phone": phone, "error": str(e)})
                
    return results


class SendMediaRequest(BaseModel):
    phone_number: str
    media_url: str
    media_type: str  # image, video, audio, document
    caption: str = ""

@router.post("/send-media")
async def send_whatsapp_media(
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
            async with httpx.AsyncClient(trust_env=False) as client:
                check_resp = await client.get(check_url, timeout=5.0)
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
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, json=payload, timeout=60.0)  # Longer timeout for media
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
