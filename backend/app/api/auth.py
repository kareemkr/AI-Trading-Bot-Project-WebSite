from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import bcrypt

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = "SUPER_SECRET_KEY"   # move to ENV later
ALGORITHM = "HS256"

# Fake DB (Replace with MongoDB/SQL later)
users_db = {}

class AuthData(BaseModel):
    email: str
    password: str


def create_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup")
async def signup(data: AuthData):
    if data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt())

    users_db[data.email] = hashed_pw

    return {"message": "User registered successfully"}


@router.post("/login")
async def login(data: AuthData):
    if data.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored_hash = users_db[data.email]

    if not bcrypt.checkpw(data.password.encode(), stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(data.email)

    return {"access_token": token, "token_type": "bearer"}
