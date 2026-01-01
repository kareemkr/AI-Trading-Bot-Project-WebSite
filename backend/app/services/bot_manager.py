from datetime import datetime
import asyncio
import threading
from app.database.session import AsyncSessionLocal
from app.models.bot import BotLog


class BotManager:
    def __init__(self):
        self.bot_task = None
        self.running = False
        self.logs = []
        self.news_logs = []
        self.engine = None
        self.loop = None

    # -------------------------
    # Logging
    # -------------------------
    def set_loop(self, loop):
        self.loop = loop

    def log(self, msg: str, level: str = "INFO", module: str = "BotEngine"):
        timestamp = datetime.utcnow()
        entry = f"[{timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
        print(f"[{module}] {entry}")
        
        if module == "NewsEngine":
            self.news_logs.append(entry)
            self.news_logs = self.news_logs[-500:]
        else:
            self.logs.append(entry)
            self.logs = self.logs[-500:]
        
        # Persist to DB using the captured event loop
        if self.loop and self.loop.is_running():
            try:
                asyncio.run_coroutine_threadsafe(self._persist_log(msg, level, module), self.loop)
            except Exception as e:
                print(f"Failed to schedule log persistence: {e}")

    async def _persist_log(self, message: str, level: str, module: str):
        try:
            async with AsyncSessionLocal() as db:
                log_entry = BotLog(
                    message=message,
                    level=level,
                    module=module
                )
                db.add(log_entry)
                await db.commit()
        except:
            pass

    # -------------------------
    # Set trading engine
    # -------------------------
    def set_engine(self, engine):
        self.engine = engine

    # -------------------------
    # Start bot engine
    # -------------------------
    async def start_bot(self, api_key: str = None, api_secret: str = None, leverage: int = 1, telegram_config: dict = None, use_news_ai: bool = False):
        if self.running:
            return "Bot already running."

        if self.engine is None:
            return "Engine not configured."

        self.running = True

        if self.loop and self.loop.is_running():
            self.bot_task = asyncio.create_task(
                self.engine.run(api_key, api_secret, leverage, telegram_config, use_news_ai)
            )
            return "Bot started."
        else:
            self.running = False
            return "Failed to start: No active event loop captured."

    # -------------------------
    # Stop bot engine
    # -------------------------
    def stop_bot(self):
        if not self.running:
            return "Bot is not running."
        
        if self.engine:
            self.engine.stop()
        
        if self.bot_task:
            self.bot_task.cancel()
            self.bot_task = None
            
        self.running = False
        self.log("Bot stop signal sent.")
        return "Bot stopped."

    # -------------------------
    # Status + Logs
    # -------------------------
    def get_status(self):
        return {"running": self.running}

    def get_logs(self):
        return self.logs

    def get_news_logs(self):
        return self.news_logs

bot_manager = BotManager()

