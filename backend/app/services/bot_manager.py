from datetime import datetime
import asyncio
import threading
from app.database.session import AsyncSessionLocal
from app.models.bot import BotLog


class BotManager:
    def __init__(self):
        self.thread = None
        self.running = False
        self.logs = []
        self.engine = None  # <-- NEW

    # -------------------------
    # Logging
    # -------------------------
    def log(self, msg: str, level: str = "INFO"):
        timestamp = datetime.utcnow()
        entry = f"[{timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
        print(entry)
        self.logs.append(entry)
        self.logs = self.logs[-500:]
        
        # Persist to DB in background if loop is running
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self._persist_log(msg, level))
        except:
            pass

    async def _persist_log(self, message: str, level: str):
        try:
            async with AsyncSessionLocal() as db:
                log_entry = BotLog(
                    message=message,
                    level=level,
                    module="BotEngine"
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
    # -------------------------
    # Start bot engine
    # -------------------------
    def start_bot(self, api_key: str = None, api_secret: str = None, leverage: int = 1, telegram_config: dict = None, use_news_ai: bool = False):
        if self.running:
            return "Bot already running."

        if self.engine is None:
            return "Engine not configured."

        self.running = True

        def run():
            try:
                self.engine.run(api_key, api_secret, leverage, telegram_config, use_news_ai)
            except Exception as e:
                self.log(f"ENGINE ERROR: {e}")
            finally:
                self.running = False
                self.log("Bot stopped.")

        self.thread = threading.Thread(target=run, daemon=True)
        self.thread.start()

        return "Bot started."

    # -------------------------
    # Stop bot engine
    # -------------------------
    def stop_bot(self):
        if self.engine:
            self.engine.stop()
        self.running = False
        return "Stop signal sent."

    # -------------------------
    # Status + Logs
    # -------------------------
    def get_status(self):
        return {"running": self.running}

    def get_logs(self):
        return self.logs
bot_manager = BotManager()

