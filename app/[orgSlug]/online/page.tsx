'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OnlineOnboarding from '@/components/onboarding/OnlineOnboarding';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { getBookingCookies } from '@/utils/booking-cookies';

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
    
    // Check if URL has booking params (partial link flow)
    const urlCenterId = searchParams.get('centerId');
    
    if (urlCenterId) {
      // Partial link flow - store URL params in sessionStorage
      const urlParams = {
        centerId: searchParams.get('centerId'),
        serviceId: searchParams.get('serviceId'),
        consultantId: searchParams.get('consultantId'),
        consultantType: searchParams.get('consultantType'),
        slotDate: searchParams.get('slotDate'),
        slotStart: searchParams.get('slotStart'),
        slotEnd: searchParams.get('slotEnd'),
        treatmentPrice: searchParams.get('treatmentPrice'),
        treatmentDuration: searchParams.get('treatmentDuration'),
        paymentType: searchParams.get('paymentType'),
      };
      Object.entries(urlParams).forEach(([key, value]) => {
        if (value) sessionStorage.setItem(key, value);
      });
      setOrganizationId(cookies.organizationId || '');
      return;
    }
    
    // Block HyFit from accessing online routes
    const isHyfit = cookies.orgSlug === 'hyfit' || cookies.orgSlug === 'devhyfit';
    if (isHyfit) {
      router.replace(`/${orgSlug}`);
      return;
    }
    
    // Check for both organizationId and centerId (same as offline route)
    if (cookies.organizationId || cookies.centerId) {
      setOrganizationId(cookies.organizationId || '');
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [orgSlug, router]);

  const handleComplete = (patientId: string, isNewUser: boolean) => {
    sessionStorage.setItem('patientId', patientId);
    
    // Check if this is a partial link flow
    const hasBookingParams = sessionStorage.getItem('centerId');
    
    if (hasBookingParams) {
      // Partial link flow - pass all params forward
      const storedParams = new URLSearchParams();
      storedParams.append('patientId', patientId);
      
      const centerId = sessionStorage.getItem('centerId');
      const serviceId = sessionStorage.getItem('serviceId');
      const consultantId = sessionStorage.getItem('consultantId');
      const consultantType = sessionStorage.getItem('consultantType');
      const slotDate = sessionStorage.getItem('slotDate');
      const slotStart = sessionStorage.getItem('slotStart');
      const slotEnd = sessionStorage.getItem('slotEnd');
      const treatmentPrice = sessionStorage.getItem('treatmentPrice');
      const treatmentDuration = sessionStorage.getItem('treatmentDuration');
      const paymentType = sessionStorage.getItem('paymentType');
      
      if (centerId) storedParams.append('centerId', centerId);
      if (serviceId) storedParams.append('serviceId', serviceId);
      if (consultantId) storedParams.append('consultantId', consultantId);
      if (consultantType) storedParams.append('consultantType', consultantType);
      if (slotDate) storedParams.append('slotDate', slotDate);
      if (slotStart) storedParams.append('slotStart', slotStart);
      if (slotEnd) storedParams.append('slotEnd', slotEnd);
      if (treatmentPrice) storedParams.append('treatmentPrice', treatmentPrice);
      if (treatmentDuration) storedParams.append('treatmentDuration', treatmentDuration);
      if (paymentType) storedParams.append('paymentType', paymentType);
      
      if (isNewUser) {
        router.push(`/${orgSlug}/online/new?${storedParams.toString()}`);
      } else {
        router.push(`/${orgSlug}/online/repeat?${storedParams.toString()}`);
      }
    } else {
      // Normal flow - no params
      if (isNewUser) {
        router.push(`/${orgSlug}/online/new`);
      } else {
        router.push(`/${orgSlug}/online/repeat`);
      }
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
