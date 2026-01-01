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
import feedparser
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
from app.database.session import AsyncSessionLocal
from app.models.bot import Signal as SignalModel
from sqlalchemy import select, update
from dateutil import parser as date_parser

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

        except Exception as e: # Catch all for retries
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
class PostgresStore:
    """
    Refactored persistence layer using PostgreSQL and SQLAlchemy.
    """
    def __init__(self):
        self._lock = asyncio.Lock()

    async def insert_events(self, events: List[Event]) -> None:
        if not events:
            return
        
        async with AsyncSessionLocal() as db:
            async with self._lock:
                for e in events:
                    # Parse dates safely
                    try:
                        c_at = date_parser.parse(e.created_at) if e.created_at else utc_now()
                        r_at = date_parser.parse(e.received_at) if e.received_at else utc_now()
                    except:
                        c_at = r_at = utc_now()

                    stmt = select(SignalModel).where(SignalModel.id == e.id)
                    existing = await db.execute(stmt)
                    if existing.scalar_one_or_none():
                        continue

                    sig = SignalModel(
                        id=e.id,
                        type=e.type,
                        source=e.source,
                        created_at=c_at,
                        received_at=r_at,
                        title=e.title,
                        content=e.content,
                        url=e.url,
                        heuristic_score=float(e.heuristic_score),
                        engagement=float(e.engagement),
                        weighted_impact=float(e.weighted_impact),
                        account=e.account,
                        category=e.category,
                        scope=e.scope,
                        targets=e.targets
                    )
                    db.add(sig)
                await db.commit()

    async def insert_snapshot(self, ts: str, global_sentiment: float, global_signal: str, coin_bias: Dict[str, float]) -> None:
        # In a full-real DB, we could store periodic snapshots in a dedicated table.
        # For now, we focus on Signal persistence as it's the core data.
        pass

    async def close(self) -> None:
        pass


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
            http2=False,
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
        return resp.json().get("Data") or []
# -----------------------------
# Yahoo Finance RSS fetcher
# -----------------------------
class YahooFinanceNews:
    RSS_URLS = {
        "BTC": "https://finance.yahoo.com/rss/headline?s=BTC-USD",
        "ETH": "https://finance.yahoo.com/rss/headline?s=ETH-USD",
        "SOL": "https://finance.yahoo.com/rss/headline?s=SOL-USD",
        "DOGE": "https://finance.yahoo.com/rss/headline?s=DOGE-USD",
        "COIN": "https://finance.yahoo.com/rss/headline?s=COIN", # Coinbase stock as proxy
    }

    def __init__(self):
        pass

    async def fetch_latest(self) -> List[dict]:
        """Async fetch of RSS feeds using executor since feedparser is blocking"""
        loop = asyncio.get_event_loop()
        all_items = []
        
        for coin, url in self.RSS_URLS.items():
            try:
                # Run feedparser in thread pool to avoid blocking async loop
                feed = await loop.run_in_executor(None, feedparser.parse, url)
                
                for entry in feed.entries[:5]: # Top 5 per coin
                    all_items.append({
                        "title": entry.title,
                        "link": entry.link,
                        "published": entry.published if hasattr(entry, 'published') else iso_now(),
                        "summary": entry.summary if hasattr(entry, 'summary') else "",
                        "source": "YahooFinance",
                        "coin_tag": coin
                    })
            except Exception as e:
                log.warning(f"Yahoo RSS error for {coin}: {e}")
                
        return all_items


