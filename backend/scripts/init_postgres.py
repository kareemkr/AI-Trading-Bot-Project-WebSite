import asyncio
from app.database.session import engine, Base
from app.models.user import User
from app.models.wallet import Wallet, Transaction, LedgerEntry

async def init_db():
    async with engine.begin() as conn:
        # Warning: This drops all tables! Only for initial setup.
        # await conn.run_sync(Base.metadata.drop_all)
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialized.")

if __name__ == "__main__":
    asyncio.run(init_db())
