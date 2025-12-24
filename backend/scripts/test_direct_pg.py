import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Try to find .env in current dir or parent
load_dotenv(".env")
load_dotenv("../.env")

async def test_direct():
    user = "postgres"
    password = "Khammed9i"
    database = "ai_trading_bot"
    host = "localhost"
    port = "5433"
    
    print(f"Testing direct asyncpg connection to {host}:{port} as {user}...")
    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database=database,
            host=host,
            port=port
        )
        print("✅ Direct connection SUCCESSFUL!")
        await conn.close()
    except Exception as e:
        print(f"❌ Direct connection FAILED: {e}")

    url = os.getenv("DATABASE_URL")
    print(f"Testing connection using DATABASE_URL from env: {url}")
    if url:
        try:
            conn = await asyncpg.connect(url)
            print("✅ URL connection SUCCESSFUL!")
            await conn.close()
        except Exception as e:
            print(f"❌ URL connection FAILED: {e}")
    else:
        print("No DATABASE_URL found in env.")

if __name__ == "__main__":
    asyncio.run(test_direct())
