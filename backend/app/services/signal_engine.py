import os
import asyncio
import httpx
import sqlite3
import logging
from datetime import datetime, timezone
import random
import numpy as np
from dotenv import load_dotenv
from app.services.telegram_service import telegram_ai

# Load .env to ensure environment variables are available
load_dotenv()

# Logging
log = logging.getLogger("SignalEngine")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

DB_PATH = "signals_exp.db"

def utc_now():
    return datetime.now(timezone.utc)

class SignalEngine:
    def __init__(self):
        self.global_sentiment = 0.5
        self.sentiment_score = 0.5 # API Alias

        self.coin_bias = {
            "BTC": 0.5,
            "ETH": 0.5,
            "SOL": 0.5,
            "DOGE": 0.5,
            "LINK": 0.5,
            "MARKET": 0.5
        }

        self.seen = set()
        self.decay_rate = 0.02

        self.influencers = {
            "TECH_TITANS": {
                "accounts": ["elonmusk", "vitalikbuterin"],
                "weight": 1.4,
                "scope": "ASSET_FOCUSED"
            },
            "CRYPTO_ELITE": {
                "accounts": ["saylor", "cz_binance"],
                "weight": 1.3,
                "scope": "ASSET_FOCUSED"
            }
        }

        self.db = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.db.execute("PRAGMA journal_mode=WAL;")
        self._init_db()

        self.x_client = httpx.AsyncClient(timeout=10.0)
        self.cc_client = httpx.AsyncClient(timeout=10.0)
        self.token = os.getenv("X_BEARER_TOKEN")
        if not self.token:
            raise ValueError("Missing X_BEARER_TOKEN")

        self.bullish_words = ["surge","jump","record","high","approve","growth","rally","moon","soar","gain","etf","buy"]
        self.bearish_words = ["crash","drop","ban","hack","scam","fraud","sue","lawsuit","dump","fear","panic","bankrupt"]

        self.coin_keywords = {
            "BTC": ["bitcoin","btc","satoshi","saylor"],
            "ETH": ["ethereum","eth","vitalik","staking"],
            "SOL": ["solana","sol","breakpoint"],
            "DOGE": ["doge","shiba","xpay"],
            "LINK": ["chainlink","link","ccip"],
            "MARKET": ["crypto","market","economy","bullish","bearish"]
        }

        self.last_sentiments = []
        self.accuracy_memory = []
        self.reward_factor = 1.0
        self.penalty_factor = 1.0
        self.smart_mode = True
        self.last_signal = "HOLD"

    def _init_db(self):
        self.db.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            source TEXT,
            content TEXT,
            created_at TEXT,
            sentiment REAL,
            coin TEXT,
            alpha REAL
        );
        """)
        self.db.commit()

    def score_sentiment(self, text: str) -> float:
        t = text.lower()
        score = 0
        for w in self.bullish_words:
            if w in t:
                score += 0.2
        for w in self.bearish_words:
            if w in t:
                score -= 0.2
        return max(-1.0, min(1.0, score))

    def detect_coin(self, text: str) -> str:
        t = text.lower()
        for coin, kws in self.coin_keywords.items():
            for k in kws:
                if k in t:
                    return coin
        return "MARKET"

    def detect_influencer_alpha(self, text: str) -> float:
        t = text.lower()
        score = 0
        for group, data in self.influencers.items():
            if any(a.lower() in t for a in data["accounts"]):
                weight = data["weight"]
                score += weight * 0.2
        return score

    def apply_decay(self):
        self.global_sentiment += (0.5 - self.global_sentiment) * self.decay_rate
        for coin in self.coin_bias:
            self.coin_bias[coin] += (0.5 - self.coin_bias[coin]) * self.decay_rate

    def detect_regime(self):
        gs = self.global_sentiment
        if gs > 0.65: return "STRONG_BULL"
        if gs > 0.55: return "BULL"
        if gs > 0.45: return "NEUTRAL"
        if gs > 0.35: return "BEAR"
        return "STRONG_BEAR"

    def coin_signal(self, coin):
        b = self.coin_bias[coin]
        if b > 0.70: return "STRONG_BUY"
        if b > 0.60: return "BUY"
        if b > 0.45: return "HOLD"
        if b > 0.30: return "SELL"
        return "STRONG_SELL"

    def confidence_score(self):
        if len(self.last_sentiments) < 6:
            return 0.3
        movement = abs(self.last_sentiments[-1] - self.last_sentiments[-6])
        volume = len(self.seen) / 100
        conf = min(1.0, (movement * 2.5 + volume))
        return round(conf, 3)

    async def run_once(self):
        self.apply_decay()

        posts = []
        news = []

        # STEP 12: Only query X API every 6th cycle (quota protection)
        if len(self.last_sentiments) % 6 == 0:
            try:
                r = await self.x_client.get(
                    "https://api.x.com/2/tweets/search/recent",
                    params={"query": "bitcoin lang:en", "max_results": 10},
                    headers={"Authorization": f"Bearer {self.token}"}
                )
                if r.status_code == 200:
                    posts = r.json().get("data", [])
                    log.info(f"X API: Fetched {len(posts)} posts.")
            except Exception as e:
                log.warning(f"X request error: {e}")

    async def fetch_ohlcv(self, coin: str):
        """Fetch recent candles for technical analysis (Step 9A)"""
        try:
            url = f"https://min-api.cryptocompare.com/data/v2/histohead?fsym={coin}&tsym=USD&limit=24"
            r = await self.cc_client.get(url)
            if r.status_code == 200:
                data = r.json().get("Data", {}).get("Data", [])
                return data
        except Exception as e:
            log.warning(f"Error fetching candles for {coin}: {e}")
        return []

    def detect_candle_sentiment(self, candles: list) -> float:
        """Detect bullish/bearish candle patterns (Step 9A)"""
        if len(candles) < 3: return 0.0
        
        last = candles[-1]
        prev = candles[-2]
        
        # Simple Engulfing pattern
        is_bullish_engulfing = last['close'] > prev['open'] and last['open'] < prev['close'] and last['close'] > last['open']
        is_bearish_engulfing = last['close'] < prev['open'] and last['open'] > prev['close'] and last['close'] < last['open']
        
        # Hammer / Shooting Star
        body = abs(last['close'] - last['open'])
        upper_wick = last['high'] - max(last['close'], last['open'])
        lower_wick = min(last['close'], last['open']) - last['low']
        
        is_hammer = lower_wick > body * 2 and upper_wick < body
        is_shooting_star = upper_wick > body * 2 and lower_wick < body
        
        sentiment = 0.0
        if is_bullish_engulfing: sentiment += 0.15
        if is_hammer: sentiment += 0.1
        if is_bearish_engulfing: sentiment -= 0.15
        if is_shooting_star: sentiment -= 0.1
        
        return sentiment

    def get_volatility_multiplier(self, candles: list) -> float:
        """Step 9C: Volatility Filter - Reduces signal strength in extreme volatility"""
        if len(candles) < 10: return 1.0
        returns = [ (candles[i]['close'] - candles[i-1]['close'])/candles[i-1]['close'] for i in range(1, len(candles))]
        vol = np.std(returns) if len(returns) > 0 else 0
        
        if vol > 0.05: return 0.5  # Too volatile, cut signal in half
        if vol < 0.005: return 0.8 # Too quiet, weaken signal
        return 1.0

    async def run_once(self):
        self.apply_decay()

        posts = []
        news = []

        # STEP 12: Only query X API every 6th cycle (quota protection)
        if len(self.last_sentiments) % 6 == 0:
            try:
                r = await self.x_client.get(
                    "https://api.x.com/2/tweets/search/recent",
                    params={"query": "bitcoin lang:en", "max_results": 10},
                    headers={"Authorization": f"Bearer {self.token}"}
                )
                if r.status_code == 200:
                    posts = r.json().get("data", [])
                    log.info(f"X API: Fetched {len(posts)} posts.")
            except Exception as e:
                log.warning(f"X request error: {e}")

        try:
            r = await self.cc_client.get(
                "https://min-api.cryptocompare.com/data/v2/news/",
                params={"lang": "EN"}
            )
            if r.status_code == 200:
                news = r.json().get("Data", [])

        except Exception as e:
            log.warning(f"News fetch error: {e}")

        all_items = []

        for p in posts[:5]:
            pid = p.get("id", "")
            if pid not in self.seen:
                self.seen.add(pid)
                text = p.get("text", "")
                coin = self.detect_coin(text)
                s = self.score_sentiment(text)
                alpha = self.detect_influencer_alpha(text)

                all_items.append({
                    "id": pid,
                    "source": "X",
                    "content": text,
                    "sentiment": s + alpha,
                    "coin": coin
                })

        for n in news[:5]:
            nid = str(n.get("id", random.random()))
            if nid not in self.seen:
                self.seen.add(nid)
                text = n.get("title", "")
                coin = self.detect_coin(text)
                s = self.score_sentiment(text)
                alpha = 0

                all_items.append({
                    "id": nid,
                    "source": "NEWS",
                    "content": text,
                    "sentiment": s,
                    "coin": coin
                })

        for item in all_items:
            self.db.execute(
                "INSERT OR REPLACE INTO events VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    item["id"],
                    item["source"],
                    item["content"][:200],
                    utc_now().isoformat(),
                    item["sentiment"],
                    item["coin"],
                    item["sentiment"]
                )
            )

            self.global_sentiment += item["sentiment"] * 0.3
            self.coin_bias[item["coin"]] += item["sentiment"] * 0.7

        self.db.commit()
        self.sentiment_score = self.global_sentiment

        self.last_sentiments.append(self.global_sentiment)
        if len(self.last_sentiments) > 100:
            self.last_sentiments.pop(0)

        regime = self.detect_regime()
        confidence = self.confidence_score()

        print("\n--- SNAPSHOT ---")
        print(f"Global sentiment  : {self.global_sentiment:.3f}  [{regime}]")
        print(f"Confidence index  : {confidence:.3f}")
        for coin, bias in self.coin_bias.items():
            print(f"{coin:6} → {bias:.3f}  [{self.coin_signal(coin)}]")
        print("Events stored:", len(self.seen))

        # Telegram Alert Logic
        current_signal = await self.enhanced_signal("BTC")
        if current_signal != self.last_signal and current_signal != "HOLD":
            await telegram_ai.send_signal_alert(
                coin="BTC",
                signal=current_signal,
                sentiment=self.global_sentiment,
                confidence=self.confidence_score()
            )
            self.last_signal = current_signal

    async def run(self):
        print("\n=== ENGINE RUNNING WITH REGIME + CONFIDENCE ===")
        while True:
            await self.run_once()
            await asyncio.sleep(3600)  # 1 HOUR cycle (FREE-TIER SAFE)

    # --- API BRIDGE ---
    async def fetch_market_news(self):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT source, content, created_at, sentiment, coin FROM events WHERE source='NEWS' ORDER BY created_at DESC LIMIT 20")
        rows = cursor.fetchall()
        conn.close()
        return [{"source": r[0], "title": r[1], "created_at": r[2], "sentiment": r[3], "coin": r[4]} for r in rows]

    def get_signal(self):
        return self.detect_regime()

    async def check_trading_window(self):
        return "Active - High Liquidity Window"

    def get_decision(self, coin: str):
        """Step 9: Buy/Sell Logic"""
        bias = self.coin_bias.get(coin.upper(), 0.5)
        conf = self.confidence_score()
        if conf < 0.4: return "WAITING"
        if bias > 0.70: return "BUY"
        if bias < 0.30: return "SELL"
        return "HOLD"

    # ------------------------------------------
    # PERFORMANCE MEMORY + ROBUST SIGNAL FILTER
    # ------------------------------------------

    def record_signal_outcome(self, correct: bool):
        """Store win/loss outcome"""
        self.accuracy_memory.append(correct)
        if len(self.accuracy_memory) > 500:
            self.accuracy_memory.pop(0)

        # Reward model
        if correct:
            self.reward_factor += 0.02
        else:
            self.penalty_factor += 0.05

        # Normalize
        self.reward_factor = min(self.reward_factor, 3.0)
        self.penalty_factor = min(self.penalty_factor, 3.0)

    def smart_threshold(self):
        """Adaptive BUY/SELL threshold tuning"""
        if not self.smart_mode:
            return 0.55, 0.45

        win_rate = self.accuracy()
        if win_rate > 0.6:
            # Signals are profitable → more aggressive
            return 0.52, 0.48
        else:
            # Signals struggling → more conservative
            return 0.6, 0.4

    def accuracy(self):
        """Returns rolling prediction accuracy"""
        if not self.accuracy_memory:
            return 0.5
        return sum(self.accuracy_memory) / len(self.accuracy_memory)

    async def enhanced_signal(self, coin: str = "BTC") -> str:
        """Final post-processed trading output (STEP 8 + 9A + 9C)"""
        upper, lower = self.smart_threshold()
        gs = self.global_sentiment
        
        # Add Technical Overlay (9A)
        candles = await self.fetch_ohlcv(coin.upper())
        technical_score = self.detect_candle_sentiment(candles)
        
        # Volatility Filter (9C)
        vol_mult = self.get_volatility_multiplier(candles)
        
        final_score = (gs + technical_score) * vol_mult
        
        if final_score >= upper:
            return "BUY"
        elif final_score <= lower:
            return "SELL"
        return "HOLD"

# --- GLOBAL INSTANCE ---
news_ai = SignalEngine()

async def main():
    await news_ai.run()

if __name__ == "__main__":
    asyncio.run(main())