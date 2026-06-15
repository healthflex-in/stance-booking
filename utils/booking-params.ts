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

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content'] as const;

/**
 * Reads UTM params from the current URL and persists them to tab storage.
 * Should be called on every page entry before any router.replace() strips the query string.
 * Existing values are NOT overwritten so the first-touch attribution is preserved.
 */
export function captureUTMParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const parts: string[] = [];
    for (const key of UTM_KEYS) {
      const val = urlParams.get(key);
      if (val) parts.push(`${key}=${encodeURIComponent(val)}`);
    }
    // Only write if we have fresh UTM data — don't wipe a previously captured value
    if (parts.length > 0) {
      tabStorage.setItem('utm_params', parts.join('&'));
    }
    // Capture original landing URL once (first-touch wins)
    if (!tabStorage.getItem('booking_landing_url')) {
      tabStorage.setItem('booking_landing_url', window.location.href);
    }
  } catch {
    // storage unavailable – silently ignore
  }
}

/**
 * Returns a serialised UTM param string from tab storage (same format as query string).
 * Returns null if no UTM params were captured.
 */
export function getStoredUTMParams(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return tabStorage.getItem('utm_params');
  } catch {
    return null;
  }
}

/**
 * Returns the original booking landing URL captured on first entry.
 */
export function getBookingLandingUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
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
