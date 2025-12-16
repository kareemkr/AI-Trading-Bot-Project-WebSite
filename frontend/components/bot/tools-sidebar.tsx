"use client";

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
    comingSoon: true,
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
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[998]" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-72 bg-sidebar border-l p-4 transition-transform z-[999]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Tools</h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>

        {tools.map((tool, i) => (
          <div
            key={i}
            className="p-3 rounded-lg hover:bg-muted cursor-pointer flex items-center gap-3"
          >
            <tool.icon className="w-5 h-5" />
            <div>
              <p className="font-medium">{tool.name}</p>
              <p className="text-xs text-muted-foreground">
                {tool.description}
              </p>
            </div>
            <ChevronRight className="ml-auto w-4 h-4 opacity-50" />
          </div>
        ))}

        <div className="mt-6">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="w-4 h-4" /> Recent Trades
          </h3>

          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {recentTrades.length === 0 && (
              <p className="text-xs text-muted-foreground">No trades yet.</p>
            )}

            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center gap-2 p-2 bg-muted rounded-lg"
              >
                {trade.type === "buy" ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}

                <div className="flex-1">
                  <p className="text-xs font-medium">{trade.asset}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {trade.amount.toFixed(4)} @ ${trade.price}
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
