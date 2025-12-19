"use client";

import { useState, useEffect } from "react";
import { Sparkline } from "./sparkline";
import { saveWatchlist } from "@/lib/watchlist";
import { Star } from "lucide-react";

export function MarketRow({ coin, watchlist, setWatchlist, isDashboardView = false }: any) {
  const isWatched = watchlist.includes(coin.id);

  function toggleWatch() {
    let updated;
    if (isWatched) {
      updated = watchlist.filter((c: string) => c !== coin.id);
    } else {
      updated = [...watchlist, coin.id];
    }
    setWatchlist(updated);
    saveWatchlist(updated);
  }

  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const status = user?.subscription_status?.toLowerCase();
  const hasSignals = status === "pro" || status === "elite";
  const isElite = status === "elite" || status === "pro";

  if (isDashboardView) {
    // Determine a mock signal based on 24h change for demo
    const isBullish = coin.price_change_percentage_24h > 0.5;
    const isBearish = coin.price_change_percentage_24h < -0.5;
    const signal = isBullish ? "Strong Buy" : (isBearish ? "Strong Sell" : "Neutral");
    const signalColor = isBullish ? "text-emerald-500" : (isBearish ? "text-red-500" : "text-muted-foreground");

    return (
      <tr className="hover:bg-muted/10 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={toggleWatch} className="text-muted-foreground hover:text-yellow-400 transition-colors">
              <Star className={`w-4 h-4 ${isWatched ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </button>
            <img src={coin.image} className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-bold text-sm">{coin.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{coin.symbol}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="font-semibold text-sm">${coin.current_price.toLocaleString()}</p>
        </td>
        <td className="px-6 py-4 font-medium">
          <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) : "0.00"}%
          </p>
        </td>
        <td className="px-6 py-4">
            {hasSignals ? (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isBullish ? "bg-emerald-500" : (isBearish ? "bg-red-500" : "bg-muted")}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${signalColor}`}>{signal}</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 opacity-30 grayscale cursor-not-allowed" title="Unlock Pro to view AI signals">
                    <Star className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Locked</span>
                </div>
            )}
        </td>
        <td className="px-6 py-4 text-right">
           <button 
             onClick={() => window.location.href = isElite ? "/dashboard/bots" : "/dashboard/market"}
             className={`px-4 py-2 rounded-xl text-white font-black uppercase tracking-widest text-[9px] opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 ${isElite ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "bg-white/5 border border-white/10"}`}>
             {isElite ? "Execute Protocol" : "View Intelligence"}
           </button>
        </td>
      </tr>
    );
  }

  // Original view for non-dashboard use
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-4">
        <img src={coin.image} className="w-8 h-8 rounded-full" />
        <div>
          <p className="font-semibold">{coin.name}</p>
          <p className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</p>
        </div>
      </div>
      <Sparkline
        data={coin.sparkline_in_7d?.price}
        color={coin.price_change_percentage_24h >= 0 ? "#4ade80" : "#f87171"}
      />
      <div className="text-right">
        <p className="font-medium">${coin.current_price.toLocaleString()}</p>
        <p className={`text-sm ${coin.price_change_percentage_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
          {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) : "0.00"}%
        </p>
      </div>
      <button onClick={toggleWatch} className="ml-4 text-xl">
        {isWatched ? "★" : "☆"}
      </button>
    </div>
  );
}
