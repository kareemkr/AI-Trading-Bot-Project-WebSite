from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.session import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.wallet import Wallet, Transaction
from app.services.wallet_service import wallet_service
from app.schemas import WalletRead, WithdrawalCreate, WithdrawalRead
from decimal import Decimal
from typing import List

router = APIRouter(prefix="/wallets", tags=["Wallets"])

@router.get("/balance")
async def get_balance(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wallet = await wallet_service.get_wallet(db, user.id)
    return {
        "balance": wallet.balance,
        "currency": wallet.currency,
        "locked": wallet.locked_balance,
        "user_id": user.id
    }

@router.post("/withdraw", response_model=WithdrawalRead)
async def request_withdrawal(
    data: WithdrawalCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    request = await wallet_service.create_withdrawal_request(
        db, user.id, data.amount, data.address, data.currency
    )
    return request

@router.get("/history/transactions")
async def get_transactions(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    wallet = await wallet_service.get_wallet(db, user.id)
    result = await db.execute(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    transactions = result.scalars().all()
    return transactions
