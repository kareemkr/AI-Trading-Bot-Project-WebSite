from binance.client import Client
from binance.enums import *
import math
import os


def get_testnet_client():
    """Get testnet Binance client."""
    api_key = os.getenv("BINANCE_TESTNET_KEY", "")
    api_secret = os.getenv("BINANCE_TESTNET_SECRET", "")
    client = Client(api_key, api_secret, testnet=True)
    client.FUTURES_URL = "https://testnet.binancefuture.com/fapi"
    return client


def get_real_client():
    """Get real Binance client."""
    api_key = os.getenv("BINANCE_KEY", "")
    api_secret = os.getenv("BINANCE_SECRET", "")
    client = Client(api_key, api_secret, testnet=False)
    client.FUTURES_URL = "https://fapi.binance.com/fapi"
    return client


class BinanceClient:
    """
    Unified Binance Futures Client:
    - Public market data
    - Testnet trading
    - Real trading
    """

    def __init__(self, testnet=False):
        self.testnet = testnet

        if testnet:
            api_key = os.getenv("BINANCE_TESTNET_KEY", "")
            api_secret = os.getenv("BINANCE_TESTNET_SECRET", "")
            if not api_key or not api_secret:
                print("[WARNING] Testnet API keys not found in environment variables.")
                print("[INFO] Public market data will work, but trading requires API keys.")
            try:
                self.client = Client(api_key, api_secret, testnet=True)
                self.client.FUTURES_URL = "https://testnet.binancefuture.com/fapi"
            except Exception as e:
                print(f"[ERROR] Failed to initialize testnet client: {e}")
                self.client = None
        else:
            api_key = os.getenv("BINANCE_KEY", "")
            api_secret = os.getenv("BINANCE_SECRET", "")
            if not api_key or not api_secret:
                print("[WARNING] Real API keys not found in environment variables.")
                print("[INFO] Public market data will work, but trading requires API keys.")
            try:
                self.client = Client(api_key, api_secret, testnet=False)
                self.client.FUTURES_URL = "https://fapi.binance.com/fapi"
            except Exception as e:
                print(f"[ERROR] Failed to initialize real client: {e}")
                self.client = None

        # Public client for reading data (always works, no keys needed)
        try:
            self.public = Client("", "", testnet=False)
        except Exception as e:
            print(f"[ERROR] Failed to initialize public client: {e}")
            self.public = None

    # -----------------------------------------------------------------
    # MARKET DATA (PUBLIC)
    # -----------------------------------------------------------------
    def fetch_ohlcv(self, symbol, interval="15m", limit=500):
        """Public OHLCV fetcher (safe, no keys required)."""
        if self.public is None:
            print(f"[ERROR] Public client not initialized. Cannot fetch OHLCV for {symbol}")
            return None
        try:
            data = self.public.futures_klines(
                symbol=symbol,
                interval=interval,
                limit=limit
            )
            return data
        except Exception as e:
            print(f"[OHLCV ERROR] {symbol}: {e}")
            return None

    def get_klines(self, symbol, interval="15m", limit=500):
        """Alias for fetch_ohlcv for compatibility."""
        return self.fetch_ohlcv(symbol, interval, limit)

    def get_tickers(self):
        """Get 24h ticker statistics for all symbols."""
        if self.public is None:
            print("[ERROR] Public client not initialized. Cannot fetch tickers.")
            return None
        try:
            tickers = self.public.futures_ticker()
            return tickers
        except Exception as e:
            print(f"[TICKERS ERROR]: {e}")
            return None

    # -----------------------------------------------------------------
    # ACCOUNT INFO
    # -----------------------------------------------------------------
    def get_futures_balance(self, asset="USDT"):
        """Get futures wallet balance."""
        if self.client is None:
            print("[WARNING] Client not initialized. Cannot fetch balance.")
            return 0.0
        try:
            balances = self.client.futures_account_balance()
            for b in balances:
                if b["asset"] == asset:
                    return float(b["balance"])
        except Exception as e:
            print(f"[BALANCE ERROR]: {e}")
        return 0.0

    # -----------------------------------------------------------------
    # LEVERAGE & MARGIN
    # -----------------------------------------------------------------
    def set_leverage(self, symbol, leverage=10):
        """Change leverage for a symbol."""
        try:
            res = self.client.futures_change_leverage(
                symbol=symbol,
                leverage=int(leverage)
            )
            print(f"[LEVERAGE] {symbol}: {res['leverage']}x")
        except Exception as e:
            print(f"[LEVERAGE ERROR] {symbol}: {e}")

    def set_margin_type(self, symbol, isolated=True):
        """Set margin type to isolated or cross."""
        m_type = "ISOLATED" if isolated else "CROSSED"
        try:
            self.client.futures_change_margin_type(
                symbol=symbol,
                marginType=m_type
            )
            print(f"[MARGIN] {symbol} set to {m_type}")
        except Exception as e:
            if "No need to change margin type" in str(e):
                print(f"[MARGIN] {symbol} already {m_type}")
            else:
                print(f"[MARGIN ERROR] {symbol}: {e}")

    # -----------------------------------------------------------------
    # ORDER HELPERS
    # -----------------------------------------------------------------
    def round_qty(self, symbol, qty):
        """Round quantity based on Binance LOT_SIZE rules."""
        info = self.client.futures_exchange_info()
        for s in info["symbols"]:
            if s["symbol"] == symbol:
                for f in s["filters"]:
                    if f["filterType"] == "LOT_SIZE":
                        step = float(f["stepSize"])
                        if step <= 0:
                            return qty
                        return math.floor(qty / step) * step
        return qty

    # -----------------------------------------------------------------
    # PLACE MARKET ORDER
    # -----------------------------------------------------------------
    def place_market_order(self, symbol, side, qty):
        if self.client is None:
            print(f"[ERROR] Client not initialized. Cannot place order for {symbol}")
            return None
        qty = self.round_qty(symbol, qty)
        print(f"[ORDER] {side} {qty} {symbol}")

        try:
            order = self.client.futures_create_order(
                symbol=symbol,
                side=side,
                type="MARKET",
                quantity=qty
            )
            return order
        except Exception as e:
            print(f"[ORDER ERROR] {symbol}: {e}")
            return None

    # -----------------------------------------------------------------
    # STOP LOSS / TAKE PROFIT ORDERS
    # -----------------------------------------------------------------
    def place_sl_tp(self, symbol, side, sl_price, tp_price):
        """Attach SL + TP as STOP_MARKET and TAKE_PROFIT_MARKET."""
        opposite = "SELL" if side == "BUY" else "BUY"

        # STOP LOSS
        try:
            sl = self.client.futures_create_order(
                symbol=symbol,
                side=opposite,
                type="STOP_MARKET",
                stopPrice=float(sl_price),
                closePosition=True
            )
            print(f"[SL] {symbol} @ {sl_price}")
        except Exception as e:
            print(f"[SL ERROR] {symbol}: {e}")

        # TAKE PROFIT
        try:
            tp = self.client.futures_create_order(
                symbol=symbol,
                side=opposite,
                type="TAKE_PROFIT_MARKET",
                stopPrice=float(tp_price),
                closePosition=True
            )
            print(f"[TP] {symbol} @ {tp_price}")
        except Exception as e:
            print(f"[TP ERROR] {symbol}: {e}")
