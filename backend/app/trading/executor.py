from app.trading.binance_client import BinanceClient
from app.trading.risk import (
    compute_position_size,
    is_symbol_allowed_to_trade,
    mark_trade_time,
    RISK_CONFIG,
)
from datetime import datetime


class TradeExecutor:
    def __init__(self, client: BinanceClient, bot_manager):
        self.client = client
        self.bot_manager = bot_manager

    # ---------------------------------------------------
    # EXECUTE FULL TRADE PIPELINE
    # ---------------------------------------------------
    def execute_trade(self, row, balance):
        """
        row expected fields:
            symbol, price, atr, signal, quote_volume_24h, above_200_ema
        """

        sym = row["symbol"]
        price = row["price"]
        atr = row["atr"]
        signal = row["signal"]  # LONG / SHORT

        # ----------------------------------------------
        # 1) RISK FILTERS (trend, liquidity, cooldown)
        # ----------------------------------------------
        allowed, reason = is_symbol_allowed_to_trade(row)
        if not allowed:
            self.bot_manager.log(f"[{sym}] ❌ Trade blocked: {reason}")
            return None

        # ----------------------------------------------
        # 2) POSITION SIZE
        # ----------------------------------------------
        qty, notional, stop_distance = compute_position_size(
            price, atr, balance
        )

        if qty <= 0:
            self.bot_manager.log(f"[{sym}] ❌ Position size = 0 → blocked")
            return None

        self.bot_manager.log(
            f"[{sym}] Allowed → Qty={qty:.4f}, Notional=${notional:,.2f}, SL={stop_distance:.4f}"
        )

        # ----------------------------------------------
        # 3) SET LEVERAGE & MARGIN TYPE
        # ----------------------------------------------
        try:
            self.client.set_leverage(sym, RISK_CONFIG["max_leverage"])
            self.client.set_margin_type(sym, isolated=True)
        except Exception as e:
            self.bot_manager.log(f"[{sym}] ⚠ Leverage/margin setup warning: {e}")

        # ----------------------------------------------
        # 4) MARKET ORDER
        # ----------------------------------------------
        side = "BUY" if signal == "LONG" else "SELL"

        try:
            order = self.client.place_market_order(
                symbol=sym,
                side=side,
                qty=qty
            )
            if order is None:
                self.bot_manager.log(f"[{sym}] ❌ Market order FAILED")
                return None
        except Exception as e:
            self.bot_manager.log(f"[{sym}] ❌ Market order FAILED: {e}")
            return None

        self.bot_manager.log(f"[{sym}] ✅ Market {side} executed at {price}")

        # ----------------------------------------------
        # 5) SET SL + TP
        # ----------------------------------------------
        try:
            sl_price, tp_price = self._calculate_sl_tp(price, stop_distance, signal)
            self.client.place_sl_tp(sym, side, sl_price, tp_price)

            self.bot_manager.log(
                f"[{sym}] SL={sl_price:.4f} | TP={tp_price:.4f} attached"
            )

        except Exception as e:
            self.bot_manager.log(f"[{sym}] ⚠ Failed to attach SL/TP: {e}")

        # ----------------------------------------------
        # 5) COOLDOWN HANDLING
        # ----------------------------------------------
        mark_trade_time(sym)

        return order

    # ---------------------------------------------------
    # STOP LOSS / TAKE PROFIT LOGIC
    # ---------------------------------------------------
    def _calculate_sl_tp(self, entry_price, stop_distance, signal):
        """
        Using Risk:Reward = 1:2
        """
        if signal == "LONG":
            sl = entry_price - stop_distance
            tp = entry_price + stop_distance * 2
        else:  # SHORT
            sl = entry_price + stop_distance
            tp = entry_price - stop_distance * 2

        return round(sl, 4), round(tp, 4)
