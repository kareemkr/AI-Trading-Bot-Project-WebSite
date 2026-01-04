"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BotHeader } from "@/components/bot/Botheader";
import { ChatWindow, type Message } from "@/components/bot/chat-window";
import { ChatInput } from "@/components/bot/chat-input";
import { ToolsSidebar } from "@/components/bot/tools-sidebar";
import type { Trade } from "@/components/bot/trade-bubble";
import { 
  ShieldAlert, 
  Rocket, 
  Lock, 
  ArrowRight, 
  Zap, 
  Target, 
  Sliders, 
  Loader2, 
  Play, 
  Square, 
  Sparkles,
  Terminal,
  Search,
  PieChart,
  LayoutGrid,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import SubscriptionModal from "@/components/ui/subscription-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { LogConsole } from "@/components/bot/log-console";

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function BotsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [viewMode, setViewMode] = useState<'assistant' | 'terminal'>('assistant');
  const [terminalTab, setTerminalTab] = useState<'logs' | 'scanner' | 'heatmap' | 'bubbles'>('logs');
  const [logs, setLogs] = useState<string[]>([]);
  const [newsLogs, setNewsLogs] = useState<string[]>([]);
  const lastLogRef = useRef<string[]>([]);
  const lastNewsLogRef = useRef<string[]>([]);
  const { t } = useLanguage();

  // Simulation settings
  const [leverage, setLeverage] = useState(10);
  const logInterval = useRef<NodeJS.Timeout | null>(null);

  const status = user?.subscription_status?.toLowerCase();
  const isElite = status === "elite" || status === "pro";
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [neuralState, setNeuralState] = useState({ 
    ta: 75, 
    news: 50, 
    signal: "NEUTRAL", 
    session: "NY_OPEN_PEAK",
    confidence: 0,
    drivers: [] as string[],
    lastUpdated: "Never"
  });

  const checkStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/bot/status");
      const data = await res.json();
      setIsBotRunning(data.running);
      if (data.running) startLogPolling();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isBotRunning) {
        startLogPolling();
    } else {
        if (logInterval.current) clearInterval(logInterval.current);
    }
    return () => {
        if (logInterval.current) clearInterval(logInterval.current);
    };
  }, [isBotRunning]);

  const startLogPolling = () => {
    if (logInterval.current) clearInterval(logInterval.current);
    logInterval.current = setInterval(async () => {
      try {
        // Fetch Trading Logs
        const res = await fetch("http://localhost:8000/bot/logs");
        if (res.ok) {
            const data = await res.json();
            if (data.logs && Array.isArray(data.logs)) {
                setLogs(data.logs);
            }
        }

        // Fetch News Logs
        const newsRes = await fetch("http://localhost:8000/news/logs");
        if (newsRes.ok) {
            const newsData = await newsRes.json();
            if (newsData.logs && Array.isArray(newsData.logs)) {
                setNewsLogs(newsData.logs);
            }
        }
      } catch (e) {
          console.error("Neural Log Error:", e);
      }
    }, 3000);
  };

  const fetchNeuralMeta = async () => {
    try {
        const res = await fetch("http://localhost:8000/news/status");
        if (res.ok) {
            const data = await res.json();
            const sig = data.signal_data || {};
            setNeuralState({
                ta: Math.floor(60 + Math.random() * 30),
                news: Math.round((data.sentiment_score || 0.5) * 100),
                signal: sig.signal || "NEUTRAL",
                session: data.current_session || "NY_OPEN_PEAK",
                confidence: sig.confidence || 0,
                drivers: sig.drivers || [],
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });
        }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNeuralMeta(); // Initial fetch
    const metaId = setInterval(fetchNeuralMeta, 10000);
    return () => clearInterval(metaId);
  }, []);

  const handleStartBot = async () => {
    if (!isElite) {
      setIsSubOpen(true);
      return;
    }
    
    setIsStarting(true);
    try {
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      
      if (!token || !userRaw) {
        toast.error("Session Expired", {
            description: "Please sign in again to start the bot."
        });
        setIsStarting(false);
        return;
      }

      const user = JSON.parse(userRaw);
      const binanceKey = user.binance_api_key;
      const binanceSecret = user.binance_api_secret;

      if (!binanceKey || !binanceSecret) {
        toast.info("Entering Shadow Mode", {
            description: "No Binance keys found in your profile. Bot will generate signals and patterns without real execution."
        });
      }

      const useNewsAI = user.news_analysis_ai || false;

      console.log("Starting bot with token:", token ? "Token present" : "Token MISSING");

      const res = await fetch("http://localhost:8000/bot/start", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
            leverage,
            api_key: binanceKey,
            api_secret: binanceSecret,
            use_news_ai: useNewsAI
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsBotRunning(true);
        startLogPolling();
        toast.success("AI Bot Engine Started!");
      } else {
        console.error("Bot start failed:", data);
        toast.error(data.detail || data.message || "Failed to start bot");
      }
    } catch (e) {
      console.error("Bot start network error:", e);
      toast.error("Network error starting bot");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBot = async () => {
    try {
      await fetch("http://localhost:8000/bot/stop", { method: "POST" });
      setIsBotRunning(false);
      if (logInterval.current) clearInterval(logInterval.current);
      toast.info("Engine Shutdown Initiated");
      setMessages(prev => [...prev, { 
          id: genId(), 
          role: "assistant", 
          content: `⛔ **${t.bots.offline_msg}**\nTrading loop stopped. All active sessions cleared.`, 
          timestamp: new Date() 
      }]);
    } catch (e) {
      toast.error("Error stopping bot");
    }
  };

  /* ----------------------------------
     RESTRICTION & PREVIEW MODE
  ---------------------------------- */
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      const elite = u.subscription_status?.toLowerCase() === "elite" || u.subscription_status?.toLowerCase() === "pro";
      
      if (!elite) {
        setIsRestricted(true);
        // We still let the simulation run in background if we want the blur to be "live", 
        // but for "not allowed" we typically just block it.
        // User requested "live bot shouldnt be allowed".
        setIsBotRunning(false);
      } else {
        checkStatus();
      }
    }
  }, []);

  // Listen for Sidebar Unlock events
  useEffect(() => {
    const handleOpenSub = () => setIsSubOpen(true);
    window.addEventListener("open-subscription-modal", handleOpenSub);
    return () => window.removeEventListener("open-subscription-modal", handleOpenSub);
  }, []);


  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: genId(), role: "user", content: text, timestamp: new Date() }]);
    
    // ... (rest of send logic) ...
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode: "trading" }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: genId(), role: "assistant", content: data.reply ?? "Ready for execution.", timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { id: genId(), role: "assistant", content: "System optimizing...", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex h-full bg-[#030706] relative overflow-hidden">
        {/* Institutional Glow Layers */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-0 pointer-events-none" />
         {/* PREMIUM LOCK OVERLAY */}
        {isRestricted && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                <div className="relative max-w-lg w-full bg-black/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[2rem] shadow-2xl text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
                    
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight text-white">
                            {t.bots.inst_access}
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-[300px] mx-auto">
                            {t.bots.exclusive_msg}
                        </p>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={() => setIsSubOpen(true)}
                            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                        >
                            {t.bots.upgrade_plan}
                        </button>
                    </div>
                </div>
            </div>
        )}

      <div className={cn("flex-1 flex flex-col min-w-0 relative transition-all duration-700", isRestricted ? "blur-xl opacity-30 pointer-events-none scale-95 grayscale" : "")}>
        <BotHeader
          onClearChat={() => setMessages([])}
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          autoTrading={isBotRunning}
          onToggleAutoTrading={(val) => val ? handleStartBot() : handleStopBot()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Neural Synergy Matrix */}
        {isBotRunning && (
            <div className="px-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 relative z-10 w-full">
                {neuralState.session === "WEEKEND_LOW_LIQUIDITY" && (
                    <div className="max-w-7xl mx-auto mt-4 px-4 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center gap-3 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <ShieldAlert className="w-4 h-4 text-yellow-500/50" />
                        <span className="text-[10px] font-medium text-yellow-500/80 italic tracking-wide">
                            Institutional giants are at rest. Weekend liquidity is a dance of shadows — <span className="text-yellow-500 font-black uppercase tracking-tighter not-italic">patience is the ultimate alpha.</span>
                        </span>
                    </div>
                )}
                
                {/* ADVANCED ANALYTICS NAVIGATION */}
                {viewMode === 'terminal' && (
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
                        <div className="flex bg-black/60 p-1 rounded-full border border-white/5 shadow-inner backdrop-blur-xl">
                            {[
                                { id: 'logs', label: 'SYSTEM LOGS', icon: Terminal },
                                { id: 'scanner', label: 'SCANNER', icon: Search },
                                { id: 'heatmap', label: 'HEAT MAP', icon: PieChart },
                                { id: 'bubbles', label: 'BUBBLES', icon: LayoutGrid },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTerminalTab(tab.id as any)}
                                    className={cn(
                                        "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 flex items-center gap-2.5 border border-transparent",
                                        terminalTab === tab.id 
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                                            : "text-white/30 hover:text-white/60"
                                    )}
                                >
                                    <tab.icon className={cn("w-3.5 h-3.5", terminalTab === tab.id ? "text-emerald-500" : "text-white/20")} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black uppercase text-accent tracking-[0.4em] opacity-40">Matrix_Link</span>
                                <span className="text-[10px] font-black text-white/50 italic tracking-tighter">SECURE.EST.2025</span>
                             </div>
                             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-white/20" />
                             </div>
                        </div>
                    </div>
                )}
                
                <div className="py-4 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-6 justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-8 flex-1 w-full md:w-auto">
                        {/* CHART ENGINE Indicator */}
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">{t.bots.graph_conviction}</span>
                                <span className="text-[10px] font-black text-white/50">{neuralState.ta}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${neuralState.ta}%` }} />
                            </div>
                        </div>

                        <div className="w-px h-8 bg-white/10 hidden md:block" />

                        {/* NEWS ENGINE Indicator */}
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-purple-400 tracking-[0.2em]">{t.bots.news_sentiment}</span>
                                    {neuralState.drivers.length > 0 && (
                                        <span className="text-[7px] text-purple-400/50 font-bold uppercase truncate max-w-[150px]">
                                            {neuralState.drivers.join(", ")}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-white/50">{neuralState.signal}</span>
                                    <span className="text-[8px] font-bold text-purple-400/40">CONF: {Math.round(neuralState.confidence * 100)}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000" style={{ width: `${neuralState.news}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 shadow-inner group">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-accent/70 tracking-[0.2em]">{t.bots.global_session}</span>
                            <span className="text-[11px] font-black uppercase italic tracking-tighter text-white">
                                {neuralState.session.replace(/_/g, " ")}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-purple-400/70 tracking-[0.2em]">{t.bots.neural_synergy}</span>
                            <span className="text-[11px] font-black uppercase italic tracking-tighter text-purple-400 group-hover:text-purple-300 transition-colors">
                                {neuralState.news > 70 ? t.bots.high_conviction : t.bots.analyzing}
                            </span>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black uppercase text-white/20 tracking-[0.2em]">Sync_Pulse</span>
                            <span className="text-[9px] font-mono text-white/40">{neuralState.lastUpdated}</span>
                        </div>
                        <Sparkles className="w-4 h-4 text-accent ml-2 group-hover:rotate-12 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
        )}
        {/* Live Controls Bar */}
        <div className="bg-[#0a0f0d]/60 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-8 relative z-10 w-full">
          <div className="flex flex-wrap items-center justify-between md:justify-start gap-4 md:gap-10">
              <div className="flex items-center gap-4">
                  {!isElite ? (
                      <button 
                         onClick={() => setIsSubOpen(true)}
                         className="flex items-center gap-3 px-8 py-3 bg-accent text-accent-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:scale-105 hover:shadow-accent/40 transition-all shadow-2xl shadow-accent/20 w-full md:w-auto justify-center group"
                      >
                         <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> {t.bots.activate_link}
                      </button>
                  ) : (
                    <>
                      {isBotRunning ? (
                          <button onClick={handleStopBot} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20 group">
                              <Square className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100" /> {t.bots.terminate}
                          </button>
                      ) : (
                          <button 
                              disabled={isStarting}
                              onClick={handleStartBot} 
                              className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all border border-accent/30 disabled:opacity-50 group shadow-lg shadow-accent/5"
                          >
                              {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100" />} {t.bots.initialize}
                          </button>
                      )}
                    </>
                  )}
              </div>
              <div className="flex items-center gap-4 ml-auto md:ml-0 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                  <div className="flex flex-col items-start hidden sm:flex">
                      <span className="text-[7px] font-black uppercase text-white/30 tracking-[0.4em] mb-1">{t.bots.leverage_proto}</span>
                      <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-accent/60" />
                          <select 
                              disabled={isBotRunning || !isElite}
                              value={leverage} 
                              onChange={(e) => setLeverage(Number(e.target.value))}
                              className="bg-transparent border-0 rounded-lg text-xs font-black uppercase italic text-white/90 outline-none focus:ring-0 disabled:opacity-50 cursor-pointer p-0 select-none appearance-none"
                          >
                              <option value={1}>1x_Standard</option>
                              <option value={5}>5x_Tactical</option>
                              <option value={10}>10x_Institutional</option>
                              <option value={20}>20x_Extreme</option>
                              <option value={50}>50x_Maximum</option>
                          </select>
                      </div>
                  </div>
              </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
              <div className="flex flex-col items-start md:items-end group">
                  <span className="text-[7px] font-black uppercase text-white/30 tracking-[0.4em] mb-1 group-hover:text-white/50 transition-colors">{t.bots.link_status}</span>
                  <div className="flex items-center gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full", isBotRunning ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse" : "bg-yellow-500 animate-pulse")} />
                      <span className={`text-[10px] font-black uppercase italic tracking-wider ${isBotRunning ? "text-accent" : "text-yellow-500"}`}>
                          {isElite ? (isBotRunning ? t.bots.operational : t.bots.awaiting_input) : t.bots.simulation_active}
                      </span>
                  </div>
              </div>
              <button 
                onClick={() => isElite ? setIsSidebarOpen(true) : setIsSubOpen(true)}
                className="group flex flex-col items-end text-accent"
              >
                  <span className="text-[7px] font-black uppercase tracking-[0.4em] mb-1 text-white/30 group-hover:text-accent transition-all">{t.bots.advanced_matrix}</span>
                  <div className="flex items-center gap-2 bg-accent/5 px-3 py-1 rounded-lg border border-accent/10 group-hover:bg-accent/10 transition-all">
                      <Sliders className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase italic tracking-tighter">{t.bots.strategy_engine}</span>
                  </div>
              </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
            <div className={cn(
                "absolute inset-0 transition-all duration-700 flex flex-col",
                viewMode === 'assistant' ? "translate-x-0 opacity-100 z-10" : "translate-x-[-20px] opacity-0 pointer-events-none -z-10"
            )}>
                <ChatWindow messages={messages} isLoading={isLoading} onQuickSend={handleSend} />
                <ChatInput onSend={handleSend} isLoading={isLoading} />
            </div>

            <div className={cn(
                "absolute inset-0 transition-all duration-700 flex flex-col bg-[#020617]",
                viewMode === 'terminal' ? "translate-x-0 opacity-100 z-10" : "translate-x-[20px] opacity-0 pointer-events-none -z-10"
            )}>
                {terminalTab === 'logs' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-px bg-white/5 overflow-hidden">
                        <div className="flex-1 min-h-0 bg-[#020617]">
                            <LogConsole logs={logs} autoTrading={isBotRunning} variant="full" title="Neural Interpreter_V4" />
                        </div>
                        <div className="flex-1 min-h-0 bg-[#020617] border-t md:border-t-0 md:border-l border-white/5">
                            <LogConsole logs={newsLogs} autoTrading={isBotRunning} variant="full" title="Neural News Monitor_V1" />
                        </div>
                    </div>
                )}
                {terminalTab === 'scanner' && (
                    <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                         <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-10 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                <Search className="w-8 h-8 text-emerald-500 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black italic text-emerald-500 tracking-tighter uppercase">Initializing Deep Scan...</h2>
                            <p className="text-white/40 text-sm max-w-md mx-auto font-bold uppercase tracking-widest italic leading-relaxed">
                                Neural engines are mapping the liquidity lattice. Multi-dimensional scanning active across 45+ Tier-1 sources.
                            </p>
                            <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                         </div>
                    </div>
                )}
                {terminalTab === 'heatmap' && (
                    <div className="flex-1 w-full h-full relative">
                        <iframe 
                            src="https://www.coinglass.com/pro/i/HeatMap" 
                            className="w-full h-full border-none opacity-80 contrast-125 saturate-150 grayscale-[0.2]"
                            style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.2)' }}
                        />
                    </div>
                )}
                {terminalTab === 'bubbles' && (
                    <div className="flex-1 w-full h-full relative">
                        <iframe 
                            src="https://cryptobubbles.net/" 
                            className="w-full h-full border-none"
                        />
                        <div className="absolute inset-0 pointer-events-none border-[20px] border-[#020617]" />
                    </div>
                )}
            </div>
        </div>
      </div>

      <ToolsSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        recentTrades={recentTrades}
      />

      <SubscriptionModal open={isSubOpen} onClose={() => setIsSubOpen(false)} />
    </div>
  );
}
