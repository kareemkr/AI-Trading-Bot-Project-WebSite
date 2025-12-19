from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Trading Bot Backend", version="1.0")

# -----------------------------
# CORS (MUST BE FIRST)
# -----------------------------
from fastapi import Request
import logging

# -----------------------------
# LOGGING MIDDLEWARE
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# -----------------------------
# CORS (MUST BE FIRST)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow ALL origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key="SUPER_SECRET_KEY")

# -----------------------------
# ROUTERS
# -----------------------------
from app.api.auth import router as auth_router
from app.api.assistant import router as assistant_router
from app.api.oauth import router as oauth_router
from app.api.payment import router as payment_router
from app.api.news import router as news_router
from app.routes import auth, bot, status, account

app.include_router(auth_router)
app.include_router(assistant_router)
app.include_router(oauth_router)
app.include_router(payment_router)
app.include_router(news_router)
app.include_router(auth.router)
app.include_router(bot.router)
app.include_router(status.router)
app.include_router(account.router)

# -----------------------------
# ROOT
# -----------------------------
@app.on_event("startup")
async def startup_event():
    from app.services.bot_manager import bot_manager
    from app.ml.engine import RealTradingBot
    
    # Initialize Engine
    engine = RealTradingBot()
    
    # Hook up logging
    engine.set_logger(bot_manager.log)
    
    # Set engine in manager
    bot_manager.set_engine(engine)
    logger.info("RealTradingBot initialized and attached to BotManager")

@app.get("/")
def root():
    return {"message": "Backend is running"}

# -----------------------------
# STEP 14: Trading History Endpoint
# -----------------------------
import sqlite3

@app.get("/trading/history")
async def get_trading_history():
    try:
        c = sqlite3.connect("signals_v2.db")
        # heuristic_score, source, created_at, targets_json
        rows = c.execute("SELECT heuristic_score, source, created_at, targets_json FROM events ORDER BY created_at DESC LIMIT 100").fetchall()
        c.close()
        
        results = []
        for r in rows:
            import json
            try:
                coin = json.loads(r[3])[0] if r[3] else "MARKET"
            except:
                coin = "MARKET"
                
            results.append({
                "sentiment": round(r[0], 2),
                "source": r[1],
                "timestamp": r[2],
                "coin": coin
            })
        return results
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# STEP 15: Trade Simulator Endpoint
# -----------------------------
from app.services.trade_simulator import TradeSim
sim = TradeSim()

@app.get("/trading/last")
async def get_last_trades():
    return sim.last(20)

# -----------------------------
# STEP 16: News Alpha Feed
# -----------------------------
@app.get("/news/alpha")
async def get_alpha_feed():
    from app.services.news_service import news_ai
    # Return normalized alpha events for the high-authority sidebar
    return news_ai.alpha_events
