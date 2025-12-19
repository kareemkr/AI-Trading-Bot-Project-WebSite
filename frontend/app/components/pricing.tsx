"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring AI trading.",
    features: [
      "1 Active Bot Instance",
      "Daily Market Analysis",
      "Standard Latency",
      "Email Support",
      "Basic Strategies"
    ],
    buttonText: "Start Free",
    premium: false
  },
  {
    name: "Pro",
    price: "$49",
    description: "For serious individual traders.",
    features: [
      "Unlimited Bot Instances",
      "Real-time AI Assistant",
      "Ultra-low Latency",
      "Priority API Access",
      "Advanced Risk Management",
      "Discord Community Access"
    ],
    buttonText: "Join Pro",
    premium: true,
    highlight: true
  },
  {
    name: "Enterprise",
    price: "$299",
    description: "Custom solutions for teams.",
    features: [
      "Everything in Pro",
      "Custom Strategy Building",
      "Team Management",
      "Dedicated Representative",
      "SLA Guarantee",
      "On-premise Options"
    ],
    buttonText: "Contact Sales",
    premium: false
  }
];

export function Pricing() {
  return (
    <section className="py-24 px-6 relative" id="pricing">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Choose Your Deployment.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
            Whether you're testing the waters or deploying deep capital, I've built a tier that fits your ambition. No hidden fees, just raw performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative bg-card p-10 rounded-3xl border transition-all flex flex-col ${
                plan.highlight 
                  ? "border-accent ring-2 ring-accent/20 scale-105 z-10 shadow-2xl shadow-accent/10" 
                  : "border-border/50 hover:border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-accent/10 text-accent">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => window.location.href = "/signup"}
                className={`w-full py-7 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all ${
                  plan.highlight 
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20" 
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
