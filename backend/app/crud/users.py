from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas import UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def create_user(db: AsyncSession, user_data: UserCreate):
    hashed_password = pwd_context.hash(user_data.password)
    db_user = User(
        email=user_data.email, 
        hashed_password=hashed_password,
        name=user_data.name or user_data.email.split("@")[0]
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
