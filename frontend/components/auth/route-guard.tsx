"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated, isPremiumUser, requiresAuth, requiresPremium } from "@/lib/auth";
import { Loader2, Lock, Zap } from "lucide-react";
import { toast } from "sonner";

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Route Guard Component
 * Protects routes based on authentication and subscription status
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Check if route requires authentication
      const needsAuth = requiresAuth(pathname);
      const needsPremium = requiresPremium(pathname);
      
      // Public route - allow access
      if (!needsAuth) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is authenticated
      const authenticated = isAuthenticated();
      
      if (!authenticated) {
        toast.error("Authentication Required", {
          description: "Please sign in to access this page.",
          duration: 4000,
        });
        router.push('/signin');
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Check if route requires premium subscription
      if (needsPremium) {
        const premium = isPremiumUser();
        
        if (!premium) {
          toast.error("Premium Access Required", {
            description: "This feature requires an Elite subscription.",
            duration: 4000,
            action: {
              label: "Upgrade",
              onClick: () => router.push('/dashboard/subscription')
            }
          });
          router.push('/dashboard');
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      }

      // User is authorized
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAccess();
  }, [pathname, router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
}
