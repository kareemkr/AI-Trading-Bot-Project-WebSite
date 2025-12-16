import time
import pandas as pd
import numpy as np
import ta
import math
import logging
from datetime import datetime, timedelta
from binance.client import Client
from binance.exceptions import BinanceAPIException
from sklearn.ensemble import GradientBoostingClassifier
import os

# CONFIG
CONFIG = {
    "symbol": "BTCUSDT",
    "timeframe": "15m",
    "limit": 1500,
    "prediction_horizon": 3,
    "train_split_ratio": 0.8,
}

SCANNER_CONFIG = {
    "interval": "15m",
    "limit": 250,
    "min_abs_score": 0.07,
    "top_n_symbols": 40,
}

RISK_CONFIG = {
    "max_leverage": 10,
    "risk_per_trade": 0.02,
    "min_atr_pct": 0.001,
    "max_atr_pct": 0.05,
    "min_quote_volume_24h": 5_000_000,
}

class RealTradingBot:
    def __init__(self):
        self.running = False
        self.client = None
        self.model = None
        self.feature_cols = [
            "open", "high", "low", "close", "volume",
            "return",
            "ema_9", "ema_21", "ema_50", "ema_200",
            "rsi_14", "atr_14", "atr_pct",
            "vol_sma_20", "vol_ratio",
            "ema_9_21_diff", "ema_21_50_diff",
            "above_200_ema"
        ]
        self.logger = None

    def set_logger(self, logger_func):
        self.logger = logger_func

    def log(self, msg):
        if self.logger:
            self.logger(msg)
        else:
            print(f"[BOT] {msg}")

    def connect(self, api_key=None, api_secret=None):
        # Use provided keys, or fallback to env
        key = api_key or os.getenv("BINANCE_API_KEY")
        secret = api_secret or os.getenv("BINANCE_API_SECRET")

        if not key or not secret:
            raise ValueError("Missing BINANCE_API_KEY or BINANCE_API_SECRET")
            
        self.client = Client(key, secret)
        self.log("Connected to Binance Futures")

    def fetch_ohlcv(self, symbol, interval, limit):
        try:
            # Using public client if self.client not set, purely for fetch? 
            # Actually self.client can fetch this too.
            klines = self.client.futures_klines(symbol=symbol, interval=interval, limit=limit)
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
        except Exception as e:
            self.log(f"Error fetching data for {symbol}: {e}")
            return None

    def add_indicators(self, df):
        df = df.copy()
        df["return"] = df["close"].pct_change()
        df["ema_9"] = df["close"].ewm(span=9, adjust=False).mean()
        df["ema_21"] = df["close"].ewm(span=21, adjust=False).mean()
        df["ema_50"] = df["close"].ewm(span=50, adjust=False).mean()
        df["ema_200"] = df["close"].ewm(span=200, adjust=False).mean()
        df["rsi_14"] = ta.momentum.rsi(df["close"], window=14)
        df["atr_14"] = ta.volatility.average_true_range(df["high"], df["low"], df["close"], window=14)
        df["vol_sma_20"] = df["volume"].rolling(window=20).mean()
        df["ema_9_21_diff"] = df["ema_9"] - df["ema_21"]
        df["ema_21_50_diff"] = df["ema_21"] - df["ema_50"]
        df["atr_pct"] = df["atr_14"] / df["close"]
        df["vol_ratio"] = df["volume"] / df["vol_sma_20"]
        df["above_200_ema"] = (df["close"] > df["ema_200"]).astype(int)
        df.dropna(inplace=True)
        return df

    def create_labels(self, df):
        df = df.copy()
        horizon = CONFIG["prediction_horizon"]
        df["future_price"] = df["close"].shift(-horizon)
        df["future_return"] = (df["future_price"] - df["close"]) / df["close"]
        df["label"] = np.where(df["future_return"] > 0.002, 1,
                      np.where(df["future_return"] < -0.002, -1, 0))
        df.dropna(inplace=True)
        return df

    def train_model(self):
        self.log("fetching training data...")
        df = self.fetch_ohlcv(CONFIG["symbol"], CONFIG["timeframe"], CONFIG["limit"])
        if df is None: return False
        
        df = self.add_indicators(df)
        df = self.create_labels(df)
        
        X = df[self.feature_cols].values
        y = df["label"].values
        
        split = int(len(df) * CONFIG["train_split_ratio"])
        X_train, y_train = X[:split], y[:split]
        
        self.log(f"Training model on {len(X_train)} samples...")
        self.model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.05, max_depth=3, random_state=42)
        self.model.fit(X_train, y_train)
        self.log("Model trained successfully.")
        return True

    def get_top_symbols(self):
        info = self.client.futures_exchange_info()
        usdt_perps = [s["symbol"] for s in info["symbols"] if s["quoteAsset"] == "USDT" and s["contractType"] == "PERPETUAL"]
        tickers = self.client.futures_ticker()
        candidates = []
        for t in tickers:
            if t["symbol"] in usdt_perps:
                candidates.append((t["symbol"], float(t["quoteVolume"])))
        ranked = sorted(candidates, key=lambda x: x[1], reverse=True)[:SCANNER_CONFIG["top_n_symbols"]]
        return [x[0] for x in ranked]

    def compute_signal(self, symbol):
        df = self.fetch_ohlcv(symbol, SCANNER_CONFIG["interval"], 300)
        if df is None or len(df) < 50: return None
        
        df = self.add_indicators(df)
        if df.empty: return None
        
        last_row = df.tail(1)
        X_live = last_row[self.feature_cols].values
        
        prob = self.model.predict_proba(X_live)[0]
        # Classes might not be [-1, 0, 1] always if not all labels existed in train
        # Safe mapping
        classes = self.model.classes_
        p_long = prob[list(classes).index(1)] if 1 in classes else 0
        p_short = prob[list(classes).index(-1)] if -1 in classes else 0
        
        score = p_long - p_short
        price = float(last_row["close"].iloc[0])
        atr = float(last_row["atr_14"].iloc[0])
        
        return {
            "symbol": symbol,
            "score": score,
            "price": price,
            "atr": atr,
            "signal": "LONG" if score > 0.07 else ("SHORT" if score < -0.07 else "NEUTRAL")
        }

    def place_trade(self, signal_data):
        symbol = signal_data["symbol"]
        side = "BUY" if signal_data["signal"] == "LONG" else "SELL"
        price = signal_data["price"]
        
        # Quantity logic
        balance = 50.0 # Hardcoded as per user req (or fetch real)
        risk_qty = (balance * 0.02) / signal_data["atr"] # 2% risk / ATR
        
        # Rounding (simplified)
        qty = round(risk_qty, 3) 
        if qty <= 0: return
        
        self.log(f"🚀 EXECUTING LIVE TRADE: {side} {qty} {symbol} @ {price}")
        
        # REAL TRADING ENABLED
        try:
            self.client.futures_create_order(symbol=symbol, side=side, type="MARKET", quantity=qty)
            self.log(f"✅ Trade executed successfully: {side} {symbol}")
        except Exception as e:
            self.log(f"❌ Trade failed: {e}")

    def set_leverage(self, leverage):
        try:
            self.client.futures_change_leverage(symbol=CONFIG["symbol"], leverage=leverage)
            self.log(f"✅ Leverage set to {leverage}x")
        except Exception as e:
            self.log(f"❌ Failed to set leverage: {e}")

    def run(self, api_key=None, api_secret=None, leverage=1):
        self.running = True
        try:
            self.connect(api_key, api_secret)
            self.set_leverage(leverage)
            
            if not self.train_model():
                self.log("Model training failed. Stopping.")
                return

            self.log("Starting scanning loop...")
            while self.running:
                symbols = self.get_top_symbols()
                best_signal = None
                best_score = 0
                
                for sym in symbols:
                    if not self.running: break
                    sig = self.compute_signal(sym)
                    if sig and abs(sig["score"]) > abs(best_score):
                        best_score = sig["score"]
                        best_signal = sig
                
                if best_signal and abs(best_score) > 0.07:
                    self.log(f"Found opportunity: {best_signal['symbol']} Score: {best_signal['score']:.2f}")
                    self.place_trade(best_signal)
                else:
                    self.log("No strong signals found.")
                
                # Sleep
                for _ in range(60):
                    if not self.running: break
                    time.sleep(1)
                    
        except Exception as e:
            self.log(f"Critical Error: {e}")
        finally:
            self.running = False

    def stop(self):
        self.running = False
