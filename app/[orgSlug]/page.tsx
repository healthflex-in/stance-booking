'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import { SimplifiedPatientOnboarding } from '@/components/onboarding/shared';
import { getOrganizationBySlug, getDefaultCenterId } from '@/utils/booking-config';
import { setBookingCookies, getBookingCookies } from '@/utils/booking-cookies';

type BookingStep =
  | 'patient-onboarding'
  | 'session-details'
  | 'slot-selection'
  | 'booking-confirmation'
  | 'booking-confirmed';

interface BookingData {
  patientId: string;
  isNewUser: boolean;
  sessionType: 'in-person' | 'online';
  centerId: string;
  location: string;
  consultantId: string;
  consultantName?: string;
  treatmentId: string;
  treatmentName?: string;
  treatmentDuration: number;
  treatmentPrice: number;
  selectedDate: string;
  selectedTimeSlot: {
    startTime: string;
    endTime: string;
    displayTime: string;
    startTimeRaw?: string;
    endTimeRaw?: string;
  };
  selectedFullDate?: Date;
  appointmentId?: string;
  selectedCenter?: any;
  selectedService?: any;
  selectedConsultant?: any;
}

function BookPageContent() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const initializedRef = React.useRef(false);
  const redirectingRef = React.useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    setMounted(true);
    
    // Get organization config
    const org = getOrganizationBySlug(orgSlug);
    
    if (!org) {
      // Invalid org slug - silently redirect to default (could be browser requests like /login, /favicon.ico, etc.)
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        if (orgSlug !== 'login' && orgSlug !== 'favicon.ico' && !orgSlug.startsWith('.')) {
          console.warn('Invalid organization slug:', orgSlug);
        }
        router.replace('/'); // Use replace instead of push
      }
      return;
    }
    
    // Get default center ID for this organization (used for patient creation only)
    const defaultCenterId = getDefaultCenterId(orgSlug);
    
    if (!defaultCenterId) {
      console.error('No default center found for org:', orgSlug);
      return;
    }
    
    // Only set cookies if they're different from current values
    const currentCookies = getBookingCookies();
    if (currentCookies.organizationId !== org.id || currentCookies.orgSlug !== org.slug) {
      // Set cookies with org and center IDs
      // Centers list will be fetched dynamically from backend API
      setBookingCookies(
        org.id,
        defaultCenterId,
        org.slug,
        '' // centerSlug not needed - centers fetched from API
      );
    }
    
    // Set center ID in booking data
    setBookingData(prev => ({ ...prev, centerId: defaultCenterId }));
  }, [orgSlug]); // Only re-run if orgSlug changes

  const handlePatientOnboardingComplete = (patientId: string, isNewUser: boolean, sessionType: 'in-person' | 'online') => {
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', bookingData.centerId || '');
    
    if (isNewUser) {
      if (sessionType === 'online') {
        router.replace(`/${orgSlug}/online/new`);
      } else {
        router.replace(`/${orgSlug}/offline/new`);
      }
    } else {
      if (sessionType === 'online') {
        router.replace(`/${orgSlug}/online/repeat`);
      } else {
        router.replace(`/${orgSlug}/offline/repeat`);
      }
    }
  };

  const handleBookingConfirm = (data: any) => {
    setBookingData((prev) => ({ ...prev, ...data }));
    setCurrentStep('booking-confirmation');
  };

  const handlePaymentComplete = (appointmentId: string) => {
    setBookingData((prev) => ({ ...prev, appointmentId }));
    setCurrentStep('booking-confirmed');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleBack = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'session-details',
      'slot-selection',
      'booking-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      router.push('/');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'patient-onboarding':
        return 'Stance Health';
      case 'session-details':
        return 'Session Details';
      case 'slot-selection':
        return 'Slot Availability';
      case 'booking-confirmation':
        return 'Booking Confirmation';
      case 'booking-confirmed':
        return 'Booking Confirmed';
      default:
        return 'Book Appointment';
    }
  };

  const canGoBack = currentStep !== 'patient-onboarding' && currentStep !== 'booking-confirmed';

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const BookingContent = () => (
    <>
      <RazorpayScriptLoader />
      <div className="h-full bg-gray-50 flex flex-col">
        {/* Mobile Header - Only show for booking steps, not patient onboarding */}
        {currentStep !== 'patient-onboarding' && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center ml-6">
              {getStepTitle()}
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'patient-onboarding' && (
            <SimplifiedPatientOnboarding
              centerId={bookingData.centerId || ''}
              onComplete={handlePatientOnboardingComplete}
              onBack={() => router.push('/')}
            />
          )}
        </div>
      </div>
    </>
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

export default function OrgHomePage() {
  return <BookPageContent />;
}

