import time
from datetime import datetime

from app.ml.scanner import MarketScanner, build_features
from app.ml.model import MLModel
from app.trading.executor import TradeExecutor


class TradingEngine:
    def __init__(self, client, bot_manager):
        self.client = client
        self.bot_manager = bot_manager

        # Load components
        self.scanner = MarketScanner(client)
        self.model = MLModel()
        self.executor = TradeExecutor(client, bot_manager)

        self.running = False

    # ----------------------------------------------------
    # PREDICT SIGNAL
    # ----------------------------------------------------
    def predict_signal(self, features):
        """Return ML prediction based on latest indicator values."""
        if features is None:
            return None

        try:
            X = [[
                features["rsi"],
                features["ema_20"],
                features["ema_50"],
                features["macd"]
            ]]

            pred = self.model.predict(X)[0]
            return int(pred)

        except Exception as e:
            self.bot_manager.log(f"[Trading] Prediction error: {e}")
            return None

    # ----------------------------------------------------
    # MAIN LOOP
    # ----------------------------------------------------
    def run(self):
        """Start the trading engine loop."""
        self.running = True
        self.bot_manager.log("🚀 Trading engine started.")

        # Load ML model once
        try:
            self.model.load()
            self.bot_manager.log("[ML] Model loaded successfully.")
        except Exception as e:
            self.bot_manager.log(f"[ML] Model load failed: {e}")
            return

        self.bot_manager.log("🚀 Trading loop started.")

        symbol = "BTCUSDT"   # default symbol — later: configurable

        while self.bot_manager.running and self.running:

            try:
                # -------------------------------
                # 1. Fetch latest market candles
                # -------------------------------
                df = self.scanner.fetch_ohlcv(symbol, interval="15m", limit=120)

                if df is None or len(df) < 50:
                    self.bot_manager.log("Not enough OHLCV data. Retrying...")
                    time.sleep(5)
                    continue

                # -------------------------------
                # 2. Build features (RSI, EMA, MACD)
                # -------------------------------
                features = build_features(df)
                if features is None:
                    time.sleep(5)
                    continue

                # -------------------------------
                # 3. ML prediction
                # -------------------------------
                signal = self.predict_signal(features)

                if signal is None:
                    time.sleep(5)
                    continue

                # -------------------------------
                # 4. Execute logic
                # -------------------------------
                if signal == 1:
                    self.bot_manager.log("📈 BUY signal detected.")
                    # self.executor.place_order(symbol, "BUY")

                elif signal == -1:
                    self.bot_manager.log("📉 SELL signal detected.")
                    # self.executor.place_order(symbol, "SELL")

                else:
                    self.bot_manager.log("⚪ HOLD — No action.")

                # -------------------------------
                # 5. Wait for next cycle
                # -------------------------------
                time.sleep(5)

            except Exception as e:
                self.bot_manager.log(f"🔥 ERROR in trading loop: {e}")
                time.sleep(5)

        self.bot_manager.log("⛔ Trading loop stopped.")

    # ----------------------------------------------------
    # STOP LOOP
    # ----------------------------------------------------
    def stop(self):
        """Stop the trading engine."""
        self.running = False
        self.bot_manager.log("🛑 Trading engine stop signal sent.")
