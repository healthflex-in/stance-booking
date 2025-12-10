'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { MobilePatientOnboarding } from '@/components/onboarding/shared';
import { SessionDetails } from '@/components/onboarding/redesign';
import {
  NewUserOnlinePaymentConfirmation,
  NewUserOnlineBookingConfirmed,
} from '@/components/onboarding/new-user-online';
import { SlotAvailability } from '@/components/onboarding/redesign';

type BookingStep =
  | 'patient-onboarding'
  | 'session-details'
  | 'slot-selection'
  | 'payment-confirmation'
  | 'booking-confirmed';

interface BookingData {
  sessionType: 'online';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  treatmentDuration: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
  isNewUser: boolean;
}

export default function NewOnlinePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: 'online',
    patientId: '',
    centerId: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    treatmentDuration: 20,
    selectedDate: '',
    selectedTimeSlot: { startTime: '', endTime: '', displayTime: '' },
    isNewUser: true,
  });

  useEffect(() => {
    setMounted(true);
    
    // Check if patient data exists in session storage
    const storedPatientId = sessionStorage.getItem('patientId');
    const storedCenterId = sessionStorage.getItem('centerId');
    
    if (storedPatientId && storedCenterId) {
      // Patient already created, skip to session details
      setBookingData(prev => ({
        ...prev,
        patientId: storedPatientId,
        centerId: storedCenterId,
      }));
      setCurrentStep('session-details');
      
      // Clear session storage
      sessionStorage.removeItem('patientId');
      sessionStorage.removeItem('centerId');
    }
  }, []);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'session-details',
      'slot-selection',
      'payment-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'session-details',
      'slot-selection',
      'payment-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
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
        return 'New User - Online';
      case 'session-details':
        return 'Session Details';
      case 'slot-selection':
        return 'Slot Availability';
      case 'payment-confirmation':
        return 'Payment';
      case 'booking-confirmed':
        return 'Booking Confirmed';
      default:
        return 'New User - Online';
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
          {!canGoBack && (
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

          {currentStep === 'session-details' && (
            <SessionDetails
              patientId={bookingData.patientId}
              centerId={bookingData.centerId}
              isNewUser={bookingData.isNewUser}
              defaultSessionType="online"
              onBack={goToPreviousStep}
              onContinue={(data) => {
                updateBookingData({
                  sessionType: data.sessionType as 'online', // new-online route only supports online
                  centerId: data.centerId,
                  treatmentId: data.serviceId,
                  treatmentDuration: data.serviceDuration,
                  treatmentPrice: data.servicePrice,
                });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'slot-selection' && (
            <SlotAvailability
              centerId={bookingData.centerId}
              serviceDuration={bookingData.treatmentDuration}
              sessionType={bookingData.sessionType}
              isNewUser={bookingData.isNewUser}
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

          {currentStep === 'payment-confirmation' && (
            <NewUserOnlinePaymentConfirmation
              bookingData={bookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <NewUserOnlineBookingConfirmed bookingData={bookingData} />
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
