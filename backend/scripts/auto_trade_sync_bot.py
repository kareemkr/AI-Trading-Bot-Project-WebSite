import asyncio, os, sys
from dotenv import load_dotenv

# Add project root to PYTHONPATH for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.engine import RealTradingBot
from app.services.news_service import news_ai

load_dotenv()

async def main():
    """Run the News AI service and the trading bot together.
    Both components share the same `news_ai` singleton, so the bot can
    consume live news signals while the news engine continuously fetches
    and processes data.
    """
    api_key = (os.getenv("BINANCE_API_KEY") or "").strip()
    api_secret = (os.getenv("BINANCE_API_SECRET") or "").strip()

    if not api_key or not api_secret:
        print("❌ ERROR: Binance API credentials not found in .env")
        return

    bot = RealTradingBot()
    bot.set_logger(lambda msg, level="INFO", **kw: print(f"[{level}] {msg}"))

    # Start the news engine as a background task
    news_task = asyncio.create_task(news_ai.run())

    # Run the trading bot (it will internally use `news_ai` when `use_news_ai=True`)
    try:
        await bot.run(api_key=api_key, api_secret=api_secret, leverage=10, use_news_ai=True)
    except Exception as e:
        print(f"❌ CRITICAL: {e}")
    finally:
        # Cancel the news task if the bot stops
        news_task.cancel()
        try:
            await news_task
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    asyncio.run(main())
