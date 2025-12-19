"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export function ThemeToggle({ compact, className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={cn(
          "w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 active:scale-95 group",
          className
        )}
        title={theme === "dark" ? "Switch to Luminous Mode" : "Switch to Neural Dark"}
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-accent group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 text-accent" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group",
        className
      )}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-5 h-5 text-accent group-hover:rotate-45 transition-transform" />
          <span>Luminous Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-accent" />
          <span>Neural Dark</span>
        </>
      )}
    </button>
  );
}