# -----------------------------
# Engine config
# -----------------------------
@dataclass
class EngineConfig:
    # polling (FREE-TIER SAFE)
    news_poll_s: float = 60.0    # 1 min for news (CryptoCompare = unlimited)
    yahoo_poll_s: float = 30.0   # 30 sec for Yahoo Finance (RSS)
    x_poll_s: float = 1200.0     # 20 min for X (Reduced for activity, but careful with free tier)

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
class SignalEngine:
    def __init__(self, cfg: Optional[EngineConfig] = None):
        self.cfg = cfg or EngineConfig()
        self.logger = None

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
        self.alpha_events: List[dict] = []

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
            http2=False,
        )

        # CryptoCompare
        self.cc = CryptoCompareNews(self.http, api_key=os.getenv("CRYPTOCOMPARE_API_KEY"))

        # Yahoo Finance
        self.yf = YahooFinanceNews()

        # X client (optional)
        self.x: Optional[XClient] = None
        bearer = os.getenv("X_BEARER_TOKEN")
        if bearer:
            self.x = XClient(bearer)
        else:
            log.warning("X_BEARER_TOKEN not set -> X ingestion disabled.")

        # Persistence
        self.store = PostgresStore()

        # Shutdown & Event Bus
        self._stop = asyncio.Event()
        self.event_q = asyncio.Queue(maxsize=self.cfg.queue_maxsize)

    def set_logger(self, logger_func):
        self.logger = logger_func

    def log_msg(self, msg: str, level: str = "INFO"):
        if self.logger:
            try:
                # Check if the logger supports the module argument (BotManager.log does)
                self.logger(msg, level, module="NewsEngine")
            except TypeError:
                self.logger(msg, level)
        if level == "INFO":
            log.info(msg)
        elif level == "WARNING":
            log.warning(msg)
        elif level == "ERROR":
            log.error(msg)

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
        # Cap impact to prevent runaway bias
        impact = max(-0.4, min(0.4, impact))

        # Global
        self.sentiment_score = clamp01(self.sentiment_score + impact * 0.10)

        # Per-coin
        for tgt in targets[:2]:
            if tgt in self.coin_sentiment:
                self.coin_sentiment[tgt] = clamp01(self.coin_sentiment[tgt] + impact * 0.20)

    def _apply_news_impact(self, heuristic_score: float):
        """
        News should SHIFT, not RESET.
        """
        impact = heuristic_score * 0.08  # small, controlled
        before = self.sentiment_score
        self.sentiment_score = clamp01(self.sentiment_score + impact)
        after = self.sentiment_score
        
        self.log_msg(f"NEWS_IMPACT | before={before:.3f} score={heuristic_score:+.2f} impact={impact:+.3f} after={after:.3f}")

    # -------------------------
    # Public getters
    # -------------------------
    def get_signal(self) -> dict:
        """
        Calculates signal, confidence, and drivers (Roadmap Phase 3).
        """
        signal = "NEUTRAL"
        if self.sentiment_score > 0.62:
            signal = "BULLISH"
        elif self.sentiment_score < 0.38:
            signal = "BEARISH"

        drivers = []
        confidence = 0.0

        # 1. Base confidence from news volume
        news_count = len(self.cached_news)
        base = min(0.5, news_count * 0.1)
        confidence += base
        if base > 0:
            drivers.append("CUMULATIVE_NEWS_FLOW")

        # 2. Alpha bonus
        if self.alpha_events:
            confidence += 0.3
            drivers.append("X_ALPHA_CONFIRMED")

        # 3. Extremity bonus
        if self.sentiment_score > 0.75 or self.sentiment_score < 0.25:
            confidence += 0.2
            drivers.append("EXTREME_SENTIMENT")

        # Final Normalization (min 1.0)
        confidence = min(1.0, confidence)

        return {
            "signal": signal,
            "confidence": round(confidence, 2),
            "drivers": drivers
        }

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
        now = datetime.now(timezone.utc)
        weekday = now.weekday()  # 0=Monday, 6=Sunday
        hour = now.hour
        
        if weekday >= 5: # Saturday or Sunday
            return "WEEKEND_LOW_LIQUIDITY"
        
        if weekday == 0 and hour < 4:
            return "MONDAY_OPEN_GAP_RISK"
            
        if 13 <= hour <= 20: # 1:00 PM - 8:00 PM UTC
            return "NY_INSTITUTIONAL_PEAK"
        
        if 8 <= hour <= 12: # 8 AM - 12 PM UTC
            return "LONDON_LIQUIDITY_SURGE"
            
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
        self.log_msg("📡 Initializing News Ingestion Protocol (CryptoCompare)...")
        while not self._stop.is_set():
            try:
                self.log_msg("🔍 Syncing latest market intelligence from CryptoCompare...")
                items = await self.cc.fetch_latest(limit=self.cfg.max_cached_news)
                self.log_msg(f"✅ CryptoCompare: Successfully synchronized {len(items)} neural data points.")
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

                    # CONTENT HASH DEDUPLICATION
                    content_key = f"HASH|{(title or '')[:80]}|{(body or '')[:120]}"
                    if content_key in self.seen_news:
                        log.debug(f"Skipping duplicate news (content hash match): {title[:50]}")
                        continue
                    self.seen_news.add(content_key)

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
                self.log_msg(f"NEWS producer error: {e}", "WARNING")

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
                    self.log_msg("X producer: Skipping cycle (Cycle Cache)")
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
                        self.log_msg(f"X recent search error: {e}", "WARNING")

            except Exception as e:
                self.log_msg(f"X producer error: {e}", "WARNING")

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
                        self.log_msg(f"🧠 NEURAL_ANALYSIS: News Sentiment Resolved [{e.heuristic_score:+.2f}] | {e.title[:60]}...")
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
                        self.log_msg(f"🧠 NEURAL_DECODER: Alpha Signal Decoded [{e.weighted_impact:+.2f}] | Source: @{e.account} | targets={e.targets}")

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
                    self.log_msg(f"DB insert events failed: {e}", "WARNING")

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
                    self.log_msg(f"DB insert snapshot failed: {e}", "WARNING")
                last_snapshot = now

            # Periodic printing
            if (now - last_print) >= self.cfg.print_every_s:
                snap = self.snapshot()
                self.log_msg(
                    f"SNAPSHOT | {snap['global_signal']} | global={snap['global_sentiment']:.3f} | BTC={snap['coin_bias']['BTC']:.3f} ETH={snap['coin_bias']['ETH']:.3f} SOL={snap['coin_bias']['SOL']:.3f} DOGE={snap['coin_bias']['DOGE']:.3f} LINK={snap['coin_bias']['LINK']:.3f}"
                )
                if snap["alpha_events"]:
                    top = snap["alpha_events"][0]
                    self.log_msg(
                        f"ALPHA | {top.get('category')} @{top.get('account')} | impact={top.get('impact')} | targets={top.get('targets')} | {(top.get('content') or '').replace('/n', ' ')}"
                    )
                last_print = now
            
            # Heartbeat to show consumer is alive
            if (now - last_flush) >= 30.0:
                self.log_msg("💓 Neural Processor Heartbeat: Monitoring event bus...")
                last_flush = now

        # Final flush on stop
        if buffer:
            try:
                self._apply_decay()
                await self.store.insert_events(buffer)
            except Exception:
                pass


    async def _produce_yahoo(self):
        """Producer: Yahoo Finance RSS"""
        self.log_msg("📡 Initializing Alpha Feed: Yahoo Finance RSS...")
        while not self._stop.is_set():
            try:
                # 1. Fetch
                self.log_msg("🔍 Scanning Yahoo Finance RSS for institutional shifts...")
                items = await self.yf.fetch_latest()
                
                # 2. Convert to Events
                buffer = []
                for item in items:
                    link = item.get("link", "")
                    # Dedup by link
                    if link in self.seen_news:
                        continue
                    self.seen_news.add(link)

                    # Score text
                    text = f"{item.get('title')} {item.get('summary')}"
                    score = self.scorer.score(text)
                    
                    # Normalize 'coin_tag' to target list
                    targets = [item.get("coin_tag", "MARKET")]
                    
                    ev = Event(
                        id=link,
                        type="NEWS",
                        source="YahooFinance",
                        created_at=item.get("published"),
                        received_at=iso_now(),
                        title=item.get("title"),
                        content=item.get("summary"),
                        url=link,
                        heuristic_score=score,
                        engagement=0.0, # RSS has no engagement metrics
                        targets=targets
                    )
                    buffer.append(ev)

                # 3. Ingest
                if buffer:
                    self.log_msg(f"Ingesting {len(buffer)} items from Yahoo Finance")
                    # Apply impact immediately
                    for e in buffer:
                        self.cached_news.insert(0, asdict(e))
                        # Keep cache small
                        if len(self.cached_news) > self.cfg.max_cached_news:
                            self.cached_news.pop()
                            
                        # Apply sentiment impact
                        self._apply_news_impact(e.heuristic_score)
                    
                    # Store DB
                    try:
                        await self.store.insert_events(buffer)
                    except: pass
                    
            except Exception as e:
                self.log_msg(f"Yahoo producer error: {e}", "WARNING")

            # Sleep
            await asyncio.sleep(self.cfg.yahoo_poll_s)

    # -------------------------
    # Public: run engine
    # -------------------------
    async def run(self):
        self.log_msg("🚀 GLOBAL NEURAL ENGINE ACTIVATED")
        self.log_msg(f"⚙️ Configuration: Poll_News={self.cfg.news_poll_s}s | Poll_Yahoo={self.cfg.yahoo_poll_s}s | Poll_X={self.cfg.x_poll_s}s")
        tasks = [
            asyncio.create_task(self._produce_news(), name="producer_news"),
            asyncio.create_task(self._produce_yahoo(), name="producer_yahoo"),
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
