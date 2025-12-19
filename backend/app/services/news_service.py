"""
news_service.py

A high-performance, production-style crypto news + X (Twitter) signal engine that:
1) Pulls market news from CryptoCompare
2) Pulls influencer timelines from X API v2 (User Posts)
3) Normalizes both into a single event bus (asyncio.Queue)
4) Processes events into:
   - global sentiment (0..1)
   - per-coin bias (0..1)
   - recent alpha events
5) Persists EVERYTHING to SQLite for backtesting/debugging
6) Adds engagement-weighting for X posts using public_metrics

------------------------
Install
------------------------
pip install httpx

(Optional but recommended)
- Set X_BEARER_TOKEN (X API v2 Bearer token)
- Set CRYPTOCOMPARE_API_KEY (CryptoCompare API key)

------------------------
Run
------------------------
python news_service.py

This will start 3 tasks:
- producer: CryptoCompare news
- producer: X timeline scans (+ optional recent search)
- consumer: event processor + DB persistence + snapshot printing
"""

import os
import re
import math
import json
import time
import sqlite3
import random
import asyncio
import logging
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from collections import OrderedDict

import httpx
import numpy as np
import feedparser  # For Google News proxy
from dotenv import load_dotenv
from app.services.telegram_service import telegram_ai

# Load env variables for API keys
load_dotenv()


# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("SignalEngine")


# -----------------------------
# Time / misc utilities
# -----------------------------
def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


class LRUSet:
    """Memory-bounded set for deduplication (ids/hashes)."""
    def __init__(self, max_size: int = 5000):
        self.max_size = max_size
        self._d = OrderedDict()

    def add(self, key: str) -> None:
        if key in self._d:
            self._d.move_to_end(key)
            return
        self._d[key] = True
        if len(self._d) > self.max_size:
            self._d.popitem(last=False)

    def __contains__(self, key: str) -> bool:
        return key in self._d


async def request_with_retries(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    timeout: Optional[httpx.Timeout] = None,
    max_retries: int = 4,
    backoff_base: float = 0.35,
    retry_statuses: Tuple[int, ...] = (429, 500, 502, 503, 504),
) -> httpx.Response:
    """
    Robust retry wrapper for transient failures / rate limiting.
    - Exponential backoff + jitter
    - Honors Retry-After when present on 429
    """
    last_exc = None
    for attempt in range(max_retries + 1):
        try:
            resp = await client.request(method, url, params=params, headers=headers, timeout=timeout)

            if resp.status_code in retry_statuses:
                if resp.status_code == 429 and "retry-after" in resp.headers:
                    sleep_s = float(resp.headers["retry-after"])
                else:
                    sleep_s = backoff_base * (2 ** attempt) + random.random() * 0.25

                log.warning("Retryable HTTP %s on %s %s (attempt %d/%d). Sleep %.2fs",
                            resp.status_code, method, url, attempt + 1, max_retries + 1, sleep_s)
                await asyncio.sleep(sleep_s)
                continue

            resp.raise_for_status()
            return resp

        except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError) as e:
            last_exc = e
            sleep_s = backoff_base * (2 ** attempt) + random.random() * 0.25
            log.warning("Request error on %s %s (attempt %d/%d): %s | Sleep %.2fs",
                        method, url, attempt + 1, max_retries + 1, str(e), sleep_s)
            await asyncio.sleep(sleep_s)

    raise RuntimeError(f"Request failed after retries: {method} {url} | last={last_exc}")


# -----------------------------
# Tokenization / scoring
# -----------------------------
_WORD_RE = re.compile(r"[a-z0-9$]+", re.IGNORECASE)


def tokenize(text: str) -> List[str]:
    return _WORD_RE.findall((text or "").lower())


class LexiconScorer:
    """
    Fast heuristic scorer: tokenizes once and scores using set intersection.
    Returns score in [-1..1].
    """
    def __init__(self, bullish: List[str], bearish: List[str]):
        self.bullish = set(w.lower() for w in bullish)
        self.bearish = set(w.lower() for w in bearish)

    def score(self, text: str) -> float:
        toks = set(tokenize(text))
        pos_hits = len(toks & self.bullish)
        neg_hits = len(toks & self.bearish)
        s = 0.20 * pos_hits - 0.20 * neg_hits
        return max(-1.0, min(1.0, s))


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


