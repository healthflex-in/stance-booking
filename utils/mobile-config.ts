/**
 * Mobile booking configuration - hardcoded values to avoid localStorage issues
 */

// Hardcoded mobile booking defaults
export const MOBILE_BOOKING_CONFIG = {
  DEFAULT_CENTER_ID: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '',
  DEFAULT_ORGANIZATION_ID: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '',
  API_KEY: process.env.NEXT_PUBLIC_API_KEY || ''
};

/**
 * Check if current route is mobile booking or org-based booking
 */
export function isMobileBookingRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  
  // Check for old booking routes
  if (path.includes('/onboarding-patient') || path.includes('/book') || path.includes('/book-prepaid')) {
    return true;
  }
  
  // Check for new org-based routes (e.g., /stance-health, /org-name)
  // These are booking routes that start with / followed by an org slug
  // Exclude protected routes like /dashboard, /profile, etc.
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/select-center', '/generate-link', '/login', '/signup'];
  const isProtected = protectedPaths.some(p => path.startsWith(p));
  
  // If it's not a protected route and not the root, it's likely an org booking route
  return !isProtected && path !== '/';
}

/**
 * Get center ID for mobile booking (hardcoded, no localStorage)
 */
export function getMobileCenterId(): string {
  return MOBILE_BOOKING_CONFIG.DEFAULT_CENTER_ID;
}

/**
 * Get organization ID for mobile booking (hardcoded, no localStorage)
 */
export function getMobileOrganizationId(): string {
  return MOBILE_BOOKING_CONFIG.DEFAULT_ORGANIZATION_ID;
}

/**
 * Get API key for mobile booking
 */
export function getMobileApiKey(): string {
  return MOBILE_BOOKING_CONFIG.API_KEY;
}