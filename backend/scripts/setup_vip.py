import asyncio
import os
import sys
from sqlalchemy import select

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.wallet import Wallet
from app.crud.users import pwd_context

async def setup_vip():
    email = "kareem@gmail.com"
    password = "kareem"
    
    print(f"--- SETTING UP VIP ACCOUNT: {email} ---")
    async with AsyncSessionLocal() as db:
        # 1. Find or create user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().one_or_none()
        
        hashed_pw = pwd_context.hash(password)
        
        if not user:
            print("Creating new user...")
            user = User(
                email=email,
                hashed_password=hashed_pw,
                name="Kareem",
                is_admin=True,
                subscription_status="elite"
            )
            db.add(user)
        else:
            print("Updating existing user...")
            user.hashed_password = hashed_pw
            user.is_admin = True
            user.subscription_status = "elite"
            user.name = "Kareem"
        
        await db.flush()
        
        # 2. Ensure Wallet exists
        res_wallet = await db.execute(select(Wallet).where(Wallet.user_id == user.id, Wallet.currency == "USDT"))
        wallet = res_wallet.scalars().one_or_none()
        
        if not wallet:
            print("Initializing wallet...")
            wallet = Wallet(user_id=user.id, currency="USDT", balance=0, locked_balance=0)
            db.add(wallet)
            
        await db.commit()
        print(f"✅ Success! Account {email} is now an ADMIN with PREMIUM status.")

if __name__ == "__main__":
    asyncio.run(setup_vip())
