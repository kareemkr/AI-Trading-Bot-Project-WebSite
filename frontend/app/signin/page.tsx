"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Home,
  ShieldCheck,
  BrainCircuit
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

export default function SigninPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // ✅ SAVE TOKEN + USER
      localStorage.setItem("token", data.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: data.email,
          name: data.name,
          subscription_status: data.subscription_status,
          avatar: data.avatar,
        })
      );

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans">
      {/* Deep Space Background Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      {/* Top Nav */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:border-accent/40 transition-all">
            <BrainCircuit className="w-6 h-6 text-accent" />
          </div>
          <span className="text-white font-black text-2xl uppercase italic tracking-tighter group-hover:text-accent transition-colors">Neural Flow</span>
        </Link>
        <Link 
            href="/" 
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:text-white hover:bg-white/10 transition-all text-sm font-bold backdrop-blur-md group"
        >
            <Home className="w-4 h-4 text-accent" />
            <span>Homepage</span>
        </Link>
      </div>

      <div className="w-full max-w-[460px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center mb-10">
          <div className="inline-flex relative mb-6">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-24 h-24 rounded-[2.5rem] bg-black/40 border-2 border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-2xl group overflow-hidden">
                <BrainCircuit className="w-12 h-12 text-accent" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                <ShieldCheck className="w-5 h-5 text-black" />
            </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">
            Welcome <span className="text-accent">Back</span>
          </h1>
          <p className="text-white/60 font-bold uppercase tracking-[0.3em] text-[12px] mt-6">
            Sign in to your account
          </p>
        </div>

        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-emerald-500/20 to-accent/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            
            <div className="relative bg-[#0a0f1d]/80 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-[200%] -translate-y-full animate-[scanline_8s_linear_infinite] pointer-events-none" />
              
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="group/input relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within/input:text-accent transition-colors" />
                    <input
                      type="email"
                      className="w-full pl-16 pr-6 py-5 rounded-2xl border border-white/10 bg-black/40 text-base font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="group/input relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within/input:text-accent transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-16 pr-16 py-5 rounded-2xl border border-white/10 bg-black/40 text-base font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all shadow-inner"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-red-400 text-[11px] font-black uppercase tracking-wider">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 rounded-2xl bg-accent text-black font-black uppercase italic tracking-[0.1em] text-sm shadow-xl hover:shadow-accent/40 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale relative group/btn"
                  >
                    {/* Fixed: Removed the sliding bg-white/20 div */}
                    <span className="relative z-10">{isLoading ? "Signing in..." : "Sign In"}</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                    <span className="bg-[#0d1425] px-4 text-white/20">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = `${API_BASE_URL}/oauth/login/google`}
                  className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 text-white hover:border-accent/30 shadow-inner"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center justify-center gap-3 mt-8">
                    <ShieldCheck className="w-4 h-4 text-accent/40" />
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Secure Encrypted Connection</p>
                </div>
              </div>
            </div>
        </div>

        <p className="text-center mt-12 text-[13px] font-bold uppercase tracking-[0.2em] text-white/60">
          Don't have an account?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="text-accent hover:text-white transition-all font-black border-b-2 border-accent/30 hover:border-white pb-0.5 ml-2"
          >
            Create Account
          </button>
        </p>
      </div>
    </main>
  );
}