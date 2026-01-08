import asyncio, os, sys
from dotenv import load_dotenv

# Add project root to PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.engine import RealTradingBot

load_dotenv()  # Load BINANCE_API_KEY and BINANCE_API_SECRET from .env

async def main():
    """Entry point for the fully‑automatic trading bot.
    It pulls the API credentials from the environment, connects to Binance,
    sets the desired leverage, and then runs the bot indefinitely.
    """
    api_key = (os.getenv("BINANCE_API_KEY") or "").strip()
    api_secret = (os.getenv("BINANCE_API_SECRET") or "").strip()

    if not api_key or not api_secret:
        print("❌ ERROR: Binance API credentials not found in .env")
        return

    bot = RealTradingBot()
    # Use the same logger format as the terminal script for consistency
    bot.set_logger(lambda msg, level="INFO", **kw: print(f"[{level}] {msg}"))

    try:
        # leverage can be adjusted here – default 10x
        await bot.run(api_key=api_key, api_secret=api_secret, leverage=10, use_news_ai=True)
    except Exception as e:
        print(f"❌ CRITICAL: {e}")

if __name__ == "__main__":
    asyncio.run(main())
