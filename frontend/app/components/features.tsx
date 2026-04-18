"use client";

import {
  AlertTriangle,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Route,
  ServerCog,
  Trophy,
} from "lucide-react";

const tracks = [
  {
    title: "Backend + Cloud",
    note: "Most stable path",
    stack: "Java, Spring Boot, PostgreSQL, Docker, AWS",
    icon: ServerCog,
  },
  {
    title: "AI + Data",
    note: "Your edge",
    stack: "Python, ML, deep learning, FastAPI, applied models",
    icon: BrainCircuit,
  },
  {
    title: "Full Stack",
    note: "Fast freelance money",
    stack: "React, Node.js, APIs, deployable product UX",
    icon: Code2,
  },
];

const roadmap = [
  {
    step: "00",
    title: "Understand the game",
    body: "Big income comes from top local companies, remote work, or relocation. The fastest upside is remote USD work.",
  },
  {
    step: "01",
    title: "Pick one high-income lane",
    body: "For this profile, AI plus backend is the power combo: models are impressive, APIs make them usable, deployment makes them real.",
  },
  {
    step: "02",
    title: "Build three portfolio killers",
    body: "Ship an AI use case, a real backend system, and one AI web app with a live demo, screenshots, and a README that sells the work.",
  },
  {
    step: "03",
    title: "Make GitHub hireable",
    body: "Keep only strong repos visible: clean code, clear architecture, screenshots, setup steps, and short demo videos when possible.",
  },
  {
    step: "04",
    title: "Enter money channels",
    body: "Apply through LinkedIn, Upwork, Toptal-style networks, and Gulf recruiters. Start small, then compound proof into better contracts.",
  },
  {
    step: "05",
    title: "Learn the money skills",
    body: "Git, REST APIs, SQL, Docker, cloud basics, and system design. These make you useful on teams, not just good in tutorials.",
  },
  {
    step: "06",
    title: "Run the timeline",
    body: "Months 0-2: one serious project. Months 3-5: three polished repos. Month 6+: first remote income attempts. Month 9-12: scale.",
  },
];

const mistakes = [
  "Tutorial-only progress",
  "Empty or messy GitHub",
  "No deployed demos",
  "Waiting for graduation",
];

export function Features() {
  return (
    <section id="roadmap" className="relative overflow-hidden bg-background px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-500">
              <Route className="h-4 w-4" />
              No random grinding
            </div>
            <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              One lane, three proofs, public execution.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              This roadmap turns ambition into visible leverage. The goal is not to look busy.
              The goal is to look expensive to hire because the work is specific, shipped, and easy to inspect.
            </p>

            <div className="mt-8 grid gap-3">
              {tracks.map((track) => (
                <div key={track.title} className="grid grid-cols-[48px_1fr] gap-4 border border-border bg-card p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-emerald-500">
                    <track.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black uppercase tracking-tight">{track.title}</h3>
                      <span className="border border-border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                        {track.note}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{track.stack}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {roadmap.map((item) => (
              <article key={item.step} className="grid gap-4 border border-border bg-card p-5 sm:grid-cols-[88px_1fr]">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-950 text-xl font-black text-emerald-300 dark:bg-white dark:text-zinc-950">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-6 border-y border-border py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-2xl font-black tracking-tight">Avoid the traps</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The market rewards proof, not potential. Cut the moves that make you feel productive without changing your public evidence.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {mistakes.map((mistake) => (
              <div key={mistake} className="flex items-center gap-3 border border-border bg-secondary/50 p-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-bold">{mistake}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: GitBranch, label: "GitHub", value: "Clean commits, real READMEs" },
            { icon: Database, label: "SQL", value: "Data models recruiters trust" },
            { icon: Cloud, label: "Cloud", value: "Deployed apps beat screenshots" },
          ].map((item) => (
            <div key={item.label} className="border border-border bg-card p-5">
              <item.icon className="h-6 w-6 text-cyan-500" />
              <div className="mt-5 text-lg font-black">{item.label}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
