import asyncio
import os
import sys
from passlib.context import CryptContext

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.database.session import AsyncSessionLocal, Base, engine
from app.models.user import User
from app.models.wallet import Wallet
from app.models.bot import BotTradeRecord
from sqlalchemy import select

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def init_db():
    print("Creating tables if they don't exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("Initializing Database with default user...")
    async with AsyncSessionLocal() as db:
        # Check if user exists
        from sqlalchemy import select
        res = await db.execute(select(User).where(User.email == "test@example.com"))
        user = res.scalars().first()
        
        if not user:
            print("Creating 'Kareem Elite' user...")
            hashed_pw = pwd_context.hash("password")
            user = User(
                email="test@example.com",
                hashed_password=hashed_pw,
                name="Kareem Elite",
                subscription_status="elite"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"User created with ID: {user.id}")
            
            # Add default wallet
            wallet = Wallet(user_id=user.id, currency="USDT", balance=10000.0)
            db.add(wallet)
            await db.commit()
            print("Default wallet created.")
        else:
            print("User already exists.")
            # Ensure they are elite for testing
            user.subscription_status = "elite"
            await db.commit()
            print("User status verified.")

if __name__ == "__main__":
    asyncio.run(init_db())
