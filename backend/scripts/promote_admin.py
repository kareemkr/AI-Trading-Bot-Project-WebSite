import asyncio
import os
import sys
from sqlalchemy import update

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.user import User

async def promote_to_admin(email: str):
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(User)
            .where(User.email == email)
            .values(is_admin=True)
        )
        await db.commit()
        print(f"✅ User {email} promoted to ADMIN.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
    else:
        asyncio.run(promote_to_admin(sys.argv[1]))
