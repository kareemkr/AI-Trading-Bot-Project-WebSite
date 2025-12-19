"use client";

import { X, Copy, Check, Star, Zap, Shield, ChevronLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

const WALLETS = {
  BEP20: "0xfa0f2cc0f2f28bf394eaa8fb21ec700b1f5dc25e",
  TRC20: "TUAkNAFohHyvn4PKg6GsXfomP13W8FnNhM",
  ERC20: "0xfa0f2cc0f2f28bf394eaa8fb21ec700b1f5dc25e",
  SOL: "4fqfNiNF6VZLnvm2gvLsDMSCoDi5s8zmPZvh6h5VrMHZ",
};

export default function SubscriptionModal({
  open,
  onClose,
}: SubscriptionModalProps) {
  if (!open) return null;

  const [yearly, setYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"Pro" | "Elite" | null>(null);
  const [network, setNetwork] = useState<keyof typeof WALLETS>("TRC20");
  const [txHash, setTxHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const checkAuth = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast.info("Authentication Required", {
        description: "Please sign in or create an account to upgrade your plan.",
      });
      window.location.href = "/signin";
      return false;
    }
    return true;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(WALLETS[network]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleManualVerify() {
    if (!checkAuth()) return;
    
    setIsLoading(true);
    setError("");

    try {
      if (!txHash || txHash.length < 10) {
        throw new Error("Please enter a valid Transaction Hash (TXID)");
      }

      const userStr = localStorage.getItem("user");
      const user = JSON.parse(userStr!);

      const res = await fetch("http://localhost:8000/payment/crypto-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          tx_hash: txHash,
          wallet_address: WALLETS[network],
          plan_name: selectedPlan!.toLowerCase(),
          duration: yearly ? "yearly" : "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Payment verification failed");

      user.subscription_status = data.subscription_status;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Payment Received!", {
        description: `Your account has been upgraded to ${selectedPlan}.`,
      });
      onClose();
      window.location.reload();

    } catch (err: any) {
      setError(err.message || "Failed to verify payment");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePlanSelection = (plan: "Pro" | "Elite") => {
    if (checkAuth()) {
      setSelectedPlan(plan);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className="relative w-full max-w-[640px] bg-card/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Futuristic Background Accents */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[100px]" />

          <div className="relative p-8 sm:p-12">
            <button onClick={onClose} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4 mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
                <Star className="w-3 h-3 fill-accent" /> Premium Trading Access
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                Choose Your Edge
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-[340px] mx-auto leading-relaxed">
                Empower your strategy with our institutional-grade AI intelligence.
              </p>
            </div>

            {/* TOGGLE */}
            <div className="flex justify-center items-center gap-6 mb-12">
              <span className={`text-sm font-bold tracking-tight transition-colors ${!yearly ? "text-white" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner group ${yearly ? "bg-accent/20" : "bg-white/5 border border-white/10"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-1 transition-all duration-300 shadow-xl ${
                    yearly ? "right-1 bg-accent" : "left-1 bg-white/40 group-hover:bg-white/60"
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-tight transition-colors ${yearly ? "text-white" : "text-muted-foreground"}`}>Yearly</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  -25%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* PRO */}
              <div className="group relative bg-white/[0.03] border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Pro Access</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Signals Only</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-4xl font-black tracking-tight">
                    ${yearly ? "180" : "19"}
                    <span className="text-sm font-medium text-muted-foreground">/{yearly ? "yr" : "mo"}</span>
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["5+ AI Market Signals Daily", "Priority Notifications", "Sentiment Analysis", "Institutional Signal Accuracy"].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-[12px] font-medium text-white/70">
                      <div className="w-1 h-1 rounded-full bg-accent" /> {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanSelection("Pro")}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-2xl transition-all border border-white/10 group-hover:border-white/20"
                >
                  Get Professional Signals
                </button>
              </div>

              {/* ELITE */}
              <div className="group relative bg-accent/5 border border-accent/30 rounded-3xl p-6 transition-all hover:bg-accent/10 hover:border-accent/50 hover:-translate-y-1 overflow-hidden shadow-[0_0_40px_-20px_rgba(var(--accent-rgb),0.5)]">
                <div className="absolute top-0 right-0 p-1 px-3 py-1.5 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-tighter rounded-bl-2xl">
                  Full Suite
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-accent">Elite System</h3>
                    <p className="text-[10px] text-accent/60 font-medium uppercase tracking-wider">Full Automation</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-4xl font-black tracking-tight">
                    ${yearly ? "440" : "49"}
                    <span className="text-sm font-medium text-muted-foreground">/{yearly ? "yr" : "mo"}</span>
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Unlimited AI Signals", "Fully Automated Trading Bot", "Upcoming News Trading AI", "VIP Institutional Tools"].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-[12px] font-medium text-white/90">
                      <div className="w-1 h-1 rounded-full bg-accent animate-pulse" /> {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanSelection("Elite")}
                  className="w-full py-4 bg-accent text-accent-foreground text-sm font-bold rounded-2xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-95 translate-y-0"
                >
                  Activate Elite Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT / ADDRESS SCREEN
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-[500px] bg-card/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in translate-y-4 duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setSelectedPlan(null)} 
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Back to plans
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-black tracking-tighter">Finalize Upgrade</h2>
          <p className="text-muted-foreground text-sm">Secure crypto payment via USDT</p>
        </div>

        {/* SUMMARY CARD */}
        <div className="mb-8 p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPlan === "Elite" ? "bg-accent/20 text-accent" : "bg-white/5 text-white/60"}`}>
                   <CreditCard className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-sm font-bold">{selectedPlan} Plan</p>
                   <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{yearly ? 'Billed Yearly' : 'Billed Monthly'}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black tracking-tight">
                    ${selectedPlan === "Pro" ? (yearly ? "180" : "19") : (yearly ? "440" : "49")}
                </p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase">USDT Only</p>
            </div>
        </div>

        {/* NETWORK SELECTOR */}
        <div className="space-y-4 mb-8">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 pointer-events-none">Select Blockchain Network</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(WALLETS).map((net) => (
              <button
                key={net}
                onClick={() => setNetwork(net as any)}
                className={`py-3 text-[11px] font-black rounded-xl border transition-all duration-300 ${
                  network === net
                    ? "bg-accent/10 text-accent border-accent/40 shadow-lg shadow-accent/10"
                    : "bg-white/5 text-muted-foreground border-white/5 hover:border-white/20"
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        {/* ADDRESS */}
        <div className="space-y-4 mb-8">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 pointer-events-none">Contract Address ({network})</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 p-4 rounded-2xl text-[11px] font-mono break-all border border-white/5 text-muted-foreground">
                    {WALLETS[network]}
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95"
                  title="Copy Address"
                >
                   {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
            </div>
        </div>

        {/* TX HASH INPUT */}
        <div className="space-y-4 mb-10">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 pointer-events-none">Enter Transaction TXID / Hash</label>
            <input 
              type="text" 
              placeholder="e.g. 0x5a1b2c3d..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full bg-black/40 p-4 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent/20 text-sm font-mono placeholder:text-muted-foreground/30 transition-all"
            />
        </div>

        {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-xs font-bold text-red-500 animate-shake">
                {error}
            </div>
        )}

        <button
            onClick={handleManualVerify}
            disabled={isLoading || !txHash}
            className="w-full py-5 bg-accent text-accent-foreground rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
        >
            {isLoading ? "Verifying Transaction..." : "Synchronize Payment"}
        </button>

        <p className="mt-8 text-center text-[10px] font-medium text-muted-foreground/40 leading-relaxed uppercase tracking-tighter">
            Crypto assets are subject to market risk. <br /> Account will be automatically upgraded upon confirmation.
        </p>

      </div>
    </div>
  );
}
