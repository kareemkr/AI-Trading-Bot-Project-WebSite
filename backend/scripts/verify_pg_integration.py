import asyncio
import os
import sys
from datetime import datetime, timezone

# Add parent dir to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import AsyncSessionLocal
from app.models.bot import BotLog, BotTradeRecord, Signal
from app.services.bot_manager import bot_manager
from app.services.trade_simulator import TradeSim

async def verify_integration():
    print("--- Verifying PostgreSQL Integration ---")
    
    # 1. Test BotManager Logging
    print("Testing BotManager logging...")
    bot_manager.log("Integration verification started", level="DEBUG")
    await asyncio.sleep(1) # Allow background task to finish
    
    # 2. Test TradeSim Recording
    print("Testing TradeSim recording...")
    sim = TradeSim()
    await sim.record("BTCUSDT", "BUY", 0.95, 0.8, price=45000.0, qty=0.1)
    
    # 3. Verify Database Entries
    print("Verifying database entries...")
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        
        # Check logs
        logs = await db.execute(select(BotLog).order_by(BotLog.timestamp.desc()).limit(1))
        log_entry = logs.scalar_one_or_none()
        if log_entry:
            print(f"✅ Log found: [{log_entry.timestamp}] {log_entry.message}")
        else:
            print("❌ No log entry found!")

        # Check trades
        trades = await db.execute(select(BotTradeRecord).order_by(BotTradeRecord.timestamp.desc()).limit(1))
        trade_entry = trades.scalar_one_or_none()
        if trade_entry:
            print(f"✅ Trade record found: {trade_entry.symbol} {trade_entry.action} @ {trade_entry.price}")
        else:
            print("❌ No trade record found!")

async def main():
    try:
        await verify_integration()
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
