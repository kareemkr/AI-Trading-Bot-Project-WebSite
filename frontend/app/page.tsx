import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/hero";

import { FloatingNav } from "./components/floating-nav";
import { TradingChart } from "./components/trading-chart";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <TradingChart />
      <Hero />
      <FloatingNav />
    </main>
  );
}
