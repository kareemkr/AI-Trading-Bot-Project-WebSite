"use client";

import { ArrowRight, BrainCircuit, Code2, Github, Globe2, Rocket, ServerCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

interface HeroProps {
  onOpenSubscription?: () => void;
}

const proofStats = [
  { value: "50K+ EGP", label: "Local target" },
  { value: "$3K-$5K", label: "Remote ceiling" },
  { value: "3 Projects", label: "Portfolio proof" },
];

export function Hero({ onOpenSubscription: _onOpenSubscription }: HeroProps) {
  const router = useRouter();

  const openBuilder = () => {
    router.push(isAuthenticated() ? "/dashboard" : "/signup");
  };

  return (
    <section className="relative isolate min-h-[92svh] overflow-hidden bg-zinc-950 px-4 pt-28 pb-12 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="mx-auto grid min-h-[calc(92svh-10rem)] max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200 backdrop-blur-md">
            <Rocket className="h-4 w-4" />
            Egypt to remote income
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl lg:text-8xl">
            AI Backend Breakout Roadmap
          </h1>

          <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-white/78 sm:text-lg">
            A focused path for becoming hireable fast: build real AI systems, wrap them in backend APIs,
            publish clean proof, and aim for remote USD work before the market forgets your classmates exist.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={openBuilder}
              className="h-14 rounded-lg bg-emerald-400 px-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 hover:bg-emerald-300"
            >
              Start the build
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a
              href="#roadmap"
              className="inline-flex h-14 items-center justify-center rounded-lg border border-white/18 bg-white/10 px-6 text-sm font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white/16"
            >
              See roadmap
            </a>
          </div>

          <div className="mt-12 grid max-w-3xl grid-cols-1 border-y border-white/14 sm:grid-cols-3">
            {proofStats.map((stat) => (
              <div key={stat.label} className="border-white/14 py-5 sm:border-r sm:px-5 sm:last:border-r-0">
                <div className="text-2xl font-black tracking-tight text-white">{stat.value}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/54">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] lg:min-h-[620px]" aria-label="AI backend roadmap command center">
          <div className="absolute left-0 top-8 w-[72%] border border-white/12 bg-zinc-900/92 p-4 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">portfolio.sh</span>
            </div>
            <div className="space-y-4 pt-5 font-mono text-xs text-white/70 sm:text-sm">
              {[
                "$ build ai-model --real-use-case",
                "$ expose --api fastapi --db postgres",
                "$ docker compose up --production",
                "$ publish github --readme --screens",
              ].map((line, index) => (
                <div key={line} className="flex items-center gap-3">
                  <span className="text-emerald-300">0{index + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-0 top-0 w-[52%] border border-emerald-300/24 bg-emerald-300 p-5 text-zinc-950 shadow-2xl shadow-emerald-950/30">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">Target</div>
            <div className="mt-3 text-4xl font-black tracking-tight">$3K+</div>
            <p className="mt-2 text-sm font-bold leading-6 opacity-75">Remote-ready proof, not tutorial screenshots.</p>
          </div>

          <div className="absolute bottom-24 left-8 w-[58%] border border-white/12 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Skill Stack</div>
                <div className="mt-2 text-xl font-black">AI + Backend Combo</div>
              </div>
              <BrainCircuit className="h-8 w-8 text-cyan-200" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "ML", icon: BrainCircuit },
                { label: "API", icon: ServerCog },
                { label: "Code", icon: Code2 },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 bg-black/24 p-3 text-center">
                  <item.icon className="mx-auto h-5 w-5 text-emerald-300" />
                  <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/62">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-6 right-6 w-[54%] border border-white/12 bg-zinc-900/90 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Roadmap velocity</span>
              <span className="text-sm font-black text-emerald-300">Month 0-6</span>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2">
              {[34, 48, 42, 66, 74, 92, 86, 100].map((height, index) => (
                <div key={index} className="flex-1 bg-emerald-300/20">
                  <div className="mt-auto bg-emerald-300" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 text-white sm:grid-cols-3">
        {[
          { icon: BrainCircuit, label: "AI + Deep Learning", text: "Models that solve visible problems" },
          { icon: Globe2, label: "Backend + Cloud", text: "APIs, Docker, databases, deployment" },
          { icon: Github, label: "Public Proof", text: "README, screenshots, demos, credibility" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 border border-white/10 bg-black/24 p-4 backdrop-blur-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-zinc-950">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.14em]">{item.label}</div>
              <p className="mt-1 text-sm text-white/60">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
