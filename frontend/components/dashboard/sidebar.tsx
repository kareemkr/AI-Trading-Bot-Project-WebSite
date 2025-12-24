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
  Terminal
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
    { name: t.nav.wallet, icon: Wallet, href: "/dashboard/wallet" },
    { name: t.nav.live_bot, icon: Bot, href: "/dashboard/bots" },
    { name: t.nav.demo_bot, icon: Activity, href: "/dashboard/demo" },
    { name: t.nav.market, icon: LineChart, href: "/dashboard/market" },
    { name: t.nav.logs, icon: Terminal, href: "/dashboard/logs" },
    { name: t.nav.subscription, icon: CreditCard, href: "/dashboard/subscription" },
    { name: t.nav.settings, icon: Settings, href: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    // Clear all application state to prevent data leakage between sessions
    localStorage.clear();
    sessionStorage.clear();
    // Force reload to ensure memory state is also cleared
    window.location.href = "/";
  };

  const status = user?.subscription_status?.toLowerCase();
  const isPremium = status === "pro" || status === "elite";
  const isElite = status === "elite" || status === "pro";

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shadow-lg shadow-accent/5">
             <img src="/neural-logo.png" className="w-full h-full object-cover scale-150" alt="Neural Flow" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tighter block leading-none">NEURAL FLOW</span>
            <span className="text-[10px] text-accent uppercase tracking-[0.2em] font-black mt-1 block">TRADING</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                pathname === item.href
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-accent" : "group-hover:text-foreground")} />
                {item.name}
              </div>
              {pathname === item.href && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {!isPremium && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">{t.sidebar.elite_protocol}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{t.sidebar.elite_desc}</p>
            <button 
              onClick={onOpenSubscription}
              className="w-full py-2 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors"
            >
              {t.sidebar.unlock}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 justify-between">
           <ThemeToggle />
           <LanguageSelector />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          {t.header.logout}
        </button>
      </div>
    </aside>
  );
}
