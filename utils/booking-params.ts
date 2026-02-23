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
