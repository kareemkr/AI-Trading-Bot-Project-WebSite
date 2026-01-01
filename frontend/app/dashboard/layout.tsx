"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useEffect, useState } from "react"
import SubscriptionModal from "@/components/ui/subscription-modal"
import { API_BASE_URL } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [isSubOpen, setIsSubOpen] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    const handleStorage = () => {
      const updated = localStorage.getItem("user")
      if (updated) setUser(JSON.parse(updated))
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const status = user?.subscription_status?.toLowerCase()
  const isPremium = status === "pro" || status === "elite"

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar onOpenSubscription={() => setIsSubOpen(true)} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-gradient-to-r from-card/80 via-card/60 to-background/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/8 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-glow shadow-accent"></span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Market Connection Active
              </span>
            </div>

            <div className="w-px h-6 bg-border/30"></div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.name || "Trader"}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">{status || "Standard"} Account</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold overflow-hidden transition-all ${
                  isPremium
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-400/50"
                    : "bg-secondary text-foreground border-border/50"
                }`}
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar.startsWith("/") ? `${API_BASE_URL}${user.avatar}` : user.avatar} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
                ) : (
                  (user?.name?.[0] || "T").toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-b from-background via-background/95 to-background">
          {children}
        </div>
      </main>

      <SubscriptionModal open={isSubOpen} onClose={() => setIsSubOpen(false)} />
    </div>
  )
}
