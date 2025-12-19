"use client";

import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { Pricing } from "./components/pricing";
import { Footer } from "./components/footer";
import { FloatingNav } from "./components/floating-nav";
import { TradingChart } from "./components/trading-chart";
import SubscriptionModal from "../components/ui/subscription-modal";

export default function Home() {
  const [isSubOpen, setIsSubOpen] = React.useState(false);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <TradingChart />

      <div className="relative z-10">
        <Hero onOpenSubscription={() => setIsSubOpen(true)} />
        <Features />
        <Pricing />
        <Footer />
      </div>

      <FloatingNav isHomePage={true} onOpenSubscription={() => setIsSubOpen(true)} />

      <SubscriptionModal
        open={isSubOpen}
        onClose={() => setIsSubOpen(false)}
      />
    </main>
  );
}
