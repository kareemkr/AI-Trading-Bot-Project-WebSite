from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.bot import BotTradeRecord
from app.database.session import AsyncSessionLocal
from decimal import Decimal

class TradeSim:
    """
    Handles background recording of trade signals and executions.
    Refactored to use PostgreSQL via SQLAlchemy.
    """
    
    async def record(self, coin: str, action: str, strength: float, sentiment: float, price: float = 0, qty: float = 0):
        async with AsyncSessionLocal() as db:
            trade = BotTradeRecord(
                symbol=coin,
                action=action,
                strength=strength,
                sentiment=sentiment,
                price=Decimal(str(price)),
                quantity=Decimal(str(qty)),
                timestamp=datetime.now(timezone.utc)
            )
            db.add(trade)
            await db.commit()

    async def last(self, n=20):
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(BotTradeRecord)
                .order_by(BotTradeRecord.timestamp.desc())
                .limit(n)
            )
            trades = result.scalars().all()
            return [
                {
                    "coin": t.symbol,
                    "action": t.action,
                    "strength": t.strength,
                    "sentiment": t.sentiment,
                    "price": float(t.price) if t.price else 0,
                    "timestamp": t.timestamp.isoformat()
                }
                for t in trades
            ]
