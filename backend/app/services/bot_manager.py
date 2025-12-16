import threading
from datetime import datetime


class BotManager:
    def __init__(self):
        self.thread = None
        self.running = False
        self.logs = []
        self.engine = None  # <-- NEW

    # -------------------------
    # Logging
    # -------------------------
    def log(self, msg: str):
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] {msg}"
        print(entry)
        self.logs.append(entry)
        self.logs = self.logs[-500:]

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
    def start_bot(self, api_key: str = None, api_secret: str = None, leverage: int = 1):
        if self.running:
            return "Bot already running."

        if self.engine is None:
            return "Engine not configured."

        self.running = True

        def run():
            try:
                self.engine.run(api_key, api_secret, leverage)
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