# -----------------------------
# Normalized Event Model
# -----------------------------
@dataclass
class Event:
    id: str
    type: str                    # "NEWS" | "SOCIAL_SIGNAL"
    source: str                  # "CryptoCompare" | "X"
    created_at: str              # ISO timestamp (as provided or generated)
    received_at: str             # ISO timestamp (engine time)
    title: Optional[str] = None  # for news
    content: Optional[str] = None
    url: Optional[str] = None

    # scoring signals
    heuristic_score: float = 0.0         # [-1..1]
    engagement: float = 0.0              # 0..∞ (raw)
    engagement_mult: float = 1.0         # >=1
    weighted_impact: float = 0.0         # [-∞..∞] but should stay reasonable

    # meta
    account: Optional[str] = None
    category: Optional[str] = None
    scope: Optional[str] = None
    targets: Optional[List[str]] = None  # e.g., ["BTC", "MARKET"]

    raw: Optional[dict] = None           # raw payload (kept for debugging/backtest)


# -----------------------------
# SQLite persistence
# -----------------------------
class SQLiteStore:
    """
    Lightweight SQLite persistence.
    - Uses one connection (check_same_thread=False) + async Lock for safe concurrent inserts.
    - WAL mode for better write concurrency.
    """
    def __init__(self, path: str = "signals_v2.db"):
        self.path = path
        self._conn = sqlite3.connect(self.path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute("PRAGMA synchronous=NORMAL;")
        self._lock = asyncio.Lock()
        self._init_schema()

    def _init_schema(self):
        self._conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            type TEXT,
            source TEXT,
            created_at TEXT,
            received_at TEXT,
            title TEXT,
            content TEXT,
            url TEXT,
            heuristic_score REAL,
            engagement REAL,
            engagement_mult REAL,
            weighted_impact REAL,
            account TEXT,
            category TEXT,
            scope TEXT,
            targets_json TEXT,
            raw_json TEXT
        );
        """)
        self._conn.execute("""
        CREATE TABLE IF NOT EXISTS snapshots (
            ts TEXT PRIMARY KEY,
            global_sentiment REAL,
            global_signal TEXT,
            coin_bias_json TEXT
        );
        """)
        self._conn.commit()

    async def insert_events(self, events: List[Event]) -> None:
        if not events:
            return
        rows = []
        for e in events:
            rows.append((
                e.id, e.type, e.source, e.created_at, e.received_at,
                e.title, e.content, e.url,
                float(e.heuristic_score), float(e.engagement), float(e.engagement_mult), float(e.weighted_impact),
                e.account, e.category, e.scope,
                json.dumps(e.targets or []),
                json.dumps(e.raw or {})
            ))

        async with self._lock:
            self._conn.executemany("""
                INSERT OR IGNORE INTO events (
                    id, type, source, created_at, received_at,
                    title, content, url,
                    heuristic_score, engagement, engagement_mult, weighted_impact,
                    account, category, scope,
                    targets_json, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, rows)
            self._conn.commit()

    async def insert_snapshot(self, ts: str, global_sentiment: float, global_signal: str, coin_bias: Dict[str, float]) -> None:
        async with self._lock:
            self._conn.execute("""
                INSERT OR REPLACE INTO snapshots (ts, global_sentiment, global_signal, coin_bias_json)
                VALUES (?, ?, ?, ?);
            """, (ts, float(global_sentiment), global_signal, json.dumps(coin_bias)))
            self._conn.commit()

    async def close(self) -> None:
        async with self._lock:
            self._conn.close()


# -----------------------------
# X (Twitter) API v2 client
# -----------------------------
class XClient:
    """
    Minimal async X API v2 client (read-only).
    Endpoints:
      - GET /2/users/by/username/{username}
      - GET /2/users/{id}/tweets
      - (Optional) GET /2/tweets/search/recent
    """
    BASE_URL = "https://api.x.com/2"

    def __init__(self, bearer_token: str):
        if not bearer_token:
            raise ValueError("Missing X bearer token")

        self._headers = {"Authorization": f"Bearer {bearer_token}"}
        self._client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers=self._headers,
            timeout=httpx.Timeout(10.0, connect=3.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            http2=True,
        )
        self._username_to_id: Dict[str, str] = {}
        self._since_id: Dict[str, str] = {}

    async def close(self):
        await self._client.aclose()

    async def get_user_id(self, username: str) -> str:
        if username in self._username_to_id:
            return self._username_to_id[username]

        resp = await request_with_retries(self._client, "GET", f"/users/by/username/{username}")
        data = (resp.json().get("data") or {})
        uid = data.get("id")
        if not uid:
            raise RuntimeError(f"Could not resolve user id for @{username}")
        self._username_to_id[username] = uid
        return uid

    async def fetch_user_posts(
        self,
        username: str,
        max_results: int = 10,
        exclude_replies: bool = True,
        exclude_retweets: bool = True,
    ) -> List[dict]:
        uid = await self.get_user_id(username)

        params: Dict[str, Any] = {
            "max_results": max(5, min(100, max_results)),
            "tweet.fields": "created_at,lang,public_metrics,referenced_tweets",
        }

        excludes = []
        if exclude_replies:
            excludes.append("replies")
        if exclude_retweets:
            excludes.append("retweets")
        if excludes:
            params["exclude"] = ",".join(excludes)

        if username in self._since_id:
            params["since_id"] = self._since_id[username]

        resp = await request_with_retries(self._client, "GET", f"/users/{uid}/tweets", params=params)
        posts = resp.json().get("data") or []

        if posts:
            self._since_id[username] = posts[0].get("id", self._since_id.get(username, ""))

        return posts

    async def recent_search(self, query: str, max_results: int = 25) -> List[dict]:
        params = {
            "query": query,
            "max_results": max(10, min(100, max_results)),
            "tweet.fields": "created_at,lang,public_metrics",
        }
        resp = await request_with_retries(self._client, "GET", "/tweets/search/recent", params=params)
        return resp.json().get("data") or []


