'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OnlineOnboarding from '@/components/onboarding/OnlineOnboarding';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { getBookingCookies } from '@/utils/booking-cookies';
import { parseBookingParams, storeBookingParamsInSession } from '@/utils/booking-params';
import { bookingStorage } from '@/utils/booking-storage';

export default function OnlinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const orgSlug = params.orgSlug as string;
  const [organizationId, setOrganizationId] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cookies = getBookingCookies();

    // Block HyFit from accessing online routes
    const isHyfit = cookies.orgSlug === 'hyfit' || cookies.orgSlug === 'devhyfit';
    if (isHyfit) {
      router.replace(`/${orgSlug}`);
      return;
    }

    // Parse URL params using the shared utility
    const parsedParams = parseBookingParams(searchParams);
    const hasUrlParams = Object.keys(parsedParams).length > 0;

    if (hasUrlParams) {
      // Store all params in sessionStorage for persistence
      storeBookingParamsInSession(parsedParams);
    }
    
    // Check for both organizationId and centerId (same as offline route)
    if (cookies.organizationId || cookies.centerId) {
      setOrganizationId(cookies.organizationId || '');
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [orgSlug, router]);

  const handleComplete = (patientId: string, isNewUser: boolean) => {
    bookingStorage.setItem('patientId', patientId);
    
    // All params are already in tab storage — the flow pages read from there
    if (isNewUser) {
      router.push(`/${orgSlug}/online/new`);
    } else {
      router.push(`/${orgSlug}/online/repeat`);
    }
  };

  if (!mounted || !organizationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <StanceHealthLoader message="Loading..." />
      </div>
    );
  }

  const BookingContent = () => (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <OnlineOnboarding organizationId={organizationId} onComplete={handleComplete} />
      </div>
    </div>
  );

  // Desktop container view
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gray-100" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ height: '90vh' }}>
            <div className="h-full overflow-y-auto">
              <BookingContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile view
  return <BookingContent />;
}
