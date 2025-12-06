from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, bot, status
from app.services.bot_manager import bot_manager
from app.trading.engine import TradingEngine
from app.trading.binance_client import BinanceClient


app = FastAPI(title="AI Trading Bot Backend", version="1.0")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------
# Configure Engine + Inject into Manager
# --------------------------------------
try:
    client = BinanceClient(testnet=True)
    print("[INFO] Binance client initialized (testnet mode)")
    
    # Test public client (market data)
    test_data = client.fetch_ohlcv("BTCUSDT", limit=1)
    if test_data:
        print("[INFO] ✅ Public market data connection working")
    else:
        print("[WARNING] ⚠️ Public market data connection failed")
    
    engine = TradingEngine(client, bot_manager)
    bot_manager.set_engine(engine)
    print("[INFO] ✅ Trading engine configured and ready")
except Exception as e:
    print(f"[ERROR] Failed to initialize trading components: {e}")
    import traceback
    traceback.print_exc()


# --------------------------------------
# Routes
# --------------------------------------
app.include_router(auth.router)
app.include_router(bot.router)
app.include_router(status.router)


@app.get("/")
def root():
    return {"message": "AI Trading Backend Running! krkrkrkrkkrkrk"}
