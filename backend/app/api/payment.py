from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.auth import users_db

from datetime import datetime, timedelta

router = APIRouter(prefix="/payment", tags=["Payment"])

class CryptoConfirmData(BaseModel):
    email: str
    tx_hash: str
    wallet_address: str
    duration: str = "monthly"

@router.post("/crypto-confirm")
async def crypto_confirm(data: CryptoConfirmData):
    """
    Simulates checking the blockchain for tx_hash.
    In production, you'd verify the tx on-chain (Infura/Alchemy).
    """
    if data.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # MOCK VERIFICATION: Ensure hash is long enough to be real
    if len(data.tx_hash) < 10:
        raise HTTPException(status_code=400, detail="Invalid transaction hash")

    # Calculate Expiry
    now = datetime.utcnow()
    days = 365 if data.duration == "yearly" else 30
    expiry = now + timedelta(days=days)

    # Update User
    users_db[data.email]["subscription_status"] = "premium"
    users_db[data.email]["wallet_address"] = data.wallet_address
    users_db[data.email]["subscription_expiry"] = expiry.isoformat()

    return {
        "message": "Payment confirmed! Upgraded to Premium.",
        "subscription_status": "premium"
    }
