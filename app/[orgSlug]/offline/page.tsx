'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OfflineOnboarding from '@/components/onboarding/OfflineOnboarding';
import { getBookingCookies } from '@/utils/booking-cookies';

export default function OfflinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const orgSlug = params.orgSlug as string;
  const [centerId, setCenterId] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if URL has booking params (partial link flow)
    const urlCenterId = searchParams.get('centerId');
    
    if (urlCenterId) {
      // Partial link flow - use URL params
      setCenterId(urlCenterId);
      // Store URL params in sessionStorage for later use
      const urlParams = {
        centerId: searchParams.get('centerId'),
        serviceId: searchParams.get('serviceId'),
        consultantId: searchParams.get('consultantId'),
        consultantType: searchParams.get('consultantType'),
        slotStart: searchParams.get('slotStart'),
        slotEnd: searchParams.get('slotEnd'),
        treatmentPrice: searchParams.get('treatmentPrice'),
        treatmentDuration: searchParams.get('treatmentDuration'),
      };
      Object.entries(urlParams).forEach(([key, value]) => {
        if (value) sessionStorage.setItem(key, value);
      });
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
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', centerId);
    
    // Check if this is a partial link flow
    const hasBookingParams = sessionStorage.getItem('serviceId') || sessionStorage.getItem('consultantId');
    
    if (hasBookingParams) {
      // Partial link flow - pass all params forward
      const storedParams = new URLSearchParams();
      storedParams.append('patientId', patientId);
      storedParams.append('centerId', centerId);
      
      const serviceId = sessionStorage.getItem('serviceId');
      const consultantId = sessionStorage.getItem('consultantId');
      const consultantType = sessionStorage.getItem('consultantType');
      const slotStart = sessionStorage.getItem('slotStart');
      const slotEnd = sessionStorage.getItem('slotEnd');
      const treatmentPrice = sessionStorage.getItem('treatmentPrice');
      const treatmentDuration = sessionStorage.getItem('treatmentDuration');
      
      if (serviceId) storedParams.append('serviceId', serviceId);
      if (consultantId) storedParams.append('consultantId', consultantId);
      if (consultantType) storedParams.append('consultantType', consultantType);
      if (slotStart) storedParams.append('slotStart', slotStart);
      if (slotEnd) storedParams.append('slotEnd', slotEnd);
      if (treatmentPrice) storedParams.append('treatmentPrice', treatmentPrice);
      if (treatmentDuration) storedParams.append('treatmentDuration', treatmentDuration);
      
      if (isNewUser) {
        router.push(`/${orgSlug}/offline/new?${storedParams.toString()}`);
      } else {
        router.push(`/${orgSlug}/offline/repeat?${storedParams.toString()}`);
      }
    } else {
      // Normal flow - no params
      if (isNewUser) {
        router.push(`/${orgSlug}/offline/new`);
      } else {
        router.push(`/${orgSlug}/offline/repeat`);
      }
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
