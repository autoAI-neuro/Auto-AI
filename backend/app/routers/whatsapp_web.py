from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
from typing import List
from app.db.session import get_db
from app.models import User
from app.deps import get_current_user
from pydantic import BaseModel
import os

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

# Default to localhost for stability
WHATSAPP_SERVICE_URL = os.getenv("WHATSAPP_SERVICE_URL", "http://localhost:3002")

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
        print(f"[Backend] Initializing WhatsApp for user: {current_user.id}")
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/init/{current_user.id}"
        print(f"[Backend] Calling URL: {url}")
        
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, timeout=60.0)
            print(f"[Backend] Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        print(f"[Backend] HTTP error: {e}")
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.RequestError as e:
        print(f"[Backend] Connection error: {e}")
        raise HTTPException(status_code=500, detail=f"Cannot connect to WhatsApp service: {str(e)}")

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
    current_user: User = Depends(get_current_user)
):
    """Send WhatsApp message to a client"""
    if not current_user.whatsapp_linked:
        raise HTTPException(status_code=400, detail="WhatsApp not linked")
    
    try:
        url = f"{WHATSAPP_SERVICE_URL}/api/whatsapp/send"
        payload = {
            "userId": str(current_user.id),
            "phoneNumber": request.phone_number,
            "message": request.message
        }
        async with httpx.AsyncClient(trust_env=False) as client:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp service error: {str(e)}")
    except httpx.HTTPStatusError as e:
         raise HTTPException(status_code=e.response.status_code, detail=f"WhatsApp service error: {str(e)}")

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
    current_user: User = Depends(get_current_user)
):
    """Send WhatsApp message to multiple clients"""
    if not current_user.whatsapp_linked:
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
