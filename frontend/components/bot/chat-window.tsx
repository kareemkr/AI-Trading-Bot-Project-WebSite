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
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Futuristic Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)] opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full px-6 py-10 text-center relative z-10">
          <div className="space-y-8 mb-12">
            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-accent/10 border border-accent/20 flex items-center justify-center shadow-2xl shadow-accent/10 group hover:scale-110 transition-transform duration-500">
              <img src="/neural-logo.png" className="w-16 h-16 object-cover rounded-xl" alt="Neural Flow" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                Neural <span className="text-accent">Assistant</span>
              </h1>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                Hybrid Intelligence Operational
              </p>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground max-w-lg mx-auto leading-relaxed border-t border-white/5 pt-6">
              "Unified signal engine. Processing charts and news sentiment. 
              Deploying logic for market domination."
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
