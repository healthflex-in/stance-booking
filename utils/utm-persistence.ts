/**
 * UTM Parameter Persistence Utility
 * Captures UTM parameters on first page load and persists them throughout the booking session
 */

const UTM_STORAGE_KEY = 'booking_utm_params';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content'];

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_id?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Capture UTM parameters from URL and store in sessionStorage
 * Call this on app initialization
 */
export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;

  try {
    // Check if we already have UTM params stored
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      // Already captured, don't overwrite
      return;
    }

    // Extract UTM parameters from current URL
    const searchParams = new URLSearchParams(window.location.search);
    const utmParams: UTMParams = {};
    let hasUTM = false;

    UTM_KEYS.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        utmParams[key as keyof UTMParams] = value;
        hasUTM = true;
      }
    });

    // Store if we found any UTM parameters
    if (hasUTM) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
      console.log('📊 UTM parameters captured:', utmParams);
    }
  } catch (error) {
    console.error('Error capturing UTM parameters:', error);
  }
}

/**
 * Get stored UTM parameters
 * Returns null if no UTM parameters were captured
 */
export function getStoredUTMParams(): UTMParams | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving UTM parameters:', error);
  }

  return null;
}

/**
 * Get UTM parameters as URL query string
 * Returns empty string if no UTM parameters
 */
export function getUTMParamsString(): string {
  const utmParams = getStoredUTMParams();
  if (!utmParams) return '';

  const params = new URLSearchParams();
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  return params.toString();
}

/**
 * Clear stored UTM parameters
 * Call this after successful booking completion
 */
export function clearUTMParams(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
    console.log('📊 UTM parameters cleared');
  } catch (error) {
    console.error('Error clearing UTM parameters:', error);
  }
}

/**
 * Get current URL with UTM parameters appended
 * Useful for preserving UTM params in navigation
 */
export function getCurrentURLWithUTM(): string {
  if (typeof window === 'undefined') return '';

  const utmString = getUTMParamsString();
  if (!utmString) return window.location.href;

  const url = new URL(window.location.href);
  const utmParams = getStoredUTMParams();
  
  if (utmParams) {
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}
