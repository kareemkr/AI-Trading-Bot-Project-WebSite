"use client";

import { useState } from "react";
import { ArrowRight, Rocket, Activity, LineChart, Repeat, User } from "lucide-react";
import { toast } from "sonner";
import { ProfileModal } from "@/components/ui/profile-modal";

interface FloatingNavProps {
  onOpenSubscription?: () => void;
}

const navItems = [
  { name: "Live Bot", icon: Rocket, href: "/real-bots" },
  { name: "Demo Bot", icon: Activity, href: "/bots" },
  { name: "Markets", icon: LineChart, href: "/markets" },
  { name: "Trade", icon: Repeat, href: "/trade" },
  { name: "Profile", icon: User, href: "#profile" },
];

export function FloatingNav({ onOpenSubscription }: FloatingNavProps) {
  const [activeItem, setActiveItem] = useState("Demo Bot");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Helper to check access
  const handleProtectedNavigation = (name: string, href: string) => {
    // Special handling for Profile
    if (name === "Profile") {
        setIsProfileOpen(true);
        setActiveItem(name);
        return;
    }

    setActiveItem(name);

    const restricted = ["Trade"]; 
    if (!restricted.includes(name)) {
      window.location.href = href;
      return;
    }

    // Check Logic
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      toast.error("Access Denied", {
        description: "Please login or subscribe to access this feature.",
        duration: 4000,
        action: {
            label: "Login",
            onClick: () => window.location.href = "/signin"
        }
      });
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.subscription_status === "premium") {
        window.location.href = href; // Allow access
      } else {
        toast.warning("Premium Feature", {
          description: "You need an active subscription to access this.",
          action: {
            label: "Upgrade",
            onClick: () => onOpenSubscription?.(),
          },
        });
      }
    } catch {
      toast.error("Authentication Error", { description: "Please login again." });
    }
  };

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-white/20 bg-black/80 backdrop-blur-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-all hover:scale-[1.01]">
        {/* Logo */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-2 shadow-lg shadow-emerald-500/30">
          <span className="font-black text-white text-lg tracking-tighter">K</span>
        </div>

        {/* Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.href) {
                handleProtectedNavigation(item.name, item.href);
              } else {
                setActiveItem(item.name);
                onOpenSubscription?.();
              }
            }}
            className={`px-5 py-2.5 text-sm transition-all rounded-full flex items-center gap-2.5 font-medium relative overflow-hidden group ${
              activeItem === item.name
                ? "text-white bg-white/10 shadow-inner"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeItem === item.name ? "text-emerald-400" : ""}`} />
            {item.name}
          </button>
        ))}

        {/* Arrow Button */}
        <button className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center ml-2 hover:bg-white/20 transition-all border border-white/10 active:scale-95 group">
          <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <ProfileModal 
        open={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpgrade={onOpenSubscription}
      />
    </nav>
  );
}
