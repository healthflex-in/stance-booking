'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureTrackingParams, getTrackingData } from '@/lib/tracking';

const TRACK_URL = process.env.NEXT_PUBLIC_TRACK_USER_URL ?? '';

/**
 * Mounted on every page inside the booking funnel (via the root layout).
 *
 * On every navigation:
 *  1. Reads UTMs + identity IDs from the URL (forwarded by stance-health or
 *     present in a direct paid-traffic link like ?utm_source=google).
 *  2. Falls back to tab storage (set on entry by storeBookingParamsInSession).
 *  3. Merges everything into localStorage ("stance_tracking").
 *  4. For DIRECT traffic (no anonymous_id anywhere) — generates a new
 *     anonymous_id and session_id so the journey is fully tracked even
 *     without a stance-health referral.
 *  5. Pings the backend track-user endpoint so a WebVisitor document exists
 *     in MongoDB before the patient registers — enabling pre-booking
 *     attribution even for users who never complete a booking.
 *
 * Wrapped in <Suspense> in layout.tsx because it uses useSearchParams().
 */
export default function TrackingInit() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Capture params + generate IDs if needed
    const data = captureTrackingParams();

    // 2. Ping backend — fire-and-forget, never blocks the UI
    if (TRACK_URL && data.anonymous_id) {
      const payload: Record<string, string> = {
        anonymous_id: data.anonymous_id,
        page_path:    window.location.pathname,
      };

      // Include every non-empty field from tracking data
      const FORWARD = [
        'session_id', 'ga_client_id', 'fbp', 'fbc', 'gcl_au',
        'landing_page', 'referrer',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_adgroup',
        'utm_content', 'utm_term', 'utm_matchtype', 'utm_device', 'utm_network',
        'placement', 'asset_id',
        'gclid', 'fbclid', 'gbraid', 'wbraid',
      ] as const;

      for (const key of FORWARD) {
        const val = (data as any)[key];
        if (val) payload[key] = val;
      }

      fetch(TRACK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        // keepalive so the ping survives page unload
        keepalive: true,
      }).catch(() => { /* non-fatal — tracking must never break the UI */ });
    }

  // Re-run on every client-side navigation so UTMs and session stay in sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
