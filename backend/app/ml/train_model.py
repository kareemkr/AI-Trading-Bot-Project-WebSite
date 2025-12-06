import pandas as pd
import numpy as np
import ta
import pickle
from binance.client import Client
from datetime import datetime, timedelta
import os

# === Load environment variables (testnet or real — doesn’t matter for data) ===
API_KEY = os.getenv("BINANCE_API_KEY", "")
API_SECRET = os.getenv("BINANCE_API_SECRET", "")

client = Client(API_KEY, API_SECRET)

# === PARAMETERS ===
SYMBOL = "BTCUSDT"
INTERVAL = Client.KLINE_INTERVAL_5MINUTE
LIMIT = 1000  # number of candles

def download_candles():
    """Download historical data from Binance."""
    print("[ML] Downloading historical candles...")

    klines = client.get_klines(symbol=SYMBOL, interval=INTERVAL, limit=LIMIT)

    df = pd.DataFrame(klines, columns=[
        "time", "open", "high", "low", "close", "volume",
        "close_time", "quote_asset_volume", "num_trades",
        "taker_buy_volume", "taker_buy_quote_volume", "ignore"
    ])

    # convert numeric values
    for col in ["open", "high", "low", "close", "volume"]:
        df[col] = df[col].astype(float)

    return df


def add_features(df):
    """Add ML indicators."""
    print("[ML] Adding technical indicators...")

    df["rsi"] = ta.momentum.RSIIndicator(df["close"], window=14).rsi()
    df["ema_20"] = ta.trend.EMAIndicator(df["close"], window=20).ema_indicator()
    df["ema_50"] = ta.trend.EMAIndicator(df["close"], window=50).ema_indicator()
    df["macd"] = ta.trend.MACD(df["close"]).macd()

    df = df.dropna()
    return df


def create_labels(df):
    """Label data: 1 = BUY, -1 = SELL, 0 = HOLD."""
    print("[ML] Creating trade labels...")

    df["future_close"] = df["close"].shift(-3)
    df["signal"] = 0
    df.loc[df["future_close"] > df["close"] * 1.002, "signal"] = 1
    df.loc[df["future_close"] < df["close"] * 0.998, "signal"] = -1
    df = df.dropna()

    return df


def train_model(df):
    """Train RandomForest model."""
    from sklearn.ensemble import RandomForestClassifier

    print("[ML] Training model...")

    X = df[["rsi", "ema_20", "ema_50", "macd"]]
    y = df["signal"]

    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)

    return model


def save_model(model):
    """Save model to pkl file."""
    path = "app/ml/models/model.pkl"

    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as f:
        pickle.dump(model, f)

    print("[ML] Model saved to:", path)


if __name__ == "__main__":
    print("=== ML MODEL TRAINING STARTED ===")

    df = download_candles()
    df = add_features(df)
    df = create_labels(df)
    model = train_model(df)
    save_model(model)

    print("=== ML MODEL TRAINING COMPLETE ===")
