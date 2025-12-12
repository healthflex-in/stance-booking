'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SimplifiedPatientOnboarding } from '@/components/onboarding/shared';

type BookingStep =
  | 'patient-onboarding'
  | 'booking-main'
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
  };
  selectedFullDate?: Date;
  appointmentId?: string;
}

export default function BookPrepaidNewPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    centerId: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePatientOnboardingComplete = (patientId: string, isNewUser: boolean, sessionType: 'in-person' | 'online') => {
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('centerId', bookingData.centerId || '');
    router.replace('/book-prepaid');
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
      'booking-main',
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#132644]"></div>
      </div>
    );
  }

  const BookingContent = () => (
    <>
      {currentStep === 'patient-onboarding' && (
        <SimplifiedPatientOnboarding
          centerId={bookingData.centerId!}
          onComplete={handlePatientOnboardingComplete}
          onBack={() => router.push('/')}
        />
      )}


    </>
  );

  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative"
            style={{ height: '90vh' }}
          >
            <div className="h-full overflow-y-auto">
              <BookingContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <BookingContent />;
}

