'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultOrganization } from '@/utils/booking-config';
import { captureUTMParams } from '@/utils/booking-params';

export default function Home() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once
    if (!hasRedirected.current) {
      hasRedirected.current = true;

      // Capture UTM params BEFORE redirecting — router.replace() strips the query string
      // so utm_source=facebook&utm_term=page must be persisted to tabStorage now.
      captureUTMParams();

      const defaultOrg = getDefaultOrganization();

      // Preserve any query params (UTMs, booking params) in the redirect URL
      // so they're also available on the destination page via useSearchParams.
      const search = window.location.search; // e.g. "?utm_source=facebook&utm_term=page"
      router.replace(`/${defaultOrg.slug}${search}`);
    }
  }, []); // Empty dependencies - only run once

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
