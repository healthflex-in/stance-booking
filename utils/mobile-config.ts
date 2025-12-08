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
 * Check if current route is mobile booking
 */
export function isMobileBookingRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes('/onboarding-patient');
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