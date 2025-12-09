"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LineChart, Heart, Settings } from "lucide-react";

const links = [
  { href: "/markets", label: "Markets", icon: LineChart },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border px-6 py-8 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
          <Bot className="w-6 h-6 text-accent-foreground" />
        </div>
        <h1 className="text-xl font-semibold">KRO Trader</h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          const Icon = l.icon;

          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  active
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/40"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-10 text-xs text-muted-foreground opacity-70">
        © 2025 KRO.ai
      </div>
    </aside>
  );
}
