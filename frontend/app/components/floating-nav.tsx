"use client";

import { useState } from "react";
import { ArrowRight, Rocket, Activity, LineChart, User } from "lucide-react";
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
                    label: "Sign In",
                    onClick: () => window.location.href = "/signin"
                }
            });
            return;
        }
        setIsProfileOpen(true);
        return;
    }

    // If on homepage, restrict access unless subscribed (or navigating to Demo)
    if (isHomePage) {
      if (name === t.nav.demo_bot) {
        window.location.href = href;
        return;
      }
      
      // If user is NOT subscribed, show modal and block access
      if (!isPremiumUser() && onOpenSubscription) {
        onOpenSubscription();
        return;
      }
    }

    // Check authentication requirement
    if (requiresAuth && !isAuthenticated()) {
      toast.error("Authentication Required", {
        description: "Please sign in to access this feature.",
        duration: 4000,
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/signin"
        }
      });
      return;
    }

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
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-border/40 bg-card/80 backdrop-blur-2xl shadow-2xl shadow-black/10 ring-1 ring-white/5 transition-all hover:scale-[1.01]">
        {/* Logo */}
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-lg shadow-accent/10">
          <img src="/neural-logo.png" className="w-full h-full object-cover scale-150" alt="Neural Flow Logo" />
        </div>

        {/* Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              handleProtectedNavigation(item.name, item.href, item.requiresAuth, item.requiresPremium);
            }}
            className={`px-5 py-2.5 text-sm transition-all rounded-full flex items-center gap-2.5 font-black uppercase tracking-widest relative overflow-hidden group ${
              activeItem === item.name
                ? "text-foreground bg-accent/10 shadow-inner"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeItem === item.name ? "text-accent" : ""}`} />
            <span className="opacity-80">{item.name}</span>
          </button>
        ))}

        {/* Theme Toggle */}
        <div className="ml-1 pr-1 border-l border-white/10 pl-2">
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
