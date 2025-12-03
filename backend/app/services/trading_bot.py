# backend/app/services/trading_bot.py

import time
import random

# 👇 Replace this with your REAL trading bot logic later
# For the backend we simulate bot output
# Then we will insert your full Binance bot into this file

def run_bot_loop():
    cycle = 0
    while True:
        cycle += 1

        # SIMULATED bot log (replace later with your actual bot)
        log = f"[BOT] Cycle {cycle} — scanning market..."
        yield log
        time.sleep(2)

        log = f"[BOT] Cycle {cycle} — no trade executed."
        yield log
        time.sleep(2)

        # if backend stops the bot, break
        # (handled by BotManager)