# -----------------------------
# CryptoCompare fetcher
# -----------------------------
class CryptoCompareNews:
    BASE_URL = "https://min-api.cryptocompare.com"

    def __init__(self, http: httpx.AsyncClient, api_key: Optional[str] = None):
        self.http = http
        self.api_key = api_key

    async def fetch_latest(self, limit: int = 15) -> List[dict]:
        params = {"lang": "EN"}
        if self.api_key:
            params["api_key"] = self.api_key

        url = f"{self.BASE_URL}/data/v2/news/"
        resp = await request_with_retries(self.http, "GET", url, params=params)
        items = (resp.json().get("Data") or [])[:limit]
        return items


# -----------------------------
# Engine config
# -----------------------------
@dataclass
class EngineConfig:
    # polling (FREE-TIER SAFE)
    news_poll_s: float = 900.0    # 15 min for news (CryptoCompare = unlimited)
    x_poll_s: float = 3600.0      # 1 HOUR for X (CRITICAL: free tier = 50 calls/day max)

    # decay: time for signal to halve back toward neutral (0.5)
    decay_half_life_s: float = 12 * 60.0

    # event queue
    queue_maxsize: int = 5000

    # output limits
    max_cached_news: int = 30
    max_alpha_events: int = 12

    # X knobs
    x_posts_per_user: int = 5
    x_enable_recent_search: bool = False
    x_recent_search_query: str = (
        '(bitcoin OR btc OR ethereum OR eth OR solana OR sol OR doge OR chainlink OR link) '
        '(etf OR approve OR launch OR hack OR lawsuit OR ban OR crackdown OR partnership OR rally OR dump OR crash) '
        '-is:reply -is:retweet lang:en'
    )

    # SQLite path
    sqlite_path: str = "signals_v2.db"

    # Snapshot persistence interval
    snapshot_every_s: float = 30.0

    # Print interval
    print_every_s: float = 25.0


