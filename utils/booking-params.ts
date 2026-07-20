'use client';

import { tabStorage } from './tab-storage';

/**
 * Booking parameter utilities for parsing URL params, persisting to
 * tab-isolated storage, and reading them back.
 *
 * These mirror the BookingParams interface used by the Dashboard's
 * booking-link-utils so that data round-trips cleanly between the two apps.
 * 
 * Uses tab-isolated storage to prevent conflicts when multiple tabs are open.
 */

export interface BookingParams {
  patientId?: string;
  centerId?: string;
  serviceId?: string;
  consultantId?: string;
  consultantType?: string;    // "Physiotherapist" | "S&C Coach"
  paymentType?: string;       // "full" | "partial" | "null" | "token"
  partialAmount?: string;
  slotStart?: string;         // Unix timestamp as string
  slotEnd?: string;           // Unix timestamp as string
  slotDate?: string;          // Date in YYYY-MM-DD format (alternative to slotStart/slotEnd)
  treatmentPrice?: string;    // Integer as string
  treatmentDuration?: string; // Minutes as string
  assessmentType?: string;    // "in-person" | "online"
  isNewUserService?: string;  // "true" | "false"
  // ── Web attribution (forwarded from stance-health via buildTrackedUrl) ────
  anonymous_id?: string;      // Stance permanent visitor ID
  session_id?: string;        // 30-min session ID
  ga_client_id?: string;      // GA4 client id
  fbp?: string;               // Meta browser id
  fbc?: string;               // Meta click id
  gcl_au?: string;            // Google Ads conversion linker
}

export const RECOGNIZED_KEYS: (keyof BookingParams)[] = [
  'patientId',
  'centerId',
  'serviceId',
  'consultantId',
  'consultantType',
  'paymentType',
  'partialAmount',
  'slotStart',
  'slotEnd',
  'slotDate',
  'treatmentPrice',
  'treatmentDuration',
  'assessmentType',
  'isNewUserService',
  // web attribution
  'anonymous_id',
  'session_id',
  'ga_client_id',
  'fbp',
  'fbc',
  'gcl_au',
];

/**
 * Extracts recognised booking keys from a URLSearchParams instance.
 * Unrecognised keys are silently ignored and empty-string values are
 * treated as missing (omitted from the result).
 */
export function parseBookingParams(searchParams: URLSearchParams): BookingParams {
  const result: BookingParams = {};

  for (const key of RECOGNIZED_KEYS) {
    const value = searchParams.get(key);
    if (value !== null && value !== '') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Persists every non-empty field of a BookingParams object into
 * tab-isolated storage. Wrapped in try/catch so private-browsing or
 * storage-full scenarios don't crash the app.
 * Also sets a flag to indicate data came from URL params.
 * Also captures UTM params and the original landing URL before the URL gets cleaned up.
 */
export function storeBookingParamsInSession(params: BookingParams): void {
  if (typeof window === 'undefined') return;

  try {
    // Set a flag to indicate these params came from URL
    tabStorage.setItem('paramsSource', 'url');
    
    for (const key of RECOGNIZED_KEYS) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        tabStorage.setItem(key, value);
      }
    }
  } catch {
    // storage may be unavailable in private browsing – silently ignore
  }

  // Capture UTM params from the current URL before it gets cleaned up
  captureUTMParams();
}

const UTM_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_id',
  'utm_term', 'utm_content', 'utm_adgroup', 'utm_matchtype',
  'utm_device', 'utm_network', 'placement', 'asset_id',
] as const;

/**
 * Reads UTM params from the current URL and from localStorage ("stance_tracking"),
 * persists them to tab storage, and writes to stance_tracking.
 * Should be called on every page entry before any router.replace() strips the query string.
 * Existing values are NOT overwritten so first-touch attribution is preserved.
 */
