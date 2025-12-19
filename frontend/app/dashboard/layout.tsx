"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useEffect, useState } from "react";
import SubscriptionModal from "@/components/ui/subscription-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isSubOpen, setIsSubOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    // Listen for storage changes (e.g. from Profile modal or Settings)
    const handleStorage = () => {
      const updated = localStorage.getItem("user");
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const status = user?.subscription_status?.toLowerCase();
  const isPremium = status === "pro" || status === "elite";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar onOpenSubscription={() => setIsSubOpen(true)} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation / Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize">Dashboard</h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Status indicators */}
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Market Connection Active</span>
             </div>
             
             <div className="w-px h-6 bg-border mx-2"></div>
             
             {/* Dynamic user display */}
             <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-semibold leading-none">{user?.name || "Trader"}</p>
                 <p className="text-[10px] text-muted-foreground capitalize">{status || "Standard"} Account</p>
               </div>
               <div className={`w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold overflow-hidden ${isPremium ? "bg-gradient-to-tr from-yellow-400 to-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                 {user?.avatar ? (
                   <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                 ) : (
                   (user?.name?.[0] || "T").toUpperCase()
                 )}
               </div>
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-background/50">
          {children}
        </div>
      </main>

      <SubscriptionModal open={isSubOpen} onClose={() => setIsSubOpen(false)} />
    </div>
  );
}
