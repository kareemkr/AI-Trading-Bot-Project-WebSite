from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "ai_bot_platform")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def get_user_collection():
    return db["users"]

async def get_bot_logs_collection():
    return db["bot_logs"]

async def get_models_collection():
    return db["models"]

async def save_log(log: dict):
    try:
        await db["bot_logs"].insert_one(log)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")
