/**
 * Booking Cookie Management
 * Handles organization and center context via cookies
 * Cookies are preferred over localStorage for SSR compatibility
 */

export interface BookingCookies {
  organizationId: string | null;
  centerId: string | null;
  orgSlug: string | null;
  centerSlug: string | null;
}

const COOKIE_NAMES = {
  ORG_ID: 'booking-organizationId',
  CENTER_ID: 'booking-centerId',
  ORG_SLUG: 'booking-orgSlug',
  CENTER_SLUG: 'booking-centerSlug',
} as const;

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Set a cookie
 */
function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Get a cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

/**
 * Delete a cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Set all booking cookies
 */
export function setBookingCookies(
  organizationId: string,
  centerId: string,
  orgSlug: string,
  centerSlug?: string
): void {
  setCookie(COOKIE_NAMES.ORG_ID, organizationId);
  setCookie(COOKIE_NAMES.CENTER_ID, centerId);
  setCookie(COOKIE_NAMES.ORG_SLUG, orgSlug);
  if (centerSlug) {
    setCookie(COOKIE_NAMES.CENTER_SLUG, centerSlug);
  }
  
  // Also set in localStorage for backward compatibility
  if (typeof window !== 'undefined') {
    localStorage.setItem('booking-organizationId', organizationId);
    localStorage.setItem('booking-centerId', centerId);
    localStorage.setItem('booking-orgSlug', orgSlug);
    if (centerSlug) {
      localStorage.setItem('booking-centerSlug', centerSlug);
    }
    
    // Set old keys for backward compatibility
    localStorage.setItem('stance-organizationID', organizationId);
    localStorage.setItem('stance-centreID', centerId);
    localStorage.setItem('organizationId', organizationId);
    localStorage.setItem('centerId', centerId);
  }
}

/**
 * Get all booking cookies
 */
export function getBookingCookies(): BookingCookies {
  // Try cookies first
  const orgId = getCookie(COOKIE_NAMES.ORG_ID);
  const centerId = getCookie(COOKIE_NAMES.CENTER_ID);
  const orgSlug = getCookie(COOKIE_NAMES.ORG_SLUG);
  const centerSlug = getCookie(COOKIE_NAMES.CENTER_SLUG);
  
  // Debug logging
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true') {
    console.log('[Cookies] Reading booking cookies:', {
      orgId: orgId ? `${orgId.substring(0, 8)}...` : 'null',
      centerId: centerId ? `${centerId.substring(0, 8)}...` : 'null',
      orgSlug,
      source: 'cookies'
    });
  }
  
  // If cookies exist, return them
  if (orgId && centerId) {
    return {
      organizationId: orgId,
      centerId,
      orgSlug,
      centerSlug,
    };
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const lsOrgId = localStorage.getItem('booking-organizationId') || 
                    localStorage.getItem('stance-organizationID') ||
                    localStorage.getItem('organizationId');
    const lsCenterId = localStorage.getItem('booking-centerId') ||
                       localStorage.getItem('stance-centreID') ||
                       localStorage.getItem('centerId');
    const lsOrgSlug = localStorage.getItem('booking-orgSlug');
    const lsCenterSlug = localStorage.getItem('booking-centerSlug');
    
    if (lsOrgId && lsCenterId) {
      // Sync to cookies
      if (lsOrgId && lsCenterId && lsOrgSlug) {
        setBookingCookies(lsOrgId, lsCenterId, lsOrgSlug, lsCenterSlug || undefined);
      }
      
      return {
        organizationId: lsOrgId,
        centerId: lsCenterId,
        orgSlug: lsOrgSlug,
        centerSlug: lsCenterSlug,
      };
    }
  }
  
  // No cookies or localStorage
  return {
    organizationId: null,
    centerId: null,
    orgSlug: null,
    centerSlug: null,
  };
}

/**
 * Clear all booking cookies
 */
export function clearBookingCookies(): void {
  deleteCookie(COOKIE_NAMES.ORG_ID);
  deleteCookie(COOKIE_NAMES.CENTER_ID);
  deleteCookie(COOKIE_NAMES.ORG_SLUG);
  deleteCookie(COOKIE_NAMES.CENTER_SLUG);
  
  // Also clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('booking-organizationId');
    localStorage.removeItem('booking-centerId');
    localStorage.removeItem('booking-orgSlug');
    localStorage.removeItem('booking-centerSlug');
  }
}

/**
 * Set organization cookie
 */
export function setOrganizationCookie(organizationId: string, orgSlug: string): void {
  setCookie(COOKIE_NAMES.ORG_ID, organizationId);
  setCookie(COOKIE_NAMES.ORG_SLUG, orgSlug);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('booking-organizationId', organizationId);
    localStorage.setItem('booking-orgSlug', orgSlug);
    localStorage.setItem('stance-organizationID', organizationId);
    localStorage.setItem('organizationId', organizationId);
  }
}

/**
 * Set center cookie
 */
export function setCenterCookie(centerId: string, centerSlug?: string): void {
  setCookie(COOKIE_NAMES.CENTER_ID, centerId);
  if (centerSlug) {
    setCookie(COOKIE_NAMES.CENTER_SLUG, centerSlug);
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('booking-centerId', centerId);
    if (centerSlug) {
      localStorage.setItem('booking-centerSlug', centerSlug);
    }
    localStorage.setItem('stance-centreID', centerId);
    localStorage.setItem('centerId', centerId);
  }
}

/**
 * Get organization ID from cookie or localStorage
 */
export function getOrganizationId(): string | null {
  const cookies = getBookingCookies();
  return cookies.organizationId;
}

/**
 * Get center ID from cookie or localStorage
 */
export function getCenterId(): string | null {
  const cookies = getBookingCookies();
  return cookies.centerId;
}

