"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/lib/language-context";
import { API_BASE_URL } from "@/lib/api";
import { BrainCircuit } from "lucide-react";

export function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // ✅ go to homepage
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 h-16 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center p-1.5 shadow-lg shadow-accent/20 transition-transform hover:scale-105 active:scale-95 text-background">
          <BrainCircuit className="w-full h-full" />
        </div>
        <span className="font-black text-xl sm:text-2xl tracking-tighter italic uppercase text-foreground">Neural Flow</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <LanguageSelector />
        
        {user ? (
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-bold text-accent hover:text-accent/80 transition-colors">
              {t.header.dashboard}
            </Link>
            <div className="flex items-center gap-3 pl-4 border-l border-border/40 h-8">
               {/* Avatar */}
               <div className={`relative w-8 h-8 rounded-full flex items-center justify-center p-[2px] ${(user as any).subscription_status === "premium" ? "bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-md shadow-orange-500/20" : "bg-muted"}`}>
                 <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                     {(user as any).avatar ? (
                         <img 
                          src={(user as any).avatar.startsWith("/") ? `${API_BASE_URL}${(user as any).avatar}` : (user as any).avatar} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                         />
                     ) : (
                         <span className="text-xs font-bold text-muted-foreground">{user.name?.[0]?.toUpperCase()}</span>
                     )}
                 </div>
              </div>

              <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{user.name}</span>
                  </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
            >
              {t.header.logout}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              {t.header.signin}
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
            >
              {t.header.get_started}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
