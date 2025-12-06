import pandas as pd
import numpy as np
import ta
from app.trading.binance_client import BinanceClient


class MarketScanner:
    def __init__(self, client: BinanceClient):
        self.client = client   # Use Binance wrapper, NOT direct python-binance

    def fetch_ohlcv(self, symbol: str, interval: str = "15m", limit: int = 500):
        data = self.client.get_klines(symbol, interval, limit)
        if data is None:
            return None

        df = pd.DataFrame(data, columns=[
            "timestamp", "open", "high", "low", "close", "volume",
            "close_time", "qav", "num_trades", "tb_base", "tb_quote", "ignore"
        ])

        df = df[["timestamp", "open", "high", "low", "close", "volume"]]
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit='ms')
        df[["open", "high", "low", "close", "volume"]] = df[["open", "high", "low", "close", "volume"]].astype(float)
        df.set_index("timestamp", inplace=True)

        return df

    def get_top_symbols(self, count=20):
        tickers = self.client.get_tickers()
        if tickers is None:
            return []

        filtered = []
        for t in tickers:
            if t.get("symbol", "").endswith("USDT"):
                vol = float(t.get("quoteVolume", 0))
                filtered.append((t["symbol"], vol))

        sorted_tokens = sorted(filtered, key=lambda x: x[1], reverse=True)
        return [s[0] for s in sorted_tokens[:count]]


def build_features(df):
    """Compute real-time technical indicators exactly like training."""
    try:
        df["rsi"] = ta.momentum.RSIIndicator(df["close"], window=14).rsi()
        df["ema_20"] = ta.trend.EMAIndicator(df["close"], window=20).ema_indicator()
        df["ema_50"] = ta.trend.EMAIndicator(df["close"], window=50).ema_indicator()
        df["macd"] = ta.trend.MACD(df["close"]).macd()

        last = df.iloc[-1]

        return {
            "rsi": last["rsi"],
            "ema_20": last["ema_20"],
            "ema_50": last["ema_50"],
            "macd": last["macd"]
        }

    except Exception as e:
        print("[ML] Feature error:", e)
        return None
