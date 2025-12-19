"use client";

import Link from "next/link";
import { Sparkles, Twitter, Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card/30 border-t border-border/40 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <img src="/neural-logo.png" className="w-full h-full object-cover rounded-xl" alt="Neural Flow" />
              </div>
              <span className="font-black text-2xl tracking-tighter italic uppercase">Neural Flow</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              I built this to give everyone the tools I used to win. Neural Flow is a testament to what's possible when passion meets code.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://twitter.com" className="p-3 rounded-xl bg-muted/30 hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://github.com" className="p-3 rounded-xl bg-muted/30 hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-xs mb-8">Ecosystem</h4>
            <ul className="space-y-4">
              <li><Link href="/dashboard/bots" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">AI Neural Bots</Link></li>
              <li><Link href="/dashboard/market" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">Market Intelligence</Link></li>
              <li><Link href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">Neural Link Settings</Link></li>
              <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">Protocol Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-xs mb-8">Infrastructure</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">Security Vault</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">API Specification</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">Node Network</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-xs mb-8">Neural Digest</h4>
            <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed italic">"The market never sleeps, and neither do our neural networks."</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="NEURAL_EMAIL" 
                className="flex-1 bg-black/20 border border-border/50 rounded-xl px-4 py-3 text-xs font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-accent uppercase"
              />
              <button className="p-3 rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:scale-105 transition-all">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            © 2025 NEURAL FLOW SYSTEM. BUILT WITH PASSION FOR ELITE TRADERS.
          </p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-[10px] text-muted-foreground font-bold hover:text-accent uppercase tracking-widest">Privacy Protocol</Link>
            <Link href="#" className="text-[10px] text-muted-foreground font-bold hover:text-accent uppercase tracking-widest">SLA Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
