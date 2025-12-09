"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = mode === "signin" ? "auth/login" : "auth/register";
    const body =
      mode === "signin" ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.access_token) {
        alert("Logged in!");
      } else if (data.success) {
        alert("Account created!");
        setMode("signin");
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      alert("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const features = [
    { icon: TrendingUp, label: "Real-time Trading" },
    { icon: Shield, label: "Bank-grade Security" },
    { icon: Zap, label: "Lightning Fast" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background effects modified to match theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "signin"
              ? "Sign in to continue your trading journey"
              : "Start your trading journey today"}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-card/70 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl shadow-black/20 animate-fade-in-up">
          {mode === "signup" && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs text-muted-foreground"
                >
                  <feature.icon className="w-3 h-3 text-accent" />
                  {feature.label}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-foreground placeholder:text-muted-foreground"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                type="email"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-background border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-background border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-foreground placeholder:text-muted-foreground"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center mt-6 text-muted-foreground">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-accent hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="text-center mt-4 text-xs text-muted-foreground/70">
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
