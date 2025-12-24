import asyncio
import os
import sys
from sqlalchemy import select

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.user import User

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == 'kareem@gmail.com'))
        user = res.scalars().one_or_none()
        if user:
            print(f"USER: {user.email}, STATUS: {user.subscription_status}, ADMIN: {user.is_admin}")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(check())
