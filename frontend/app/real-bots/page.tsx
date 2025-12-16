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
            const resStatus = await fetch("http://localhost:8000/bot/status");
            const dataStatus = await resStatus.json();
            if (dataStatus.running !== autoTrading) {
                setAutoTrading(dataStatus.running);
            }

            // Logs
            const resLogs = await fetch("http://localhost:8000/bot/logs");
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

    return () => {
        if (statusInterval.current) clearInterval(statusInterval.current);
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
        if (user.subscription_status === "premium") {
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
          const endpoint = shouldRun ? "/bot/start" : "/bot/stop";
          const body = shouldRun ? JSON.stringify({ api_key: key, api_secret: secret, leverage: leverage }) : undefined;
          
          const res = await fetch(`http://localhost:8000${endpoint}`, { 
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body
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

  return (
    <div className="flex h-screen bg-background">
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
