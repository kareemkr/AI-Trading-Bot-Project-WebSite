"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@/app/components/sparkline";
import { MarketRow } from "@/app/components/market-row";
import { loadWatchlist } from "@/lib/watchlist";

export default function MarketsPage() {
  const [coins, setCoins] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sortBy, setSortBy] = useState("market_cap");
  const [loading, setLoading] = useState(true);

  // Load watchlist
  useEffect(() => {
    setWatchlist(loadWatchlist());
  }, []);

  // Fetch market data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&sparkline=true&price_change_percentage=24h"
        );
        const data = await res.json();
        setCoins(data);
        setLoading(false);
      } catch (err) {
        console.error("Market data error:", err);
      }
    }
    load();
  }, []);

  // Apply filtering + sorting
  useEffect(() => {
    if (!Array.isArray(coins)) return;

    let list = coins.filter((c) => c && c.name);

    if (search) {
      list = list.filter((coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (tab === "gainers") {
      list = list.filter((c) => c.price_change_percentage_24h > 0);
    } else if (tab === "losers") {
      list = list.filter((c) => c.price_change_percentage_24h < 0);
    } else if (tab === "watchlist") {
      list = list.filter((c) => watchlist.includes(c.id));
    }

    if (sortBy === "price") {
      list.sort((a, b) => b.current_price - a.current_price);
    } else if (sortBy === "change") {
      list.sort(
        (a, b) =>
          (b.price_change_percentage_24h ?? 0) -
          (a.price_change_percentage_24h ?? 0)
      );
    } else {
      list.sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
    }

    setFiltered(list);
  }, [coins, search, tab, sortBy, watchlist]);

  return (
    <main className="min-h-screen px-6 md:px-12 py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[380px] h-[380px] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-chart-3/20 rounded-full blur-[100px] animate-float [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-2">
            Markets
          </h1>
          <p className="text-muted-foreground mt-1">
            Live cryptocurrency market prices, trends, and performance.
          </p>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl p-4 mb-6">
          <input
            type="text"
            placeholder="Search coins…"
            className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {[
            { id: "all", label: "All" },
            { id: "gainers", label: "Gainers" },
            { id: "losers", label: "Losers" },
            { id: "watchlist", label: "Watchlist" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sorting */}
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex gap-6 text-sm font-medium">
            {[
              { id: "market_cap", label: "Market Cap" },
              { id: "price", label: "Price" },
              { id: "change", label: "24h %" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`transition-all ${
                  sortBy === s.id
                    ? "text-primary font-semibold underline"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground">Loading market data…</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((coin) => (
              <MarketRow
                key={coin.id}
                coin={coin}
                watchlist={watchlist}
                setWatchlist={setWatchlist}
              />
            ))}
          </div>
        )}

        <p className="text-center text-muted-foreground mt-10 text-sm">
          Data provided by CoinGecko • Updated every minute
        </p>
      </div>
    </main>
  );
}
