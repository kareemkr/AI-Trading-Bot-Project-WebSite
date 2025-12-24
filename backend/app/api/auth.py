from fastapi import APIRouter, HTTPException, Depends
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

SECRET_KEY = os.getenv("JWT_SECRET", "SUPER_SECRET_KEY")
ALGORITHM = "HS256"
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
    news_analysis_ai: bool | None = None

def create_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await get_user_by_email(db, email)
    if user is None:
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

@router.put("/update")
async def update_profile(data: UpdateProfileRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if data.name:
        user.name = data.name
    if data.avatar:
        user.avatar = data.avatar
    if data.telegram_token is not None:
        user.telegram_token = data.telegram_token
    if data.telegram_chat_id is not None:
        user.telegram_chat_id = data.telegram_chat_id
    if data.binance_api_key is not None:
        user.binance_api_key = data.binance_api_key
    if data.binance_api_secret is not None:
        user.binance_api_secret = data.binance_api_secret
    if data.auto_trade_confirmation is not None:
        user.auto_trade_confirmation = data.auto_trade_confirmation
    if data.risk_management_alerts is not None:
        user.risk_management_alerts = data.risk_management_alerts
    if data.news_analysis_ai is not None:
        user.news_analysis_ai = data.news_analysis_ai
    
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
        "risk_management_alerts": user.risk_management_alerts,
        "news_analysis_ai": user.news_analysis_ai
    }
