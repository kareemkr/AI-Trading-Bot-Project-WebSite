"use client";

import { useEffect, useState } from "react";
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  Camera, 
  Send, 
  ShieldAlert, 
  Cpu, 
  Database,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();
  
  // States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [tgToken, setTgToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");
  const [binanceKey, setBinanceKey] = useState("");
  const [binanceSecret, setBinanceSecret] = useState("");
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(false);
  const [newsAI, setNewsAI] = useState(false);
  
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
      setAvatar(u.avatar || null);
      setTgToken(u.telegram_token || "");
      setTgChatId(u.telegram_chat_id || "");
      setBinanceKey(u.binance_api_key || "");
      setBinanceSecret(u.binance_api_secret || "");
      setAutoConfirm(u.auto_trade_confirmation ?? true);
      setRiskAlerts(u.risk_management_alerts ?? false);
      setNewsAI(u.news_analysis_ai ?? false);
    }
    setIsInitializing(false);
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const formData = new FormData();
      formData.append("name", name);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      formData.append("telegram_token", tgToken || "");
      formData.append("telegram_chat_id", tgChatId || "");
      formData.append("binance_api_key", binanceKey || "");
      formData.append("binance_api_secret", binanceSecret || "");
      formData.append("auto_trade_confirmation", String(autoConfirm));
      formData.append("risk_management_alerts", String(riskAlerts));

      const res = await fetch(API_ENDPOINTS.AUTH.UPDATE, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Backend update failed");
      const data = await res.json();

      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { 
          ...existingUser,
          name: data.name, 
          avatar: data.avatar,
          telegram_token: data.telegram_token,
          telegram_chat_id: data.telegram_chat_id,
          binance_api_key: data.binance_api_key,
          binance_api_secret: data.binance_api_secret,
          auto_trade_confirmation: data.auto_trade_confirmation,
          risk_management_alerts: data.risk_management_alerts
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event("storage"));
      
      if (!silent) {
        toast.success(t.settings.save_success, {
            description: "Your secure preferences have been updated."
        });
      }
    } catch (err: any) {
      if (!silent) toast.error(err.message || "Failed to update settings");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Auto-save effect for toggles
  useEffect(() => {
    if (!isInitializing) {
        handleSave(true);
    }
  }, [autoConfirm, riskAlerts]);

  if (isInitializing) return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
  );

  const status = user?.subscription_status?.toLowerCase();
  const isPremium = status === "elite" || status === "pro" || status === "premium";

  const tabs = [
    { id: "profile", label: t.settings.tabs.identity, icon: User, active: true },
    { id: "binance", label: t.settings.tabs.neural_link, icon: Database, active: true },
    { id: "telegram", label: t.settings.tabs.comms, icon: Send, active: true },
    { id: "ai", label: t.settings.tabs.engine, icon: Cpu, active: true },
    { id: "security", label: t.settings.tabs.security, icon: Lock, active: false },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
          <Settings className="w-6 h-6 text-accent" />
          {t.settings.title}
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.active && setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${
                activeTab === tab.id 
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                    : tab.active 
                        ? "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        : "opacity-30 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-accent-foreground" : "text-accent group-hover:scale-110"}`} />
                {tab.label}
              </div>
              {activeTab === tab.id ? <ChevronRight className="w-4 h-4" /> : (!tab.active && <span className="text-[8px] opacity-60">Locked</span>)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex-1 p-8 space-y-8">
              
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                   <div className="flex items-center gap-4">
                      <Zap className="w-5 h-5 text-accent animate-pulse" />
                      <h2 className="text-xl font-black uppercase italic tracking-tighter">Identity Protocol</h2>
                   </div>
                   
                   <div className="flex flex-col md:flex-row gap-10 items-center md:items-start pt-4">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-accent/20 shadow-2xl overflow-hidden flex items-center justify-center group-hover:border-accent group-hover:scale-105 transition-all duration-500">
                          {avatar ? (
                            <img 
                              src={avatar.startsWith("data:") ? avatar : (avatar.startsWith("/") ? `${API_BASE_URL}${avatar}` : avatar)} 
                              className="w-full h-full object-cover" 
                              alt="Profile" 
                            />
                          ) : (
                            <span className="text-3xl font-black text-accent">{(name?.[0] || "T").toUpperCase()}</span>
                          )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all border-4 border-card">
                          <Camera className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </label>
                      </div>

                      <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1">{t.settings.alias}</label>
                            <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Kareem Master" 
                              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-accent/40 text-[13px] font-bold shadow-inner" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t.settings.email}</label>
                            <input 
                              type="email" 
                              value={email}
                              disabled
                              className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-[13px] font-bold cursor-not-allowed opacity-50" 
                            />
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* BINANCE TAB */}
              {activeTab === "binance" && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center gap-4">
                       <Database className="w-5 h-5 text-accent" />
                       <h2 className="text-xl font-black uppercase italic tracking-tighter">Neural Link (Binance/Bybit)</h2>
                    </div>
                    <p className="text-[12px] font-medium text-muted-foreground leading-relaxed bg-accent/5 p-4 rounded-2xl border border-accent/10">
                        Link your Futures API key to allow the Neural Engine to execute high-alpha trades. 
                        Ensure <span className="text-accent font-bold">"Enable Futures"</span> is checked in your API settings. 
                        Your keys are encrypted using AES-256 before storage.
                    </p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1">{t.settings.api_key}</label>
                            <input 
                              type="text" 
                              value={binanceKey}
                              onChange={(e) => setBinanceKey(e.target.value)}
                              placeholder="x-api-key-..." 
                              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-accent/40 text-[13px] font-bold shadow-inner" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1">{t.settings.secret_key}</label>
                            <div className="relative">
                                <input 
                                  type={showSecret ? "text" : "password"} 
                                  value={binanceSecret}
                                  onChange={(e) => setBinanceSecret(e.target.value)}
                                  placeholder="••••••••••••••••" 
                                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-accent/40 text-[13px] font-bold shadow-inner" 
                                />
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
                                >
                                    {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* TELEGRAM TAB */}
              {activeTab === "telegram" && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                    <div className="flex items-center gap-4">
                       <Send className="w-5 h-5 text-accent" />
                       <h2 className="text-xl font-black uppercase italic tracking-tighter">Communication Protocols</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* TELEGRAM */}
                        <div className="p-8 rounded-3xl bg-accent/5 border border-accent/10 space-y-6 flex flex-col">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400">
                                    <Send className="w-5 h-5" />
                                </div>
                                <h3 className="font-black uppercase tracking-widest text-[12px]">Telegram Alpha Link</h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1">{t.settings.tg_token}</label>
                                    <input 
                                        type="password" 
                                        value={tgToken}
                                        onChange={(e) => setTgToken(e.target.value)}
                                        placeholder="723456789:AAEj..." 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-accent/40 text-[13px] font-bold shadow-inner text-white" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-accent uppercase tracking-widest pl-1">{t.settings.tg_chat_id}</label>
                                    <input 
                                        type="text" 
                                        value={tgChatId}
                                        onChange={(e) => setTgChatId(e.target.value)}
                                        placeholder="123456789" 
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-accent/40 text-[13px] font-bold shadow-inner text-white" 
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider opacity-60">
                                Direct neural-link to your mobile device for real-time trade execution alerts and alpha notifications.
                            </p>
                        </div>

                        {/* BROWSER EXTENSION */}
                        <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-6 flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-black uppercase tracking-widest text-[12px]">{t.settings.browser_ext}</h3>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">Version 1.4.2 (LATEST)</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase italic">On</span>
                                </div>
                            </div>
                            
                            <p className="text-[11px] text-muted-foreground leading-relaxed uppercase font-bold tracking-tight opacity-70">
                                The Antigravity Browser Extension is required for the Antigravity Agent to access the web. 
                                It establishes a low-latency bridge for real-time sentiment collection and autonomous web intelligence.
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.settings.ext_status}</span>
                                    <span className="text-[10px] font-mono font-bold text-white tracking-widest">ACTIVE_INSTUTIONAL</span>
                                </div>
                                <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                    Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* AI LOGIC TAB */}
              {activeTab === "ai" && (
                <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
                   <div className="flex items-center gap-4">
                      <Cpu className="w-5 h-5 text-accent" />
                      <h2 className="text-xl font-black uppercase italic tracking-tighter">Engine Core Logic</h2>
                   </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-accent/5 border border-accent/10 hover:border-accent/30 transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                            {t.settings.auto_trade}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Engine executes without manual signing</p>
                      </div>
                      <Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} />
                    </div>
                    
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-accent/5 border border-accent/10 hover:border-accent/30 transition-all">
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                            {t.settings.risk_notifications}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Urgent alerts on drawdown/SL events</p>
                      </div>
                      <Switch checked={riskAlerts} onCheckedChange={setRiskAlerts} />
                    </div>

                    <div className={cn("p-8 rounded-3xl bg-accent/5 border border-accent/10 hover:border-accent/30 transition-all", !isPremium && "opacity-50")}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <div className="flex flex-col">
                                    <p className="text-base font-black uppercase tracking-tighter">Neuro-Alpha Strategy Matrix</p>
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60 text-purple-400">Tactical Sentiment Engine v2.0</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest leading-none">Always Operational</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural_Alpha_Weight</p>
                                        <span className="text-[10px] font-bold text-accent">1.5x Boost</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] w-[85%]" />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-medium">Multiplier applied to signals when institutional news and charts converge.</p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Enabled_Alpha_Streams</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Whale_Moves', 'Macro_Pol', 'Tech_Alpha', 'OnChain_Int'].map((item) => (
                                            <div key={item} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-colors">
                                                <span className="text-[9px] font-bold uppercase tracking-tighter group-hover:text-purple-400">{item}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-purple-500/3 border border-purple-500/10 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Institutional_Logic_Gates</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Strict Session Lock</span>
                                            <Switch className="scale-75" checked={true} disabled />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">BTC Beta Guard</span>
                                            <Switch className="scale-75" checked={true} disabled />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider opacity-60">
                                    Engine now processes 150+ high-authority channels with a direct fiber link to institutional wires. 
                                    Average execution latency: {"<"}150ms.
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SAVE ACTION */}
            <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between mt-auto">
                <div className="hidden md:flex items-center gap-3 text-muted-foreground">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">AES-256 Vault Encryption Active</span>
                </div>
                <button 
                  onClick={() => handleSave(false)}
                  disabled={isLoading}
                  className="flex items-center gap-3 px-10 py-4 bg-accent text-accent-foreground font-black uppercase tracking-[0.15em] text-[11px] rounded-[1.5rem] shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                  {t.settings.sync_data}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
