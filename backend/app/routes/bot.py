from fastapi import APIRouter
from app.services.bot_manager import bot_manager


router = APIRouter(prefix="/bot", tags=["Trading Bot"])

@router.post("/start")
def start_bot():
    if bot_manager.engine is None:
        return {"message": "Engine not configured."}

    return {"message": bot_manager.start_bot()}

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