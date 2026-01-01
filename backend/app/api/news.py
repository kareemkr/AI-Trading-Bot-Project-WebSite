from fastapi import APIRouter, Depends
from app.services.news_service import news_ai
from typing import List, Dict

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/latest")
async def get_latest_news():
    news = await news_ai.fetch_market_news()
    sig_data = news_ai.get_signal()
    return {
        "news": news,
        "aggregate_sentiment": news_ai.sentiment_score,
        "signal": sig_data["signal"],
        "confidence": sig_data["confidence"],
        "drivers": sig_data["drivers"]
    }

@router.get("/status")
async def get_news_status():
    sig_data = news_ai.get_signal()
    return {
        "status": "Operational",
        "engine": "Neural Sentiment V1",
        "sentiment_score": news_ai.sentiment_score,
        "last_signal": sig_data["signal"],
        "signal_data": sig_data,
        "current_session": await news_ai.check_trading_window()
    }

@router.get("/logs")
async def get_news_logs():
    from app.services.bot_manager import bot_manager
    return {"logs": bot_manager.get_news_logs()}
