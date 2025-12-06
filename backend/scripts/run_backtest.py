"""
Run backtest on historical data.

Usage:
    cd backend
    python scripts/run_backtest.py
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from binance.client import Client
import pandas as pd
from app.ml.features import add_indicators, FEATURE_COLUMNS
from app.ml.trainer import ModelTrainer
from app.ml.model import MLModel
from app.ml.backtest import generate_signals, run_futures_backtest, BACKTEST_CONFIG

CONFIG = {
    "symbol": "BTCUSDT",
    "timeframe": "15m",
    "limit": 1500,
    "prediction_horizon": 3,
    "up_threshold": 0.002,
    "down_threshold": -0.002,
}


def fetch_ohlcv(symbol="BTCUSDT", interval="15m", limit=1000):
    """Fetch OHLCV from Binance."""
    client = Client("", "")
    try:
        klines = client.futures_klines(symbol=symbol, interval=interval, limit=limit)
    except Exception as e:
        print(f"Error: {e}")
        return None
    
    if not klines:
        return None
    
    df = pd.DataFrame(klines, columns=[
        "timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_asset_volume", "num_trades",
        "taker_buy_base", "taker_buy_quote", "ignore"
    ])
    
    df = df[["timestamp", "open", "high", "low", "close", "volume"]]
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df[["open", "high", "low", "close", "volume"]] = df[["open", "high", "low", "close", "volume"]].astype(float)
    df.set_index("timestamp", inplace=True)
    return df


def main():
    print("=" * 60)
    print("BACKTESTING TRADING STRATEGY")
    print("=" * 60)
    
    # 1) Load model
    print("\n📦 Loading model...")
    try:
        model = MLModel()
        model.load()
        print("✅ Model loaded")
    except FileNotFoundError:
        print("❌ model.pkl not found. Train the model first!")
        print("   Run: python -m app.ml.train_model")
        return
    
    # 2) Fetch data
    print(f"\n📊 Fetching {CONFIG['limit']} candles for {CONFIG['symbol']}...")
    df_raw = fetch_ohlcv(CONFIG["symbol"], CONFIG["timeframe"], limit=CONFIG["limit"])
    if df_raw is None:
        print("❌ Failed to fetch data")
        return
    print(f"✅ Fetched {len(df_raw)} candles")
    
    # 3) Add indicators
    print("\n🔧 Adding indicators...")
    df_feat = add_indicators(df_raw)
    
    # 4) Create labels
    trainer = ModelTrainer()
    df_labeled = trainer.create_labels(
        df_feat,
        horizon=CONFIG["prediction_horizon"],
        up_th=CONFIG["up_threshold"],
        down_th=CONFIG["down_threshold"]
    )
    
    # 5) Generate signals
    print("\n🤖 Generating signals...")
    df_bt = generate_signals(df_labeled, model, FEATURE_COLUMNS, BACKTEST_CONFIG)
    
    # 6) Run backtest
    print("\n📈 Running backtest...")
    stats, equity_df, trades_df = run_futures_backtest(df_bt, BACKTEST_CONFIG)
    
    # 7) Print results
    print("\n" + "=" * 60)
    print("BACKTEST RESULTS")
    print("=" * 60)
    for k, v in stats.items():
        print(f"{k}: {round(v, 4) if isinstance(v, float) else v}")
    
    if len(trades_df) > 0:
        print(f"\n📊 Sample trades (first 10):")
        print(trades_df.head(10).to_string())
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

