"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="font-bold text-accent-foreground text-lg">K</span>
        </div>
        <span className="font-semibold text-foreground text-lg tracking-tight">
          KRO
        </span>
      </div>

      {/* Sign In Button */}
      <Link
        href="/signin"
        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        Sign in
      </Link>
    </header>
  );
}
