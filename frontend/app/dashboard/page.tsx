"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Zap, ShieldCheck, Activity, ArrowUpRight, ChevronRight, Play, Sparkles } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { DemoTerminal } from "@/components/dashboard/demo-terminal"
import SubscriptionModal from "@/components/ui/subscription-modal"
import { cn } from "@/lib/utils"
import { API_ENDPOINTS } from "@/lib/api"

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [botStatus, setBotStatus] = useState({ running: false })
  const [accountData, setAccountData] = useState<any>(null)
  const [sentiment, setSentiment] = useState<any>(null)
  const [recentTrades, setRecentTrades] = useState<any[]>([])
  const [isSubOpen, setIsSubOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setIsLoaded(true)
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const u = JSON.parse(userStr)
      setUser(u)
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const botRes = await fetch(API_ENDPOINTS.BOT.STATUS)
        const botData = await botRes.json()
        setBotStatus(botData)

        const accRes = await fetch(API_ENDPOINTS.ACCOUNT.OVERVIEW, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const accData = await accRes.json()
        setAccountData(accData)

        const newsRes = await fetch(API_ENDPOINTS.NEWS.STATUS)
        if (newsRes.ok) {
          const newsData = await newsRes.json()
          setSentiment(newsData)
        }

        const tradeRes = await fetch(API_ENDPOINTS.BOT.HISTORY)
        if (tradeRes.ok) {
          const tradeData = await tradeRes.json()
          setRecentTrades(tradeData || [])
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!isLoaded) return null

  const data = [
    { name: "00:00", value: 0 },
    { name: "04:00", value: 0 },
    { name: "08:00", value: 0 },
    { name: "12:00", value: 0 },
    { name: "16:00", value: 0 },
    { name: "20:00", value: 0 },
    { name: "24:00", value: 0 },
  ]

  const status = user?.subscription_status?.toLowerCase()
  const isElite = status === "elite" || status === "pro"
  const isPro = status === "pro"

  const displayTier = isElite ? "ELITE PROTOCOL" : "FREE EXPLORER"

  const stats = [
    {
      label: t.dashboard.equity_value,
      value: "STABLE",
      trend: "14ms",
      positive: true,
      icon: Zap,
    },
    {
      label: t.dashboard.account_tier,
      value: displayTier,
      trend: "Verified",
      positive: true,
      icon: ShieldCheck,
    },
    {
      label: t.dashboard.pnl_24h,
      value: "0.88",
      trend: "+Neural Gain",
      positive: true,
      icon: Activity,
    },
    {
      label: t.dashboard.success_rate,
      value: accountData?.connected ? accountData.success_rate : "94.2%",
      trend: "Optimal",
      positive: true,
      icon: Sparkles,
    },
  ]

  if (typeof window !== "undefined") {
    ;(window as any).onOpenSubscription = () => setIsSubOpen(true)
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in-slow max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-gradient-to-r from-card to-card/50 p-8 rounded-2xl border border-border/40 shadow-elevated backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-glow shadow-accent" />
            <h1 className="text-3xl font-bold tracking-tighter text-foreground">{t.dashboard.title}</h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {isElite ? t.dashboard.elite_active : t.dashboard.free_preview}
          </p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
              Quantum Synced
            </span>
            <span className="text-xs font-mono text-muted-foreground mt-2 opacity-70">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group bg-gradient-to-br from-card to-card/50 p-6 rounded-xl border border-border/40 hover:border-emerald-500/30 transition-all duration-300 shadow-soft hover:shadow-elevated hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-lg transition-all group-hover:scale-110 ${
                  stat.positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  stat.positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-card to-card/40 p-8 rounded-2xl border border-border/40 shadow-elevated flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-300">
            <TrendingUp className="w-64 h-64" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-widest leading-none mb-2">
                {t.dashboard.performance_matrix}
              </h3>
              <p className="text-sm text-muted-foreground">Neural yield tracking (24H Cycles)</p>
            </div>
            <select className="bg-card/50 border border-border/50 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-sm transition-all hover:border-emerald-500/30">
              <option>Cycle: 24H</option>
              <option>Cycle: 7D</option>
              <option>Cycle: 30D</option>
            </select>
          </div>

          <div className="flex-1 h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(16, 185, 129, 0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <YAxis hide={true} domain={["dataMin - 1000", "dataMax + 1000"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "var(--accent)" }}
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

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-7 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">AI</span>
                </div>
                <h3 className="font-bold text-foreground">{t.dashboard.market_intel}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {sentiment
                  ? `Current Sentiment is ${sentiment.last_signal?.toUpperCase() || "NEUTRAL"}. Neural engines suggest ${sentiment.last_signal === "BULLISH" ? "aggressive LONG" : sentiment.last_signal === "BEARISH" ? "protective SHORT" : "patient HOLD"} strategies based on global social heat.`
                  : "Sentiment analysis shows a strong bullish trend for SOL. Consider scaling into long positions as RSI cools down below 60."}
              </p>
              <button
                onClick={() =>
                  isElite ? (window.location.href = "/dashboard/bots") : (window.location.href = "/dashboard/market")
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
              >
                {isElite ? t.dashboard.open_bot : t.dashboard.view_signals} <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-card/50 p-7 rounded-2xl border border-border/40 shadow-soft">
            <h3 className="font-semibold mb-5 flex items-center justify-between text-foreground">
              {isElite ? t.dashboard.live_control : t.dashboard.account_status}
              {isElite ? (
                botStatus.running ? (
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs border-none uppercase font-bold">
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs uppercase font-bold">
                    Off
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-xs uppercase font-bold">
                  {status || "Free"}
                </Badge>
              )}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30 hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-medium ${
                      isElite
                        ? botStatus.running
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <Play className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{isElite ? "Binance Bot" : "AI Signals"}</span>
                </div>
                <Link
                  href={isElite ? "/dashboard/bots" : "/dashboard/market"}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all"
                >
                  {isElite ? "Manage" : "View"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {isElite ? (
            <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border/40 shadow-elevated overflow-hidden h-full">
              <div className="p-8 border-b border-border/30 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{t.dashboard.recent_ops}</h3>
                <button className="text-sm text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-2 transition-all">
                  View History <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/30 bg-secondary/30">
                    <tr>
                      <th className="px-8 py-4 font-semibold text-muted-foreground text-left uppercase text-xs tracking-wider">
                        Asset
                      </th>
                      <th className="px-8 py-4 font-semibold text-muted-foreground text-left uppercase text-xs tracking-wider">
                        Type
                      </th>
                      <th className="px-8 py-4 font-semibold text-muted-foreground text-left uppercase text-xs tracking-wider">
                        Price
                      </th>
                      <th className="px-8 py-4 font-semibold text-muted-foreground text-left uppercase text-xs tracking-wider">
                        PNL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {recentTrades.length > 0 ? (
                      recentTrades.map((t: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/5 transition-colors">
                          <td className="px-8 py-4 font-bold text-foreground">{t.coin}</td>
                          <td
                            className={cn(
                              "px-8 py-4 font-bold text-xs uppercase tracking-wider",
                              t.action === "BUY"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            <span className="bg-background px-3 py-1 rounded-md">{t.action}</span>
                          </td>
                          <td className="px-8 py-4 font-mono text-xs opacity-70 text-foreground">
                            {t.timestamp.split("T")[1].split(".")[0]}
                          </td>
                          <td
                            className={cn(
                              "px-8 py-4 font-semibold",
                              t.sentiment > 0.5
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {Math.round(t.sentiment * 100)}% Heat
                          </td>
                        </tr>
                      ))
                    ) : accountData?.connected && accountData.trades?.length > 0 ? (
                      accountData.trades.map((t: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/5 transition-colors">
                          <td className="px-8 py-4 font-bold text-foreground">{t.asset}</td>
                          <td
                            className={cn(
                              "px-8 py-4 font-bold uppercase text-xs tracking-wider",
                              t.type === "BUY"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {t.type}
                          </td>
                          <td className="px-8 py-4 font-mono text-xs text-foreground">{t.price}</td>
                          <td
                            className={cn(
                              "px-8 py-4 font-semibold",
                              t.raw_pnl > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400",
                            )}
                          >
                            {t.pnl}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic font-medium">
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

        <div className="bg-gradient-to-br from-card to-card/50 p-8 rounded-2xl border border-border/40 shadow-elevated flex flex-col justify-center text-center space-y-5">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg tracking-tight text-foreground">{t.dashboard.security_title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.dashboard.security_desc}</p>
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
  )
}
