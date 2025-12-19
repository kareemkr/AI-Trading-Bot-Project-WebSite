"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldCheck, 
  Activity,
  ArrowUpRight,
  ChevronRight,
  Wallet,
  Play
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { DemoTerminal } from "@/components/dashboard/demo-terminal";
import SubscriptionModal from "@/components/ui/subscription-modal";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [botStatus, setBotStatus] = useState({ running: false });
  const [accountData, setAccountData] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsLoaded(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
    }

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Fetch Bot Status
            const botRes = await fetch("http://localhost:8000/bot/status");
            const botData = await botRes.json();
            setBotStatus(botData);

            // Fetch Real Account Data
            const accRes = await fetch("http://localhost:8000/account/overview", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const accData = await accRes.json();
            setAccountData(accData);

            // Fetch News AI Status
            const newsRes = await fetch("http://localhost:8000/news/status");
            if (newsRes.ok) {
                const newsData = await newsRes.json();
                setSentiment(newsData);
            }

            // Fetch Recent Simulated/Real Trades
            const tradeRes = await fetch("http://localhost:8000/trading/last");
            if (tradeRes.ok) {
                const tradeData = await tradeRes.json();
                setRecentTrades(tradeData.trades || []);
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
        }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Pulse every 30s
    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) return null;

  const data = [
    { name: "00:00", value: 45000 },
    { name: "04:00", value: 46200 },
    { name: "08:00", value: 45800 },
    { name: "12:00", value: 48500 },
    { name: "16:00", value: 47900 },
    { name: "20:00", value: 49200 },
    { name: "24:00", value: 50500 },
  ];

  const status = user?.subscription_status?.toLowerCase();
  const isElite = status === "elite" || status === "pro";
  const isPro = status === "pro";

  const displayTier = isElite ? "ELITE PROTOCOL" : "FREE EXPLORER";

  const stats = [
    { 
        label: t.dashboard.equity_value, 
        value: accountData?.connected ? accountData.equity : "0x00.00", 
        trend: accountData?.connected ? "+12.5%" : "---", 
        positive: true, 
        icon: Zap 
    },
    { 
        label: t.dashboard.account_tier, 
        value: displayTier, 
        trend: "Active", 
        positive: true, 
        icon: Activity 
    },
    { 
        label: t.dashboard.pnl_24h, 
        value: accountData?.connected ? accountData.pnl_24h : "+$0.00", 
        trend: accountData?.connected ? accountData.pnl_24h_pct : "+0.0%", 
        positive: accountData?.connected ? !accountData.pnl_24h.includes("-") : true, 
        icon: TrendingUp 
    },
    { 
        label: t.dashboard.success_rate, 
        value: accountData?.connected ? accountData.success_rate : "0.0%", 
        trend: accountData?.connected ? "Optimal" : "No_Data", 
        positive: true, 
        icon: ShieldCheck 
    },
  ];

  // Expose onOpenSubscription to window for the demo terminal
  if (typeof window !== "undefined") {
    (window as any).onOpenSubscription = () => setIsSubOpen(true);
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between bg-card/30 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(61,214,140,0.5)]" />
               <h1 className="text-2xl font-black tracking-tighter uppercase italic">{t.dashboard.title}</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {isElite ? t.dashboard.elite_active : t.dashboard.free_preview}
            </p>
          </div>
          <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end mr-4">
                 <span className="text-[9px] font-black text-accent uppercase tracking-widest leading-none">{t.dashboard.quantum_synced}</span>
                 <span className="text-[10px] font-mono text-muted-foreground mt-1 opacity-50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
              </div>
              {user?.wallet_address && (
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-accent/5 border border-accent/20 rounded-2xl">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{t.dashboard.wallet}</p>
                          <p className="text-xs font-mono font-bold text-accent">{user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card/40 p-5 rounded-[2rem] border border-border/40 hover:border-accent/30 transition-all group shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${stat.positive ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl font-black tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-card/60 p-6 rounded-[2.5rem] border border-border/30 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <TrendingUp className="w-64 h-64" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest leading-none mb-1">{t.dashboard.performance_matrix}</h3>
              <p className="text-[10px] font-medium text-muted-foreground">Neural yield tracking (24H Cycles)</p>
            </div>
            <select className="bg-background/50 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-accent backdrop-blur-xl">
              <option>Cycle: 24H</option>
              <option>Cycle: 7D</option>
              <option>Cycle: 30D</option>
            </select>
          </div>
          
          <div className="flex-1 h-[260px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#8ba89a'}}
                  dy={10}
                />
                <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#3dd68c' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--accent)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                  data={accountData?.connected ? accountData.chart_data : data}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights & Assistant Entry */}
        <div className="space-y-6">
          <div className="bg-accent/5 p-6 rounded-3xl border border-accent/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xs">AI</span>
                </div>
                <h3 className="font-bold">{t.dashboard.market_intel}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {sentiment ? (
                    `Current Sentiment is ${sentiment.last_signal?.toUpperCase() || 'NEUTRAL'}. Neural engines suggest ${sentiment.last_signal === 'BULLISH' ? 'aggressive LONG' : sentiment.last_signal === 'BEARISH' ? 'protective SHORT' : 'patient HOLD'} strategies based on global social heat.`
                ) : (
                    "Sentiment analysis shows a strong bullish trend for SOL. Consider scaling into long positions as RSI cools down below 60."
                )}
              </p>
              <button 
                onClick={() => isElite ? window.location.href="/dashboard/bots" : window.location.href="/dashboard/market"}
                className="w-full py-3 bg-accent text-accent-foreground rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center justify-center gap-2"
              >
                {isElite ? t.dashboard.open_bot : t.dashboard.view_signals} <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              {isElite ? t.dashboard.live_control : t.dashboard.account_status}
              {isElite ? (
                botStatus.running ? (
                    <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 text-[9px] border-none uppercase">Online</Badge>
                ) : (
                    <Badge variant="outline" className="text-[9px] uppercase">Off</Badge>
                )
              ) : (
                <Badge variant="outline" className="text-[9px] uppercase">{status || "Free"}</Badge>
              )}
            </h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isElite ? (botStatus.running ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground") : "bg-accent/10 text-accent"}`}>
                        <Play className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-medium">{isElite ? "Binance Bot" : "AI Signals"}</span>
                  </div>
                  <Link href={isElite ? "/dashboard/bots" : "/dashboard/market"} className="text-xs text-accent font-bold hover:underline">
                      {isElite ? "Manage" : "View"}
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* REPLACEMENT SECTION: DEMO TERMINAL VS RECENT OPERATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            {isElite ? (
                <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden h-full">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t.dashboard.recent_ops}</h3>
                    <button className="text-sm text-accent font-medium hover:underline flex items-center gap-1">
                        View History <ChevronRight className="w-4 h-4" />
                    </button>
                    </div>
                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left">
                            <thead className="border-b border-border/30 bg-muted/20">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px]">Asset</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px]">Type</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px]">Price</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground uppercase text-[10px]">PNL</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30 font-medium">
                            {recentTrades.length > 0 ? (
                                recentTrades.map((t: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-accent/5 transition-colors">
                                        <td className="px-6 py-4 font-bold">{t.coin}</td>
                                        <td className={cn("px-6 py-4 font-black text-[10px]", t.action === 'BUY' ? 'text-accent' : 'text-red-500')}>
                                            <span className="bg-background/80 px-2 py-1 rounded-md">{t.action}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs opacity-80">{t.timestamp.split('T')[1].split('.')[0]}</td>
                                        <td className={cn("px-6 py-4", t.sentiment > 0.5 ? 'text-accent' : 'text-red-500')}>
                                            {Math.round(t.sentiment * 100)}% Heat
                                        </td>
                                    </tr>
                                ))
                            ) : accountData?.connected && accountData.trades?.length > 0 ? (
                                accountData.trades.map((t: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-accent/5 transition-colors">
                                        <td className="px-6 py-4 font-bold">{t.asset}</td>
                                        <td className={cn("px-6 py-4", t.type === 'BUY' ? 'text-emerald-500' : 'text-amber-500')}>{t.type}</td>
                                        <td className="px-6 py-4">{t.price}</td>
                                        <td className={cn("px-6 py-4", t.raw_pnl > 0 ? 'text-emerald-500' : 'text-red-500')}>{t.pnl}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No recent signals identified. Neural engines are scanning for opportunities.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <DemoTerminal />
            )}
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col justify-center text-center space-y-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <h3 className="font-bold tracking-tight">{t.dashboard.security_title}</h3>
             <p className="text-xs text-muted-foreground leading-relaxed">
                 {t.dashboard.security_desc}
             </p>
             <div className="pt-2 flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                 <span>AES-256</span>
                 <div className="w-1 h-1 rounded-full bg-border" />
                 <span>2FA Ready</span>
                 <div className="w-1 h-1 rounded-full bg-border" />
                 <span>Private Node</span>
             </div>
        </div>
      </div>

      <SubscriptionModal open={isSubOpen} onClose={() => setIsSubOpen(false)} />
    </div>
  );
}
