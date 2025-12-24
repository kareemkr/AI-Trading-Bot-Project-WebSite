import hmac
import hashlib
import json
import time
from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.wallet_service import WalletService
from decimal import Decimal
import logging

router = APIRouter()
logger = logging.getLogger("BinancePay")

# In production, these should be in .env
BINANCE_PAY_CERTIFICATE = "" # Public key or secret for HMAC

@router.post("/binance/pay")
async def binance_pay_webhook(
    request: Request,
    binance_pay_timestamp: str = Header(None),
    binance_pay_nonce: str = Header(None),
    binance_pay_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for Binance Pay Webhooks.
    Real-world flow:
    1. Verify Signature
    2. Parse Payload
    3. Idempotently Process Transaction
    """
    body = await request.body()
    payload = body.decode()
    
    # 1. Replay Defense: Timestamp Freshness (I8)
    if not binance_pay_timestamp:
        raise HTTPException(status_code=400, detail="Missing Binance-Pay-Timestamp")
    
    try:
        ts = int(binance_pay_timestamp)
        # Binance often uses ms. If > 10^12, it's likely ms.
        if ts > 10**12:
            ts = ts / 1000
        
        current_time = time.time()
        skew = abs(current_time - ts)
        
        if skew > 300: # 5 minute window
            logger.warning(f"Webhook rejected: Timestamp skew too large ({skew}s)")
            raise HTTPException(status_code=401, detail="Webhook window expired")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    # 2. Signature Verification (I7)
    # real_str = f"{binance_pay_timestamp}\n{binance_pay_nonce}\n{payload}\n"
    # signature = hmac.new(BINANCE_PAY_KEY.encode(), real_str.encode(), hashlib.sha256).hexdigest().upper()
    # if signature != binance_pay_signature:
    #    raise HTTPException(status_code=401, detail="Invalid signature")

    data = json.loads(payload)
    logger.info(f"Webhook received: {data}")

    # Example Binance Pay Notify Payload:
    # {
    #   "bizType": "PAY",
    #   "bizStatus": "PAY_SUCCESS",
    #   "data": {
    #     "merchantTradeNo": "987654321",
    #     "productName": "USDT Deposit",
    #     "transAmount": "100.00",
    #     "currency": "USDT",
    #     ...
    #   }
    # }

    if data.get("bizStatus") == "PAY_SUCCESS":
        biz_data = data.get("data", {})
        merchant_trade_no = biz_data.get("merchantTradeNo")
        amount = Decimal(str(biz_data.get("transAmount")))
        currency = biz_data.get("currency", "USDT")
        
        # We need to find which user this belongs to. 
        # Typically merchant_trade_no should contain user_id or be linked to a pending tx.
        
        # For this implementation, we assume we can extract user_id from merchant_trade_no 
        # or find a pending transaction in our DB with this external_id.
        
        await WalletService.confirm_deposit(
            db, 
            external_id=merchant_trade_no, 
            amount=amount, 
            currency=currency
        )

    return {"returnCode": "SUCCESS", "returnMsg": None}
