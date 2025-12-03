import threading
import time
from datetime import datetime

class BotManager:
    def __init__(self):
        self.thread = None
        self.running = False
        self.logs = []

    def log(self, msg: str):
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}] {msg}"
        print(entry)
        self.logs.append(entry)

        # keep only last 500 logs
        self.logs = self.logs[-500:]

    def start_bot(self, bot_function):
        if self.running:
            return "Bot already running."

        self.running = True

        def run():
            self.log("Bot started.")
            try:
                bot_function(self)
            except Exception as e:
                self.log(f"BOT ERROR: {e}")
            finally:
                self.running = False
                self.log("Bot stopped.")

        self.thread = threading.Thread(target=run, daemon=True)
        self.thread.start()
        return "Bot started."

    def stop_bot(self):
        self.running = False
        return "Bot stop signal sent."

    def get_status(self):
        return {
            "running": self.running,
            "log_count": len(self.logs)
        }

    def get_logs(self):
        return self.logs
