"use client";

import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

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

  // Copy Helper
  const handleCopy = () => {
    navigator.clipboard.writeText(WALLETS[network]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleManualVerify() {
    setIsLoading(true);
    setError("");

    try {
      if (!txHash || txHash.length < 10) {
        throw new Error("Please enter a valid Transaction Hash (TXID)");
      }

      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("User not found (please sign in first)");
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:8000/payment/crypto-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          tx_hash: txHash,
          wallet_address: WALLETS[network], // The address they sent TO
          duration: yearly ? "yearly" : "monthly",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Payment verification failed");

      // Update Local State
      user.subscription_status = "premium";
      localStorage.setItem("user", JSON.stringify(user));

      alert("Payment Confirmed! Account Upgraded.");
      onClose();
      window.location.reload();

    } catch (err: any) {
      setError(err.message || "Failed to verify payment");
    } finally {
      setIsLoading(false);
    }
  }

  // If no plan selected, show pricing cards
  if (!selectedPlan) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-[95%] max-w-[520px] bg-white text-black rounded-3xl shadow-2xl p-8 z-[10000]">
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-3xl font-bold text-center">Supercharge Your Trading</h2>
          <p className="text-center text-gray-500 mt-2">Choose your plan</p>

          {/* TOGGLE */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <span className={!yearly ? "font-semibold" : "text-gray-400"}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`w-12 h-6 rounded-full relative transition ${yearly ? "bg-black/80" : "bg-gray-300"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition ${
                  yearly ? "right-[2px]" : "left-[2px]"
                }`}
              />
            </button>
            <div className="flex flex-col items-start leading-tight">
              <span className={yearly ? "font-semibold" : "text-gray-400"}>Yearly</span>
              <span className="text-green-600 text-xs">Save 17%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {/* PRO */}
            <div className="border border-gray-300 rounded-2xl p-5 text-center shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold">Pro</p>
                <p className="text-3xl font-bold mt-2">
                  ${yearly ? "190" : "24"}
                  <span className="text-base font-medium text-gray-500">/yr</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan("Pro")}
                className="mt-4 w-full py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-black/80 transition"
              >
                Get Pro
              </button>
            </div>

            {/* ELITE */}
            <div className="border border-gray-300 rounded-2xl p-5 text-center shadow-sm relative flex flex-col justify-between">
              <p className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-3 py-1 rounded-full">POPULAR</p>
              <div>
                <p className="text-lg font-semibold">Elite</p>
                <p className="text-3xl font-bold mt-2">
                  ${yearly ? "490" : "59"}
                  <span className="text-base font-medium text-gray-500">/yr</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan("Elite")}
                className="mt-4 w-full py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition"
              >
                Get Elite
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAYMENT / ADDRESS SCREEN
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[95%] max-w-[520px] bg-white text-black rounded-3xl shadow-2xl p-8 z-[10000]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setSelectedPlan(null)} className="text-sm text-gray-500 hover:text-black">
            ← Back
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center">Complete Payment</h2>
        <p className="text-center text-gray-500 mt-1">Send USDT to the address below</p>

        {/* AMOUNT */}
        <div className="mt-6 text-center bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-500">Amount to send</p>
          <p className="text-3xl font-bold">
            ${selectedPlan === "Pro" ? (yearly ? "190" : "24") : (yearly ? "490" : "59")}
            <span className="text-lg text-gray-500 font-normal">.00 USDT</span>
          </p>
        </div>

        {/* NETWORK SELECTOR */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Network</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(WALLETS).map((net) => (
              <button
                key={net}
                onClick={() => setNetwork(net as any)}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  network === net
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        {/* ADDRESS */}
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Address ({network})</label>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 p-3 rounded-xl text-xs font-mono break-all border border-gray-200">
                    {WALLETS[network]}
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 transition"
                  title="Copy Address"
                >
                   {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
                </button>
            </div>
        </div>

        {/* TX HASH INPUT */}
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Hash (TXID)</label>
            <input 
              type="text" 
              placeholder="Paste the transaction hash here..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
        </div>

        {error && (
            <p className="mt-4 text-center text-sm text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>
        )}

        <button
            onClick={handleManualVerify}
            disabled={isLoading}
            className="w-full mt-6 py-4 bg-black text-white rounded-2xl text-lg font-bold hover:bg-black/90 transition disabled:opacity-50"
        >
            {isLoading ? "Verifying..." : "I Have Sent The Funds"}
        </button>

      </div>
    </div>
  );
}
