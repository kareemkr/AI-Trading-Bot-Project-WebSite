# backend/app/services/trading_bot.py

import time
import os
from app.ml.scanner import MarketScanner
from app.trading.binance_client import BinanceClient, get_testnet_client, get_real_client
from app.trading.executor import TradeExecutor
from app.trading.risk import RISK_CONFIG


def run_trading_bot(bot_manager):
    """
    Main trading bot loop that:
    1. Scans market using ML model
    2. Filters signals through risk management
    3. Executes trades on Binance Futures
    """
    bot_manager.log("🤖 Initializing trading bot...")
    
    # Configuration
    USE_TESTNET = os.getenv("USE_TESTNET", "true").lower() == "true"
    SCAN_INTERVAL = int(os.getenv("SCAN_INTERVAL_SECONDS", "60"))
    TOP_SYMBOLS = int(os.getenv("TOP_SYMBOLS", "40"))
    MIN_SCORE = float(os.getenv("MIN_SIGNAL_SCORE", "0.07"))
    
    # Initialize components
    try:
        scanner = MarketScanner()
        bot_manager.log("✅ Market scanner initialized")
    except Exception as e:
        bot_manager.log(f"❌ Scanner init failed: {e}")
        return
    
    try:
        client = BinanceClient(testnet=USE_TESTNET)
        executor = TradeExecutor(client, bot_manager)
        bot_manager.log(f"✅ Trading client initialized ({'TESTNET' if USE_TESTNET else 'REAL'})")
    except Exception as e:
        bot_manager.log(f"❌ Trading client init failed: {e}")
        return
    
    # Get account balance
    try:
        balance = client.get_futures_balance("USDT")
        bot_manager.log(f"💰 Account balance: ${balance:.2f} USDT")
    except Exception as e:
        bot_manager.log(f"⚠️ Could not fetch balance: {e}. Using default $1000")
        balance = 1000.0
    
    if balance <= 0:
        bot_manager.log("❌ Account balance is zero. Bot stopped.")
        return
    
    cycle = 0
    
    bot_manager.log(f"🚀 Bot started. Scanning every {SCAN_INTERVAL}s")
    
    while bot_manager.running:
        cycle += 1
        bot_manager.log(f"\n{'='*50}")
        bot_manager.log(f"📊 Cycle {cycle} — Starting market scan...")
        
        try:
            # 1) Get top symbols by volume
            symbols = scanner.get_top_symbols(TOP_SYMBOLS)
            if not symbols:
                bot_manager.log("⚠️ No symbols found. Retrying next cycle...")
                time.sleep(SCAN_INTERVAL)
                continue
            
            bot_manager.log(f"📈 Scanning {len(symbols)} top symbols...")
            
            # 2) Scan market for signals
            signals = scanner.scan_market(
                symbols=symbols,
                interval="15m",
                limit=250,
                min_score=MIN_SCORE
            )
            
            if not signals:
                bot_manager.log("🔍 No strong signals found this cycle.")
                time.sleep(SCAN_INTERVAL)
                continue
            
            bot_manager.log(f"✨ Found {len(signals)} signals")
            
            # 3) Sort by score (best first)
            signals_sorted = sorted(signals, key=lambda x: abs(x["score"]), reverse=True)
            
            # 4) Try to execute best signal
            trade_executed = False
            for signal in signals_sorted:
                if not bot_manager.running:
                    break
                
                bot_manager.log(f"🎯 Evaluating: {signal['symbol']} {signal['signal']} (score: {signal['score']:.4f})")
                
                # Execute trade
                result = executor.execute_trade(signal, balance)
                
                if result:
                    bot_manager.log(f"✅ Trade executed successfully!")
                    trade_executed = True
                    # Update balance estimate (simplified)
                    balance = client.get_futures_balance("USDT")
                    break
                else:
                    bot_manager.log(f"⏭️ Signal filtered out, trying next...")
            
            if not trade_executed:
                bot_manager.log("ℹ️ No trades executed this cycle (all filtered)")
            
        except Exception as e:
            bot_manager.log(f"❌ Error in cycle {cycle}: {e}")
            import traceback
            bot_manager.log(f"Traceback: {traceback.format_exc()}")
        
        # Sleep before next cycle
        if bot_manager.running:
            bot_manager.log(f"⏳ Waiting {SCAN_INTERVAL}s until next scan...")
            time.sleep(SCAN_INTERVAL)
    
    bot_manager.log("🛑 Bot loop ended.")
