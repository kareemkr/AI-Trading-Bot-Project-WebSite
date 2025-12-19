from fastapi import APIRouter
from pydantic import BaseModel
from huggingface_hub import InferenceClient

router = APIRouter(prefix="/assistant", tags=["Assistant"])

HF_TOKEN = "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"
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

client = InferenceClient(token=HF_TOKEN)

class AssistantRequest(BaseModel):
    message: str
    mode: str = "trading"  # "trading" or "guide"

@router.post("/chat")
async def chat(req: AssistantRequest):
    system_msg = ""
    
    if req.mode == "guide":
        # Platform Guide Persona
        system_msg = (
            "You are the Neural Flow Platform Guide. Your goal is to help users navigate the website, "
            "understand the features, and upgrade their accounts. "
            "You effectively act as a support agent and tour guide. "
            "Key info:\n"
            "- Dashboard: The main hub for stats.\n"
            "- Live Bot: Where automated trading happens (requires Elite plan).\n"
            "- Market: Market intelligence and signals (requires Pro/Elite).\n"
            "- Subscriptions: Where users upgrade plans.\n"
            "- If a user asks how to trade, guide them to the 'Live Bot' page but mention they need a subscription.\n"
            "Be helpful, friendly, and concise. Do not give financial advice in this mode."
        )
    else:
        # Trading Assistant Persona (Default)
        # Fetch news sentiment to provide a more accurate market context
        from app.services.news_service import news_ai
        news_context = ""
        if any(k in req.message.lower() for k in ["news", "market", "sentiment", "trend", "btc", "crypto"]):
            await news_ai.fetch_market_news()
            news_signal = news_ai.get_signal()
            news_context = f" CURRENT MARKET NEWS SENTIMENT: {news_signal} (Neural Engine Analysis). "

        system_msg = f"You are NeuralFlow Assistant, a high-performance crypto trading AI. Be concise, institutional, and technical.{news_context}"
    
    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": req.message},
    ]

    response = client.chat_completion(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=200,
        temperature=0.7 if req.mode == "guide" else 0.5,
    )

    return {
        "reply": response.choices[0].message["content"]
    }
