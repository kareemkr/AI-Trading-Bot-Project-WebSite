from fastapi import APIRouter
from app.services.bot_manager import BotManager
from app.services.trading_bot import run_trading_bot
from app.services.bot_manager import BotManager

bot_manager = BotManager()  # create one global instance


router = APIRouter(prefix="/bot", tags=["bot"])

@router.post("/start")
def start_bot():
    msg = bot_manager.start_bot(run_trading_bot)
    return {"message": msg}

@router.post("/stop")
def stop_bot():
    msg = bot_manager.stop_bot()
    return {"message": msg}

@router.get("/logs")
def get_logs():
    return bot_manager.get_logs()

@router.get("/status")
def get_status():
    return bot_manager.get_status()
