"use client";

import { Sparkline } from "./sparkline";
import { saveWatchlist } from "@/lib/watchlist";

export function MarketRow({ coin, watchlist, setWatchlist }) {
  const isWatched = watchlist.includes(coin.id);

  function toggleWatch() {
    let updated;
    if (isWatched) {
      updated = watchlist.filter((c) => c !== coin.id);
    } else {
      updated = [...watchlist, coin.id];
    }
    setWatchlist(updated);
    saveWatchlist(updated);
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
      {/* Left */}
      <div className="flex items-center gap-4">
        <img src={coin.image} className="w-8 h-8 rounded-full" />
        <div>
          <p className="font-semibold">{coin.name}</p>
          <p className="text-xs text-muted-foreground">
            {coin.symbol.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Sparkline */}
      <Sparkline
        data={coin.sparkline_in_7d?.price}
        color={coin.price_change_percentage_24h >= 0 ? "#4ade80" : "#f87171"}
      />

      {/* Right */}
      <div className="text-right">
        <p className="font-medium">${coin.current_price.toLocaleString()}</p>
        <p
          className={`text-sm ${
            coin.price_change_percentage_24h >= 0
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {coin.price_change_percentage_24h != null
  ? coin.price_change_percentage_24h.toFixed(2)
  : "0.00"}
%



        </p>
      </div>

      {/* Watchlist Star */}
      <button onClick={toggleWatch} className="ml-4 text-xl">
        {isWatched ? "★" : "☆"}
      </button>
    </div>
  );
}
