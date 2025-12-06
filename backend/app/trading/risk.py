import numpy as np
from datetime import datetime, timedelta


# ============================
# RISK CONFIG DEFAULTS
# ============================
RISK_CONFIG = {
    "max_leverage": 10,
    "risk_per_trade": 0.02,                # Risk 2% of equity per trade
    "min_atr_pct": 0.001,                  # ATR < 0.1% → too quiet, skip
    "max_atr_pct": 0.05,                   # ATR > 5% → too volatile, skip
    "min_quote_volume_24h": 5_000_000,     # Minimum liquidity
    "trend_filter_long": True,
    "trend_filter_short": True,
    "cooldown_minutes": 30,
}


# Track last trade time for cooldown
last_trade_time = {}   # symbol → datetime


# ============================
# POSITION SIZING
# ============================
def compute_position_size(price, atr, balance, cfg=RISK_CONFIG):
    """
    Compute position size using:
    - ATR-based stop
    - percentage risk model
    - leverage
    """

    if atr <= 0 or np.isnan(atr):
        return 0.0, 0.0, 0.0

    atr_pct = atr / price
    if atr_pct < cfg["min_atr_pct"] or atr_pct > cfg["max_atr_pct"]:
        # volatility too low or too high
        return 0.0, 0.0, atr

    risk_amount = balance * cfg["risk_per_trade"]
    stop_distance = atr

    if stop_distance <= 0:
        return 0.0, 0.0, 0.0

    # qty in base asset (e.g. BTC)
    qty = risk_amount / stop_distance

    # Apply leverage to get notional
    notional = qty * price * cfg["max_leverage"]

    return float(qty), float(notional), float(stop_distance)


# ============================
# TRADE FILTERS
# ============================
def is_symbol_allowed_to_trade(row, cfg=RISK_CONFIG, now=None):
    """
    Check if the symbol passes all filters:
    - liquidity
    - trend (EMA200 direction)
    - cooldown
    """

    if now is None:
        now = datetime.utcnow()

    sym = row["symbol"]

    # Liquidity filter
    if row["quote_volume_24h"] < cfg["min_quote_volume_24h"]:
        return False, "Low liquidity (24h quote volume)"

    # Trend filter for LONGS
    if row["signal"] == "LONG" and cfg["trend_filter_long"]:
        if row["above_200_ema"] != 1:
            return False, "Long rejected – price below EMA200"

    # Trend filter for SHORTS
    if row["signal"] == "SHORT" and cfg["trend_filter_short"]:
        if row["above_200_ema"] != 0:
            return False, "Short rejected – price above EMA200"

    # Cooldown filter
    last_time = last_trade_time.get(sym, None)
    if last_time is not None:
        diff = now - last_time
        if diff < timedelta(minutes=cfg["cooldown_minutes"]):
            return False, f"Cooldown active ({cfg['cooldown_minutes']} min)"

    return True, "OK"


# ============================
# UPDATE COOLDOWN LOG
# ============================
def mark_trade_time(symbol):
    """Record last trade time for cooldown management."""
    last_trade_time[symbol] = datetime.utcnow()
