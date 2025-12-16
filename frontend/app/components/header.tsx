"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);

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
    <header className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center justify-between bg-background/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="font-bold text-primary-foreground text-xl">K</span>
        </div>
        <span className="font-bold text-xl tracking-tight">KRO</span>
      </div>

      {/* Right side */}
      {user ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-border/40 h-8">
             {/* Avatar */}
             <div className={`relative w-8 h-8 rounded-full flex items-center justify-center p-[2px] ${(user as any).subscription_status === "premium" ? "bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-md shadow-orange-500/20" : "bg-muted"}`}>
               <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                   {(user as any).avatar ? (
                       <img src={(user as any).avatar} alt="User" className="w-full h-full object-cover" />
                   ) : (
                       <span className="text-xs font-bold text-muted-foreground">{user.name?.[0]?.toUpperCase()}</span>
                   )}
               </div>
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{user.name}</span>
                    {(user as any).subscription_status === "premium" && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm tracking-wider">
                            PRO
                        </span>
                    )}
                </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 hover:bg-red-50 rounded-lg"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
