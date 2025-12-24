import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
sys.path.append(os.getcwd())

from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.user import User

async def run():
    async with AsyncSessionLocal() as s:
        res = await s.execute(select(User))
        users = res.scalars().all()
        print("Users in database:")
        for u in users:
            print(f"- {u.email} (Status: {u.subscription_status}, ID: {u.id})")

if __name__ == "__main__":
    asyncio.run(run())
