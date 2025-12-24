"use client";

import * as React from "react";
import { Rocket, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";

interface HeroProps {
  onOpenSubscription?: () => void;
}

export function Hero({ onOpenSubscription }: HeroProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center overflow-hidden">
      {/* Passionate Futuristic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      
      {/* Hero Badge Removed */}

      <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground max-w-4xl leading-[0.9] tracking-tighter text-balance mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic uppercase">
        {t.hero.title_line1}
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-foreground to-emerald-400">{t.hero.title_line2}</span>
      </h1>

      <p className="text-muted-foreground max-w-2xl text-base md:text-lg mb-10 text-pretty font-semibold leading-relaxed opacity-80 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        {t.hero.subtitle}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-9 rounded-[2.5rem] text-xl font-black uppercase tracking-widest group shadow-[0_20px_60px_-15px_rgba(61,214,140,0.4)] transition-all hover:-translate-y-1 active:scale-95 border-none"
          onClick={() => {
              const userStr = localStorage.getItem("user");
              if (userStr) {
                  router.push("/dashboard");
              } else {
                  router.push("/signup");
              }
          }}
        >
          {t.hero.cta_primary}
          <Rocket className="w-6 h-6 ml-3 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <button 
            onClick={() => router.push("/dashboard/market")}
            className="px-10 py-5 rounded-[2rem] border border-border/50 hover:border-accent/40 bg-card/40 backdrop-blur-xl text-sm font-black uppercase tracking-widest hover:bg-accent/5 transition-all active:scale-95"
        >
            {t.hero.cta_secondary}
        </button>
      </div>

      <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
           <div className="flex flex-col items-center">
               <span className="text-3xl font-black text-foreground italic tracking-tighter">2.4ms</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_lat}</span>
           </div>
           <div className="w-px h-12 bg-border/40 hidden sm:block" />
           <div className="flex flex-col items-center">
               <span className="text-3xl font-black text-foreground italic tracking-tighter">99.9%</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_up}</span>
           </div>
           <div className="w-px h-12 bg-border/40 hidden sm:block" />
           <div className="flex flex-col items-center">
               <span className="text-3xl font-black text-foreground italic tracking-tighter">1.2M+</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_sig}</span>
           </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-24 flex items-center justify-center gap-12 opacity-30 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> <span className="text-xs font-bold uppercase tracking-widest">Military Grade</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" /> <span className="text-xs font-bold uppercase tracking-widest">Global Node</span>
          </div>
      </div>
    </section>
  );
}
