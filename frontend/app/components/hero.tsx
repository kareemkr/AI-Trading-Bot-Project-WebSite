"use client";

import Image from "next/image";
import { ArrowRight, BadgeDollarSign, BrainCircuit, Github, Globe2, Rocket } from "lucide-react";
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
    <section className="relative isolate min-h-[92svh] overflow-hidden px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      <Image
        src="/breakout-hero.png"
        alt="Software engineer building cloud AI systems from Cairo"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,10,14,0.96)_0%,rgba(5,10,14,0.82)_42%,rgba(5,10,14,0.34)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent" />

      <div className="mx-auto flex min-h-[calc(92svh-10rem)] max-w-7xl items-center">
        <div className="max-w-3xl text-white">
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
