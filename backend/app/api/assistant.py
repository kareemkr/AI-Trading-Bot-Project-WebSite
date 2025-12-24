from fastapi import APIRouter
import os
from pydantic import BaseModel
from huggingface_hub import InferenceClient

router = APIRouter(prefix="/assistant", tags=["Assistant"])

HF_TOKEN = "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"
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

print(f"DEBUG: Loaded HF_TOKEN...{HF_TOKEN[-6:]}")

client = InferenceClient(token=HF_TOKEN)

class AssistantRequest(BaseModel):
    message: str
    mode: str = "trading"  # "trading" or "guide"

@router.post("/chat")
async def chat(req: AssistantRequest):

    system_msg = ""

    # --------------------------
    # PLATFORM GUIDE MODE
    # --------------------------
    if req.mode == "guide":
        system_msg = (
            "You are the Neural Flow Platform Guide. Be extremely concise (max 2 sentences). "
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
            signal = news_ai.get_signal()
            news_context = f" SENTIMENT: {signal}. "

        system_msg = (
            "You are NeuralFlow Assistant. Be extremely concise (max 30 words). "
            "Technical style." + news_context
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
