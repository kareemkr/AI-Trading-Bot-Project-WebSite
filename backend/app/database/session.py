from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

# Load .env from the backend directory explicitly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback only if env is missing
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:Khammed9i@localhost:5433/ai_trading_bot"

print(f"DATABASE_URL DEBUG: {DATABASE_URL.split('@')[-1]}") # Log host part only for safety

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
