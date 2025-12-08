'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { MobilePatientOnboarding } from '@/components/onboarding/shared';
import {
  PrepaidBookingConfirmed,
  PrepaidCenterSelection,
  PrepaidConsultantSelection,
  PrepaidServiceSelection,
  PrepaidSlotSelection,
} from '@/components/onboarding/prepaid';

type BookingStep =
  | 'patient-onboarding'
  | 'center-selection'
  | 'consultant-selection'
  | 'service-selection'
  | 'slot-selection'
  | 'booking-confirmed';

interface BookingData {
  sessionType: 'in-person' | 'online' | null;
  location: string;
  selectedDate: string;
  selectedTimeSlot: string | { startTime: string; endTime: string; displayTime: string };
  selectedFullDate?: Date;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  treatmentDuration: number;
  patientId: string;
  centerId: string;
  assessmentType?: 'in-person' | 'online';
  isNewUser: boolean;
}

export default function BookPrepaidPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: 'online',
    location: '',
    selectedDate: '',
    selectedTimeSlot: '',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    treatmentDuration: 20,
    patientId: '',
    centerId: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c',
    assessmentType: 'online',
    isNewUser: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'center-selection',
      'consultant-selection',
      'service-selection',
      'slot-selection',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      // Skip consultant selection for new users
      if (currentStep === 'center-selection' && bookingData.isNewUser) {
        setCurrentStep('service-selection');
      } else {
        setCurrentStep(stepOrder[currentIndex + 1]);
      }
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'center-selection',
      'consultant-selection',
      'service-selection',
      'slot-selection',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      // Skip consultant selection for new users when going back
      if (currentStep === 'service-selection' && bookingData.isNewUser) {
        setCurrentStep('center-selection');
      } else {
        setCurrentStep(stepOrder[currentIndex - 1]);
      }
    } else {
      router.push('/book');
    }
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'patient-onboarding':
        return 'Pre-Paid Services';
      case 'center-selection':
        return 'Select Center';
      case 'consultant-selection':
        return 'Select Consultant';
      case 'service-selection':
        return 'Select Duration';
      case 'slot-selection':
        return 'Select Slot';
      case 'booking-confirmed':
        return 'Booking Confirmed';
      default:
        return 'Pre-Paid Services';
    }
  };

  const canGoBack = currentStep !== 'patient-onboarding' && currentStep !== 'booking-confirmed';

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const BookingContent = () => (
    <>
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          {canGoBack && (
            <button
              onClick={goToPreviousStep}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {!canGoBack && currentStep === 'patient-onboarding' && (
            <button
              onClick={() => router.push('/book')}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center ml-6">
            {getStepTitle()}
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentStep === 'patient-onboarding' && (
            <MobilePatientOnboarding
              centerId={bookingData.centerId}
              onNext={goToNextStep}
              onPatientCreated={(patientId, isNewUser) => updateBookingData({ patientId, isNewUser })}
            />
          )}

          {currentStep === 'center-selection' && (
            <PrepaidCenterSelection
              selectedCenterId={bookingData.centerId}
              onCenterSelect={(centerId) => updateBookingData({ centerId })}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'consultant-selection' && (
            <PrepaidConsultantSelection
              centerId={bookingData.centerId}
              onConsultantSelect={(consultantId) => {
                updateBookingData({ consultantId });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'service-selection' && (
            <PrepaidServiceSelection
              centerId={bookingData.centerId}
              patientId={bookingData.patientId}
              isNewUser={bookingData.isNewUser}
              onServiceSelect={(serviceId, serviceDuration, servicePrice) => {
                updateBookingData({ 
                  treatmentId: serviceId, 
                  treatmentPrice: servicePrice,
                  treatmentDuration: serviceDuration
                });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'slot-selection' && (
            <PrepaidSlotSelection
              centerId={bookingData.centerId}
              serviceDuration={bookingData.treatmentDuration}
              consultantId={bookingData.isNewUser ? undefined : bookingData.consultantId}
              onSlotSelect={(consultantId, slot) => {
                const slotDate = new Date(slot.startTimeRaw);
                updateBookingData({
                  consultantId,
                  selectedTimeSlot: {
                    startTime: new Date(slot.startTimeRaw).toISOString(),
                    endTime: new Date(slot.endTimeRaw).toISOString(),
                    displayTime: slot.displayTime
                  },
                  selectedDate: slotDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                  selectedFullDate: slotDate,
                });
                goToNextStep();
              }}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <PrepaidBookingConfirmed bookingData={bookingData} />
          )}
        </div>
      </div>
    </>
  );

  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
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

  return <BookingContent />;
}