export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Collect UTMs from the URL
    const fromUrl: Partial<Record<typeof UTM_KEYS[number], string>> = {};
    for (const key of UTM_KEYS) {
      const val = urlParams.get(key);
      if (val) fromUrl[key] = val;
    }

    // 2. Merge into stance_tracking (localStorage) — URL wins over stored
    let tracking: Record<string, string> = {};
    try {
      const raw = window.localStorage.getItem('stance_tracking');
      if (raw) tracking = JSON.parse(raw);
    } catch { /* ignore */ }

    let updated = false;
    for (const key of UTM_KEYS) {
      const urlVal = fromUrl[key];
      if (urlVal && !tracking[key]) {
        tracking[key] = urlVal;
        updated = true;
      }
    }
    if (updated) {
      try { window.localStorage.setItem('stance_tracking', JSON.stringify(tracking)); } catch { /* quota */ }
    }

    // 3. Build serialised UTM string from the merged tracking data (all UTMs)
    const parts: string[] = [];
    for (const key of UTM_KEYS) {
      const val = tracking[key];
      if (val) parts.push(`${key}=${encodeURIComponent(val)}`);
    }
    if (parts.length > 0) {
      tabStorage.setItem('utm_params', parts.join('&'));
    }

    // 4. Capture original landing URL once (first-touch wins)
    if (!tabStorage.getItem('booking_landing_url')) {
      tabStorage.setItem('booking_landing_url', window.location.href);
    }
  } catch {
    // storage unavailable – silently ignore
  }
}

/**
 * Returns a serialised UTM param string built from localStorage ("stance_tracking").
 * This is the source of truth — captureTrackingParams() writes ALL UTMs there
 * on every page load and they survive router.replace() stripping the URL.
 *
 * Falls back to tabStorage ("utm_params") for backward compatibility.
 * Returns null if no UTM params exist anywhere.
 */
export function getStoredUTMParams(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Primary: localStorage "stance_tracking" — has all UTMs written by captureTrackingParams()
    const raw = window.localStorage.getItem('stance_tracking');
    if (raw) {
      const tracking = JSON.parse(raw) as Record<string, string>;
      const parts: string[] = [];
      for (const key of UTM_KEYS) {
        const val = tracking[key];
        if (val) parts.push(`${key}=${encodeURIComponent(val)}`);
      }
      if (parts.length > 0) return parts.join('&');
    }
    // Fallback: tabStorage (written by captureUTMParams when UTMs are in the URL)
    return tabStorage.getItem('utm_params');
  } catch {
    return null;
  }
}

/**
 * Returns the original booking landing URL.
 * Reads from localStorage "stance_tracking" first (written by captureTrackingParams),
 * falls back to tabStorage for backward compatibility.
 */
export function getBookingLandingUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('stance_tracking');
    if (raw) {
      const tracking = JSON.parse(raw) as Record<string, string>;
      if (tracking.landing_page) return tracking.landing_page;
    }
    return tabStorage.getItem('booking_landing_url');
  } catch {
    return null;
  }
}

/**
 * Reads previously-stored booking params back from tab-isolated storage.
 * Returns a BookingParams object containing only the keys that have
 * non-empty values in storage.
 */
export function getBookingParamsFromSession(): BookingParams {
  if (typeof window === 'undefined') return {};

  const result: BookingParams = {};

  try {
    for (const key of RECOGNIZED_KEYS) {
      const value = tabStorage.getItem(key);
      if (value !== null && value !== '') {
        result[key] = value;
      }
    }
  } catch {
    // storage may be unavailable – return whatever we have so far
  }

  return result;
}

/**
 * Checks if a specific parameter came from URL params (and should be locked)
 * vs being set during normal booking flow (should not be locked).
 */
export function isParamFromUrl(paramKey: keyof BookingParams): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const paramsSource = tabStorage.getItem('paramsSource');
    const paramValue = tabStorage.getItem(paramKey);
    
    // Only lock if:
    // 1. The param exists in tab storage
    // 2. The paramsSource flag is set to 'url'
    return paramsSource === 'url' && paramValue !== null && paramValue !== '';
  } catch {
    return false;
  }
}
