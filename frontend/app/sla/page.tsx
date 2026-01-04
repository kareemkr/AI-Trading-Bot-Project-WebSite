"use client";

import { BrainCircuit, Cpu, Zap, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { Footer } from "../components/footer";

export default function SLAPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">SLA Terms</h1>
        </div>

        <p className="text-xl text-muted-foreground mb-12 font-medium leading-relaxed">
          Neural Flow is designed for high-frequency precision. Our Service Level Agreement guarantees the performance required for elite market execution.
        </p>

        <div className="grid gap-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Network Uptime</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We commit to a 99.9% uptime for our core neural networks. Our global node network ensures redundancy, with automatic failover to the nearest available gateway in the event of local infrastructure instability.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Execution Latency</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Neural Flow optimizes for sub-millisecond route calculation. While final execution time depends on exchange liquidity and network congestion, our internal processing overhead is guaranteed to be within specified high-performance bounds.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Support Protocol</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Institutional and Pro users receive priority access to our support channels. Incident reports are triaged instantly by our technical team, with an objective response time of under 4 hours for critical system anomalies.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border/20">
          <Link 
            href="/" 
            className="text-accent font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 hover:gap-4 transition-all"
          >
            ← Back to Terminal
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
