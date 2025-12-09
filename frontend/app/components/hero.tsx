import * as React from "react";
import { ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="mb-8 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm flex items-center gap-2">
        <Rocket className="w-4 h-4 text-accent" />
        <span className="text-sm text-muted-foreground">Trading Bots</span>
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground max-w-3xl leading-tight text-balance mb-6">
        The Fastest and Secure
        <br />
        AI Trading Assistant.
      </h1>

      <p className="text-muted-foreground max-w-xl text-base md:text-lg mb-8 text-pretty">
        Trade faster and smarter with our secure AI bots. Maximize your
        investments with real-time insights and automation.
      </p>

      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 rounded-full text-base font-medium group">
        Try Free Trial
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </section>
  );
}
