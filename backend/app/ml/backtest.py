"""
Backtesting module for the trading bot.
Simulates trading on historical data to evaluate strategy performance.
"""

import pandas as pd
import numpy as np
from app.ml.features import add_indicators, FEATURE_COLUMNS
from app.ml.model import MLModel


BACKTEST_CONFIG = {
    "initial_equity": 1000.0,   # starting USDT
    "risk_per_trade": 0.02,     # 2% of equity risked per trade
    "leverage": 10,             # 10x leverage (applied to PnL, not margin)
    "fee_rate": 0.0004,         # 0.04% taker fee per side (entry + exit)
    "atr_multiple_sl": 1.0,     # SL distance = 1 * ATR
    "atr_multiple_tp": 2.0,     # TP distance = 2 * ATR (2R)
    "max_positions": 1,         # only 1 position at a time (simpler)
    "signal_column": "pred",    # model prediction column
}


def generate_signals(df_labeled, model, feature_cols, config=BACKTEST_CONFIG):
    """
    Runs model on ALL rows and stores predictions.
    """
    df = df_labeled.copy()
    
    X_all = df[feature_cols].values
    preds = model.predict(X_all)
    
    df[config["signal_column"]] = preds.astype(int)
    return df


def run_futures_backtest(df_bt, config=BACKTEST_CONFIG):
    """
    Realistic backtest for 1-symbol futures with:
      - model signal (1 long, -1 short, 0 flat)
      - entry at next candle open
      - SL/TP based on ATR
      - leverage on PnL
      - taker fees on entry and exit
      - 1 position at a time
      - candle-based SL/TP hit simulation using H/L
    """
    
    equity = config["initial_equity"]
    equity_curve = []
    equity_times = []
    trades = []
    
    in_position = False
    pos_side = None          # "LONG" or "SHORT"
    pos_entry_price = None
    pos_sl = None
    pos_tp = None
    pos_size = 0.0           # in base asset (e.g. BTC)
    pos_notional = 0.0       # in USDT
    
    fee_rate = config["fee_rate"]
    lev = config["leverage"]
    risk_per_trade = config["risk_per_trade"]
    
    df = df_bt.copy()
    sig_col = config["signal_column"]
    
    rows = list(df.itertuples())
    n_rows = len(rows)
    
    for i in range(n_rows - 1):
        row = rows[i]
        nxt = rows[i + 1]   # we enter at next candle open
        
        t = df.index[i]
        
        open_price = float(row.open)
        high_price = float(row.high)
        low_price = float(row.low)
        close_price = float(row.close)
        atr = float(row.atr_14)
        
        signal = int(getattr(row, sig_col))
        
        # record equity each bar
        equity_curve.append(equity)
        equity_times.append(t)
        
        # 1) If in position, check SL/TP on this bar (H/L), then close if hit
        if in_position:
            exit_price = None
            exit_reason = None
            
            # Simulate hit order:
            if pos_side == "LONG":
                sl_hit = low_price <= pos_sl
                tp_hit = high_price >= pos_tp
                
                if sl_hit and tp_hit:
                    exit_price = pos_sl
                    exit_reason = "SL+TP_same_bar_SL"
                elif sl_hit:
                    exit_price = pos_sl
                    exit_reason = "SL"
                elif tp_hit:
                    exit_price = pos_tp
                    exit_reason = "TP"
                    
            elif pos_side == "SHORT":
                sl_hit = high_price >= pos_sl
                tp_hit = low_price <= pos_tp
                
                if sl_hit and tp_hit:
                    exit_price = pos_sl
                    exit_reason = "SL+TP_same_bar_SL"
                elif sl_hit:
                    exit_price = pos_sl
                    exit_reason = "SL"
                elif tp_hit:
                    exit_price = pos_tp
                    exit_reason = "TP"
            
            # If hit SL or TP, close position
            if exit_price is not None:
                # Gross return (unlevered)
                if pos_side == "LONG":
                    ret = (exit_price - pos_entry_price) / pos_entry_price
                else:
                    ret = (pos_entry_price - exit_price) / pos_entry_price
                
                # Apply leverage on PnL
                gross_pnl = ret * lev * equity
                
                # Fees: two sides (entry + exit)
                fee_entry = fee_rate * pos_notional
                fee_exit = fee_rate * pos_notional
                fee_total = fee_entry + fee_exit
                
                net_pnl = gross_pnl - fee_total
                
                prev_equity = equity
                equity += net_pnl
                
                trades.append({
                    "time_exit": t,
                    "side": pos_side,
                    "entry_price": pos_entry_price,
                    "exit_price": exit_price,
                    "reason": exit_reason,
                    "ret_unlever": ret,
                    "gross_pnl": gross_pnl,
                    "fee_total": fee_total,
                    "net_pnl": net_pnl,
                    "equity_before": prev_equity,
                    "equity_after": equity
                })
                
                # Reset position
                in_position = False
                pos_side = None
                pos_entry_price = None
                pos_sl = None
                pos_tp = None
                pos_size = 0.0
                pos_notional = 0.0
        
        # 2) If flat, maybe open a new position at the NEXT candle open
        if (not in_position) and (i < n_rows - 2):
            if signal != 0:
                # risk per trade in USDT
                risk_amount = equity * risk_per_trade
                
                if atr <= 0 or np.isnan(atr):
                    continue
                
                sl_distance = config["atr_multiple_sl"] * atr
                tp_distance = config["atr_multiple_tp"] * atr
                
                next_open = float(nxt.open)
                
                if signal == 1:
                    side = "LONG"
                    sl_price = next_open - sl_distance
                    tp_price = next_open + tp_distance
                elif signal == -1:
                    side = "SHORT"
                    sl_price = next_open + sl_distance
                    tp_price = next_open - tp_distance
                else:
                    side = None
                
                if side is None:
                    continue
                
                if sl_distance <= 0:
                    continue
                
                qty = risk_amount / (sl_distance * lev)
                notional = qty * next_open * lev
                
                if qty <= 0 or notional <= 0:
                    continue
                
                # Pay entry fee:
                fee_entry = fee_rate * notional
                equity -= fee_entry
                
                # open position
                in_position = True
                pos_side = side
                pos_entry_price = next_open
                pos_sl = sl_price
                pos_tp = tp_price
                pos_size = qty
                pos_notional = notional
                
                trades.append({
                    "time_entry": df.index[i + 1],
                    "side": side,
                    "entry_price": pos_entry_price,
                    "sl_price": pos_sl,
                    "tp_price": pos_tp,
                    "notional": notional,
                    "fee_entry": fee_entry,
                    "equity_after_entry": equity
                })
    
    # At end, close any open position
    if in_position and len(rows) > 0:
        last = rows[-1]
        final_price = float(last.close)
        if pos_side == "LONG":
            ret = (final_price - pos_entry_price) / pos_entry_price
        else:
            ret = (pos_entry_price - final_price) / pos_entry_price
        
        gross_pnl = ret * lev * equity
        fee_exit = fee_rate * pos_notional
        fee_total = fee_exit
        net_pnl = gross_pnl - fee_total
        prev_equity = equity
        equity += net_pnl
        
        trades.append({
            "time_exit": df.index[-1],
            "side": pos_side,
            "entry_price": pos_entry_price,
            "exit_price": final_price,
            "reason": "FORCED_EXIT_END",
            "ret_unlever": ret,
            "gross_pnl": gross_pnl,
            "fee_total": fee_total,
            "net_pnl": net_pnl,
            "equity_before": prev_equity,
            "equity_after": equity
        })
    
    # Build equity curve DataFrame
    eq_df = pd.DataFrame({"equity": equity_curve}, index=pd.to_datetime(equity_times))
    
    # Build trades DataFrame
    trades_df = pd.DataFrame(trades)
    
    # Compute stats
    final_equity = equity
    total_return = (final_equity / config["initial_equity"]) - 1.0
    
    # Drawdown
    eq_cummax = eq_df["equity"].cummax()
    dd_series = (eq_df["equity"] - eq_cummax) / eq_cummax
    max_dd = dd_series.min() if len(dd_series) > 0 else 0.0
    
    # Win rate
    closed_mask = trades_df["net_pnl"].notna()
    closed_trades = trades_df[closed_mask & trades_df["net_pnl"].notnull()]
    n_trades = len(closed_trades)
    wins = (closed_trades["net_pnl"] > 0).sum()
    win_rate = wins / n_trades if n_trades > 0 else 0.0
    
    stats = {
        "initial_equity": config["initial_equity"],
        "final_equity": final_equity,
        "total_return_pct": total_return * 100.0,
        "max_drawdown_pct": max_dd * 100.0,
        "num_trades": n_trades,
        "win_rate_pct": win_rate * 100.0
    }
    
    return stats, eq_df, trades_df

