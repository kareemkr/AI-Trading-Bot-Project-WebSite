import asyncio
import asyncpg
import sys

async def test_conn(host):
    url = f"postgresql://postgres:Khammed9i@{host}:5433/ai_trading_bot"
    print(f"Testing {host}...")
    try:
        conn = await asyncpg.connect(url)
        print(f"✅ Success with {host}!")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Failed with {host}: {e}")
        return False

async def main():
    if not await test_conn("localhost"):
        await test_conn("127.0.0.1")

if __name__ == "__main__":
    asyncio.run(main())
