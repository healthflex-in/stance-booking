'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OfflineOnboarding from '@/components/onboarding/OfflineOnboarding';
import { getBookingCookies } from '@/utils/booking-cookies';
import { parseBookingParams, storeBookingParamsInSession } from '@/utils/booking-params';
import { bookingStorage } from '@/utils/booking-storage';

export default function OfflinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const orgSlug = params.orgSlug as string;
  const [centerId, setCenterId] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Parse URL params using the shared utility
    const parsedParams = parseBookingParams(searchParams);
    const hasUrlParams = Object.keys(parsedParams).length > 0;

    if (hasUrlParams) {
      // Store all params in sessionStorage for persistence
      storeBookingParamsInSession(parsedParams);
    }

    // Check if URL has patientId (direct link with patient)
    const urlPatientId = parsedParams.patientId || searchParams.get('patientId');
    const urlCenterId = parsedParams.centerId || searchParams.get('centerId');
    
    if (urlPatientId) {
      // Direct patient link - skip onboarding, go straight to booking
      bookingStorage.setItem('patientId', urlPatientId);
      if (urlCenterId) bookingStorage.setItem('centerId', urlCenterId);
      
      // Redirect to repeat flow — the flow page reads from tab storage
      router.push(`/${orgSlug}/offline/repeat`);
      return;
    }
    
    // Check if URL has booking params (partial link flow without patientId)
    if (urlCenterId) {
      setCenterId(urlCenterId);
      return;
    }

    // Check tab storage for centerId (from a previous dynamic link flow)
    const storedCenterId = bookingStorage.getItem('centerId');
    if (storedCenterId) {
      setCenterId(storedCenterId);
      return;
    }
    
    // Normal flow - use cookies
    const cookies = getBookingCookies();
    if (cookies.centerId) {
      setCenterId(cookies.centerId);
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [orgSlug, router]);

  const handleComplete = (patientId: string, isNewUser: boolean) => {
    bookingStorage.setItem('patientId', patientId);
    if (centerId) bookingStorage.setItem('centerId', centerId);
    
    // All params are already in tab storage — the flow pages read from there
    if (isNewUser) {
      router.push(`/${orgSlug}/offline/new`);
    } else {
      router.push(`/${orgSlug}/offline/repeat`);
    }
  };

  if (!mounted || !centerId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const BookingContent = () => (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <OfflineOnboarding centerId={centerId} onComplete={handleComplete} />
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
