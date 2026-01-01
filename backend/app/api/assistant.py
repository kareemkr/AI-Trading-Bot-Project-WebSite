from fastapi import APIRouter
import os
from pydantic import BaseModel
from huggingface_hub import InferenceClient
from datetime import datetime

router = APIRouter(prefix="/assistant", tags=["Assistant"])

HF_TOKEN = "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"
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

print(f"DEBUG: Loaded HF_TOKEN...{HF_TOKEN[-6:]}")

client = InferenceClient(token=HF_TOKEN)

WEBSITE_CONTEXT = """
NEURAL FLOW PLATFORM DOCUMENTATION:
1. **DASHBOARD**: Main command center. Shows Equity, PnL, and Active Tiers.
2. **LIVE BOT**: (Premium Only) Autonomous AI trading engine. Features:
   - "Neural Strategist" Mode: Deep market analysis.
   - Auto-Trading: Hands-free execution.
3. **DEMO BOT**: Sandbox environment. Uses fake money for strategy testing.
4. **MARKET**: Real-time charts (TradingView), sentiment analysis, and news feed.
5. **WALLET**: Deposit (USDT/BTC) and Withdraw funds. Transaction history.
6. **SUBSCRIPTIONS**:
   - "Explorer" (Free): Basic access.
   - "Elite" ($99/mo): Live Bot access, 100x leverage, Real-time Neural Stats.
"""

class AssistantRequest(BaseModel):
    message: str
    mode: str = "trading"  # "trading" or "guide"

@router.post("/chat")
async def chat(req: AssistantRequest):

    system_msg = ""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # --------------------------
    # PLATFORM GUIDE MODE
    # --------------------------
    if req.mode == "guide":
        system_msg = (
            "You are the Neural Flow Platform Guide. "
            f"Current System Time: {current_time}. "
            f"Use this context to answer user questions: {WEBSITE_CONTEXT} "
            "Be extremely concise (max 2 sentences). Professional, helpful tone. "
            "Help users navigate plan options and upgrades. DO NOT give financial advice."
        )

    # --------------------------
    # TRADING ASSISTANT MODE
    # --------------------------
    else:
        from app.services.news_service import news_ai

        news_context = ""
        if any(k in req.message.lower() for k in ["news", "market", "sentiment", "trend", "btc", "crypto"]):
            await news_ai.fetch_market_news()
            sig_data = news_ai.get_signal()
            news_context = f" SENTIMENT: {sig_data['signal']}. "

        system_msg = (
            "You are the Neural Strategist, an Elite Quantitative Trading Assistant. "
            f"Current Date/Time: {current_time}. "
            "Your goal is to provide sharp, actionable market insights with a professional, confident tone. "
            f"Context: {news_context} "
            "Do not start every message with 'Current Market Intel'. "
            "Answer the user's specific question directly. If asked 'why', explain the reasoning behind the trends. "
            "Be concise but natural. Use professional trading terminology where appropriate."
        )

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": req.message},
    ]

    response = client.chat_completion(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=100,
        temperature=0.7 if req.mode == "guide" else 0.5,
    )

    return {
        "reply": response.choices[0].message["content"]
    }
