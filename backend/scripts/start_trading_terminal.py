import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.engine import RealTradingBot
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("\n" + "═"*60)
    print("🚀 STARTING AI TRADING BOT IN TERMINAL MODE")
    print("═"*60 + "\n")

    api_key = (os.getenv("BINANCE_API_KEY") or "").strip()
    api_secret = (os.getenv("BINANCE_API_SECRET") or "").strip()

    if not api_key or not api_secret:
        print("❌ ERROR: BINANCE_API_KEY or BINANCE_API_SECRET not found in .env")
        print("Please ensure your .env file in the backend folder has these keys.")
        return

    bot = RealTradingBot()
    
    # We use a custom logger that just prints to terminal
    def terminal_logger(msg, level="INFO", module="Bot"):
        timestamp = asyncio.get_event_loop().time()
        print(f"[{level}] {msg}")

    bot.set_logger(terminal_logger)

    try:
        # Run the bot directly
        # use_news_ai=True for full intelligence
        await bot.run(
            api_key=api_key, 
            api_secret=api_secret, 
            leverage=10, 
            use_news_ai=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Trading stopped by user.")
    except Exception as e:
        print(f"\n❌ CRITICAL CRASH: {e}")

if __name__ == "__main__":
    asyncio.run(main())
