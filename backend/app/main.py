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
from app.routes import auth, bot, status

app.include_router(auth_router)
app.include_router(assistant_router)
app.include_router(oauth_router)
app.include_router(payment_router)
app.include_router(auth.router)
app.include_router(bot.router)
app.include_router(status.router)

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
