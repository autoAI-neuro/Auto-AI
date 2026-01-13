from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

class ClientBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    status: Optional[str] = "new"
    tags: Optional[str] = None
    notes: Optional[str] = None
    
    # Phase 2: Expanded Fields
    last_name: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    purchase_date: Optional[date] = None
    car_make: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None
    interest_rate: Optional[float] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    purchase_date: Optional[date] = None
    car_make: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None
    interest_rate: Optional[float] = None

class ClientResponse(ClientBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    document_path: Optional[str] = None

    class Config:
        orm_mode = True
