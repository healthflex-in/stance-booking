'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import { SimplifiedPatientOnboarding } from '@/components/onboarding/shared';

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
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  useEffect(() => {
    setMounted(true);
    
    // Get centerId from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const centerIdFromUrl = urlParams.get('centerId');
    const centerIdFromStorage = localStorage.getItem('centerId');
    const centerId = centerIdFromUrl || centerIdFromStorage || process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c';
    
    setBookingData(prev => ({ ...prev, centerId }));
  }, []);

  const handlePatientOnboardingComplete = (patientId: string, isNewUser: boolean, sessionType: 'in-person' | 'online') => {
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', bookingData.centerId || '');
    
    if (isNewUser) {
      if (sessionType === 'online') {
        router.replace('/book/new-online');
      } else {
        router.replace('/book/new-offline');
      }
    } else {
      if (sessionType === 'online') {
        router.replace('/book/repeat-online');
      } else {
        router.replace('/book/repeat-offline');
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
              centerId={bookingData.centerId || process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c'}
              onComplete={handlePatientOnboardingComplete}
              onBack={() => router.push('/')}
            />
          )}


        </div>
      </div>
    </>
  );

  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gray-100" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative flex flex-col" style={{ height: '90vh', maxHeight: '90vh' }}>
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <BookingContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <BookingContent />;
}

export default function BookPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <BookPageContent />
    </React.Suspense>
  );
}
