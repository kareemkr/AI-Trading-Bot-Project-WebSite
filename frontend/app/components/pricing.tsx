"use client";

import {
  ArrowUpRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Check,
  FlaskConical,
  Github,
  Globe2,
  HeartPulse,
  Laptop,
  ServerCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

const projects = [
  {
    name: "AI Emotion Detection",
    tag: "AI system",
    icon: FlaskConical,
    bullets: ["Model training pipeline", "API inference endpoint", "Screenshots and demo clips"],
  },
  {
    name: "Finance Backend System",
    tag: "Backend proof",
    icon: ServerCog,
    bullets: ["Auth, DB, and REST APIs", "Dockerized services", "Transaction-safe architecture"],
  },
  {
    name: "XR Rehab Intelligence",
    tag: "Thesis advantage",
    icon: HeartPulse,
    bullets: ["Medical AI workflow", "Research-backed use case", "React + FastAPI deployment"],
  },
];

const channels = [
  {
    name: "Remote USD Work",
    range: "$1K-$5K/mo path",
    icon: Globe2,
    details: "Best upside. Use LinkedIn, Upwork, contract networks, and direct founder outreach.",
  },
  {
    name: "Top Local Teams",
    range: "50K+ EGP target",
    icon: BriefcaseBusiness,
    details: "Valeo, Microsoft-style pipelines, fintech, telecom, and strong backend teams.",
  },
  {
    name: "Gulf / Europe",
    range: "Long-term leverage",
    icon: Laptop,
    details: "Backend/cloud experience compounds into Saudi, UAE, Germany, and relocation routes.",
  },
];

interface PricingProps {
  onOpenSubscription?: () => void;
}

export function Pricing({ onOpenSubscription: _onOpenSubscription }: PricingProps) {
  const router = useRouter();

  const openProofBuilder = () => {
    router.push(isAuthenticated() ? "/dashboard/bots" : "/signup");
  };

  return (
    <section className="relative bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8" id="projects">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
              <Github className="h-4 w-4" />
              Portfolio proof
            </div>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Three repos that make strangers take you seriously.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-white/64">
            The fastest reputation boost is public evidence. Each project needs code, setup instructions,
            screenshots, and a demo that proves you can ship more than notebooks.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <article key={project.name} className="border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-300 text-zinc-950">
                  <project.icon className="h-6 w-6" />
                </div>
                <span className="border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/48">
                  {project.tag}
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-black tracking-tight">{project.name}</h3>
              <div className="mt-6 space-y-3">
                {project.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div id="channels" className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="inline-flex items-center gap-2 border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
              <BadgeDollarSign className="h-4 w-4" />
              Money channels
            </div>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Aim where the income actually lives.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/64">
              Start with realistic entry contracts, then use each shipped project and client result to negotiate better.
              The page should make your next message easier to trust.
            </p>
            <Button
              onClick={openProofBuilder}
              className="mt-8 h-14 rounded-lg bg-white px-5 text-xs font-black uppercase tracking-[0.18em] text-zinc-950 hover:bg-emerald-200"
            >
              Open the app
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            {channels.map((channel) => (
              <article key={channel.name} className="grid gap-4 border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-[56px_1fr]">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 text-cyan-200">
                  <channel.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black">{channel.name}</h3>
                    <span className="border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      {channel.range}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/60">{channel.details}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
