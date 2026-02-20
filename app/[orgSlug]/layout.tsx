'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { setBookingCookies } from '@/utils/booking-cookies';
import { getOrganizationBySlug, getDefaultCenterId } from '@/utils/booking-config';

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  useEffect(() => {
    // Set organization cookies as soon as any page under [orgSlug] loads
    const org = getOrganizationBySlug(orgSlug);
    if (org) {
      const defaultCenterId = getDefaultCenterId(orgSlug);
      if (defaultCenterId) {
        setBookingCookies(org.id, defaultCenterId, org.slug, '');
        console.log('✅ [Layout] Organization cookies set:', { orgId: org.id, centerId: defaultCenterId });
      }
    }
  }, [orgSlug]);

  return <>{children}</>;
}
