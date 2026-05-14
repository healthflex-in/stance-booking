/**
 * URL UTM Parameter Preserver
 * Ensures UTM parameters are preserved in URLs during navigation
 * This is the PROPER solution - keeping UTM params in the URL itself
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'ref'];

/**
 * Get current UTM parameters from URL
 */
export function getCurrentUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const searchParams = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  UTM_KEYS.forEach(key => {
    const value = searchParams.get(key);
    if (value) {
      utmParams[key] = value;
    }
  });

  return utmParams;
}

/**
 * Add UTM parameters to a URL
 * @param url - The URL to add UTM parameters to
 * @param utmParams - Optional UTM params to add (defaults to current URL params)
 */
export function addUTMToURL(url: string, utmParams?: Record<string, string>): string {
  try {
    const params = utmParams || getCurrentUTMParams();
    
    // If no UTM params, return original URL
    if (Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url, window.location.origin);
    
    // Add UTM parameters to URL (don't overwrite existing params)
    Object.entries(params).forEach(([key, value]) => {
      if (!urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, value);
      }
    });

    return urlObj.toString();
  } catch (error) {
    console.error('Error adding UTM to URL:', error);
    return url;
  }
}

/**
 * Get UTM parameters as query string
 */
export function getUTMQueryString(): string {
  const params = getCurrentUTMParams();
  if (Object.keys(params).length === 0) return '';

  const searchParams = new URLSearchParams(params);
  return searchParams.toString();
}

/**
 * Intercept Next.js router navigation to preserve UTM parameters
 * Call this in your app initialization
 */
export function setupUTMPreservation() {
  if (typeof window === 'undefined') return;

  // Store original pushState and replaceState
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // Override pushState to add UTM parameters
  window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
    if (url) {
      const utmParams = getCurrentUTMParams();
      if (Object.keys(utmParams).length > 0) {
        url = addUTMToURL(url.toString(), utmParams);
      }
    }
    return originalPushState.call(this, state, title, url);
  };

  // Override replaceState to add UTM parameters
  window.history.replaceState = function(state: any, title: string, url?: string | URL | null) {
    if (url) {
      const utmParams = getCurrentUTMParams();
      if (Object.keys(utmParams).length > 0) {
        url = addUTMToURL(url.toString(), utmParams);
      }
    }
    return originalReplaceState.call(this, state, title, url);
  };

  console.log('✅ UTM preservation enabled - UTM params will be preserved in URL during navigation');
}

/**
 * Hook for Next.js Link component
 * Usage: <Link href={preserveUTM('/next-page')}>Next</Link>
 */
export function preserveUTM(href: string): string {
  return addUTMToURL(href);
}

/**
 * React hook to get current UTM parameters
 */
export function useUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  return getCurrentUTMParams();
}
