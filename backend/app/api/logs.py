from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.session import get_db
from app.models.bot import BotLog
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class LogSchema(BaseModel):
    id: int
    timestamp: datetime
    level: str
    message: str
    module: Optional[str]

    class Config:
        from_attributes = True

@router.get("", response_model=List[LogSchema])
async def get_bot_logs(
    limit: int = Query(100, le=500),
    level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch bot execution logs with filtering.
    """
    stmt = select(BotLog).order_by(desc(BotLog.timestamp))
    
    if level:
        stmt = stmt.where(BotLog.level == level.upper())
    
    stmt = stmt.limit(limit)
    
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return logs
