'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getBookingCookies } from '@/utils/booking-cookies';

import {
  NewUserOnlinePaymentConfirmation,
  NewUserOnlineBookingConfirmed,
  NewUserOnlineSessionDetails,
  NewUserOnlineSlotSelection,
} from '@/components/onboarding/new-user-online';

type BookingStep =
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
  appointmentId?: string;
  centerName?: string;
  consultantName?: string;
}

export default function NewOnlinePage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('session-details');
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: 'online',
    patientId: '',
    centerId: '',
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
    
    // Block HyFit from accessing online routes
    const cookies = getBookingCookies();
    const isHyfit = cookies.orgSlug === 'hyfit' || cookies.orgSlug === 'devhyfit';
    if (isHyfit) {
      router.replace(`/${orgSlug}`);
      return;
    }
  }, [orgSlug, router]);

  useEffect(() => {
    if (!mounted) return;
    
    const storedPatientId = sessionStorage.getItem('patientId');
    
    if (storedPatientId) {
      setBookingData(prev => ({
        ...prev,
        patientId: storedPatientId,
      }));
      sessionStorage.removeItem('patientId');
    } else {
      console.warn('⚠️ No patientId found in sessionStorage');
      router.push(`/${orgSlug}`);
    }
  }, [mounted, orgSlug, router]);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
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
      'session-details',
      'slot-selection',
      'payment-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      router.push(`/${orgSlug}`);
    }
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const getStepTitle = () => {
    switch (currentStep) {
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

  const canGoBack = currentStep !== 'session-details' && currentStep !== 'booking-confirmed';

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
              onClick={() => router.push(`/${orgSlug}`)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center">
            {getStepTitle()}
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentStep === 'session-details' && (
            <NewUserOnlineSessionDetails
              patientId={bookingData.patientId}
              onBack={goToPreviousStep}
              onContinue={(data: { serviceId: string; serviceDuration: number; servicePrice: number }) => {
                updateBookingData({
                  treatmentId: data.serviceId,
                  treatmentDuration: data.serviceDuration,
                  treatmentPrice: data.servicePrice,
                });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'slot-selection' && (
            <NewUserOnlineSlotSelection
              serviceDuration={bookingData.treatmentDuration}
              designation="Physiotherapist"
              onSlotSelect={(consultantId: string, slot: any) => {
                const slotDate = new Date(slot.startTimeRaw);
                updateBookingData({
                  consultantId,
                  centerId: slot.centerId,
                  centerName: slot.centerName,
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
              onNext={(appointmentId?: string) => {
                updateBookingData({ appointmentId });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <NewUserOnlineBookingConfirmed bookingData={bookingData} />
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

