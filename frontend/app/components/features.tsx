"use client";

import { 
  Zap, 
  ShieldCheck, 
  LineChart, 
  BrainCircuit,
  Globe,
  Lock
} from "lucide-react";

const features = [
  {
    title: "Technical Chart Engine",
    description: "Our neural networks dive deep into historical and live chart data, identifying high-probability patterns with surgical precision.",
    icon: BrainCircuit,
    color: "text-accent"
  },
  {
    title: "News Sentiment Link",
    description: "A specialized bot that scans global headlines and social feeds, executing trades based on real-time market-moving news.",
    icon: Globe,
    color: "text-blue-400"
  },
  {
    title: "Secure Node Vault",
    description: "Military-grade encryption for your API keys. We never have withdrawal access to your funds. Your capital stays in your exchange.",
    icon: Lock,
    color: "text-purple-400"
  },
  {
    title: "Smart Strategies",
    description: "Choose from pre-built institutional-grade strategies or build your own with our visual editor.",
    icon: Zap,
    color: "text-yellow-400"
  },
  {
    title: "Deep Backtesting",
    description: "Test your strategies against 10 years of historical tick-level data before going live.",
    icon: LineChart,
    color: "text-emerald-400"
  },
  {
    title: "Risk Guards",
    description: "Advanced stop-loss and take-profit mechanisms that protect your capital in volatile markets.",
    icon: ShieldCheck,
    color: "text-red-400"
  }
];

export function Features() {
  return (
    <section className="py-24 px-6 relative overflow-hidden" id="features">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <Badge variant="outline" className="px-3 py-1 border-accent/30 text-accent bg-accent/5 text-[10px] uppercase tracking-widest font-bold">
            Capabilities
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Engineered for the 1%.</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
            I designed this infrastructure to bridge the gap between retail limitations and institutional power. 
            Every module is built with an obsession for performance and precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-card p-8 rounded-3xl border border-border/50 hover:border-accent/30 transition-all group flex flex-col gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed italic text-sm">
                "{feature.description}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Minimal Badge since it's locally needed or imported
function Badge({ children, className, variant }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
