'use client';

/**
 * Builds the WebTrackingInput object for the createAppointment mutation.
 *
 * IDs are read from localStorage (populated by TrackingInit from the
 * forwarded stance-health URL params) and from tab-isolated session
 * storage (populated by storeBookingParamsInSession from the original URL).
 *
 * NEVER generates new IDs — stance-health is the single source of truth.
 * Returns null if no anonymous_id is available (direct traffic with no
 * stance-health referral) — caller should omit webTracking in that case.
 */

import { getTrackingData } from '@/lib/tracking';
import { getBookingParamsFromSession } from './booking-params';

export interface WebTrackingInput {
  anonymousId?: string;
  sessionId?:   string;
  gaClientId?:  string;
  fbp?:         string;
  fbc?:         string;
  gclAu?:       string;
}

export function getWebTrackingForBooking(): WebTrackingInput | null {
  if (typeof window === 'undefined') return null;

  // Primary: localStorage (written by captureTrackingParams on every page)
  const ls = getTrackingData();
  // Fallback: tab-isolated session storage from the original booking URL
  const session = getBookingParamsFromSession();

  const anonymousId = ls.anonymous_id || session.anonymous_id;
  if (!anonymousId) return null; // no identity from stance-health → skip

  const result: WebTrackingInput = {
    anonymousId,
    sessionId:  ls.session_id   || session.session_id,
    gaClientId: ls.ga_client_id || session.ga_client_id,
    fbp:        ls.fbp           || session.fbp,
    fbc:        ls.fbc           || session.fbc,
    gclAu:      ls.gcl_au        || session.gcl_au,
  };

  // Strip undefined/empty so GraphQL doesn't send null for optional fields
  return Object.fromEntries(
    Object.entries(result).filter(([, v]) => v != null && v !== ''),
  ) as WebTrackingInput;
}
