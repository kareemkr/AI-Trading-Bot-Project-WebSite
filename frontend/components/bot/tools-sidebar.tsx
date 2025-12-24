"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  History,
  Search,
  Briefcase,
  Newspaper,
  BarChart3,
} from "lucide-react";
import type { Trade } from "./trade-bubble";

interface ToolsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentTrades: Trade[];
}

const tools = [
  {
    icon: Search,
    name: "Market Scanner",
    description: "Scan markets for opportunities",
    comingSoon: true,
  },
  {
    icon: Briefcase,
    name: "Portfolio Tracker",
    description: "Track holdings",
    comingSoon: true,
  },
  {
    icon: Newspaper,
    name: "News Sentiment",
    description: "Analyze news",
    comingSoon: false,
  },
  {
    icon: BarChart3,
    name: "Strategy Builder",
    description: "Create strategies",
    comingSoon: true,
  },
];

export function ToolsSidebar({
  isOpen,
  onClose,
  recentTrades,
}: ToolsSidebarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [binanceKey, setBinanceKey] = useState("");
  const [binanceSecret, setBinanceSecret] = useState("");
  const [alphaFeed, setAlphaFeed] = useState<any[]>([]);

  // Fetch aggregated feed (News + Alpha)
  const fetchFeed = async () => {
    try {
      const [alphaRes, newsRes] = await Promise.all([
        fetch("http://localhost:8000/news/alpha"),
        fetch("http://localhost:8000/news/latest")
      ]);

      let combined: any[] = [];

      if (alphaRes.ok) {
        const alpha = await alphaRes.json();
        combined = [...combined, ...alpha];
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.news) {
            combined = [...combined, ...newsData.news];
        }
      }

      // Sort by creation time desc
      combined.sort((a, b) => {
        const tA = new Date(a.created_at || 0).getTime();
        const tB = new Date(b.created_at || 0).getTime();
        return tB - tA;
      });

      setAlphaFeed(combined);
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      setBinanceKey(u.binance_api_key || "");
      setBinanceSecret(u.binance_api_secret || "");
    }
    
    if (isOpen) {
      fetchFeed();
      const interval = setInterval(fetchFeed, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSyncProtocol = async () => {
    setIsSyncing(true);
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please sign in first.");

        // 1. Verify on Backend
        const verifyRes = await fetch("http://localhost:8000/account/verify-keys?api_key=" + binanceKey + "&api_secret=" + binanceSecret, {
            method: "POST"
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            throw new Error(verifyData.message || "Invalid API keys.");
        }

        // 2. Persist to Profile
        const saveRes = await fetch("http://localhost:8000/auth/update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                binance_api_key: binanceKey,
                binance_api_secret: binanceSecret
            })
        });

        if (!saveRes.ok) throw new Error("Failed to sync profile.");
        
        const userData = await saveRes.json();
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...user, ...userData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Trigger storage event for dashboard update
        window.dispatchEvent(new Event("storage"));
        
        toast.success("Protocol Synced", {
            description: "Binance Neural Link established successfully."
        });
    } catch (e: any) {
        toast.error("Sync Failed", {
            description: e.message
        });
    } finally {
        setIsSyncing(false);
    }
  };

  const handleKeyChange = (val: string) => {
    setBinanceKey(val);
  };

  const handleSecretChange = (val: string) => {
    setBinanceSecret(val);
  };

  /* ----------------------------------
     RENDER
  ---------------------------------- */
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[998]" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-background/80 backdrop-blur-3xl border-l border-white/5 p-5 transition-transform z-[999] overflow-y-auto shadow-2xl custom-scrollbar",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg tracking-tight">Command Center</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10">
            ×
          </Button>
        </div>

        {/* TOOLS LIST */}
        <div className="relative space-y-2 mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-3 px-1">Active Modules</h3>
            {tools.map((tool, i) => (
            <div
                key={i}
                className="group relative p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 overflow-hidden hover:bg-white/[0.08] transition-all"
            >
                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                    <tool.icon className={cn("w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors", !tool.comingSoon && "animate-pulse")} />
                </div>
                <div className="flex-1 min-w-0 transition-opacity duration-300 group-hover:opacity-20">
                    <p className="text-[11px] font-black uppercase tracking-wider text-white/80">{tool.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold truncate opacity-60">
                        {tool.description}
                    </p>
                </div>
                
                {/* Hover Description Layer */}
                <div className="absolute inset-0 left-14 flex items-center pr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <p className="text-[9px] font-black uppercase tracking-widest text-accent leading-tight">
                        {tool.description}
                    </p>
                </div>
            </div>
            ))}
        </div>

        {/* Live Market Intelligence Feed */}
        <div className="relative mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                <Newspaper className="w-3.5 h-3.5" /> Market Intelligence
            </h3>
            <div className="space-y-4">
                {alphaFeed.length > 0 ? (
                    alphaFeed.map((news, i) => (
                        <div key={i} className="flex flex-col gap-2 pb-3 border-b border-white/5 last:border-0 group animate-in fade-in slide-in-from-right-2 duration-500">
                            {/* Source Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {/* Source Icon/Badge */}
                                    {news.source === "YahooFinance" ? (
                                        <span className="bg-[#720e9e] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-sm flex items-center gap-1">
                                            Y! <span className="opacity-70 font-normal">Finance</span>
                                        </span>
                                    ) : news.platform === "X" || news.source === "X" ? (
                                        <span className="bg-black text-white border border-white/20 text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-sm">
                                            𝕏
                                        </span>
                                    ) : (
                                        <span className="bg-orange-500/20 text-orange-400 text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-sm">
                                            CC
                                        </span>
                                    )}
                                    
                                    {/* Account/Tag */}
                                    {news.account && <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">@{news.account}</span>}
                                    {news.coin_tag && <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">#{news.coin_tag}</span>}
                                </div>
                                
                                {/* Category Badge */}
                                {(news.category || news.type === "NEWS") && (
                                    <span className={cn(
                                        "text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                        news.category?.includes("ELITE") ? "bg-purple-500/20 text-purple-400" : 
                                        news.category?.includes("WHALE") ? "bg-blue-500/20 text-blue-400" : 
                                        news.type === "NEWS" ? "bg-white/10 text-white/50" :
                                        "bg-emerald-500/20 text-emerald-400"
                                    )}>{news.category || "HEADLINE"}</span>
                                )}
                            </div>

                            {/* Content */}
                            <p className="text-[10px] font-bold text-foreground leading-tight line-clamp-3">
                                {news.content || news.title || news.summary}
                            </p>

                            {/* Heuristic Bar */}
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full transition-all duration-1000", (news.heuristic ?? news.sentiment ?? 0) > 0 ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]")} 
                                        style={{ width: `${Math.abs(news.heuristic ?? news.sentiment ?? 0) * 100}%` }} 
                                    />
                                </div>
                                <span className={cn("text-[8px] font-black uppercase", (news.heuristic ?? news.sentiment ?? 0) > 0 ? "text-emerald-500" : "text-red-500")}>
                                    {(news.heuristic ?? news.sentiment ?? 0) > 0 ? "+" : ""}{(news.heuristic ?? news.sentiment ?? 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center space-y-3 opacity-30">
                        <Newspaper className="w-8 h-8 mx-auto animate-pulse" />
                        <p className="text-[10px] uppercase font-black tracking-widest leading-tight">Neural Channels<br/>Syncing...</p>
                    </div>
                )}
            </div>
            <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-white/20 text-center animate-pulse">Monitoring Global Feeds (Yahoo, X, CC)...</p>
        </div>

        {/* Binance Connection Settings */}
        <div className="mt-6 p-4 rounded-2xl bg-accent/5 border border-accent/10">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Binance Protocol
            </h3>
            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">API Key</label>
                    <input 
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent transition-all text-white"
                        value={binanceKey}
                        onChange={(e) => handleKeyChange(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">API Secret</label>
                    <input 
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent transition-all text-white"
                        value={binanceSecret}
                        onChange={(e) => handleSecretChange(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleSyncProtocol}
                    disabled={isSyncing || !binanceKey || !binanceSecret}
                    className="w-full py-2.5 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
                >
                    {isSyncing ? "Verifying..." : "Synchronize Protocol"}
                </button>
                <p className="text-[9px] text-muted-foreground leading-tight italic">
                    Keys are processed through an encrypted private node. Ensure "Enable Futures" is active on Binance.
                </p>
            </div>
        </div>

        <div className="mt-6 mb-10">
          <h3 className="font-semibold flex items-center gap-2 text-sm mb-3">
            <History className="w-4 h-4" /> Operations Cloud
          </h3>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {recentTrades.length === 0 && (
              <p className="text-xs text-muted-foreground italic opacity-50">Awaiting system triggers...</p>
            )}

            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 hover:border-white/20 transition-all group"
              >
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    trade.type === "buy" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                    {trade.type === "buy" ? (
                      <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                    )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-black uppercase tracking-tighter text-white/90">{trade.asset}</p>
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">LIVE</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-tighter opacity-70">
                    {trade.amount.toFixed(4)} Units @ ${trade.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
