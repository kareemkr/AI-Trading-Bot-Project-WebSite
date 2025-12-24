import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def test_conn(url):
    print(f"Testing {url} ...")
    try:
        engine = create_async_engine(url)
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print(f"SUCCESS: {url}")
        return True
    except Exception as e:
        print(f"FAILED: {url} - {e}")
        return False

async def main():
    # Try default
    await test_conn("postgresql+asyncpg://postgres:postgres@localhost:5432/ai_trading_bot")
    # Try 5433
    await test_conn("postgresql+asyncpg://postgres:postgres@localhost:5433/ai_trading_bot")
    # Try env
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        await test_conn(env_url)

if __name__ == "__main__":
    asyncio.run(main())
