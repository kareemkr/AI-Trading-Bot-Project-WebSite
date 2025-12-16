from fastapi import APIRouter, Body
from app.services.bot_manager import bot_manager
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/bot", tags=["Trading Bot"])

class BotStartRequest(BaseModel):
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    leverage: int = 1

@router.post("/start")
def start_bot(request: BotStartRequest):
    if bot_manager.engine is None:
        return {"message": "Engine not configured."}

    return {"message": bot_manager.start_bot(request.api_key, request.api_secret, request.leverage)}

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