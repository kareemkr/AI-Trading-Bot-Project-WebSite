"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Cpu, Zap, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

const DEMO_SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "AVAX/USDT", "MATIC/USDT"];

interface Trade {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  exit?: number;
  qty: number;
  pnl?: number;
  status: "OPEN" | "CLOSED";
  timestamp: string;
}

export default function DemoBotPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    balance: 10000
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<any>(null);
  const { t } = useLanguage();

  const addLog = (type: string, message: string, icon: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-20), { id: Date.now(), type, message, icon, time }]);
  };

  const executeTrade = () => {
    const symbol = DEMO_SYMBOLS[Math.floor(Math.random() * DEMO_SYMBOLS.length)];
    const side = Math.random() > 0.5 ? "LONG" : "SHORT";
    const basePrice = symbol.includes("BTC") ? 65000 : symbol.includes("ETH") ? 3500 : symbol.includes("SOL") ? 140 : 450;
    const entry = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const qty = Math.random() * 0.5 + 0.1;

    addLog("SCAN", `Scanning ${symbol} liquidity depth...`, "🔍");
    
    setTimeout(() => {
      addLog("ANALYSIS", `ML Pattern identified on ${symbol} (Score: ${(Math.random() * 0.15 + 0.05).toFixed(3)})`, "📊");
      
      setTimeout(() => {
        addLog("SIGNAL", `Strategy matched: Scalping ${side} Opportunity`, "💡");
        
        setTimeout(() => {
          const trade: Trade = {
            id: Date.now(),
            symbol,
            side,
            entry,
            qty,
            status: "OPEN",
            timestamp: new Date().toLocaleTimeString()
          };
          
          setTrades(prev => [trade, ...prev.slice(0, 9)]);
          addLog("TRADE", `EXECUTING ${side} ${qty.toFixed(4)} ${symbol} @ $${entry.toFixed(2)}`, "🚀");
          
          // Close trade after 3-5 seconds
          setTimeout(() => {
            const winChance = 0.65; // 65% win rate
            const isWin = Math.random() < winChance;
            const priceChange = isWin ? (Math.random() * 0.015 + 0.005) : -(Math.random() * 0.01 + 0.003);
            const exit = entry * (1 + (side === "LONG" ? priceChange : -priceChange));
            const pnl = (exit - entry) * qty * (side === "LONG" ? 1 : -1);
            
            setTrades(prev => prev.map(t => 
              t.id === trade.id ? { ...t, exit, pnl, status: "CLOSED" } : t
            ));
            
            setStats(prev => ({
              totalTrades: prev.totalTrades + 1,
              winRate: ((prev.winRate * prev.totalTrades + (isWin ? 100 : 0)) / (prev.totalTrades + 1)),
              totalPnL: prev.totalPnL + pnl,
              balance: prev.balance + pnl
            }));
            
            addLog("SUCCESS", `Trade Closed! PnL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${((pnl/entry/qty)*100).toFixed(2)}%)`, isWin ? "✨" : "⚠️");
          }, Math.random() * 2000 + 3000);
          
        }, 1000);
      }, 1200);
    }, 800);
  };

  const startBot = () => {
    setIsRunning(true);
    addLog("SYSTEM", "🤖 Demo Bot Activated - Simulating AI Trading Engine", "⚡");
    
    // Execute first trade immediately
    setTimeout(executeTrade, 2000);
    
    // Then execute trades every 8-12 seconds
    intervalRef.current = setInterval(() => {
      executeTrade();
    }, Math.random() * 4000 + 8000);
  };

  const stopBot = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    addLog("SYSTEM", "⏸️ Demo Bot Paused", "🛑");
  };

  const resetBot = () => {
    stopBot();
    setLogs([]);
    setTrades([]);
    setStats({
      totalTrades: 0,
      winRate: 0,
      totalPnL: 0,
      balance: 10000
    });
    addLog("SYSTEM", "🔄 Demo Bot Reset - Ready for new simulation", "🔧");
  };

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("neural_demo_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(parsed.stats);
        setIsRunning(parsed.isRunning);
        setTrades(parsed.trades);
        setLogs(parsed.logs);
        
        // If it was running, we need to restart the interval logic without adding "started" log again
        if (parsed.isRunning) {
            // Slight delay to ensure state is set
            setTimeout(() => {
                if (!intervalRef.current) {
                    intervalRef.current = setInterval(() => {
                        executeTrade();
                    }, Math.random() * 4000 + 8000);
                }
            }, 500);
        }
      } catch (e) {
        console.error("Failed to load demo state", e);
      }
    }
  }, []);

  // Save state to local storage
  useEffect(() => {
    const state = {
        stats,
        isRunning,
        trades,
        logs
    };
    localStorage.setItem("neural_demo_state", JSON.stringify(state));
  }, [stats, isRunning, trades, logs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between bg-card/30 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              isRunning ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-500"
            )} />
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">{t.demo.title}</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {isRunning ? t.demo.active_mode : t.demo.paused_mode}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={startBot}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              {t.demo.start}
            </button>
          ) : (
            <button
              onClick={stopBot}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
            >
              <Pause className="w-4 h-4" />
              {t.demo.pause}
            </button>
          )}
          <button
            onClick={resetBot}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            {t.demo.reset}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card/40 p-5 rounded-[2rem] border border-border/40 hover:border-accent/30 transition-all group shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500">
              DEMO
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{t.demo.balance}</p>
          <p className="text-xl font-black tracking-tight">${stats.balance.toFixed(2)}</p>
        </div>

        <div className="bg-card/40 p-5 rounded-[2rem] border border-border/40 hover:border-accent/30 transition-all group shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500">
              {stats.totalTrades}
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{t.demo.total_trades}</p>
          <p className="text-xl font-black tracking-tight">{stats.totalTrades}</p>
        </div>

        <div className="bg-card/40 p-5 rounded-[2rem] border border-border/40 hover:border-accent/30 transition-all group shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-[10px] font-black px-2 py-1 rounded-lg",
              stats.totalPnL >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            )}>
              {stats.totalPnL >= 0 ? "+" : ""}{((stats.totalPnL / 10000) * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{t.demo.total_pnl}</p>
          <p className={cn(
            "text-xl font-black tracking-tight",
            stats.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {stats.totalPnL >= 0 ? "+" : ""}${stats.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-card/40 p-5 rounded-[2rem] border border-border/40 hover:border-accent/30 transition-all group shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500">
              AI
            </span>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{t.demo.win_rate}</p>
          <p className="text-xl font-black tracking-tight">{stats.winRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal */}
        <div className="bg-[#050a08] rounded-3xl border border-accent/20 overflow-hidden shadow-2xl">
          <div className="bg-accent/5 border-b border-accent/10 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{t.demo.execution_log}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest",
                isRunning ? "text-emerald-500" : "text-amber-500"
              )}>
                {isRunning ? t.demo.active_status : t.demo.standby_status}
              </span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="h-96 overflow-y-auto p-6 font-mono text-xs space-y-2.5 custom-scrollbar"
          >
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-4">
                <Cpu className="w-12 h-12" />
                <p className="text-[10px] uppercase font-black tracking-widest">{t.demo.waiting}</p>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-white/20 shrink-0">[{log.time}]</span>
                <div className="flex items-start gap-2">
                  <span className="shrink-0">{log.icon}</span>
                  <span className={cn(
                    "leading-relaxed",
                    log.type === "TRADE" ? "text-accent font-bold" : 
                    log.type === "SUCCESS" ? "text-emerald-400" : 
                    log.type === "SYSTEM" ? "text-purple-400" : "text-white/70"
                  )}>
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade History */}
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t.demo.recent_trades}</h3>
            <span className="text-xs text-muted-foreground">Last {trades.length} executions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/30 bg-muted/20">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] text-left">{t.demo.asset}</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] text-left">{t.demo.side}</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] text-left">{t.demo.entry}</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] text-left">{t.demo.pnl}</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px] text-left">{t.demo.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-medium">
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                      No trades executed yet. Start the demo bot to begin simulation.
                    </td>
                  </tr>
                )}
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-6 py-4 font-bold">{trade.symbol}</td>
                    <td className={cn(
                      "px-6 py-4",
                      trade.side === "LONG" ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {trade.side}
                    </td>
                    <td className="px-6 py-4">${trade.entry.toFixed(2)}</td>
                    <td className={cn(
                      "px-6 py-4 font-bold",
                      trade.pnl && trade.pnl > 0 ? "text-emerald-500" : 
                      trade.pnl && trade.pnl < 0 ? "text-red-500" : ""
                    )}>
                      {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase",
                        trade.status === "OPEN" ? "bg-blue-500/10 text-blue-500" : "bg-white/5 text-white/40"
                      )}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-500/5 border border-purple-500/10 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
          <Zap className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-black uppercase tracking-widest text-sm mb-2">{t.demo.info_title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.demo.info_desc} 
            <span className="text-accent font-bold"> Elite</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
