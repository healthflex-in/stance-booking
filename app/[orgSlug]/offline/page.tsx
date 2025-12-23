'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OfflineOnboarding from '@/components/onboarding/OfflineOnboarding';
import { getBookingCookies } from '@/utils/booking-cookies';

export default function OfflinePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const [centerId, setCenterId] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const cookies = getBookingCookies();
    if (cookies.centerId) {
      setCenterId(cookies.centerId);
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [orgSlug, router]);

  const handleComplete = (patientId: string, isNewUser: boolean) => {
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', centerId);
    
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
