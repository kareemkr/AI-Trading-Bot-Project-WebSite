"use client";

import { useEffect, useState } from "react";
import { CreditCard, Check, ShieldCheck, Zap, History, Loader2, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import SubscriptionModal from "@/components/ui/subscription-modal";
import { useLanguage } from "@/lib/language-context";

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
    setIsInitializing(false);

    const handleStorage = () => {
      const updated = localStorage.getItem("user");
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (isInitializing) return <div className="p-8">Loading subscription...</div>;

  const status = user?.subscription_status?.toLowerCase();
  const isElite = status === "elite" || status === "pro" || status === "premium";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t.subscription.title}</h1>
        <p className="text-muted-foreground">{t.subscription.subtitle}</p>
      </div>

      {/* Current Plan Card */}
      <div className={`relative p-8 rounded-[2.5rem] border overflow-hidden transition-all shadow-xl ${
        isElite 
          ? "bg-gradient-to-br from-emerald-500/20 via-background to-accent/5 border-emerald-500/30" 
          : "bg-card border-border/50"
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className={`p-3 w-fit rounded-2xl ${isElite ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
              {isElite ? <ShieldCheck className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
            </div>
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3 uppercase italic tracking-tighter">
                {isElite ? t.subscription.elite_active : t.subscription.standard_account}
                {isElite && <span className="text-[10px] bg-accent text-accent-foreground px-3 py-1 rounded-full uppercase tracking-widest font-black">{t.subscription.inst_tier}</span>}
              </h2>
              <p className="text-muted-foreground mt-1 text-lg font-medium">
                {isElite 
                  ? t.subscription.elite_desc 
                  : t.subscription.free_desc}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
              {[
                { label: "AI Neural Indicators", active: true },
                { label: "Limited Bots", active: !isElite },
                { label: "Unlimited Institutional Bots", active: isElite },
                { label: "Priority Sentiment Analysis", active: isElite },
              ].map((feat) => feat.active && (
                <div key={feat.label} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-foreground/80">
                  <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  {feat.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[220px]">
             {!isElite && (
               <button 
                onClick={() => setIsSubOpen(true)}
                className="w-full py-4 bg-accent text-accent-foreground font-black rounded-[1.5rem] shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all text-center tracking-widest text-xs uppercase"
               >
                 {t.subscription.activate}
               </button>
             )}
             <button className="w-full py-4 bg-white/5 text-foreground font-black rounded-[1.5rem] text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
               {isElite ? t.subscription.view_billing : t.subscription.view_comparison}
             </button>
          </div>
        </div>

        {/* Decorative background elements */}
        {isElite && (
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Sparkles className="w-64 h-64 text-accent animate-pulse" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic">
              <CreditCard className="w-5 h-5 text-accent" /> {t.subscription.wallets}
            </h3>
            
            <div className="space-y-4">
               {user?.wallet_address ? (
                 <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-black/40 border border-accent/20">
                   <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                       <Building2 className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="text-[11px] font-black uppercase tracking-widest">Main Settlement Wallet</p>
                       <p className="text-xs font-mono text-muted-foreground truncate max-w-[200px] mt-1">{user.wallet_address}</p>
                     </div>
                   </div>
                   <Badge className="text-[9px] uppercase font-black text-accent bg-accent/10 px-3 py-1">Secure</Badge>
                 </div>
               ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/20 rounded-[2rem] bg-white/[0.02]">
                  <p className="text-[11px] font-bold text-muted-foreground mb-6 uppercase tracking-widest">No settlement networks identified.</p>
                  <button onClick={() => setIsSubOpen(true)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:bg-accent/5 transition-all">Initialize First Link</button>
                </div>
               )}
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/40 shadow-sm">
            <h3 className="text-sm font-black mb-8 flex items-center gap-3 uppercase tracking-widest italic">
              <History className="w-5 h-5 text-accent" /> {t.subscription.invoices}
            </h3>
            {isElite ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground">
                      <th className="pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Deployment Date</th>
                      <th className="pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Protocol Tier</th>
                      <th className="pb-4 font-black uppercase text-[9px] tracking-[0.2em]">Allocation</th>
                      <th className="pb-4 font-black uppercase text-[9px] tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 text-xs font-medium">Dec 18, 2025</td>
                      <td className="py-6 font-black text-xs uppercase italic tracking-tighter text-accent">Elite Protocol (Full Suite)</td>
                      <td className="py-6 text-xs font-bold">$440.00</td>
                      <td className="py-6 text-right"><span className="text-accent font-black uppercase text-[10px] tracking-widest">Confirmed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] font-bold text-muted-foreground text-center py-10 uppercase tracking-widest opacity-50 italic">Zero deployment history identified.</p>
            )}
          </div>
        </div>

        {/* Security / Sidebar card */}
        <div className="space-y-6">
          <div className="bg-accent/5 p-6 rounded-3xl border border-accent/20">
             <h3 className="font-bold flex items-center gap-2 mb-4">
               <ShieldCheck className="w-5 h-5 text-accent" /> {t.subscription.protection}
             </h3>
             <ul className="space-y-4">
               <li className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">IP Protection</span>
                 <span className="text-emerald-500 font-bold">Enabled</span>
               </li>
               <li className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">2FA Verification</span>
                 <span className="text-red-500 font-bold cursor-pointer hover:underline">Disabled</span>
               </li>
               <li className="flex items-center justify-between text-xs">
                 <span className="text-muted-foreground">Encryption Level</span>
                 <span className="font-bold">AES-256</span>
               </li>
             </ul>
             <button className="w-full mt-6 py-2.5 bg-background border border-border/50 text-xs font-bold rounded-xl hover:bg-muted transition-all">
               Security Dashboard
             </button>
          </div>
        </div>
      </div>

      <SubscriptionModal open={isSubOpen} onClose={() => setIsSubOpen(false)} />
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {children}
    </span>
  )
}
