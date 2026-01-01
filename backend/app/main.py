import os
import json
import sqlite3
import logging
import asyncio
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import select
from app.models.bot import BotTradeRecord

from app.api.auth import router as auth_router
from app.api.assistant import router as assistant_router
from app.api.oauth import router as oauth_router
from app.api.payment import router as payment_router
from app.api.news import router as news_router
from app.api.webhooks import router as webhooks_router
from app.api.logs import router as logs_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router

from app.routes import auth, bot, status, account
from app.services.trade_simulator import TradeSim
from app.database.session import AsyncSessionLocal
load_dotenv()

# --- ENVIRONMENT & SECURITY HARDENING (Phase 9) ---
ENV = os.getenv("ENV", "development").lower()
is_production = ENV == "production"

# In production, the kill switch defaults to ON for safety.
PLATFORM_KILL_SWITCH = is_production 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# SILENCE SQLAlchemy ENGINE LOGS (Huge improvement)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING) # Reduce REQ/RES noise

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Log startup
    from app.services.bot_manager import bot_manager
    bot_manager.log("Initializing AI Trading Bot Backend...")
    try:
        from app.services.bot_manager import bot_manager
        from app.ml.engine import RealTradingBot
        from app.services.news_service import news_ai
        
        # Initialize engine and attach to manager
        loop = asyncio.get_running_loop()
        bot_manager.set_loop(loop)
        
        engine = RealTradingBot()
        engine.set_logger(bot_manager.log)
        news_ai.set_logger(bot_manager.log)
        bot_manager.set_engine(engine)
        bot_manager.log("✅ RealTradingBot Engine Integrated & Thread-Safe Loop Captured")
    except Exception as e:
        bot_manager.log(f"❌ Engine initialization failed: {e}", level="ERROR")
        
    # Start News AI in background
    news_task = asyncio.create_task(news_ai.run())
    bot_manager.log("✅ News AI Neural Engine Activated")

    yield
    
    # Log shutdown
    logger.info("Shutting down AI Trading Bot Backend...")
    await news_ai.close()
    news_task.cancel()

app = FastAPI(
    title="AI Trading Bot Backend",
    version="1.0",
    lifespan=lifespan,
    docs_url="/docs" if not is_production else None,
    redoc_url="/redoc" if not is_production else None,
    openapi_url="/openapi.json" if not is_production else None
)

# --- STATIC FILES (Phase 10: Professional Storage) ---
UPLOAD_DIR = "uploads"
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------------
# MIDDLEWARE
# ---------------------

@app.middleware("http")
async def safety_and_rate_limit_middleware(request: Request, call_next):
    # 1. Kill Switch Check
    if PLATFORM_KILL_SWITCH and request.url.path.startswith("/api") and not request.url.path.startswith("/api/admin"):
        # Allow admin routes to stay accessible so we can toggle the switch off.
        # Allow auth so admins can log in.
        if "/auth" not in request.url.path and "/status" not in request.url.path:
            return JSONResponse(
                status_code=503,
                content={"detail": "PLATFORM_EMERGENCY_HALT: All trading and financial mutations are disabled."}
            )
    
    # Simple production header security (Phase 9)
    response = await call_next(request)
    if is_production:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# CORS configuration
if is_production:
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
    # If not set, default to something safe or keep empty to force config
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://192.168.56.1:3000",
        "http://192.168.56.1:3001"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET") or ("DEV_SECRET" if not is_production else None)
)
if is_production and not os.getenv("SESSION_SECRET"):
    logger.error("❌ SESSION_SECRET not set in production! Session middleware might fail.")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"REQ: {request.method} {request.url}")
    res = await call_next(request)
    logger.info(f"RES: {res.status_code}")
    return res

# ---------------------
# ROUTES
# ---------------------
app.include_router(auth_router, tags=["Auth API"])
app.include_router(assistant_router, tags=["Assistant"])
app.include_router(oauth_router, tags=["OAuth"])
app.include_router(payment_router, tags=["Payment"])
app.include_router(news_router, tags=["News"])
app.include_router(webhooks_router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(health_router, tags=["System"])

app.include_router(bot.router, tags=["Bot"])
app.include_router(status.router, tags=["Status"])
app.include_router(account.router, tags=["Account"])

# ---------------------
# DATABASE VIEW
# ---------------------
@app.get("/trading/history")
async def get_trading_history():
    """
    Fetch unified trading history from PostgreSQL.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(BotTradeRecord).order_by(BotTradeRecord.timestamp.desc()).limit(50)
        )
        history = result.scalars().all()
        return [
            {
                "coin": t.symbol,
                "action": t.action,
                "strength": float(t.strength) if t.strength else 0,
                "sentiment": float(t.sentiment) if t.sentiment else 0,
                "price": float(t.price) if t.price else 0,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None
            }
            for t in history
        ]

# ---------------------
# TRADING HISTORY
# ---------------------
sim = TradeSim()

@app.get("/trading/last")
async def trading_last():
    return await sim.last(20)

@app.get("/news/alpha")
def news_alpha():
    from app.services.news_service import news_ai
    return news_ai.alpha_events
