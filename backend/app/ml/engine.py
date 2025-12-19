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
import requests
from app.services.news_service import news_ai
from app.services.telegram_service import telegram_ai

def send_telegram_msg(token, chat_id, message):
    if not token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        requests.post(url, json={"chat_id": chat_id, "text": message}, timeout=5)
    except Exception as e:
        print(f"Telegram error: {e}")

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
        self.public_client = Client("", "") # For public data
        self.is_virtual = False
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
            self.log("⚠️ No Binance keys provided. Entering SHADOW MODE (Signal Only).")
            self.is_virtual = True
            self.client = self.public_client
            return
            
        try:
            self.client = Client(key, secret)
            self.is_virtual = False
            self.log("✅ Securely connected to Binance Protocol.")
        except Exception as e:
            self.log(f"❌ Connection failed: {e}. Falling back to SHADOW MODE.")
            self.is_virtual = True
            self.client = self.public_client

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

    def get_account_info(self):
        """Fetches real balances and account health from Binance."""
        if self.is_virtual:
            return {
                "equity": 50000.0,
                "unrealized_pnl": 0.0,
                "total_wallet_balance": 50000.0,
                "available_balance": 50000.0,
                "mode": "SHADOW"
            }
        
        if not self.client:
            return None
        try:
            # Futures Account Balance
            balances = self.client.futures_account_balance()
            usdt_balance = next((b for b in balances if b['asset'] == 'USDT'), None)
            
            # Futures Account Details for PNL
            acc_info = self.client.futures_account()
            
            equity = float(usdt_balance['balance']) if usdt_balance else 0.0
            unrealized_pnl = float(acc_info['totalUnrealizedProfit'])
            
            return {
                "equity": equity,
                "unrealized_pnl": unrealized_pnl,
                "total_wallet_balance": float(acc_info['totalWalletBalance']),
                "available_balance": float(acc_info['availableBalance'])
            }
        except Exception as e:
            self.log(f"Error fetching account info: {e}")
            return None

    def get_trade_history(self, limit=10):
        """Fetches actual recent trade executions."""
        if not self.client:
            return []
        try:
            # Get list of recent trades for the account
            trades = self.client.futures_account_trades(limit=limit)
            formatted_trades = []
            for t in trades:
                formatted_trades.append({
                    "symbol": t['symbol'],
                    "type": "SELL" if t['side'] == 'SELL' else "BUY",
                    "price": f"${float(t['price']):,.2f}",
                    "pnl": f"{float(t['realizedPnl']):+.2f}",
                    "time": datetime.fromtimestamp(t['time']/1000).strftime('%H:%M:%S')
                })
            return formatted_trades
        except Exception as e:
            self.log(f"Error fetching trade history: {e}")
            return []
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

    async def compute_signal(self, symbol, use_news_ai=False):
        self.log(f"🔍 Analyzing {symbol} for patterns...")
        df = self.fetch_ohlcv(symbol, SCANNER_CONFIG["interval"], 300)
        if df is None or len(df) < 50: 
            self.log(f"⚠️ Insufficient data for {symbol}")
            return None
        
        df = self.add_indicators(df)
        if df.empty: return None
        
        last_row = df.tail(1)
        X_live = last_row[self.feature_cols].values
        
        prob = self.model.predict_proba(X_live)[0]
        classes = self.model.classes_
        p_long = prob[list(classes).index(1)] if 1 in classes else 0
        p_short = prob[list(classes).index(-1)] if -1 in classes else 0
        
        # SYNERGY ENGINE: TA + News + TIME
        ta_score = p_long - p_short
        news_multiplier = 1.0
        time_multiplier = 1.0
        logic_gate = "NEUTRAL"
        
        # Determine Session/Time Context
        time_context = await news_ai.check_trading_window()
        
        # Apply Session-Native Multipliers
        if time_context in ["NY_INSTITUTIONAL_PEAK", "LONDON_LIQUIDITY_SURGE"]:
            time_multiplier = 1.25 # Peak conviction
        elif time_context == "MONDAY_OPEN_GAP_RISK":
            time_multiplier = 0.3 # Extreme caution during Monday resets
        elif time_context == "WEEKEND_LOW_LIQUIDITY":
            time_multiplier = 0.5 # Neutralize weekend washouts
        elif time_context == "DAILY_CLOSE_VOLATILITY":
            time_multiplier = 0.8 # Respect the UTC 00:00 volatility spike

        # --- CRYPTO-NATIVE: BTC BETA CHECK ---
        # "Don't fight the King." If BTC is bearish, altcoin longs are traps.
        if symbol != "BTCUSDT":
            # Simple mock of BTC sentiment for current logic flow
            btc_is_safe = True 
            # In production: btc_is_safe = (await self.check_btc_trend())
            if not btc_is_safe:
                time_multiplier *= 0.2 # Kill conviction if BTC is dumping
            
        if use_news_ai:
            news_signal = news_ai.get_decision(symbol.replace("USDT",""))
            sentiment = news_ai.sentiment_score
            sentiment_pct = round(sentiment * 100, 1)
            
            # Strict Convergence Strategy
            if news_signal == "BULLISH":
                if ta_score > 0.05: # TA agrees
                    news_multiplier = 1.5
                    logic_gate = "SYNERGY_BULLISH"
                elif ta_score < -0.05: # Conflict!
                    news_multiplier = 0.1 # Near-total suppression
                    logic_gate = "NEURAL_CONFLICT"
            elif news_signal == "BEARISH":
                if ta_score < -0.05: # TA agrees
                    news_multiplier = 1.5
                    logic_gate = "SYNERGY_BEARISH"
                elif ta_score > 0.05: # Conflict!
                    news_multiplier = 0.1
                    logic_gate = "NEURAL_CONFLICT"
                    
            self.log(f"🧠 Neural Analysis: {logic_gate} | Sentiment: {sentiment_pct}% | Session: {time_context}")
        
        final_score = ta_score * news_multiplier * time_multiplier
        price = float(last_row["close"].iloc[0])
        atr = float(last_row["atr_14"].iloc[0])
        
        sig_type = "LONG" if final_score > 0.12 else ("SHORT" if final_score < -0.12 else "NEUTRAL")
        
        # Add sentiment info to log
        s_info = f" | News: {sentiment_pct}%" if use_news_ai else ""
        self.log(f"📊 Signal Matrix: {symbol} | Final: {final_score:.3f}{s_info} | Sig: {sig_type}")
        
        return {
            "symbol": symbol,
            "score": final_score,
            "ta_score": ta_score,
            "news_multiplier": news_multiplier,
            "logic_gate": logic_gate,
            "price": price,
            "atr": atr,
            "signal": sig_type
        }

    def place_trade(self, signal_data, telegram_config=None):
        symbol = signal_data["symbol"]
        side = "BUY" if signal_data["signal"] == "LONG" else "SELL"
        price = signal_data["price"]
        
        self.log(f"🎯 Strategy Triggered for {symbol} ({side})")
        
        # Quantity logic
        balance = 50.0 # Hardcoded demo balance
        risk_qty = (balance * 0.02) / signal_data["atr"] 
        
        qty = round(risk_qty, 3) 
        if qty <= 0: 
            self.log(f"🚫 Trade too small for {symbol} (Qty: {qty})")
            return
        
        self.log(f"⚡ EVALUATING {side} PROTOCOL: {qty} {symbol} @ {price}")
        
        if self.is_virtual:
            self.log(f"🛡️ [SHADOW] Forwarding signal to virtual ledger (No real execution).")
            # Record to Ledger (Step 15)
            try:
                from app.main import sim
                sim.record(symbol, side, signal_data.get("score", 1.0), news_ai.sentiment_score)
            except: pass
            return

        try:
            self.client.futures_create_order(symbol=symbol, side=side, type="MARKET", quantity=qty)
            self.log(f"✨ SUCCESS: {side} order filled for {symbol}")
            
            # Record to Ledger (Step 15)
            try:
                from app.main import sim
                sim.record(symbol, side, signal_data.get("score", 1.0), news_ai.sentiment_score)
            except: pass

            if telegram_config:
                asyncio.run(telegram_ai.send_signal_alert(symbol, side, news_ai.sentiment_score, 0.95))
        except Exception as e:
            self.log(f"❌ EXECUTION FAILED: {str(e)}")
            if telegram_config:
                send_telegram_msg(telegram_config.get("token"), telegram_config.get("chat_id"), f"❌ Trade Failed: {symbol} {side}\nError: {str(e)}")

    def set_leverage(self, leverage):
        if self.is_virtual:
            self.log(f"⚙️ SHADOW MODE: Skipping leverage sync.")
            return

        try:
            self.client.futures_change_leverage(symbol=CONFIG["symbol"], leverage=leverage)
            self.log(f"⚙️ Binance Protocol: Leverage updated to {leverage}x")
        except Exception as e:
            self.log(f"❌ Leverage error: {e}")

    def run(self, api_key=None, api_secret=None, leverage=1, telegram_config=None, use_news_ai=False):
        self.running = True
        try:
            self.log("Initializing secure connection to Binance...")
            self.connect(api_key, api_secret)
            self.set_leverage(leverage)
            
            if telegram_config:
                send_telegram_msg(telegram_config.get("token"), telegram_config.get("chat_id"), "🚀 AI Bot Started Successfully!")

            self.log("Training local ML model on historical BTC data...")
            if not self.train_model():
                self.log("❌ Training failed. Insufficient data.")
                return

            self.log("🕵️ Starting high-frequency scanning loop...")
            while self.running:
                import asyncio
                
                # --- FAST PATH: INFLUENCER ALPHA ---
                if use_news_ai:
                    alpha_event = asyncio.run(news_ai.scan_influencer_alpha())
                    if alpha_event:
                        # Institutional-grade event logging
                        self.log(f"🚨 NEURAL_SIGNAL_TRIGGER: High-Impact intelligence detected.")
                        self.log(f"↳ Source: @{alpha_event['account']} ({alpha_event['source']})")
                        self.log(f"↳ Authority: {alpha_event['authority']} | Confidence: {alpha_event['confidence']:.2f}")
                        self.log(f"↳ Core Intel: \"{alpha_event['content'][:60]}...\"")
                        
                        target_symbol = f"{alpha_event['coin'].upper()}USDT"
                        if alpha_event['coin'].upper() == "MARKET": target_symbol = "BTCUSDT"
                        
                        self.log(f"⚡ FAST-PATH EXECUTION: Initiating emergency {target_symbol} protocol.")
                        
                        # Mock price/atr for fast-path if ohlcv fetch fails
                        sig_data = {
                            "symbol": target_symbol,
                            "signal": "LONG",
                            "price": 0.0, # Will be handled by market order
                            "atr": 0.01,   # Standard default for emergency entry
                            "score": 1.0
                        }
                        self.place_trade(sig_data, telegram_config)

                # --- STANDARD PATH: ML SCAN ---
                symbols = self.get_top_symbols()
                self.log(f"🌐 Identified {len(symbols)} high-volume candidates...")
                best_signal = None
                best_score = 0
                
                for sym in symbols:
                    if not self.running: break
                    # Fix: use_news_ai needs to be passed correctly. 
                    import asyncio
                    sig = asyncio.run(self.compute_signal(sym, use_news_ai))
                    if sig and abs(sig["score"]) > abs(best_score):
                        best_score = sig["score"]
                        best_signal = sig
                
                if best_signal and abs(best_score) > 0.07:
                    self.log(f"💡 High-probability signal identified on {best_signal['symbol']}!")
                    self.place_trade(best_signal, telegram_config)
                else:
                    self.log("💤 Market scan complete. No high-conviction signals. Sleeping for 60s...")
                
                for _ in range(60):
                    if not self.running: break
                    time.sleep(1)
                    
        except Exception as e:
            self.log(f"Critical Error: {e}")
        finally:
            self.running = False

    def stop(self):
        self.running = False
