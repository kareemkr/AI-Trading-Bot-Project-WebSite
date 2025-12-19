"use client";

import { useEffect, useState } from "react";
import { loadWatchlist } from "@/lib/watchlist";
import { Search, Filter, TrendingUp, TrendingDown, Star, Layout, Maximize2, Activity } from "lucide-react";
import TradingViewChart from "@/components/dashboard/tradingview-chart";
import { MarketRow } from "@/app/components/market-row";
import { useLanguage } from "@/lib/language-context";

export default function DashboardMarketPage() {
  const [coins, setCoins] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setWatchlist(loadWatchlist());
    async function load() {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&sparkline=true&price_change_percentage=24h");
        const data = await res.json();
        setCoins(data);
        setLoading(false);
      } catch (err) {
        console.error("Market data error:", err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!Array.isArray(coins)) return;
    let list = coins.filter((c) => c && c.name);
    if (search) list = list.filter((coin) => coin.name.toLowerCase().includes(search.toLowerCase()));
    if (tab === "gainers") list = list.filter((c) => c.price_change_percentage_24h > 0);
    else if (tab === "losers") list = list.filter((c) => c.price_change_percentage_24h < 0);
    else if (tab === "watchlist") list = list.filter((c) => watchlist.includes(c.id));
    setFiltered(list);
  }, [coins, search, tab, watchlist]);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-4 space-y-4 overflow-hidden">
      {/* Mini Header / Ticker Space */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-accent/10 text-accent">
                <Activity className="w-5 h-5" />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">{t.market.title}</h1>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{t.market.subtitle}</p>
             </div>
         </div>
         
         <div className="flex items-center gap-2 bg-card/40 p-1 rounded-xl border border-white/5 backdrop-blur-md scale-90 origin-right">
           {[
             { id: "all", label: t.market.all, icon: Filter },
             { id: "gainers", label: t.market.gainers, icon: TrendingUp },
             { id: "losers", label: t.market.losers, icon: TrendingDown },
             { id: "watchlist", label: t.market.favs, icon: Star },
           ].map((t) => (
             <button
               key={t.id}
               onClick={() => setTab(t.id)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 tab === t.id ? "bg-accent text-accent-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
               }`}
             >
               <t.icon className="w-3 h-3" />
               <span className="hidden sm:inline">{t.label}</span>
             </button>
           ))}
         </div>
      </div>

      {/* Main Cockpit Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* LEFT: TradingView Chart */}
        <div className="flex-1 bg-card/60 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden relative group">
           <div className="absolute top-6 left-6 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                 {t.market.live_feed}
              </div>
           </div>
           <div className="w-full h-full">
              <TradingViewChart />
           </div>
        </div>

        {/* RIGHT: Compact Watchlist */}
        <div className="w-[380px] hidden xl:flex flex-col bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
           <div className="p-6 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t.market.search}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-black/20 border border-white/5 focus:border-accent/40 outline-none text-[10px] font-black tracking-widest transition-all uppercase"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((coin) => (
                    <MarketRowCompact key={coin.id} coin={coin} watchlist={watchlist} setWatchlist={setWatchlist} />
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function MarketRowCompact({ coin, watchlist, setWatchlist }: any) {
  const isWatched = watchlist.includes(coin.id);
  
  const toggleWatch = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const newW = isWatched ? watchlist.filter(id => id !== coin.id) : [...watchlist, coin.id];
    setWatchlist(newW);
    localStorage.setItem("watchlist", JSON.stringify(newW));
  };

  return (
    <div className="flex items-center justify-between p-3 px-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group cursor-pointer">
       <div className="flex items-center gap-3">
          <img src={coin.image} className="w-6 h-6 rounded-full" alt="" />
          <div>
            <div className="flex items-center gap-2">
               <p className="text-[11px] font-black uppercase tracking-tight">{coin.symbol}</p>
               <button onClick={toggleWatch}>
                 <Star className={`w-2.5 h-2.5 ${isWatched ? "text-accent fill-accent" : "text-muted-foreground opacity-20 group-hover:opacity-100"}`} />
               </button>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate max-w-[80px]">{coin.name}</p>
          </div>
       </div>

       <div className="text-right">
          <p className="text-[11px] font-black leading-none italic">${coin.current_price.toLocaleString()}</p>
          <p className={`text-[9px] font-black mt-1 ${coin.price_change_percentage_24h > 0 ? "text-accent" : "text-red-500"}`}>
            {coin.price_change_percentage_24h > 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
          </p>
       </div>
    </div>
  );
}
