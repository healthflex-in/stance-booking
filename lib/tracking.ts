'use client';

/**
 * stance-booking tracking — book.stance.health
 *
 * DESIGN PRINCIPLE:
 *   IDs always come from stance-health via URL params.  This module:
 *     1. Reads forwarded params from the URL on first landing.
 *     2. Falls back to tab-isolated sessionStorage (populated by
 *        storeBookingParamsInSession on the entry page) so UTMs and IDs
 *        persist across every page in the booking funnel even after the
 *        router strips the query string via router.replace().
 *     3. Merges everything into localStorage (key "stance_tracking") so
 *        getWebTrackingForBooking() can read it at booking time.
 *     4. For direct traffic (no anonymous_id from stance-health), generates
 *        new IDs so the booking journey is still tracked.
 */

import { tabStorage } from '@/utils/tab-storage';

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'stance_tracking'; // same key as stance-health → shared identity
const SESSION_KEY = 'stance_session';  // same key as stance-health
const SESSION_TTL = 30 * 60 * 1000;   // 30 minutes — must match stance-health

// ── Types ────────────────────────────────────────────────────────────────────

export const TRACKED_PARAMS = [
  // UTMs
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_adgroup', 'utm_matchtype', 'utm_device', 'utm_network',
  // Placement / creative
  'placement', 'asset_id',
  // Click IDs
  'gclid', 'fbclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid', 'twclid',
  // Internal
  'ref', 'affiliate_id',
] as const;

// Identity + derived keys forwarded from stance-health
const IDENTITY_KEYS = [
  'anonymous_id', 'session_id', 'ga_client_id', 'fbp', 'fbc', 'gcl_au',
  'landing_page', 'referrer',
] as const;

export type TrackedParam  = (typeof TRACKED_PARAMS)[number];
type IdentityKey          = (typeof IDENTITY_KEYS)[number];
export type TrackingData  = Partial<Record<TrackedParam | IdentityKey, string>>;

// Keys that get appended to outbound links inside stance-booking
const FORWARD_KEYS: readonly string[] = [
  ...TRACKED_PARAMS,
  'anonymous_id', 'session_id', 'ga_client_id', 'fbp', 'fbc', 'gcl_au',
];

// ── Storage helpers ───────────────────────────────────────────────────────────

export function readStoredParams(): TrackingData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeStoredParams(data: TrackingData): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* private mode / quota */ }
}

export function getTrackingData(): TrackingData {
  return readStoredParams();
}

// ── Decode Google cross-domain linker ─────────────────────────────────────────

function decodeGl(gl: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const parts = gl.split('*');
    for (let i = 2; i + 1 < parts.length; i += 2) {
      const k = parts[i]; const v = parts[i + 1];
      if (k && v) {
        try { out[k] = atob(v.replace(/-/g, '+').replace(/_/g, '/')); }
        catch { out[k] = v; }
      }
    }
  } catch { /* ignore */ }
  return out;
}

// ── Small utilities ──────────────────────────────────────────────────────────

function uuid(): string {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); }
  catch { /* fallthrough */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Main capture ──────────────────────────────────────────────────────────────

/**
 * Call on every page mount.
 *
 * RULES:
 *  - URL params win first (entry page, or direct link with params).
 *  - Tab storage fallback: if URL has no params but tabStorage already has
 *    them (set on the entry page by storeBookingParamsInSession), merge them
 *    in.  This is the key fix for multi-step funnels where the router strips
 *    the query string after the first page.
 *  - localStorage ("stance_tracking") is the final persistent store that
 *    survives both page navigation and soft refreshes.
 *  - UTMs: first-touch wins — never overwrite once stored.
 *  - Identity IDs from stance-health: URL / tabStorage value always wins.
 *  - Direct traffic (no anonymous_id anywhere): generate new IDs.
 */
export function captureTrackingParams(): TrackingData {
  if (typeof window === 'undefined') return {};

  const stored = readStoredParams();
  const url    = new URL(window.location.href);

  // 1. URL params — highest priority, always accept identity IDs
  for (const key of TRACKED_PARAMS) {
    const val = url.searchParams.get(key);
    if (val && !stored[key]) stored[key] = val;
  }
  for (const key of IDENTITY_KEYS) {
    const val = url.searchParams.get(key);
    if (val) stored[key] = val;
  }

  // 2. Tab storage fallback — picks up params saved on the entry page even
  //    after router.replace() stripped them from the URL.
  //    Only fills gaps — never overwrites values already in localStorage.
  const TAB_PARAMS: string[] = [...TRACKED_PARAMS, ...IDENTITY_KEYS];
  for (const key of TAB_PARAMS) {
    if (!stored[key as keyof TrackingData]) {
      try {
        const val = tabStorage.getItem(key);
        if (val) stored[key as keyof TrackingData] = val;
      } catch { /* tab storage unavailable */ }
    }
  }

  // 3. Decode _gl cross-domain linker
  const gl = url.searchParams.get('_gl');
  if (gl) {
    const decoded = decodeGl(gl);
    if (decoded._gcl_au && !stored.gcl_au) stored.gcl_au = decoded._gcl_au;
  }

  // 4. Visit context
  if (!stored.landing_page) {
    stored.landing_page = url.pathname + url.search;
  }

  // 5. Generate IDs only for direct traffic (stance-health didn't forward them)
  if (!stored.anonymous_id) {
    stored.anonymous_id = uuid();
  }
  const lastSeen   = Number(window.localStorage.getItem(SESSION_KEY) ?? 0);
  const newSession = !lastSeen || Date.now() - lastSeen > SESSION_TTL;
  if (!stored.session_id || newSession) {
    stored.session_id = uuid();
  }

  // 6. Persist to localStorage
  writeStoredParams(stored);

  // Keep session TTL clock ticking
  try { window.localStorage.setItem(SESSION_KEY, String(Date.now())); }
  catch { /* */ }

  return stored;
}

// ── URL forwarding ────────────────────────────────────────────────────────────

/**
 * Append stored tracking params to an internal booking URL.
 * Use this for any <Link> or router.push() inside stance-booking so params
 * survive client-side navigation.
 *
 * Returns the original string unchanged if nothing needs adding (prevents
 * WHATWG URL normalisation trailing-slash hydration mismatches).
 */
export function buildTrackedUrl(destination: string): string {
  if (typeof window === 'undefined' || !destination) return destination;
  if (/^(tel:|mailto:|sms:|javascript:|#)/i.test(destination.trim())) return destination;

  try {
    const origin = window.location.origin;
    const url    = new URL(destination, origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return destination;

    const stored    = readStoredParams();
    let   added     = false;

    for (const key of FORWARD_KEYS) {
      const value = stored[key as keyof TrackingData];
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
        added = true;
      }
    }

    if (!added) return destination;
    return url.origin === origin
      ? `${url.pathname}${url.search}${url.hash}`
      : url.toString();
  } catch { return destination; }
}

// ────────────────────────────────────────────────────────────────────────────
// NOTE: ID generation is now handled inline in captureTrackingParams() above.
// Direct traffic → IDs generated there. Stance-health referral → IDs come
// from URL params and are never overwritten.
// ────────────────────────────────────────────────────────────────────────────
//     new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
//   );
// ────────────────────────────────────────────────────────────────────────────
// NOTE: ID generation is now handled inline in captureTrackingParams() above.
// Direct traffic → IDs generated there. Stance-health referral → IDs come
// from URL params and are never overwritten.
// ────────────────────────────────────────────────────────────────────────────
