import asyncio
from sqlalchemy import create_engine, text

def test_sync():
    print("Testing sync connection...")
    try:
        url = "postgresql://postgres:Khammed9i@localhost:5433/ai_trading_bot"
        e = create_engine(url)
        with e.connect() as conn:
            res = conn.execute(text("SELECT version()"))
            print(f"Success! DB Version: {res.fetchone()[0]}")
    except Exception as e:
        print(f"Sync Connection Error: {e}")

if __name__ == "__main__":
    test_sync()
