from fastapi import APIRouter
from pydantic import BaseModel
from huggingface_hub import InferenceClient

router = APIRouter(prefix="/assistant", tags=["Assistant"])
import os
HF_TOKEN = os.getenv("HF_TOKEN")


# This model fully supports chat_completion with no provider parameter
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

client = InferenceClient(token=HF_TOKEN)

class AssistantRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(req: AssistantRequest):

    messages = [
        {"role": "system", "content": "You are K-Trader, a friendly crypto trading assistant."},
        {"role": "user", "content": req.message}
    ]

    response = client.chat_completion(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=200,
        temperature=0.5
    )

    reply = response.choices[0].message["content"]

    return {"reply": reply}
