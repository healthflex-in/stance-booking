'use client';

/**
 * Booking parameter utilities for parsing URL params, persisting to
 * sessionStorage, and reading them back.
 *
 * These mirror the BookingParams interface used by the Dashboard's
 * booking-link-utils so that data round-trips cleanly between the two apps.
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
  treatmentPrice?: string;    // Integer as string
  treatmentDuration?: string; // Minutes as string
  assessmentType?: string;    // "in-person" | "online"
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
  'treatmentPrice',
  'treatmentDuration',
  'assessmentType',
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
 * sessionStorage. Wrapped in try/catch so private-browsing or
 * storage-full scenarios don't crash the app.
 */
export function storeBookingParamsInSession(params: BookingParams): void {
  if (typeof window === 'undefined') return;

  try {
    for (const key of RECOGNIZED_KEYS) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        sessionStorage.setItem(key, value);
      }
    }
  } catch {
    // sessionStorage may be unavailable in private browsing – silently ignore
  }
}

/**
 * Reads previously-stored booking params back from sessionStorage.
 * Returns a BookingParams object containing only the keys that have
 * non-empty values in storage.
 */
export function getBookingParamsFromSession(): BookingParams {
  if (typeof window === 'undefined') return {};

  const result: BookingParams = {};

  try {
    for (const key of RECOGNIZED_KEYS) {
      const value = sessionStorage.getItem(key);
      if (value !== null && value !== '') {
        result[key] = value;
      }
    }
  } catch {
    // sessionStorage may be unavailable – return whatever we have so far
  }

  return result;
}
