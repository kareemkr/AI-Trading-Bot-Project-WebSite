"use client";

import { BrainCircuit, Shield, Eye, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { Header } from "../components/header";
import { Footer } from "../components/footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Privacy Protocol</h1>
        </div>

        <p className="text-xl text-muted-foreground mb-12 font-medium leading-relaxed">
          At Neural Flow, we believe privacy is the cornerstone of elite trading. Our systems are built to ensure your data remains your edge.
        </p>

        <div className="grid gap-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Data Transmission</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                All communications between your terminal and our neural networks are encrypted using institutional-grade 256-bit protocols. We never store raw API keys; they are vaulted and injected into isolated execution environments only when required.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Neural Anonymization</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Our AI models process market intelligence without associating it with individual trading patterns. Your strategy remains proprietary. We do not sell user data to secondary markets or liquidity providers.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Global Compliance</h2>
            </div>
            <div className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-3xl p-8 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We adhere to international data protection standards, ensuring that your digital footprint is minimized. You have full control over your neural link settings and can terminate any active node connection instantly.
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
