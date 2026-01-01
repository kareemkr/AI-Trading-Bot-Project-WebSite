from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
import shutil
import uuid
import os
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas import UserCreate, UserRead, UserBase
from app.crud.users import create_user, get_user_by_email, pwd_context
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    # In production, we should raise an error. For now, we'll log a warning.
    import logging
    logging.warning("JWT_SECRET not found in environment variables. Using insecure default.")
    SECRET_KEY = "SUPER_SECRET_KEY_CHANGEME_PROD"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class LoginData(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    avatar: str | None = None
    telegram_token: str | None = None
    telegram_chat_id: str | None = None
    binance_api_key: str | None = None
    binance_api_secret: str | None = None
    auto_trade_confirmation: bool | None = None
    risk_management_alerts: bool | None = None

def create_token(email: str):
    payload = {
        "sub": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    print(f"DEBUG: Validating token: {token[:10]}...") 
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            print("DEBUG: Token has no sub field")
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        print("DEBUG: Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await get_user_by_email(db, email)
    if user is None:
        print(f"DEBUG: User not found for email: {email}")
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_admin(user: User = Depends(get_current_user)) -> User:
    """
    Dependency to restrict access to admin-users only.
    """
    if not getattr(user, "is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="The user does not have enough privileges"
        )
    return user

@router.post("/register", response_model=UserRead)
@router.post("/signup", response_model=UserRead) # Maintain compatibility with previous endpoints
async def signup(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = await create_user(db, data)

    # Automatically create a default USDT wallet for the user
    new_wallet = Wallet(
        user_id=new_user.id,
        currency="USDT",
        balance=0
    )
    db.add(new_wallet)
    await db.commit()

    return new_user

@router.post("/login")
async def login(data: LoginData, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, data.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not pwd_context.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check Expiration
    if user.subscription_status == "premium" and user.subscription_expiry:
        if datetime.utcnow() > user.subscription_expiry:
            user.subscription_status = "free"
            user.subscription_expiry = None
            await db.commit()

    token = create_token(user.email)

    return {
        "access_token": token,
        "token_type": "bearer",
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar,
        "subscription_status": user.subscription_status,
    }

@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)):
    return user

@router.put("/update")
async def update_profile(
    name: str | None = Form(None),
    avatar: UploadFile | None = File(None),
    telegram_token: str | None = Form(None),
    telegram_chat_id: str | None = Form(None),
    binance_api_key: str | None = Form(None),
    binance_api_secret: str | None = Form(None),
    auto_trade_confirmation: bool | None = Form(None),
    risk_management_alerts: bool | None = Form(None),
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if name:
        user.name = name
    
    if avatar:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads/avatars", exist_ok=True)
        
        # Security: unique filename
        file_ext = os.path.splitext(avatar.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"uploads/avatars/{unique_filename}"
        
        # Delete old avatar if it exists locally
        if user.avatar and user.avatar.startswith("/uploads/"):
            old_path = user.avatar.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)
        
        # Save new file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)
            
        user.avatar = f"/{file_path}"

    if telegram_token is not None:
        user.telegram_token = telegram_token
    if telegram_chat_id is not None:
        user.telegram_chat_id = telegram_chat_id
    if binance_api_key is not None:
        user.binance_api_key = binance_api_key
    if binance_api_secret is not None:
        user.binance_api_secret = binance_api_secret
    if auto_trade_confirmation is not None:
        user.auto_trade_confirmation = auto_trade_confirmation
    if risk_management_alerts is not None:
        user.risk_management_alerts = risk_management_alerts
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "Profile updated",
        "name": user.name,
        "avatar": user.avatar,
        "telegram_token": user.telegram_token,
        "telegram_chat_id": user.telegram_chat_id,
        "binance_api_key": user.binance_api_key,
        "binance_api_secret": user.binance_api_secret,
        "auto_trade_confirmation": user.auto_trade_confirmation,
        "risk_management_alerts": user.risk_management_alerts
    }
