"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Cpu, Zap, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";

const DEMO_SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "AVAX/USDT"];
const LOG_TYPES = [
  { type: "SCAN", icon: "🔍", text: "Scanning liquidity depth for {symbol}..." },
  { type: "ANALYSIS", icon: "📊", text: "ML Pattern identified on {symbol} (Score: {score})" },
  { type: "SIGNAL", icon: "💡", text: "Strategy matched: Scalping {side} Opportunity" },
  { type: "TRADE", icon: "🚀", text: "EXECUTING {side} {qty} {symbol} @ ${price}" },
  { type: "SUCCESS", icon: "✨", text: "Trade Filled! Target: 1:3 RR" },
];

export function DemoTerminal() {
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;

    const fetchLogs = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.BOT.LOGS);
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            const newLogs = data.logs.map((msg: string, i: number) => {
              // Parse basic info from message string
              const type = msg.includes("TRADE") ? "TRADE" : msg.includes("SUCCESS") ? "SUCCESS" : msg.includes("patterns") ? "SCAN" : "ANALYSIS";
              const icon = type === "TRADE" ? "🚀" : type === "SUCCESS" ? "✨" : type === "SCAN" ? "🔍" : "⚙️";
              return {
                id: i + msg,
                type,
                icon,
                text: msg.split('] ')[1] || msg,
                time: msg.match(/\[(.*?)\]/)?.[1]?.split(' ')[1] || "00:00:00"
              };
            });
            setLogs(newLogs.slice(-20));
            return true;
          }
        }
      } catch (e) { console.error(e); }
      return false;
    };

    interval = setInterval(async () => {
      const hasRealLogs = await fetchLogs();
      if (!hasRealLogs) {
        // ... (demo sequence logic if needed, but let's just stick to real/empty)
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#050a08] rounded-3xl border border-accent/20 overflow-hidden shadow-2xl relative group">
      {/* Header */}
      <div className="bg-accent/5 border-b border-accent/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">AI Execution Preview (Elite)</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Global Pool Activity</span>
        </div>
      </div>

      {/* Terminal View */}
      <div 
        ref={scrollRef}
        className="h-64 overflow-y-auto p-6 font-mono text-xs space-y-2.5 custom-scrollbar"
      >
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-4">
             <Cpu className="w-12 h-12 animate-spin-slow" />
             <p className="text-[10px] uppercase font-black tracking-widest">Connecting to Global Execution Engine...</p>
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-white/20 shrink-0">[{log.time}]</span>
            <div className="flex items-start gap-2">
              <span className="shrink-0">{log.icon}</span>
              <span className={cn(
                "leading-relaxed",
                log.type === "TRADE" ? "text-accent font-bold" : (log.type === "SUCCESS" ? "text-emerald-400" : "text-white/70")
              )}>
                {log.text}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Overlay - Subtle for free users to see through */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050a08] via-transparent to-transparent flex flex-col items-center justify-end p-8">
          <div className="bg-card/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] text-center max-w-sm shadow-2xl translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
              <Zap className="w-8 h-8 text-accent mx-auto mb-3" />
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Ready to automate?</h4>
              <p className="text-xs text-muted-foreground mb-4">Elite members see their own accounts live here. Start dominating the market today.</p>
              <button 
               onClick={() => (window as any).onOpenSubscription?.()}
               className="w-full py-3 bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                Activate Elite Protocol
              </button>
          </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
