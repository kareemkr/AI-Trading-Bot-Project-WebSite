import pandas as pd
import numpy as np
import ta

def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["return"] = df["close"].pct_change()

    # EMAs
    df["ema_9"] = df["close"].ewm(span=9, adjust=False).mean()
    df["ema_21"] = df["close"].ewm(span=21, adjust=False).mean()
    df["ema_50"] = df["close"].ewm(span=50, adjust=False).mean()
    df["ema_200"] = df["close"].ewm(span=200, adjust=False).mean()

    # RSI
    df["rsi_14"] = ta.momentum.rsi(df["close"], window=14)

    # ATR
    df["atr_14"] = ta.volatility.average_true_range(
        df["high"], df["low"], df["close"], window=14
    )

    # Volume MA
    df["vol_sma_20"] = df["volume"].rolling(20).mean()

    # Derived features
    df["ema_9_21_diff"] = df["ema_9"] - df["ema_21"]
    df["ema_21_50_diff"] = df["ema_21"] - df["ema_50"]
    df["atr_pct"] = df["atr_14"] / df["close"]
    df["vol_ratio"] = df["volume"] / df["vol_sma_20"]
    df["above_200_ema"] = (df["close"] > df["ema_200"]).astype(int)

    df.dropna(inplace=True)
    return df


FEATURE_COLUMNS = [
    "open","high","low","close","volume",
    "return",
    "ema_9","ema_21","ema_50","ema_200",
    "rsi_14",
    "atr_14","atr_pct",
    "vol_sma_20","vol_ratio",
    "ema_9_21_diff","ema_21_50_diff",
    "above_200_ema"
]