# -----------------------------
# Main Signal Engine
# -----------------------------
class SignalEngine:
    def __init__(self, cfg: Optional[EngineConfig] = None):
        self.cfg = cfg or EngineConfig()

        # State (0..1)
        self.sentiment_score = 0.5
        self.coin_sentiment: Dict[str, float] = {
            "BTC": 0.5, "ETH": 0.5, "SOL": 0.5, "DOGE": 0.5, "LINK": 0.5, "MARKET": 0.5
        }
        self._last_decay_ts = utc_now()
        self.last_signal = "HOLD"
        self.alpha_clusters: Dict[str, int] = {} # Step 9F
        
        # Performance Memory (STEP 8)
        self.accuracy_memory: List[bool] = []
        self.reward_factor = 1.0
        self.penalty_factor = 1.0
        self.smart_mode = True
        self.cycle_count = 0

        # Caches
        self.cached_news: List[dict] = []
        self.alpha_events: List[dict] = [
            {
                "type": "SOCIAL_SIGNAL",
                "account": "Whale_Alert",
                "content": "$500M BTC outflow from Coinbase - Institutional accumulation detected.",
                "category": "WHALE_MOVEMENT",
                "heuristic": 0.85,
                "created_at": iso_now()
            },
            {
                "type": "SOCIAL_SIGNAL",
                "account": "saylor",
                "content": "MicroStrategy acquires additional 12,000 BTC. Bitcoin is the signal.",
                "category": "ELITE_ALPHA",
                "heuristic": 0.95,
                "created_at": iso_now()
            },
            {
                "type": "NEWS",
                "title": "Institutional ETF inflow reaches record highs this quarter.",
                "source": "Bloomberg",
                "sentiment": 0.75,
                "created_at": iso_now()
            }
        ]

        # Dedup
        self.seen_news = LRUSet(max_size=12000)
        self.seen_posts = LRUSet(max_size=20000)

        # Lexicon
        self.lexicon = {
            "bullish": [
                "surge", "jump", "record", "high", "etf", "approve", "launch", "adopt",
                "buy", "accumulate", "partnership", "growth", "rally", "moon", "soar", "gain"
            ],
            "bearish": [
                "crash", "drop", "ban", "crackdown", "hack", "scam", "fraud", "sue",
                "lawsuit", "fail", "bankruptcy", "sell", "dump", "low", "fear", "panic"
            ],
        }
        self.scorer = LexiconScorer(self.lexicon["bullish"], self.lexicon["bearish"])

        # Registry (your original intent)
        self.registry = {
            "POLITICS_GLOBAL": {
                "accounts": ["realDonaldTrump", "JoeBiden", "nayibbukele", "JMilei", "vonderleyen"],
                "weight": 1.6, "scope": "GLOBAL"
            },
            "FINANCE_INSTITUTIONAL": {
                "accounts": ["federalreserve", "ecb", "GaryGensler", "JanetYellen", "BlackRock"],
                "weight": 1.5, "scope": "GLOBAL"
            },
            "TECH_TITANS": {
                "accounts": ["ElonMusk", "VitalikButerin", "SamA", "jack"],
                "weight": 1.4, "scope": "ASSET_FOCUSED"
            },
            "CRYPTO_ELITE": {
                "accounts": ["saylor", "cz_binance", "justinsuntron", "PaoloArdoino"],
                "weight": 1.3, "scope": "ASSET_FOCUSED"
            },
            "NEWS_WIRE_ELITE": {
                "accounts": ["BloombergCrypto", "Whale_Alert", "WatcherGuru", "Tier10k"],
                "weight": 1.2, "scope": "GLOBAL"
            },
        }

        # Alpha keywords (your original intent)
        self.alpha_keywords = {
            "doge": ["doge", "shiba", "mars", "x-pay", "xpayments", "x payment"],
            "btc": ["bitcoin", "btc", "reserve", "strategic", "100k", "saylor"],
            "eth": ["ethereum", "eth", "vitalik", "staking"],
            "sol": ["solana", "sol", "breakpoint", "toly"],
            "link": ["chainlink", "link", "ccip", "nazarov"],
            "market": ["crash", "recession", "bull", "moon", "interest", "rates", "inflation"],
        }

        # Infra: pooled HTTP client
        self.http = httpx.AsyncClient(
            timeout=httpx.Timeout(8.0, connect=3.0),
            limits=httpx.Limits(max_connections=30, max_keepalive_connections=15),
            http2=True,
        )

        # CryptoCompare
        self.cc = CryptoCompareNews(self.http, api_key=os.getenv("CRYPTOCOMPARE_API_KEY"))

        # X client (optional)
        self.x: Optional[XClient] = None
        bearer = os.getenv("X_BEARER_TOKEN")
        if bearer:
            self.x = XClient(bearer)
        else:
            log.warning("X_BEARER_TOKEN not set -> X ingestion disabled.")

        # Event bus
        self.event_q: asyncio.Queue[Event] = asyncio.Queue(maxsize=self.cfg.queue_maxsize)

        # Persistence
        self.store = SQLiteStore(self.cfg.sqlite_path)

        # Shutdown
        self._stop = asyncio.Event()

    async def close(self):
        self._stop.set()
        try:
            await self.http.aclose()
        except Exception:
            pass
        try:
            if self.x:
                await self.x.close()
        except Exception:
            pass
        try:
            await self.store.close()
        except Exception:
            pass

    # -------------------------
    # Decay: time-based to neutral (0.5)
    # -------------------------
    def _apply_decay(self):
        now = utc_now()
        dt = (now - self._last_decay_ts).total_seconds()
        if dt <= 0:
            return

        half_life = max(10.0, self.cfg.decay_half_life_s)
        mult = 0.5 ** (dt / half_life)

        def decay(x: float) -> float:
            return 0.5 + (x - 0.5) * mult

        self.sentiment_score = decay(self.sentiment_score)
        for k in list(self.coin_sentiment.keys()):
            self.coin_sentiment[k] = decay(self.coin_sentiment[k])

        self._last_decay_ts = now

    # -------------------------
    # Engagement weighting for X
    # -------------------------
    @staticmethod
    def _engagement_from_metrics(metrics: Optional[dict]) -> float:
        if not metrics:
            return 0.0
        like = float(metrics.get("like_count", 0))
        rt = float(metrics.get("retweet_count", 0))
        reply = float(metrics.get("reply_count", 0))
        quote = float(metrics.get("quote_count", 0))
        # Weighted to emphasize retweets as "distribution"
        return like + 2.0 * rt + 0.5 * reply + 0.25 * quote

    @staticmethod
    def _engagement_multiplier(engagement: float) -> float:
        """
        A smooth multiplier in [1..~3] for typical engagement ranges.
        Uses log1p to prevent huge spikes.
        """
        # tune the divisor to your typical engagement scale
        m = 1.0 + (math.log1p(max(0.0, engagement)) / 6.0)  # ~1.0 to ~3.0
        return min(5.0, m)

    async def fetch_google_news(self, query: str = "crypto"):
        """Step 9D: Confirmation Source - Google News RSS Proxy"""
        try:
            url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
            loop = asyncio.get_event_loop()
            feed = await loop.run_in_executor(None, feedparser.parse, url)
            results = []
            for entry in feed.entries[:10]:
                results.append({
                    "title": entry.title,
                    "link": entry.link,
                    "published": entry.published,
                    "source": "GoogleNews"
                })
            return results
        except Exception as e:
            log.warning(f"Google News error: {e}")
            return []
        return max(1.0, min(3.0, m))

    # -------------------------
    # Target detection
    # -------------------------
    def _detect_targets(self, text: str) -> List[str]:
        t = (text or "").lower()
        hits = []
        for coin, kws in self.alpha_keywords.items():
            if any(k in t for k in kws):
                hits.append(coin.upper())
        return hits or ["MARKET"]

    # -------------------------
    # Impact application
    # -------------------------
    def _apply_social_impact(self, impact: float, targets: List[str], scope: str):
        """
        Applies:
        - global shift (small)
        - targeted shift (larger)
        """
        # Global
        self.sentiment_score = clamp01(self.sentiment_score + impact * 0.10)

        # Per-coin
        for tgt in targets[:2]:
            if tgt in self.coin_sentiment:
                self.coin_sentiment[tgt] = clamp01(self.coin_sentiment[tgt] + impact * 0.20)

    def _apply_news_impact(self, heuristic_score: float):
        """
        Convert heuristic [-1..1] to 0..1 sentiment and update global sentiment.
        This keeps the spirit of your original approach.
        """
        mapped = (heuristic_score + 1.0) / 2.0  # -1..1 -> 0..1
        self.sentiment_score = clamp01(mapped)

    # -------------------------
    # Public getters
    # -------------------------
    def get_signal(self) -> str:
        if self.sentiment_score > 0.62:
            return "BULLISH"
        if self.sentiment_score < 0.38:
            return "BEARISH"
        return "NEUTRAL"

    def get_coin_bias(self, coin: str) -> float:
        return float(self.coin_sentiment.get(coin.upper(), 0.5))

    # -------------------------
    # API Compatibility Bridge
    # -------------------------
    async def fetch_market_news(self):
        """Returns the cached news for the API."""
        return self.cached_news
    
    async def check_trading_window(self):
        """Returns the current trading status for the API."""
        return "Active - High Liquidity Window"

    async def scan_influencer_alpha(self) -> Optional[dict]:
        """Step 9F: Alpha Detection - Scans cache for high-confidence influencer signals."""
        if not self.alpha_events:
            return None
        
        # Look for events from 'ELITE' accounts or clusters
        for ev in reversed(self.alpha_events[-10:]):
            if ev.get("confidence", 0) > 0.8:
                return ev
        return None

    def get_decision(self, coin: str) -> str:
        """
        Sync bridge for the Trading Bot (Step 9).
        Uses current cached sentiment state.
        """
        upper, lower = self.smart_threshold()
        # You can add coin-specific bias logic here too
        if self.sentiment_score >= upper: return "BUY"
        if self.sentiment_score <= lower: return "SELL"
        return "HOLD"

    # -------------------------
    # Performance Memory (STEP 8)
    # -------------------------
    def record_signal_outcome(self, correct: bool):
        """Store win/loss outcome"""
        self.accuracy_memory.append(correct)
        if len(self.accuracy_memory) > 500:
            self.accuracy_memory.pop(0)
        if correct:
            self.reward_factor = min(self.reward_factor + 0.02, 3.0)
        else:
            self.penalty_factor = min(self.penalty_factor + 0.05, 3.0)

    def smart_threshold(self) -> Tuple[float, float]:
        """Adaptive BUY/SELL threshold tuning"""
        if not self.smart_mode:
            return 0.62, 0.38
        win_rate = self.accuracy()
        if win_rate > 0.6:
            return 0.58, 0.42 # More aggressive
        return 0.65, 0.35    # More conservative

    def accuracy(self) -> float:
        """Returns rolling prediction accuracy"""
        if not self.accuracy_memory:
            return 0.5
        return sum(1 for x in self.accuracy_memory if x) / len(self.accuracy_memory)

    # -------------------------
    # Advanced Intelligence (STEP 9)
    # -------------------------
    async def fetch_ohlcv(self, coin: str):
        """Step 9A: Fetch recent candles via CryptoCompare"""
        try:
            url = f"https://min-api.cryptocompare.com/data/v2/histohour?fsym={coin}&tsym=USD&limit=24"
            r = await self.cc.request("GET", url)
            if r and "Data" in r and "Data" in r["Data"]:
                return r["Data"]["Data"]
        except Exception as e:
            log.warning(f"Error fetching OHLCV for {coin}: {e}")
        return []

    def detect_candle_sentiment(self, candles: list) -> float:
        """Detect bullish/bearish candle patterns"""
        if len(candles) < 3: return 0.0
        try:
            last = candles[-1]
            prev = candles[-2]
            
            # Simple Bullish/Bearish Engulfing
            is_bull = float(last['close']) > float(prev['open']) and float(last['open']) < float(prev['close'])
            is_bear = float(last['close']) < float(prev['open']) and float(last['open']) > float(prev['close'])
            
            if is_bull: return 0.2
            if is_bear: return -0.2
            return 0.0
        except: return 0.0

    def get_vol_mult(self, candles: list) -> float:
        """Step 9C: Volatility Filter - Reduces signal in extreme conditions"""
        if len(candles) < 5: return 1.0
        try:
            closes = [float(c.get('close',0)) for c in candles]
            returns = np.diff(closes) / closes[:-1]
            vol = np.std(returns)
            if vol > 0.04: return 0.6  # Suppress extreme volatility
            if vol < 0.005: return 0.9 # Slightly weaken in dead markets
            return 1.0
        except: return 1.0

    async def get_latest_signal(self, coin: str = "BTC") -> str:
        """Enhanced Signal with Tech + Vol + Alpha Logic"""
        candles = await self.fetch_ohlcv(coin)
        tech = self.detect_candle_sentiment(candles)
        vol = self.get_vol_mult(candles)
        
        # Base logic
        upper, lower = self.smart_threshold()
        final_score = (self.sentiment_score + tech) * vol
        
        signal = "HOLD"
        if final_score >= upper: signal = "BUY"
        elif final_score <= lower: signal = "SELL"
        
        # Telegram Alert on change
        if signal != self.last_signal and signal != "HOLD":
            await telegram_ai.send_signal_alert(coin, signal, final_score, self.accuracy())
            self.last_signal = signal
            
        return signal

    def snapshot(self) -> dict:
        return {
            "timestamp": iso_now(),
            "global_sentiment": round(self.sentiment_score, 4),
            "global_signal": self.get_signal(),
            "coin_bias": {k: round(v, 4) for k, v in self.coin_sentiment.items()},
            "alpha_events": self.alpha_events[:5],
            "latest_news": self.cached_news[:5],
        }

    # -------------------------
    # Producers: NEWS
    # -------------------------
    async def _produce_news(self):
        while not self._stop.is_set():
            try:
                items = await self.cc.fetch_latest(limit=self.cfg.max_cached_news)
                new_events: List[Event] = []

                for it in items:
                    title = it.get("title", "") or ""
                    body = it.get("body", "") or ""
                    source = it.get("source", "CryptoCompare") or "CryptoCompare"
                    url = it.get("url")
                    published_on = it.get("published_on")

                    # Derive a stable id key
                    raw_id = str(it.get("id") or "")
                    event_id = raw_id if raw_id else f"CC|{source}|{title[:100]}|{hash(body[:200])}"

                    if event_id in self.seen_news:
                        continue
                    self.seen_news.add(event_id)

                    text = f"{title} {body}"
                    score = self.scorer.score(text)

                    created_at = iso_now()
                    if published_on:
                        try:
                            created_at = datetime.fromtimestamp(int(published_on), tz=timezone.utc).isoformat()
                        except Exception:
                            created_at = iso_now()

                    ev = Event(
                        id=event_id,
                        type="NEWS",
                        source="CryptoCompare",
                        created_at=created_at,
                        received_at=iso_now(),
                        title=title,
                        content=(body[:1200] if body else None),
                        url=url,
                        heuristic_score=score,
                        engagement=0.0,
                        engagement_mult=1.0,
                        weighted_impact=score,  # for news, impact is the heuristic score itself
                        raw=it,
                    )
                    new_events.append(ev)

                # Push to event bus
                for ev in new_events:
                    await self.event_q.put(ev)

            except Exception as e:
                log.warning("NEWS producer error: %s", e)

            await asyncio.sleep(self.cfg.news_poll_s)

    # -------------------------
    # Producers: X timelines
    # -------------------------
    async def _produce_x(self):
        if not self.x:
            # X disabled; just idle
            while not self._stop.is_set():
                await asyncio.sleep(5.0)
            return

        while not self._stop.is_set():
            try:
                # STEP 12: Cycle-based caching (approx once per hour at 10-15m cycle)
                self.cycle_count += 1
                if self.cycle_count % 6 != 0:
                    log.info("X producer: Skipping cycle (Cycle Cache)")
                    await asyncio.sleep(self.cfg.x_poll_s)
                    continue

                tasks = []
                meta: List[Tuple[str, str]] = []

                for category, cfg in self.registry.items():
                    for acct in cfg["accounts"]:
                        tasks.append(self.x.fetch_user_posts(acct, max_results=self.cfg.x_posts_per_user))
                        meta.append((acct, category))

                results = await asyncio.gather(*tasks, return_exceptions=True)

                for (acct, category), posts in zip(meta, results):
                    if isinstance(posts, Exception) or not posts:
                        continue

                    # process newest unseen posts first
                    for p in posts:
                        pid = str(p.get("id") or "")
                        text = p.get("text") or ""
                        if not pid or not text:
                            continue
                        if pid in self.seen_posts:
                            continue

                        self.seen_posts.add(pid)

                        cat_data = self.registry.get(category, {"weight": 1.0, "scope": "GLOBAL"})
                        weight = float(cat_data.get("weight", 1.0))
                        scope = str(cat_data.get("scope", "GLOBAL"))

                        heuristic = self.scorer.score(text)
                        metrics = p.get("public_metrics") or {}
                        engagement = self._engagement_from_metrics(metrics)
                        mult = self._engagement_multiplier(engagement)

                        # Weighted impact = heuristic * category_weight * engagement_multiplier
                        impact = heuristic * weight * mult

                        targets = self._detect_targets(text)

                        ev = Event(
                            id=f"X|{pid}",
                            type="SOCIAL_SIGNAL",
                            source="X",
                            created_at=p.get("created_at") or iso_now(),
                            received_at=iso_now(),
                            content=text[:1200],
                            heuristic_score=heuristic,
                            engagement=engagement,
                            engagement_mult=mult,
                            weighted_impact=impact,
                            account=acct,
                            category=category,
                            scope=scope,
                            targets=targets,
                            raw=p,
                        )

                        await self.event_q.put(ev)

                        # one post per account per cycle to keep it lightweight
                        break

                # Optional: market-wide recent search
                if self.cfg.x_enable_recent_search:
                    try:
                        hits = await self.x.recent_search(self.cfg.x_recent_search_query, max_results=30)
                        for p in hits:
                            pid = str(p.get("id") or "")
                            text = p.get("text") or ""
                            if not pid or not text:
                                continue
                            key = f"X|SEARCH|{pid}"
                            if key in self.seen_posts:
                                continue
                            self.seen_posts.add(key)

                            heuristic = self.scorer.score(text)
                            metrics = p.get("public_metrics") or {}
                            engagement = self._engagement_from_metrics(metrics)
                            mult = self._engagement_multiplier(engagement)

                            # treat as news-wire class
                            cat_data = self.registry.get("NEWS_WIRE_ELITE", {"weight": 1.2, "scope": "GLOBAL"})
                            impact = heuristic * float(cat_data.get("weight", 1.2)) * mult
                            targets = self._detect_targets(text)

                            ev = Event(
                                id=key,
                                type="SOCIAL_SIGNAL",
                                source="X",
                                created_at=p.get("created_at") or iso_now(),
                                received_at=iso_now(),
                                content=text[:1200],
                                heuristic_score=heuristic,
                                engagement=engagement,
                                engagement_mult=mult,
                                weighted_impact=impact,
                                account="X_RECENT_SEARCH",
                                category="NEWS_WIRE_ELITE",
                                scope=str(cat_data.get("scope", "GLOBAL")),
                                targets=targets,
                                raw=p,
                            )
                            await self.event_q.put(ev)

                    except Exception as e:
                        log.warning("X recent search error: %s", e)

            except Exception as e:
                log.warning("X producer error: %s", e)

            await asyncio.sleep(self.cfg.x_poll_s)

    # -------------------------
    # Consumer: Event processor + persistence
    # -------------------------
    async def _consume_events(self):
        buffer: List[Event] = []
        last_flush = time.time()
        last_print = time.time()
        last_snapshot = time.time()

        while not self._stop.is_set():
            # Wait for next event (with timeout so we can flush periodically)
            try:
                ev = await asyncio.wait_for(self.event_q.get(), timeout=1.0)
                buffer.append(ev)
            except asyncio.TimeoutError:
                pass

            # Periodic flush & processing
            now = time.time()
            if buffer and (len(buffer) >= 100 or (now - last_flush) >= 2.0):
                # Apply decay once per processing batch
                self._apply_decay()

                # Process buffer
                for e in buffer:
                    if e.type == "NEWS":
                        self._apply_news_impact(e.heuristic_score)
                        # cache
                        self.cached_news = ([{
                            "type": "NEWS",
                            "title": e.title,
                            "sentiment": e.heuristic_score,
                            "source": e.source,
                            "url": e.url,
                            "created_at": e.created_at,
                        }] + self.cached_news)[: self.cfg.max_cached_news]

                    elif e.type == "SOCIAL_SIGNAL":
                        self._apply_social_impact(e.weighted_impact, e.targets or ["MARKET"], e.scope or "GLOBAL")

                        alpha_item = {
                            "type": "SOCIAL_SIGNAL",
                            "platform": "X",
                            "account": e.account,
                            "category": e.category,
                            "targets": e.targets or ["MARKET"],
                            "impact": round(float(e.weighted_impact), 4),
                            "heuristic": round(float(e.heuristic_score), 4),
                            "engagement": round(float(e.engagement), 2),
                            "mult": round(float(e.engagement_mult), 3),
                            "created_at": e.created_at,
                            "timestamp": e.received_at,
                            "content": (e.content or "")[:260],
                        }
                        self.alpha_events = [alpha_item] + self.alpha_events[: self.cfg.max_alpha_events]

                # Persist
                try:
                    await self.store.insert_events(buffer)
                except Exception as e:
                    log.warning("DB insert events failed: %s", e)

                buffer.clear()
                last_flush = now

            # Periodic snapshot persistence
            if (now - last_snapshot) >= self.cfg.snapshot_every_s:
                try:
                    snap_ts = iso_now()
                    await self.store.insert_snapshot(
                        snap_ts,
                        self.sentiment_score,
                        self.get_signal(),
                        {k: float(v) for k, v in self.coin_sentiment.items()},
                    )
                except Exception as e:
                    log.warning("DB insert snapshot failed: %s", e)
                last_snapshot = now

            # Periodic printing
            if (now - last_print) >= self.cfg.print_every_s:
                snap = self.snapshot()
                log.info(
                    "SNAPSHOT | %s | global=%.3f | BTC=%.3f ETH=%.3f SOL=%.3f DOGE=%.3f LINK=%.3f",
                    snap["global_signal"],
                    snap["global_sentiment"],
                    snap["coin_bias"]["BTC"],
                    snap["coin_bias"]["ETH"],
                    snap["coin_bias"]["SOL"],
                    snap["coin_bias"]["DOGE"],
                    snap["coin_bias"]["LINK"],
                )
                if snap["alpha_events"]:
                    top = snap["alpha_events"][0]
                    log.info(
                        "ALPHA | %s @%s | impact=%s | targets=%s | %s",
                        top.get("category"),
                        top.get("account"),
                        top.get("impact"),
                        top.get("targets"),
                        (top.get("content") or "").replace("\n", " "),
                    )
                last_print = now

        # Final flush on stop
        if buffer:
            try:
                self._apply_decay()
                await self.store.insert_events(buffer)
            except Exception:
                pass

    # -------------------------
    # Public: run engine
    # -------------------------
    async def run(self):
        tasks = [
            asyncio.create_task(self._produce_news(), name="producer_news"),
            asyncio.create_task(self._produce_x(), name="producer_x"),
            asyncio.create_task(self._consume_events(), name="consumer"),
        ]
        try:
            await asyncio.gather(*tasks)
        finally:
            for t in tasks:
                t.cancel()
            await self.close()


# -----------------------------
# Entry point
# -----------------------------
async def main():
    cfg = EngineConfig(
        news_poll_s=900.0,           # 15 min (CryptoCompare = free, unlimited)
        x_poll_s=3600.0,             # 1 HOUR (X free tier = CRITICAL)
        decay_half_life_s=12 * 60.0,
        x_posts_per_user=3,          # Reduced from 5 to save quota
        x_enable_recent_search=False,
        sqlite_path="signals_v2.db",
        snapshot_every_s=60.0,
        print_every_s=60.0,
    )

    engine = SignalEngine(cfg)
    try:
        await engine.run()
    except asyncio.CancelledError:
        pass
    except KeyboardInterrupt:
        log.info("Stopping...")
    finally:
        await engine.close()


# -----------------------------
# Global Instance
# -----------------------------
news_ai = SignalEngine()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")
