/**
 * Authentication utilities for client-side route protection
 */

export interface User {
  id: string;
  email: string;
  name: string;
  subscription_status?: string;
  avatar?: string;
  wallet_address?: string;
  news_analysis_ai?: boolean;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user has premium/elite subscription
 */
export function isPremiumUser(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const status = user.subscription_status?.toLowerCase();
  return status === 'elite' || status === 'pro';
}

/**
 * Check if user has elite subscription
 */
export function isEliteUser(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const status = user.subscription_status?.toLowerCase();
  return status === 'elite' || status === 'pro';
}

/**
 * Get subscription tier
 */
export function getSubscriptionTier(): 'free' | 'pro' | 'elite' {
  const user = getCurrentUser();
  if (!user) return 'free';
  
  const status = user.subscription_status?.toLowerCase();
  if (status === 'elite') return 'elite';
  if (status === 'pro') return 'pro';
  return 'free';
}

/**
 * Route access levels
 */
export const ROUTE_ACCESS = {
  PUBLIC: ['/', '/signin', '/signup', '/oauth-success'],
  AUTHENTICATED: ['/dashboard', '/dashboard/demo', '/dashboard/market', '/dashboard/subscription', '/dashboard/settings'],
  PREMIUM: ['/dashboard/bots', '/real-bots', '/assistant'],
} as const;

/**
 * Check if route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  // Public routes don't require auth
  if (ROUTE_ACCESS.PUBLIC.some(route => pathname === route || pathname.startsWith(route))) {
    return false;
  }
  
  // All dashboard routes require auth
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/assistant') || pathname.startsWith('/real-bots')) {
    return true;
  }
  
  return false;
}

/**
 * Check if route requires premium subscription
 */
export function requiresPremium(pathname: string): boolean {
  return ROUTE_ACCESS.PREMIUM.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * Redirect to sign in
 */
export function redirectToSignIn() {
  if (typeof window !== 'undefined') {
    window.location.href = '/signin';
  }
}

/**
 * Redirect to subscription page
 */
export function redirectToSubscription() {
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard/subscription';
  }
}
