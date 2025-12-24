from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.crud.users import get_user_by_email
from datetime import datetime, timedelta

router = APIRouter(prefix="/payment", tags=["Payment"])

class CryptoConfirmData(BaseModel):
    email: str
    tx_hash: str
    wallet_address: str
    plan_name: str # "pro" or "elite"
    duration: str = "monthly"

@router.post("/crypto-confirm")
async def crypto_confirm(data: CryptoConfirmData, db: AsyncSession = Depends(get_db)):
    """
    Simulates checking the blockchain for tx_hash.
    In production, you'd verify the tx on-chain (Infura/Alchemy).
    """
    user = await get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # MOCK VERIFICATION: Ensure hash is long enough to be real
    if len(data.tx_hash) < 10:
        raise HTTPException(status_code=400, detail="Invalid transaction hash")

    # Calculate Expiry
    now = datetime.utcnow()
    days = 365 if data.duration == "yearly" else 30
    expiry = now + timedelta(days=days)

    # Update User
    user.subscription_status = data.plan_name.lower()
    user.wallet_address = data.wallet_address
    user.subscription_expiry = expiry
    
    await db.commit()

    return {
        "message": f"Payment confirmed! Upgraded to {data.plan_name.capitalize()}.",
        "subscription_status": user.subscription_status
    }
