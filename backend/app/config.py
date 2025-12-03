import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    API_KEY = os.getenv("API_KEY", "demo-key")
    DEMO_BOT_PATH = "/bots/demo_bot.py"  # your demo bot script

settings = Settings()
