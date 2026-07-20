'use client';

/**
 * Builds the WebTrackingInput object for createAppointment / createPatient mutations.
 *
 * IDs are read from localStorage (populated by captureTrackingParams on every page)
 * and from tab-isolated session storage (populated by storeBookingParamsInSession
 * from the original booking URL).
 *
 * NEVER generates new IDs — stance-health is the single source of truth.
 * Returns null if no anonymous_id is available (direct traffic with no
 * stance-health referral) — caller should omit webTracking in that case.
 */

import { getTrackingData } from '@/lib/tracking';
import { getBookingParamsFromSession, getBookingLandingUrl } from './booking-params';

export interface WebTrackingInput {
  anonymousId?:   string;
  sessionId?:     string;
  gaClientId?:    string;
  fbp?:           string;
  fbc?:           string;
  gclAu?:         string;
  gclid?:         string;
  bookingUrl?:    string;
  landingPage?:   string;
  referrer?:      string;
  utmSource?:     string;
  utmMedium?:     string;
  utmCampaign?:   string;
  utmAdgroup?:    string;
  utmContent?:    string;
  utmTerm?:       string;
  utmMatchtype?:  string;
  utmDevice?:     string;
  utmNetwork?:    string;
  placement?:     string;
  assetId?:       string;
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
    sessionId:   ls.session_id    || session.session_id,
    gaClientId:  ls.ga_client_id  || session.ga_client_id,
    fbp:         ls.fbp            || session.fbp,
    fbc:         ls.fbc            || session.fbc,
    gclAu:       ls.gcl_au         || session.gcl_au,
    gclid:       ls.gclid,
    // bookingUrl: full landing URL with UTMs when available, else current page
    bookingUrl:  (ls.landing_page && ls.landing_page.startsWith('http'))
      ? ls.landing_page
      : window.location.href,
    landingPage: ls.landing_page   || getBookingLandingUrl() || undefined,
    referrer:    ls.referrer       || (document.referrer || undefined),
    utmSource:   ls.utm_source,
    utmMedium:   ls.utm_medium,
    utmCampaign: ls.utm_campaign,
    utmAdgroup:  ls.utm_adgroup,
    utmContent:  ls.utm_content,
    utmTerm:     ls.utm_term,
    utmMatchtype: ls.utm_matchtype,
    utmDevice:   ls.utm_device,
    utmNetwork:  ls.utm_network,
    placement:   ls.placement,
    assetId:     ls.asset_id,
  };

  // Strip undefined/empty so GraphQL doesn't send null for optional fields
  return Object.fromEntries(
    Object.entries(result).filter(([, v]) => v != null && v !== ''),
  ) as WebTrackingInput;
}
