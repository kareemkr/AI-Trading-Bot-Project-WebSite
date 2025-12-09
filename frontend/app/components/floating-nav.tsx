"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "Bots" },
  { label: "Markets", href: "/markets" },
  { label: "Trade" },
  { label: "Token" },
  { label: "AI Assistant", href: "/assistant" },
  ,
];

export function FloatingNav() {
  const [activeItem, setActiveItem] = useState("Trade");

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full border border-border/50 bg-card/80 backdrop-blur-md">
        {/* Logo */}
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center mr-2">
          <span className="font-bold text-accent-foreground text-lg">K</span>
        </div>

        {/* Navigation */}
        {navItems.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setActiveItem(item.label)}
              className={`px-4 py-2 text-sm transition-all rounded-full ${
                activeItem === item.label
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.label}
              onClick={() => setActiveItem(item.label)}
              className={`px-4 py-2 text-sm transition-all rounded-full ${
                activeItem === item.label
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          )
        )}

        {/* Arrow button */}
        <button className="w-10 h-10 rounded-full bg-accent flex items-center justify-center ml-2 hover:bg-accent/90 transition-colors">
          <ArrowRight className="w-5 h-5 text-accent-foreground" />
        </button>
      </div>
    </nav>
  );
}
