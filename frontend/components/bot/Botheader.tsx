"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Menu, Moon, Sun, Trash2, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface HeaderProps {
  onClearChat: () => void;
  onToggleSidebar: () => void;
  autoTrading: boolean;
  onToggleAutoTrading: (enabled: boolean) => void;
  title?: string;
}

export function BotHeader({
  onClearChat,
  onToggleSidebar,
  autoTrading,
  onToggleAutoTrading,
  title,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load user for header display
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const isPremium = user?.subscription_status === "premium";

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 
rounded-xl hover:bg-accent/50"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-4 pl-3 border-l border-white/10 h-10">
            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center p-[2px] ${user?.subscription_status === "elite" || user?.subscription_status === "pro" ? "bg-gradient-to-tr from-accent to-emerald-400 shadow-xl shadow-accent/20" : "bg-white/10"}`}>
               <div className="w-full h-full rounded-[0.5rem] bg-card flex items-center justify-center overflow-hidden">
                   {user?.avatar ? (
                       <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                   ) : (
                       <span className="text-xs font-black uppercase italic">{user?.name?.[0]?.toUpperCase() || "U"}</span>
                   )}
               </div>
            </div>
            
            <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                     <span className="font-black text-xs uppercase italic tracking-tighter">{user?.name || "Neural_Operator"}</span>
                     {(user?.subscription_status === "pro" || user?.subscription_status === "elite") && (
                         <span className="text-[9px] font-black italic px-2 py-0.5 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 tracking-widest uppercase">
                             ELITE
                         </span>
                     )}
                 </div>
                 <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                     {user?.subscription_status === "elite" || user?.subscription_status === "pro" ? "Institutional Access" : "Basic Terminal"}
                 </span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "hidden md:flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300",
            autoTrading
              ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-secondary/30 border-border hover:bg-secondary/50"
          )}
        >
          <div className={cn("flex items-center justify-center w-5 h-5 rounded-full", autoTrading ? "bg-emerald-500 shadow-sm" : "bg-muted-foreground/20")}>
              <Zap className={cn("h-3 w-3", autoTrading ? "text-white fill-current" : "text-muted-foreground")} />
          </div>

          <div className="flex flex-col">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider leading-none", autoTrading ? "text-emerald-600" : "text-muted-foreground")}>
                  {autoTrading ? "Active" : "Oﬄine"}
              </span>
              <span className="text-[10px] text-muted-foreground/80 leading-tight">
                  Auto-Trading
              </span>
          </div>

          <Switch
            checked={autoTrading}
            onCheckedChange={onToggleAutoTrading}
            className="data-[state=checked]:bg-emerald-500 h-5 w-9 ml-2"
          />
        </div>

        <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-accent/50"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
}
