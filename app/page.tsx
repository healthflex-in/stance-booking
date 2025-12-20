'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getDefaultOrganization } from '@/utils/booking-config';

export default function Home() {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      const defaultOrg = getDefaultOrganization();
      router.replace(`/${defaultOrg.slug}`); // Use replace instead of push
    }
  }, []); // Empty dependencies - only run once

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
