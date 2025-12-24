import asyncio
import os
import sys

# Add the current directory to sys.path so we can import 'app'
# Assuming we run this from the 'backend' directory
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from app.models.user import User

# Use the exact URL we think is being used
DB_URL = "postgresql+asyncpg://postgres:Khammed9i@localhost:5433/ai_trading_bot"

async def diagnose_db():
    print(f"Diagnosing DB Connection: {DB_URL}")
    try:
        # 1. Try connect
        engine = create_async_engine(DB_URL, echo=False)
        async with engine.connect() as conn:
            print("✅ Connection Successful!")
            
            # 2. Check Version
            res = await conn.execute(text("SELECT version()"))
            print(f"✅ DB Version: {res.fetchone()[0]}")
            
            # 3. Check Tables
            res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [r[0] for r in res.fetchall()]
            print(f"✅ Found Tables: {tables}")
            
            if "users" not in tables:
                print("❌ 'users' table MISSING! Migrations might not have run.")
            else:
                print("✅ 'users' table exists.")

    except Exception as e:
        print(f"❌ Connection FAILED: {e}")
        # Try to diagnose detailed error
        if "Connection refused" in str(e):
             print(">> check if Postgres is running on port 5433")
        elif "password authentication failed" in str(e):
             print(">> check password in .env or session.py")
        elif 'database "ai_trading_bot" does not exist' in str(e):
             print(">> Database missing. Try creating it.")

if __name__ == "__main__":
    asyncio.run(diagnose_db())
