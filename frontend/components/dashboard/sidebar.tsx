"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Bot, 
  LineChart, 
  CreditCard, 
  Settings, 
  LogOut,
  Sparkles,
  ChevronRight,
  Globe,
  Activity,
  Wallet,
  Terminal,
  ShieldCheck,
  BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSelector } from "../ui/language-selector";
import { useLanguage } from "@/lib/language-context";

interface SidebarProps {
  onOpenSubscription?: () => void;
}

export function DashboardSidebar({ onOpenSubscription }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
    
    const handleStorage = () => {
      const updated = localStorage.getItem("user");
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const menuItems = [
    { name: t.nav.site_home, icon: Globe, href: "/" },
    { name: t.nav.overview, icon: LayoutDashboard, href: "/dashboard" },
    { name: t.nav.live_bot, icon: Bot, href: "/dashboard/bots" },
    { name: t.nav.demo_bot, icon: Activity, href: "/dashboard/demo" },
    { name: t.nav.market, icon: LineChart, href: "/dashboard/market" },
    { name: "Analytics", icon: Terminal, href: "/dashboard/logs" },
    { name: t.nav.subscription, icon: CreditCard, href: "/dashboard/subscription" },
    { name: t.nav.settings, icon: Settings, href: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const status = user?.subscription_status?.toLowerCase();
  const isPremium = status === "pro" || status === "elite";

  return (
    <aside className="w-64 h-screen bg-[#020617] border-r border-white/5 flex flex-col sticky top-0 transition-all duration-500">
      {/* HEADER SECTION */}
      <div className="p-7 mb-4">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-150 group-hover:bg-accent/40 transition-all duration-700" />
            <div className="relative w-11 h-11 rounded-[14px] overflow-hidden border border-white/10 bg-black shadow-2xl transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
               <BrainCircuit className="w-6 h-6 text-accent" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-[#020617] flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-[-0.05em] text-white block leading-tight drop-shadow-sm">NEURAL FLOW</span>
            <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-accent uppercase tracking-[0.3em] font-black leading-none opacity-80">TRADING</span>
                <div className="w-1 h-1 rounded-full bg-accent/40" />
                <span className="text-[8px] text-white/40 font-black tracking-tighter uppercase">v4.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SECTION */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar no-scrollbar">
        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 group",
                  isActive
                    ? "bg-accent/10 text-accent shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] border border-accent/20"
                    : "text-white/50 hover:bg-white/[0.03] hover:text-white border border-transparent"
                )}
              >
                {/* Active Strip */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}

                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-accent/20 text-accent" : "bg-white/[0.02] text-white/30 group-hover:text-white group-hover:bg-white/10"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="tracking-tight uppercase italic text-[11px] font-black">{item.name}</span>
                </div>
                
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* FOOTER SECTION */}
      <div className="p-6 space-y-5 bg-gradient-to-t from-black/40 to-transparent border-t border-white/5">
        {!isPremium && (
          <div className="relative p-5 rounded-[20px] bg-gradient-to-br from-indigo-500/20 via-primary/10 to-transparent border border-white/5 overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/20 transition-all duration-700" />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-300">{t.sidebar.elite_protocol}</span>
            </div>
            
            <p className="text-[10px] text-white/50 font-bold mb-4 line-clamp-2 leading-relaxed italic">{t.sidebar.elite_desc}</p>
            
            <button 
              onClick={onOpenSubscription}
              className="w-full py-2.5 bg-indigo-500 text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20"
            >
              {t.sidebar.unlock}
            </button>
          </div>
        )}

        {/* User Quick View (Premium) */}
        {isPremium && (
            <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                 <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider">ELITE_STATUS_ACTIVE</span>
                    <span className="text-[8px] text-white/30 font-bold uppercase tracking-tighter">SECURE NODE: {user?.id?.slice(0,8) || "GUEST"}</span>
                 </div>
            </div>
        )}

        <div className="flex items-center gap-3 justify-between">
           <ThemeToggle />
           <LanguageSelector />
        </div>

        <button
          onClick={handleLogout}
          className="group flex items-center justify-center gap-3 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/20"
        >
          <LogOut className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          {t.header.logout}
        </button>
      </div>
    </aside>
  );
}
