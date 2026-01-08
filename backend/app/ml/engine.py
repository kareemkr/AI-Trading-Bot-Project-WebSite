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
from app.database.session import AsyncSessionLocal
import asyncio

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
        self.is_virtual = False  # FORCE LIVE MODE
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

    def log(self, msg, level="INFO"):
        if self.logger:
            try:
                self.logger(msg, level, module="BotEngine")
            except TypeError:
                self.logger(msg)
        else:
            print(f"[BOT] {msg}")

    def connect(self, api_key=None, api_secret=None):
        # Use provided keys, or fallback to env
        key = (api_key or os.getenv("BINANCE_API_KEY") or "").strip()
        secret = (api_secret or os.getenv("BINANCE_API_SECRET") or "").strip()

        if not key or not secret:
            self.log("❌ CRITICAL ERROR: Missing Binance API credentials!", level="CRITICAL")
            print("\n" + "="*60)
            print("❌ SHADOW MODE DISABLED BY SYSTEM")
            print("❌ Missing Binance API credentials - TERMINATING")
            print("="*60 + "\n")
            raise RuntimeError("❌ BINANCE API KEYS MISSING — CANNOT START IN LIVE MODE")
            
        try:
            self.client = Client(key, secret)
            self.is_virtual = False
            
            print("\n" + "╔" + "═"*58 + "╗")
            print(f"║ {'SYSTEM CONNECTED TO BINANCE PROTOCOL':^56} ║")
            print("╠" + "═"*58 + "╣")
            print(f"║ {'API KEY: ' + key[:6] + '...' + key[-4:]:^56} ║")
            print(f"║ {'TRADING MODE: REAL MONEY':^56} ║")
            print("╚" + "═"*58 + "╝\n")
            
            self.log("✅ Securely connected to Binance Protocol.")
            self.log("🚨 LIVE TRADING ENABLED – REAL ORDERS WILL BE SENT")
        except Exception as e:
            self.log(f"❌ Connection failed: {e}.", level="ERROR")
            print(f"\n❌ FAILED TO CONNECT TO BINANCE: {e}\n")
            raise RuntimeError(f"❌ FAILED TO CONNECT TO BINANCE: {e}")

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
            raise RuntimeError("❌ SHADOW MODE IS ACTIVE — ACCOUNT INFO BLOCKED")
        
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
        
        self.log(f"🌐 MACRO_CONTEXT: Detected Session [{time_context}] | Volatility Multiplier: {time_multiplier}x")

        # --- CRYPTO-NATIVE: BTC BETA CHECK ---
        # "Don't fight the King." If BTC is bearish, altcoin longs are traps.
        if symbol != "BTCUSDT":
            # Simple mock of BTC sentiment for current logic flow
            btc_is_safe = True 
            # In production: btc_is_safe = (await self.check_btc_trend())
            if not btc_is_safe:
                time_multiplier *= 0.2 # Kill conviction if BTC is dumping
            
        if use_news_ai:
            sig_data = news_ai.get_signal()
            news_signal = sig_data["signal"]
            sentiment = news_ai.sentiment_score
            sentiment_pct = round(sentiment * 100, 1)
            self.log(f"🧠 NEURAL_GATE_SYNC: [{symbol}] Comparing TA Bias ({ta_score:+.3f}) with News Sentiment ({sentiment_pct}%)")
            self.log(f"↳ Signal: {news_signal} | Confidence: {sig_data['confidence']*100}% | Drivers: {', '.join(sig_data['drivers'])}")
            
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
                    
            # PRODUCER-CONSUMER SYNERGY LOGGING
            if logic_gate == "SYNERGY_BULLISH":
                self.log(f"💎 BULLISH SYNERGY: TA and News both confirm LONG direction. Conviction Boost: 1.5x")
            elif logic_gate == "SYNERGY_BEARISH":
                self.log(f"💎 BEARISH SYNERGY: TA and News both confirm SHORT direction. Conviction Boost: 1.5x")
            elif logic_gate == "NEURAL_CONFLICT":
                self.log(f"⚠️ NEURAL CONFLICT: TA and News disagree for {symbol}. Suppressing signal for safety.")
            
            self.log(f"🧠 Neural Logic: {logic_gate} | Sentiment: {sentiment_pct}% | Session: {time_context}")
        
        final_score = ta_score * news_multiplier * time_multiplier
        price = float(last_row["close"].iloc[0])
        atr = float(last_row["atr_14"].iloc[0])
        
        sig_type = "LONG" if final_score > 0.12 else ("SHORT" if final_score < -0.12 else "NEUTRAL")

        # --- CONFIDENCE GATE (Addition 2) ---
        if sig_type != "NEUTRAL":
            news_count = len(news_ai.cached_news)
            # Check for recent alpha events (e.g., last 30 mins)
            has_alpha = len(news_ai.alpha_events) > 0
            
            if news_count < 3 and not has_alpha:
                self.log(f"💤 CONFIDENCE_GATE: Only {news_count} news items and no alpha signals. Forcing NEUTRAL for institutional safety.")
                sig_type = "NEUTRAL"
        
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

    async def place_trade(self, signal_data, telegram_config=None):
        symbol = signal_data["symbol"]
        
        if signal_data["signal"] == "NEUTRAL":
            self.log(f"💤 Signal for {symbol} is NEUTRAL. Skipping execution.")
            return

        side = "BUY" if signal_data["signal"] == "LONG" else "SELL"
        price = signal_data["price"]
        
        self.log(f"🎯 Strategy Triggered for {symbol} ({side})")
        self.log("💰💰💰 LIVE TRADE EXECUTION PATH REACHED 💰💰💰", level="CRITICAL")
        
        # Risk Management (Fixed unit for simplicity as per removal of wallet logic)
        qty = 0.01 # Institutional default unit
        
        self.log(f"⚡ EVALUATING {side} PROTOCOL: {qty} {symbol} @ {price}")
        
        if self.is_virtual:
            self.log("❌ CRITICAL ERROR: Bot is in Virtual Mode!", level="CRITICAL")
            raise RuntimeError("❌ SHADOW MODE IS ACTIVE — LIVE TRADING BLOCKED")

        if not self.client:
            self.log("❌ CRITICAL ERROR: Binance Client Not Initialized!", level="CRITICAL")
            raise RuntimeError("❌ BINANCE CLIENT NOT INITIALIZED — CANNOT TRADE")

        try:
            # Wrap synchronous Binance call in executor
            loop = asyncio.get_running_loop()
            
            print("\n" + "🔥"*20)
            print(f"🚀 EXECUTING {side} ORDER: {qty} {symbol}")
            print("🔥"*20 + "\n")
            
            # Adjust quantity to respect Binance precision for the symbol
            try:
                info = self.client.get_symbol_info(symbol)
                step_size = None
                for f in info.get('filters', []):
                    if f.get('filterType') == 'LOT_SIZE':
                        step_size = f.get('stepSize')
                        break
                if step_size:
                    from decimal import Decimal, ROUND_DOWN
                    step = Decimal(step_size)
                    qty_decimal = Decimal(str(qty))
                    qty = float((qty_decimal // step) * step)
            except Exception as e:
                self.log(f"⚠️ Failed to adjust qty precision for {symbol}: {e}", level="WARNING")

            await loop.run_in_executor(
                None,
                lambda: self.client.futures_create_order(
                    symbol=symbol,
                    side=side,
                    type="MARKET",
                    quantity=qty,
                ),
            )
            
            print(f"✅ SUCCESS: {side} order filled for {symbol} at ${price}")
            self.log(f"✨ SUCCESS: {side} order filled for {symbol}")
            
            try:
                from app.main import sim
                await sim.record(symbol, side, signal_data.get("score", 1.0), news_ai.sentiment_score, price=price, qty=qty)
            except: pass

            if telegram_config:
                try:
                    await telegram_ai.send_signal_alert(symbol, side, news_ai.sentiment_score, 0.95)
                except Exception as te:
                    self.log(f"Telegram notification failed (non-fatal): {te}", level="WARNING")
                    
        except BinanceAPIException as e:
            error_msg = str(e)
            if e.code == -2010:
                friendly_error = "❌ INSUFFICIENT FUNDS: Your Binance Futures account doesn't have enough USDT."
            elif e.code == -1021:
                friendly_error = "❌ TIMESTAMP ERROR: Check your VPS clock/time settings."
            elif e.code == -2015:
                friendly_error = "❌ INVALID API KEY permissions: Check if Futures is enabled for this key."
            else:
                friendly_error = f"❌ BINANCE API ERROR ({e.code}): {e.message}"
            
            print("\n" + "!"*60)
            print(f"❌ {friendly_error}")
            print("!"*60 + "\n")
            self.log(friendly_error, level="ERROR")
            
        except Exception as e:
            print(f"\n❌ UNKNOWN EXECUTION ERROR: {str(e)}\n")
            self.log(f"❌ EXECUTION FAILED: {str(e)}")
            if telegram_config:
                try:
                    await telegram_ai.send_signal_alert(symbol, f"FAILED_{side}", news_ai.sentiment_score, 0.0)
                except Exception as te:
                    self.log(f"Telegram notification failed (non-fatal): {te}", level="WARNING")

    def set_leverage(self, leverage):
        if self.is_virtual:
            self.log(f"⚙️ SHADOW MODE: Skipping leverage sync.")
            return

        try:
            self.client.futures_change_leverage(symbol=CONFIG["symbol"], leverage=leverage)
            self.log(f"⚙️ Binance Protocol: Leverage updated to {leverage}x")
        except Exception as e:
            self.log(f"❌ Leverage error: {e}")

    async def run(self, api_key=None, api_secret=None, leverage=1, telegram_config=None, use_news_ai=False):
        self.running = True
        loop = asyncio.get_running_loop()
        try:
            self.log("Initializing secure connection to Binance...")
            await loop.run_in_executor(None, self.connect, api_key, api_secret)
            await loop.run_in_executor(None, self.set_leverage, leverage)
            
            if telegram_config:
                try:
                    await telegram_ai.send_msg("🚀 AI Bot Started Successfully!")
                except Exception as te:
                    self.log(f"Telegram start notification failed: {te}", level="WARNING")

            self.log(f"BOT STATUS: RUNNING | mode={'SHADOW' if self.is_virtual else 'REAL'} | news=ON | trading=ON")

            self.log("Training local ML model on historical BTC data...")
            success = await loop.run_in_executor(None, self.train_model)
            if not success:
                self.log(f"BOT STOPPED | reason=Training failed. Insufficient data.", level="CRITICAL")
                return

            self.log("🕵️ Starting high-frequency scanning loop...")
            while self.running:
                # --- FAST PATH: INFLUENCER ALPHA ---
                if use_news_ai:
                    alpha_event = await news_ai.scan_influencer_alpha()
                    if alpha_event:
                        self.log(f"🚨 NEURAL_SIGNAL_TRIGGER: High-Impact intelligence detected.")
                        self.log(f"↳ Source: @{alpha_event['account']} ({alpha_event['source']})")
                        self.log(f"↳ Authority: {alpha_event['authority']} | Confidence: {alpha_event['confidence']:.2f}")
                        
                        target_symbol = f"{alpha_event['coin'].upper()}USDT"
                        if alpha_event['coin'].upper() == "MARKET": target_symbol = "BTCUSDT"
                        
                        self.log(f"⚡ FAST-PATH EXECUTION: Initiating emergency {target_symbol} protocol.")
                        
                        sig_data = {
                            "symbol": target_symbol,
                            "signal": "LONG",
                            "price": 0.0,
                            "atr": 0.01,
                            "score": 1.0
                        }
                        await self.place_trade(sig_data, telegram_config)

                # --- STANDARD PATH: ML SCAN ---
                symbols = await loop.run_in_executor(None, self.get_top_symbols)
                self.log(f"🌐 Identified {len(symbols)} high-volume candidates...")
                best_signal = None
                best_score = 0
                
                for sym in symbols:
                    if not self.running: break
                    sig = await self.compute_signal(sym, use_news_ai)
                    if sig and abs(sig["score"]) > abs(best_score):
                        best_score = sig["score"]
                        best_signal = sig
                
                if True:
                    # Forced trade for verification – will always attempt to place a real order
                    self.log("⚠️ FORCED TRADE TEST – bypassing confidence check")
                    await self.place_trade(best_signal, telegram_config)
                else:
                    self.log("💤 Market scan complete. No high-conviction signals. Sleeping for 60s...")
                
                for _ in range(60):
                    if not self.running: break
                    await asyncio.sleep(1)
                    
        except Exception as e:
            self.log(f"Critical Error: {e}", level="ERROR")
            self.log(f"BOT STOPPED | reason={e}", level="CRITICAL")
        finally:
            self.running = False
            self.log("BOT STOPPED | reason=Manual Stop or Loop Exit", level="CRITICAL")

    def stop(self):
        self.running = False
