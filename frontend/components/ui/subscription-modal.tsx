"use client";

import { X, Copy, Check, Star, Zap, Shield, ChevronLeft, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api";

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
  const [referenceId, setReferenceId] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

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

  const handleCopyRef = () => {
    if (!referenceId) return;
    navigator.clipboard.writeText(referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
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

      const res = await fetch(API_ENDPOINTS.PAYMENT.CRYPTO_CONFIRM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          tx_hash: txHash,
          wallet_address: WALLETS[network],
          plan_name: selectedPlan!.toLowerCase(),
          duration: yearly ? "yearly" : "monthly",
          reference_id: referenceId,
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
      const newRef = `NF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setReferenceId(newRef);
      setSelectedPlan(plan);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />
        
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-[540px] bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_48px_128px_-32px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />

          <div className="relative p-10 sm:p-14">
            <button onClick={onClose} className="absolute top-8 right-8 text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-white/5 transition-all active:scale-90">
              <X className="w-6 h-6" />
            </button>

            <div className="text-center space-y-6 mb-12">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-accent/5">
                <Star className="w-3.5 h-3.5 fill-accent animate-pulse" /> Strategic Deployment
              </div>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-none">
                NEURAL PRO
              </h2>
              <p className="text-muted-foreground/80 text-sm sm:text-base max-w-[320px] mx-auto leading-relaxed font-medium">
                Unlock institutional-grade AI intelligence and automated execution protocols.
              </p>
            </div>

            {/* TOGGLE SECTION */}
            <div className="flex justify-center items-center gap-8 mb-14">
              <span className={`text-xs font-black uppercase tracking-widest transition-all duration-300 ${!yearly ? "text-white scale-110" : "text-muted-foreground opacity-40"}`}>Monthly</span>
              <button
                onClick={() => setYearly(!yearly)}
                className={`w-16 h-8 rounded-full relative transition-all duration-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-white/5 ${yearly ? "bg-accent/20" : "bg-white/5"}`}
              >
                <div
                  className={`w-6 h-6 rounded-full absolute top-1 transition-all cubic-bezier(0.34, 1.56, 0.64, 1) duration-500 shadow-2xl ${
                    yearly ? "right-1 bg-accent shadow-accent/40" : "left-1 bg-white/40"
                  }`}
                />
              </button>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black uppercase tracking-widest transition-all duration-300 ${yearly ? "text-white scale-110" : "text-muted-foreground opacity-40"}`}>Yearly</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-accent/20">
                  -25% OFF
                </span>
              </div>
            </div>

            {/* SINGLE FOCUSED PLAN CARD */}
            <div className="relative group">
              {/* Outer glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 transition-all duration-500 hover:bg-white/[0.05] hover:border-accent/40 hover:-translate-y-1">
                <div className="flex items-end justify-between mb-10">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-accent uppercase tracking-[0.2em]">Institutional Access</p>
                    <h3 className="text-3xl font-black tracking-tight">Pro Signals</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black tracking-tighter leading-none">
                      ${yearly ? "180" : "19"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                       billed {yearly ? "annually" : "monthly"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-10">
                  {[
                    "Unlimited AI Signals",
                    "News Sentinel AI",
                    "Sentiment Alpha",
                    "Low Latency Edge",
                    "Smart Risk Engine",
                    "Institutional Support"
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-3 text-[13px] font-bold text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]" /> 
                      {feat}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanSelection("Pro")}
                  className="w-full py-5 bg-accent text-accent-foreground text-sm font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_20px_40px_-10px_rgba(var(--accent-rgb),0.4)] hover:shadow-accent/60 hover:-translate-y-0.5 active:scale-95 shadow-lg"
                >
                  Activate Neural Link
                </button>
              </div>
            </div>

            <p className="text-center mt-10 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest pointer-events-none">
              Secured by Institutional Blockchain Protocol
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT / ADDRESS SCREEN
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[500px] bg-card/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,1)] p-8 sm:p-12 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => setSelectedPlan(null)} 
            className="group flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-accent transition-all uppercase tracking-[0.2em]"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to tier
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-3 mb-12">
          <h2 className="text-4xl font-black tracking-tighter uppercase">Finalize Link</h2>
          <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">Secure Cryptographic Transfer (USDT)</p>
        </div>

        {/* SUMMARY CARD */}
        <div className="mb-10 p-6 rounded-[2rem] bg-accent/5 border border-accent/20 flex items-center justify-between shadow-lg shadow-accent/5">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-inner">
                   <Zap className="w-7 h-7 fill-accent/20" />
                </div>
                <div>
                   <p className="text-base font-black tracking-tight uppercase">Neural Pro</p>
                   <p className="text-[10px] text-accent/60 font-black uppercase tracking-widest">{yearly ? 'Annual Protocol' : 'Monthly Access'}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-3xl font-black tracking-tighter leading-none">
                    ${yearly ? "180" : "19"}
                </p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-1">Tier 1 USDT</p>
            </div>
        </div>

        {/* NETWORK SELECTOR */}
        <div className="space-y-4 mb-10">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">Deployment Network</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(WALLETS).map((net) => (
              <button
                key={net}
                onClick={() => setNetwork(net as any)}
                className={`py-4 text-[11px] font-black rounded-2xl border transition-all duration-300 ${
                  network === net
                    ? "bg-accent text-accent-foreground border-accent shadow-xl shadow-accent/20 scale-[1.02]"
                    : "bg-white/5 text-muted-foreground border-white/5 hover:border-white/20"
                }`}
              >
                {net} PROTOCOL
              </button>
            ))}
          </div>
        </div>

        {/* ADDRESS */}
        <div className="space-y-4 mb-10">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">Gateway Address ({network})</label>
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-black/40 p-5 rounded-2xl text-[11px] font-mono break-all border border-white/5 text-muted-foreground/80 shadow-inner">
                    {WALLETS[network]}
                </div>
                <button 
                  onClick={handleCopy}
                  className={`p-5 rounded-2xl border transition-all active:scale-90 ${copied ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  title="Copy Address"
                >
                   {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
            </div>
        </div>

        {/* REFERENCE ID */}
        <div className="space-y-4 mb-10">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">Secure Payment ID</label>
            <div className="flex items-center gap-3">
                <div className="flex-1 bg-accent/5 p-5 rounded-2xl text-[11px] font-black tracking-widest border border-accent/20 text-accent shadow-inner">
                    {referenceId}
                </div>
                <button 
                  onClick={handleCopyRef}
                  className={`p-5 rounded-2xl border transition-all active:scale-90 ${copiedRef ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                  title="Copy Reference"
                >
                   {copiedRef ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
            </div>
            <p className="px-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Include this ID in your transfer memo if your wallet supports it.</p>
        </div>

        {/* TX HASH INPUT */}
        <div className="space-y-4 mb-12">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2 opacity-50">Transaction TXID / Hash</label>
            <div className="relative">
                <input 
                  type="text" 
                  placeholder="Paste transaction signature here..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full bg-black/40 p-5 rounded-2xl border border-white/10 focus:border-accent/40 focus:ring-4 focus:ring-accent/10 text-sm font-mono placeholder:text-muted-foreground/20 transition-all shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent animate-pulse opacity-50" />
            </div>
        </div>

        {error && (
            <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-xs font-black uppercase tracking-widest text-red-500 animate-shake">
                {error}
            </div>
        )}

        <button
            onClick={handleManualVerify}
            disabled={isLoading || !txHash}
            className="w-full py-6 bg-accent text-accent-foreground rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
        >
            {isLoading ? "Validating Logic..." : "Synchronize Deployment"}
        </button>

        <p className="mt-10 text-center text-[10px] font-black text-muted-foreground/20 leading-relaxed uppercase tracking-tighter">
            Assets subject to high market volatility. <br /> Deployment synchronized upon block confirmation.
        </p>

      </div>
    </div>
  );
}
