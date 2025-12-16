"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BotHeader } from "@/components/bot/Botheader";
import { ChatWindow, type Message } from "@/components/bot/chat-window";
import { ChatInput } from "@/components/bot/chat-input";
import { ToolsSidebar } from "@/components/bot/tools-sidebar";
import type { Trade } from "@/components/bot/trade-bubble";
import SubscriptionModal from "@/components/ui/subscription-modal";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ----------------------------------
   SAFE ID GENERATOR (NO crypto)
---------------------------------- */
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function BotsPage() {
  const router = useRouter(); // For redirecting
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const autoTradeInterval = useRef<NodeJS.Timeout | null>(null);

  // 🔒 PROTECT ROUTE (Logged in only)
  const [isChecking, setIsChecking] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Kept if needed later, or remove

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/");
        return;
      }
      // Allow ALL logged in users
      setIsChecking(false);
    };
    checkAuth();
  }, [router]);



  const scenarios = [
    { asset: "BTC/USD", type: "buy", reason: "Bullish divergence" },
    { asset: "ETH/USD", type: "buy", reason: "Strong support bounce" },
    { asset: "SOL/USD", type: "sell", reason: "Overbought RSI" },
    { asset: "BTC/USD", type: "sell", reason: "Resistance rejection" },
    { asset: "LINK/USD", type: "buy", reason: "Breakout confirmed" },
  ] as const;

  /* ----------------------------------
     AUTO-TRADE DEMO LOOP
  ---------------------------------- */
  useEffect(() => {
    if (!autoTrading) {
      if (autoTradeInterval.current) {
        clearInterval(autoTradeInterval.current);
      }
      return;
    }

    const first = setTimeout(executeAutoTrade, 2000);

    autoTradeInterval.current = setInterval(
      executeAutoTrade,
      12000 + Math.random() * 8000
    );

    return () => {
      clearTimeout(first);
      if (autoTradeInterval.current) {
        clearInterval(autoTradeInterval.current);
      }
    };
  }, [autoTrading]);

  /* ----------------------------------
     EXECUTE DEMO TRADE (UI ONLY)
  ---------------------------------- */
  const executeAutoTrade = useCallback(() => {
    const s = scenarios[Math.floor(Math.random() * scenarios.length)];

    const pnl =
      s.type === "buy"
        ? Number((Math.random() * 4).toFixed(2))
        : Number((Math.random() * -3).toFixed(2));

    const trade: Trade = {
      id: genId(),
      type: s.type,
      asset: s.asset,
      amount: Number((0.01 + Math.random() * 0.05).toFixed(4)),
      price: Number((65000 + Math.random() * 2000).toFixed(2)),
      status: "executed",
      timestamp: new Date(),
      pnl,
      strategy: s.reason,
    };

    setRecentTrades((prev) => [trade, ...prev].slice(0, 10));

    setMessages((prev) => [
      ...prev,
      {
        id: genId(),
        role: "trade",
        content: "",
        timestamp: new Date(),
        trade,
      },
      {
        id: genId(),
        role: "assistant",
        content: `📊 **Demo Trade Executed**
Asset: **${trade.asset}**
Strategy: *${trade.strategy}*
PnL: **${pnl > 0 ? "+" : ""}${pnl}%**`,
        timestamp: new Date(),
      },
    ]);
  }, [scenarios]);

  /* ----------------------------------
     AI CHAT (REAL BACKEND)
  ---------------------------------- */
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: genId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: data.reply ?? "No response received.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: "Error: Could not connect to AI server.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ----------------------------------
     RENDER
  ---------------------------------- */
  if (isChecking) {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  // Locked UI removed.


  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <BotHeader
          onClearChat={() => setMessages([])}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          autoTrading={autoTrading}
          onToggleAutoTrading={setAutoTrading}
        />

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onQuickSend={handleSend}
        />

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>

      <ToolsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        recentTrades={recentTrades}
      />
    </div>
  );
}
