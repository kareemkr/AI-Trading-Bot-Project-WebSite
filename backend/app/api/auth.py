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
        "name": "kareem",
        "avatar": None,
        "subscription_status": "premium",
        "subscription_expiry": (datetime.utcnow() + timedelta(days=365)).isoformat(),
        "wallet_address": "0xTestUserWallet"
    }
}  # email -> {password, name}

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
    
    users_db[email] = user
    
    return {
        "message": "Profile updated",
        "name": user["name"],
        "avatar": user["avatar"]
    }
