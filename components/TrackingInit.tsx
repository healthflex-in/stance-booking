'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureTrackingParams } from '@/lib/tracking';

/**
 * Runs on every page mount inside the booking funnel.
 *
 * Reads UTMs + identity IDs forwarded from stance-health via URL params
 * and persists them to localStorage so they survive page-to-page navigation.
 *
 * Does NOT generate any new IDs — those always come from stance-health.
 *
 * Wrapped in <Suspense> in layout.tsx because it uses useSearchParams().
 */
export default function TrackingInit() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureTrackingParams();

    // ── POST /api/track-user (commented out — enable when backend is deployed) ──
    // import('@/lib/tracking').then(({ getTrackingData, pingTrackUser }) => {
    //   const data = getTrackingData();
    //   if (data.anonymous_id) {
    //     void pingTrackUser({ page_path: window.location.pathname });
    //   }
    // });

  // Re-run on every client-side navigation so UTMs stay in sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
