from fastapi import FastAPI
from app.services.bot_manager import BotManager
from app.routes import auth, bot, status

bot_manager = BotManager()

app = FastAPI()

# include routes
app.include_router(auth.router)
app.include_router(bot.router)
app.include_router(status.router)


@app.get("/")
def home():
    return {"message": "AI Bot Platform Backend Running"}
