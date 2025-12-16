"use client";

import * as React from "react";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { FloatingNav } from "./components/floating-nav";
import { TradingChart } from "./components/trading-chart";
import SubscriptionModal from "../components/ui/subscription-modal";

export default function Home() {
  const [isSubOpen, setIsSubOpen] = React.useState(false);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Header />
      <TradingChart />

      <Hero onOpenSubscription={() => setIsSubOpen(true)} />

      <FloatingNav onOpenSubscription={() => setIsSubOpen(true)} />

      <SubscriptionModal
        open={isSubOpen}
        onClose={() => setIsSubOpen(false)}
      />
    </main>
  );
}
