"use client";

import { ArrowUpRight, ArrowDownRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Trade {
  id: string;
  type: "buy" | "sell";
  asset: string;
  amount: number;
  price: number;
  status: "pending" | "executed" | "failed";
  timestamp: Date;
  pnl?: number;
  strategy?: string;
}

interface TradeBubbleProps {
  trade: Trade;
}

export function TradeBubble({ trade }: TradeBubbleProps) {
  const isBuy = trade.type === "buy";

  return (
    <div className="flex gap-3 w-full">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary" />
      </div>

      <div className="rounded-2xl border bg-card w-fit">
        <div
          className={cn(
            "px-4 py-2 flex items-center gap-2",
            isBuy ? "bg-emerald-500/10" : "bg-red-500/10"
          )}
        >
          {isBuy ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm font-semibold">
            {isBuy ? "BUY" : "SELL"} ORDER
          </span>
        </div>

        <div className="p-4 text-sm space-y-1">
          <p>Asset: {trade.asset}</p>
          <p>Amount: {trade.amount}</p>
          <p>Price: ${trade.price}</p>
        </div>

        <p className="px-4 pb-2 text-[10px] opacity-60">
          {trade.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
