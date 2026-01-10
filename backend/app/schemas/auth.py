from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    whatsapp_linked: bool
    onboarding_completed: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
