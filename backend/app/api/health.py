from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database.session import get_db

router = APIRouter(prefix="/health", tags=["System"])

@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Check if the API and database are up and running.
    """
    try:
        # Perform a simple database query to verify connection
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }
