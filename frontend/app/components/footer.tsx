"use client";

import Link from "next/link";
import { Sparkles, Twitter, Github, Linkedin, Mail, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isAuthenticated } from "../../lib/auth";

export function Footer() {
  const router = useRouter();

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    
    // Auth Check
    if (!isAuthenticated()) {
      toast.error("Authentication Required", {
        description: "Please sign up to access the ecosystem features.",
        duration: 4000,
        action: {
          label: "Sign Up",
          onClick: () => router.push("/signup")
        }
      });
      return;
    }

    // Placeholder Check
    if (href === "#") {
      toast.info("Neural Node Initializing", {
        description: "This feature is currently being optimized for institutional deployment.",
        duration: 3000
      });
      return;
    }

    router.push(href);
  };

  return (
    <footer className="bg-card/30 border-t border-border/40 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-background">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <span className="font-black text-2xl tracking-tighter uppercase">Neural Flow</span>
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
              <li>
                <button 
                  onClick={(e) => handleProtectedLink(e, "/dashboard/bots")} 
                  className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter text-left"
                >
                  AI Neural Bots
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleProtectedLink(e, "/dashboard/market")} 
                  className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter text-left"
                >
                  Market Intelligence
                </button>
              </li>
              <li>
                <button 
                  onClick={(e) => handleProtectedLink(e, "/dashboard/settings")} 
                  className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter text-left"
                >
                  Neural Link Settings
                </button>
              </li>
              <li>
                <Link href="#pricing" className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter">
                  Protocol Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-xs mb-8">Infrastructure</h4>
            <ul className="space-y-4">
              {[
                { name: "Neural Gateway", href: "#" },
                { name: "Smart Execution", href: "#" },
                { name: "Institutional Custody", href: "#" },
                { name: "Global Node Network", href: "#" },
                { name: "Latency Optimization", href: "#" },
                { name: "Liquidity Aggregation", href: "#" },
                { name: "Neural Mesh", href: "#" },
                { name: "Risk Engine", href: "#" },
                { name: "Security Vault", href: "#" },
                { name: "API Specification", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <button 
                    onClick={(e) => handleProtectedLink(e, item.href)} 
                    className="text-sm text-muted-foreground hover:text-accent font-bold transition-all uppercase tracking-tighter text-left w-full"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black uppercase tracking-widest text-xs mb-8">Neural Digest</h4>
            <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed italic">
              "Technical issues? Direct your queries to my secure neural channel for developer support."
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="SUPPORT_CHANNEL" 
                className="flex-1 bg-black/20 border border-border/50 rounded-xl px-4 py-3 text-xs font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-accent uppercase"
              />
              <button 
                onClick={() => window.location.href = "mailto:kareem@gmail.com"}
                className="p-3 rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:scale-105 transition-all"
              >
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
            <Link href="/privacy" className="text-[10px] text-muted-foreground font-bold hover:text-accent uppercase tracking-widest">Privacy Protocol</Link>
            <Link href="/sla" className="text-[10px] text-muted-foreground font-bold hover:text-accent uppercase tracking-widest">SLA Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
