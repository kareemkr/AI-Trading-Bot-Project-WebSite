"use client";

import Link from "next/link";
import { BrainCircuit, Github, Linkedin, Mail, Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-background">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tight">Breakout OS</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
            A public roadmap for turning AI, backend, and disciplined GitHub proof into better local, remote,
            and relocation opportunities.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {[
              { icon: Github, href: "https://github.com", label: "GitHub" },
              { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
              { icon: Mail, href: "mailto:kareem@gmail.com", label: "Email" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-accent hover:text-accent"
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.22em]">Execution</h4>
          <ul className="mt-5 space-y-3 text-sm font-bold text-muted-foreground">
            <li><a href="#roadmap" className="hover:text-foreground">Roadmap</a></li>
            <li><a href="#projects" className="hover:text-foreground">Portfolio Projects</a></li>
            <li><a href="#channels" className="hover:text-foreground">Money Channels</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.22em]">Next Move</h4>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Build one serious repo this month, publish it cleanly, then use it as your first proof asset.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground transition hover:bg-primary/90"
          >
            Start
            <Rocket className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-border pt-6 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2026 Breakout OS. Built for visible proof.</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/sla" className="hover:text-foreground">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
