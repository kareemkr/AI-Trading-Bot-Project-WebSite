"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "./chat-bubble";
import { TradeBubble, type Trade } from "./trade-bubble";
import { TypingIndicator } from "./typing-indicator";
import { TrendingUp, Zap, Shield, LineChart } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "trade";
  content: string;
  timestamp: Date;
  trade?: Trade;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onQuickSend: (text: string) => void;
}

const suggestions = [
  { icon: TrendingUp, text: "Analyze BTC/USD trend" },
  { icon: Zap, text: "Best entry points today" },
  { icon: Shield, text: "Risk management tips" },
  { icon: LineChart, text: "Market sentiment" },
];

export function ChatWindow({
  messages,
  isLoading,
  onQuickSend,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center h-full px-4 py-10 text-center space-y-10">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">K</span>
            </div>

            <h1 className="text-3xl font-bold">Welcome to KRO</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your AI-powered trading assistant. Ask me about market analysis,
              trading strategies, or portfolio management.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onQuickSend(s.text)}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((msg) =>
          msg.role === "trade" && msg.trade ? (
            <TradeBubble key={msg.id} trade={msg.trade} />
          ) : (
            <ChatBubble
              key={msg.id}
              role={msg.role as "assistant" | "user"}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          )
        )}

        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
