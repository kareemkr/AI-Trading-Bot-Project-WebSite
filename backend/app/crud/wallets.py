from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.wallet import Wallet

async def get_wallets(db: AsyncSession, user_id: int):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    return result.scalars().all()

async def get_wallet_by_currency(db: AsyncSession, user_id: int, currency: str):
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id, Wallet.currency == currency)
    )
    return result.scalars().first()
