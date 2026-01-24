from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.deps import get_current_user
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User
from app.schemas.auth import UserCreate, UserLogin, Token, UserOut
from app.auth import get_password_hash, create_access_token
from app.db.base import Base
from app.utils.email import send_email
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/forgot-password")
def forgot_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if user exists
        return {"message": "Si el correo existe, recibirás instrucciones."}
    
    # Generate reset token (valid for 15 mins)
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    link = f"https://auto-ai-beta.vercel.app/reset-password?token={reset_token}"
    
    subject = "Recuperación de Contraseña - AutoAI"
    body = f"""
    <h1>Recuperar Contraseña</h1>
    <p>Hola {user.name},</p>
    <p>Has solicitado restablecer tu contraseña. Haz click en el siguiente enlace:</p>
    <a href="{link}">Restablecer Contraseña</a>
    <p>Este enlace expira en 15 minutos.</p>
    <p>Si no fuiste tú, ignora este mensaje.</p>
    """
    
    send_email(user.email, subject, body)
    return {"message": "Si el correo existe, recibirás instrucciones."}

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] Registration attempt for: {user_in.email}")
        
        # 1. Check if user exists
        user = db.query(User).filter(User.email == user_in.email).first()
        if user:
            print(f"[DEBUG] User already exists: {user_in.email}")
            raise HTTPException(
                status_code=400,
                detail="El email ya está registrado"
            )
        
        # 2. Create user
        print(f"[DEBUG] Creating new user: {user_in.email}")
        new_user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            name=user_in.name
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"[DEBUG] User created successfully: {new_user.id}")
        
        # 3. Auto-login (Generate Token)
        access_token = create_access_token(data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "name": new_user.name
        })
        print(f"[DEBUG] Token generated for user: {new_user.id}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Registration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] Login attempt for: {user_in.email}")
        
        # 1. Find user by email
        user = db.query(User).filter(User.email == user_in.email).first()
        if not user:
            print(f"[DEBUG] User not found: {user_in.email}")
            raise HTTPException(
                status_code=401,
                detail="Email o contraseña incorrectos"
            )
        
        # 2. Verify password
        from app.auth import verify_password
        if not verify_password(user_in.password, user.password_hash):
            print(f"[DEBUG] Invalid password for user: {user_in.email}")
            raise HTTPException(
                status_code=401,
                detail="Email o contraseña incorrectos"
            )
        
        # 3. Generate token
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "name": user.name
        })
        print(f"[DEBUG] Login successful for user: {user.id}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Login failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
