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
      {/* Passionate Futuristic Background Elements - Hidden on mobile for clarity */}
      <div className="hidden sm:block absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      
      {/* Hero Badge Removed */}

      <h1 className="text-[28px] leading-tight tracking-tight sm:text-4xl md:text-5xl xl:text-7xl font-black text-foreground max-w-4xl text-balance mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 italic uppercase">
        {t.hero.title_line1}
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-foreground to-emerald-400">{t.hero.title_line2}</span>
      </h1>

      <p className="max-w-[32ch] mx-auto text-sm leading-relaxed text-foreground/80 sm:text-base md:text-lg mb-10 text-pretty font-semibold opacity-80 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        {t.hero.subtitle}
      </p>

      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
        <Button
          className="w-full sm:w-auto py-3 sm:py-9 px-8 sm:px-12 text-sm sm:text-xl font-semibold sm:font-black rounded-2xl sm:rounded-[2.5rem] bg-accent hover:bg-accent/90 text-accent-foreground uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 border-none sm:shadow-[0_20px_60px_-15px_rgba(61,214,140,0.4)]"
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
          <Rocket className="w-4 h-4 sm:w-6 sm:h-6 ml-3 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <button 
            onClick={() => router.push("/dashboard/market")}
            className="w-full sm:w-auto py-3 sm:py-5 px-8 sm:px-10 text-sm font-semibold sm:font-black rounded-2xl sm:rounded-[2rem] bg-background/40 border border-white/10 sm:bg-card/40 sm:backdrop-blur-xl uppercase tracking-widest hover:bg-accent/5 transition-all active:scale-95"
        >
            {t.hero.cta_secondary}
        </button>
      </div>

      <div className="mt-12 sm:mt-20 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-12 gap-y-6 w-full max-w-xs sm:max-w-none text-center">
           <div className="flex flex-col items-center">
               <span className="text-xl sm:text-3xl font-semibold sm:font-black text-foreground italic tracking-tighter">2.4ms</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_lat}</span>
           </div>
           <div className="w-px h-12 bg-border/40 hidden sm:block" />
           <div className="flex flex-col items-center">
               <span className="text-xl sm:text-3xl font-semibold sm:font-black text-foreground italic tracking-tighter">99.9%</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_up}</span>
           </div>
           
           <div className="col-span-2 sm:col-span-1 flex flex-col items-center border-t border-border/20 pt-4 sm:border-t-0 sm:pt-0">
             <div className="w-px h-12 bg-border/40 hidden sm:block absolute -left-6" /> {/* Hacky divider replacement for flex, but keeping simple for grid */}
               <span className="text-xl sm:text-3xl font-semibold sm:font-black text-foreground italic tracking-tighter">1.2M+</span>
               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em]">{t.hero.stat_sig}</span>
           </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-16 sm:mt-24 flex items-center justify-center gap-12 opacity-30 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
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
