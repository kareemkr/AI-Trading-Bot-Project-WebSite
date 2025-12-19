from typing import Optional
from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel
from app.api.auth import get_current_user
from app.services.bot_manager import bot_manager

router = APIRouter(prefix="/bot", tags=["Trading Bot"])

class BotStartRequest(BaseModel):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    leverage: Optional[int] = None
    use_news_ai: Optional[bool] = False

@router.post("/start")
async def start_bot(request: BotStartRequest, current_user: tuple = Depends(get_current_user)):
    user, email = current_user
    
    if bot_manager.engine is None:
        return {"message": "Engine not configured."}

    # Use keys from request if provided, or from "wallet_address" if that's how binance is linked (or env)
    # The user mentioned "connect wallet through only binance"
    # We will pass telegram config if available
    telegram_config = None
    if user.get("telegram_token") and user.get("telegram_chat_id"):
        telegram_config = {
            "token": user.get("telegram_token"),
            "chat_id": user.get("telegram_chat_id")
        }

    # Leverage from request or user profile (default 1)
    lev = request.leverage or 1

    msg = bot_manager.start_bot(
        api_key=request.api_key, 
        api_secret=request.api_secret, 
        leverage=lev,
        telegram_config=telegram_config,
        use_news_ai=request.use_news_ai
    )
    return {"message": msg}

@router.post("/stop")
def stop_bot():
    msg = bot_manager.stop_bot()
    return {"message": msg}

@router.get("/status")
def get_status():
    return bot_manager.get_status()

@router.get("/logs")
def get_logs():
    return {"logs": bot_manager.get_logs()}