"use client";

import { useState } from "react";
import { Rocket, Activity, LineChart, User, BrainCircuit, Github as GithubIcon } from "lucide-react";
import { toast } from "sonner";
import { ProfileModal } from "@/components/ui/profile-modal";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { isAuthenticated, isPremiumUser, getCurrentUser } from "@/lib/auth";
import { useLanguage } from "@/lib/language-context";

interface FloatingNavProps {
  onOpenSubscription?: () => void;
  isHomePage?: boolean;
}

export function FloatingNav({ onOpenSubscription, isHomePage = false }: FloatingNavProps) {
  const [activeItem, setActiveItem] = useState("Demo Bot");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t } = useLanguage();

  if (isHomePage) {
    const homeItems = [
      { name: "Roadmap", icon: Activity, href: "#roadmap" },
      { name: "Projects", icon: GithubIcon, href: "#projects" },
      { name: "Channels", icon: LineChart, href: "#channels" },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 w-full sm:bottom-8 sm:left-1/2 sm:w-auto sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2">
        <div className="flex items-center justify-between gap-1.5 border-t border-white/5 bg-black/60 px-4 py-3 backdrop-blur-md sm:mx-auto sm:w-fit sm:justify-start sm:gap-3 sm:overflow-x-auto sm:rounded-lg sm:border sm:border-border/40 sm:bg-card/90 sm:px-3 sm:py-2.5 sm:shadow-2xl sm:shadow-black/10">
          <div className="hidden h-11 w-11 items-center justify-center rounded-lg bg-black text-accent sm:flex">
            <BrainCircuit className="h-6 w-6" />
          </div>
          {homeItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10 hover:text-white sm:flex-none sm:px-4"
            >
              <item.icon className="h-4 w-4 text-accent" />
              <span className="hidden sm:block">{item.name}</span>
            </a>
          ))}
          <div className="ml-1 border-l border-white/10 pl-2 sm:ml-2 sm:pl-3">
            <ThemeToggle compact />
          </div>
        </div>
      </nav>
    );
  }

  const navItems = [
    { name: t.nav.live_bot, icon: Rocket, href: "/dashboard/bots", requiresAuth: true, requiresPremium: true },
    { name: t.nav.demo_bot, icon: Activity, href: "/dashboard/demo", requiresAuth: false, requiresPremium: false },
    { name: t.nav.market, icon: LineChart, href: "/dashboard/market", requiresAuth: false, requiresPremium: false },
    { name: t.nav.profile, icon: User, href: "#profile", requiresAuth: true, requiresPremium: false },
  ];

  // Helper to check access
  const handleProtectedNavigation = (name: string, href: string, requiresAuth: boolean, requiresPremium: boolean) => {
    setActiveItem(name);

    // Special handling for Profile
    // We check if name matches the translated "Profile" string
    if (name === t.nav.profile) {
        if (!isAuthenticated()) {
            toast.error("Authentication Required", {
                description: "Please sign in to view your profile.",
                duration: 4000,
                action: {
                    label: "Sign Up",
                    onClick: () => window.location.href = "/signup"
                }
            });
            return;
        }
        setIsProfileOpen(true);
        return;
    }

    // Auth check first - everything clicked on refers to signup page when not signed in
    if (!isAuthenticated()) {
      toast.error("Authentication Required", {
        description: "Please sign up to access the ecosystem features.",
        duration: 4000,
        action: {
          label: "Sign Up",
          onClick: () => window.location.href = "/signup"
        }
      });
      return;
    }

    // From here on, user is authenticated
    // Check premium requirement
    if (requiresPremium && !isPremiumUser()) {
      toast.error("Elite Access Required", {
        description: "This feature requires an Elite subscription.",
        duration: 4000,
        action: {
          label: "Upgrade",
          onClick: () => {
            if (onOpenSubscription) {
              onOpenSubscription();
            } else {
              window.location.href = "/dashboard/subscription";
            }
          }
        }
      });
      return;
    }

    // Navigate to the page
    window.location.href = href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:max-w-[calc(100vw-2rem)]">
      <div className="flex items-center justify-between sm:justify-start sm:w-fit sm:mx-auto gap-1.5 sm:gap-4 px-6 sm:px-0 py-4 sm:py-2.5 backdrop-blur-md bg-black/40 border-t border-white/5 sm:border sm:border-border/40 sm:bg-card/80 sm:backdrop-blur-2xl sm:shadow-2xl sm:shadow-black/10 sm:ring-1 sm:ring-white/5 sm:transition-all sm:hover:scale-[1.01] sm:overflow-x-auto sm:no-scrollbar sm:rounded-full">
        {/* Logo - Hidden on mobile, visible on desktop */}
        <div className="hidden sm:flex w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-accent/10 items-center justify-center bg-black">
          <BrainCircuit className="w-6 h-6 text-accent" />
        </div>

        {/* Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              handleProtectedNavigation(item.name, item.href, item.requiresAuth, item.requiresPremium);
            }}
            className={`flex-1 sm:flex-none justify-center px-1 sm:px-5 py-1 sm:py-2.5 text-sm transition-all rounded-lg sm:rounded-full flex items-center gap-2.5 font-black uppercase tracking-widest relative overflow-hidden group ${
              activeItem === item.name
                ? "text-foreground sm:bg-accent/10 sm:shadow-inner"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <item.icon className={`w-5 h-5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${activeItem === item.name ? "text-accent" : ""}`} />
            <span className="opacity-80 hidden sm:block">{item.name}</span>
          </button>
        ))}

        {/* Theme Toggle */}
        <div className="ml-4 border-l border-white/10 pl-4">
            <ThemeToggle compact />
        </div>
      </div>

      <ProfileModal 
        open={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpgrade={onOpenSubscription}
      />
    </nav>
  );
}
