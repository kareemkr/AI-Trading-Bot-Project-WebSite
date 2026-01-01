"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ApiKeyModal } from "@/components/bot/api-key-modal";
import { BotHeader } from "@/components/bot/Botheader";
import { ChatWindow, type Message } from "@/components/bot/chat-window";
import { ChatInput } from "@/components/bot/chat-input";
import { ToolsSidebar } from "@/components/bot/tools-sidebar";
import type { Trade } from "@/components/bot/trade-bubble";
import { LogConsole } from "@/components/bot/log-console";


import SubscriptionModal from "@/components/ui/subscription-modal";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api";

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function RealBotsPage() {
  const router = useRouter(); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoTrading, setAutoTrading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const statusInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Auth Check
  useEffect(() => {
     const userStr = localStorage.getItem("user");
     if (!userStr) {
       router.push("/");
     }
  }, [router]);

  // 2. Poll Status & Logs
  useEffect(() => {
    const fetchStatus = async () => {
        try {
            // Status
            const resStatus = await fetch(API_ENDPOINTS.BOT.STATUS);
            const dataStatus = await resStatus.json();
            if (dataStatus.running !== autoTrading) {
                setAutoTrading(dataStatus.running);
            }

            // Logs
            const resLogs = await fetch(API_ENDPOINTS.BOT.LOGS);
            const dataLogs = await resLogs.json();
            if (dataLogs.logs) {
                setLogs(dataLogs.logs.reverse()); // Newest first
            }
        } catch (e) {
            console.error("Poll error", e);
        }
    };

    fetchStatus(); // Initial call
    statusInterval.current = setInterval(fetchStatus, 2000); // Poll every 2s

    const handleOpenSub = () => setIsSubModalOpen(true);
    window.addEventListener("open-subscription-modal", handleOpenSub);

    return () => {
        if (statusInterval.current) clearInterval(statusInterval.current);
        window.removeEventListener("open-subscription-modal", handleOpenSub);
    };
  }, []);

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ... (existing effects)

  // 3. Start/Stop Handlers
  const handleToggleAttempt = (shouldRun: boolean) => {
    if (!shouldRun) {
        // Stop is easy
        toggleBotRequest(false);
        return;
    }

    // Start requires flows
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const status = user.subscription_status?.toLowerCase();
        if (status === "premium" || status === "pro" || status === "elite") {
            setIsApiKeyModalOpen(true);
        } else {
            setIsSubModalOpen(true);
        }
    } catch (e) {
        console.error("User parse error", e);
    }
  };

  const onKeysSubmit = async (apiKey: string, apiSecret: string, leverage: number) => {
      setIsConnecting(true);
      try {
          await toggleBotRequest(true, apiKey, apiSecret, leverage);
          setIsApiKeyModalOpen(false);
          toast.success(`Bot Started (Leverage: ${leverage}x)`);
      } catch (e) {
          toast.error("Failed to start bot");
      } finally {
          setIsConnecting(false);
      }
  };

  const toggleBotRequest = async (shouldRun: boolean, key?: string, secret?: string, leverage: number = 20) => {
      try {
          const token = localStorage.getItem("token");
          const endpoint = shouldRun ? API_ENDPOINTS.BOT.START : API_ENDPOINTS.BOT.STOP;
          const res = await fetch(endpoint, { 
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": token ? `Bearer ${token}` : ""
              },
              body: shouldRun ? JSON.stringify({ 
                  api_key: key, 
                  api_secret: secret, 
                  leverage: leverage,
                  use_news_ai: true // Combine both bots as requested
              }) : undefined
          });
          
          if (!res.ok) throw new Error("Failed");

          setAutoTrading(shouldRun); // Optimistic update
          
          // Add system message
          setMessages(prev => [...prev, {
              id: genId(),
              role: "assistant",
              content: shouldRun ? "✅ **Trading Engine Started with Custom Keys**" : "🛑 **Trading Engine Stopped**",
              timestamp: new Date()
          }]);

      } catch (e) {
          console.error("Toggle error", e);
          throw e;
      }
  };

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
      const res = await fetch(API_ENDPOINTS.ASSISTANT.CHAT, {
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
     RESTRICTION CHECK
  ---------------------------------- */
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const status = user.subscription_status?.toLowerCase();
            if (status === "premium" || status === "pro" || status === "elite") {
                setIsRestricted(false);
            } else {
                setIsRestricted(true);
            }
        } catch (e) {
            console.error("Auth check failed", e);
        }
    }
  }, []);

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {/* RESTRICTED CONTENT WRAPPER */}
      <div className={`flex h-full transition-all duration-700 ${isRestricted ? "blur-xl opacity-30 pointer-events-none scale-95 grayscale" : ""}`}>
          <div className="flex-1 flex flex-col min-w-0">
            <BotHeader
              onClearChat={() => setMessages([])}
              onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
              autoTrading={autoTrading}
              onToggleAutoTrading={handleToggleAttempt} 
              title="REAL TRADING BOT (BTC/USDT)"
            />

            <div className="flex-1 overflow-hidden flex">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col relative z-0">
                    <ChatWindow
                        messages={messages}
                        isLoading={isLoading}
                        onQuickSend={handleSend}
                    />
                    <ChatInput onSend={handleSend} isLoading={isLoading} />
                </div>
                
                {/* Live Logs Panel (Desktop) */}
                <LogConsole logs={logs} autoTrading={autoTrading} />
            </div>
          </div>

          <ToolsSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            recentTrades={[]} // Real trades would come from log parsing or API, empty for now
          />
      </div>

      {/* PREMIUM LOCK OVERLAY */}
      {isRestricted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-lg w-full bg-black/40 backdrop-blur-2xl border border-white/10 p-10 rounded-[2rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                {/* Decorative Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
                
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight text-white">
                        Premium Access Required
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[300px] mx-auto">
                        Real-time AI trading execution is exclusively available for our Pro & Elite subscribers.
                    </p>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={() => setIsSubModalOpen(true)}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                    >
                        Unlock Trading Engine
                    </button>
                    <p className="mt-4 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">
                        30-Day Money Back Guarantee
                    </p>
                </div>
            </div>
        </div>
      )}

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)}
        onSubmit={onKeysSubmit}
        isLoading={isConnecting}
      />

      <SubscriptionModal
        open={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />
    </div>
  );
}
