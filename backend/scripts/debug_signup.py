import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import AsyncSessionLocal
from app.crud.users import create_user, get_user_by_email
from app.schemas import UserCreate
from app.models.wallet import Wallet
import random

async def test_signup():
    email = f"test_{random.randint(0,100000)}@test.com"
    data = UserCreate(email=email, password="password123")
    
    async with AsyncSessionLocal() as db:
        print(f"Testing signup for {email}...")
        try:
            # 1. Check existing
            existing = await get_user_by_email(db, data.email)
            print(f"Existing check: {existing}")
            
            # 2. Create user
            new_user = await create_user(db, data)
            print(f"User created: ID={new_user.id}, email={new_user.email}")
            
            # 3. Create wallet
            new_wallet = Wallet(
                user_id=new_user.id,
                currency="USDT",
                balance=0
            )
            db.add(new_wallet)
            await db.commit()
            print("Wallet created and committed.")
            
            print("Signup logic SUCCESSFUL.")
        except Exception as e:
            print(f"❌ Signup logic FAILED: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_signup())
