from fastapi import APIRouter, Depends
from app.services.news_service import news_ai
from typing import List, Dict

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/latest")
async def get_latest_news():
    news = await news_ai.fetch_market_news()
    return {
        "news": news,
        "aggregate_sentiment": news_ai.sentiment_score,
        "signal": news_ai.get_signal()
    }

@router.get("/status")
async def get_news_status():
    return {
        "status": "Operational",
        "engine": "Neural Sentiment V1",
        "last_signal": news_ai.get_signal(),
        "current_session": await news_ai.check_trading_window()
    }
