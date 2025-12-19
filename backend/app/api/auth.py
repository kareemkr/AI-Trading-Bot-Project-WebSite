from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Fake DB
users_db = {
    "kareem@gmail.com": {
        "password": b"$2b$12$n8yPfK30xrPjsw0a4jXqru/5pNBFzTBvQ9QzO.VGqmt1exPqEftK6", # kareem
        "name": "Kareem Elite",
        "avatar": None,
        "subscription_status": "elite",
        "subscription_expiry": (datetime.utcnow() + timedelta(days=365)).isoformat(),
        "wallet_address": "0xNeuralFlowMaster001",
    },
    "kareem1@gmail.com": {
        "password": b"$2b$12$n8yPfK30xrPjsw0a4jXqru/5pNBFzTBvQ9QzO.VGqmt1exPqEftK6", # kareem
        "name": "Kareem Guest",
        "avatar": None,
        "subscription_status": "free",
        "wallet_address": None,
    }
}

class AuthData(BaseModel):
    email: str
    password: str
    name: str | None = None
    wallet_address: str | None = None

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

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = users_db.get(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user, email

@router.post("/signup")
async def signup(data: AuthData):
    if data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())

    users_db[data.email] = {
        "password": hashed_pw,
        "name": data.name or data.email.split("@")[0],
        "avatar": None,
        "subscription_status": "free",  # Default to free
        "wallet_address": None
    }

    return {
        "message": "User registered successfully",
        "email": data.email,
        "name": users_db[data.email]["name"],
        "avatar": None,
        "subscription_status": "free"
    }


@router.post("/login")
async def login(data: LoginData):
    user = users_db.get(data.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.checkpw(data.password.encode(), user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check Expiration
    if user.get("subscription_status") == "premium":
        expiry_str = user.get("subscription_expiry")
        if expiry_str:
            try:
                # Naive parse, assuming isoformat
                expiry_date = datetime.fromisoformat(expiry_str)
                if datetime.utcnow() > expiry_date:
                    user["subscription_status"] = "free"
                    user["subscription_expiry"] = None
            except Exception:
                pass 

    token = create_token(data.email)

    return {
        "access_token": token,
        "token_type": "bearer",
        "email": data.email,
        "name": user["name"],
        "avatar": user.get("avatar"),
        "subscription_status": user.get("subscription_status", "free"),
    }

@router.put("/update")
async def update_profile(data: UpdateProfileRequest, current_user_data: tuple = Depends(get_current_user)):
    user, email = current_user_data
    
    if data.name:
        user["name"] = data.name
    if data.avatar:
        user["avatar"] = data.avatar
    if data.telegram_token is not None:
        user["telegram_token"] = data.telegram_token
    if data.telegram_chat_id is not None:
        user["telegram_chat_id"] = data.telegram_chat_id
    if data.binance_api_key is not None:
        user["binance_api_key"] = data.binance_api_key
    if data.binance_api_secret is not None:
        user["binance_api_secret"] = data.binance_api_secret
    if data.auto_trade_confirmation is not None:
        user["auto_trade_confirmation"] = data.auto_trade_confirmation
    if data.risk_management_alerts is not None:
        user["risk_management_alerts"] = data.risk_management_alerts
    if data.news_analysis_ai is not None:
        user["news_analysis_ai"] = data.news_analysis_ai
    
    users_db[email] = user
    
    return {
        "message": "Profile updated",
        "name": user["name"],
        "avatar": user["avatar"],
        "telegram_token": user.get("telegram_token"),
        "telegram_chat_id": user.get("telegram_chat_id"),
        "binance_api_key": user.get("binance_api_key"),
        "binance_api_secret": user.get("binance_api_secret"),
        "auto_trade_confirmation": user.get("auto_trade_confirmation"),
        "risk_management_alerts": user.get("risk_management_alerts"),
        "news_analysis_ai": user.get("news_analysis_ai")
    }
