import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_conn():
    url = os.getenv("DATABASE_URL")
    print(f"Testing connection to: {url}")
    # Remove the driver part for asyncpg.connect
    clean_url = url.replace("postgresql+asyncpg://", "postgresql://")
    try:
        conn = await asyncpg.connect(clean_url)
        print("✅ SUCCESS: Connected to PostgreSQL!")
        await conn.close()
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_conn())
