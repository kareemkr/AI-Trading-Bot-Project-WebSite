import os
import asyncio
import httpx
from datetime import datetime, timezone
import sqlite3
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# ========== CONFIG ==========
X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")

# ========== BASIC X CALL ==========
async def test_x_post():
    if not X_BEARER_TOKEN:
        print("⚠️  MISSING: X_BEARER_TOKEN not found in .env. Skipping X test.")
        return []

    print(f"Testing X API with token starting with: {X_BEARER_TOKEN[:8]}...")
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                "https://api.x.com/2/tweets/search/recent",
                params={"query": "bitcoin lang:en", "max_results": 10},
                headers={"Authorization": f"Bearer {X_BEARER_TOKEN}"},
                timeout=10.0,
            )
            r.raise_for_status()
            data = r.json()
            return data.get("data", [])
        except Exception as e:
            print(f"❌ X API Connection Failed: {e}")
            return []

# ========== BASIC CryptoCompare CALL ==========
async def test_cryptocompare():
    print("Testing CryptoCompare News API...")
    async with httpx.AsyncClient() as client:
        try:
            # Basic news doesn't strictly need a key for small volume
            r = await client.get("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", timeout=5.0)
            r.raise_for_status()
            data = r.json()
            news = data.get("Data", [])
            return news
        except Exception as e:
            print(f"❌ CryptoCompare Connection Failed: {e}")
            return []

# ========== BASIC DATABASE TEST ==========
def init_db():
    conn = sqlite3.connect("signals_test.db")
    conn.execute("""
    CREATE TABLE IF NOT EXISTS test_events (
        id TEXT PRIMARY KEY,
        content TEXT,
        created_at TEXT
    );
    """)
    conn.commit()
    conn.close()

def save_event(idv, content, ts):
    conn = sqlite3.connect("signals_test.db")
    conn.execute(
        "INSERT OR REPLACE INTO test_events (id, content, created_at) VALUES (?, ?, ?);",
        (idv, content, ts)
    )
    conn.commit()
    conn.close()

# ========== MAIN RUN ==========
async def main():
    print("\n=== STARTING SIGNAL ENGINE CONNECTIVITY TEST ===")
    
    print("\n[PART 1: X API]")
    posts = await test_x_post()
    if posts: print(f"✅ Returned {len(posts)} posts from X — SUCCESS.")

    print("\n[PART 2: CryptoCompare]")
    news = await test_cryptocompare()
    if news: print(f"✅ Returned {len(news)} news items — SUCCESS.")

    print("\n[PART 3: Database]")
    init_db()
    if posts:
        first = posts[0]
        save_event(first.get("id", "unknown"), first.get("text", "")[:120], datetime.now(timezone.utc).isoformat())
        print("✅ Saved X post to signals_test.db — SUCCESS.")
    elif news:
        first = news[0]
        save_event(f"CC_{first.get('id', 'unknown')}", first.get('title', '')[:120], datetime.now(timezone.utc).isoformat())
        print("✅ Saved News item to signals_test.db — SUCCESS.")
    else:
        print("⚠️  Skipping DB save (no data available to save).")

    print("\n=== STEP 4 COMPLETE — CHECK RESULTS ABOVE ===")

if __name__ == "__main__":
    asyncio.run(main())
