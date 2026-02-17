'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getBookingCookies } from '@/utils/booking-cookies';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { parseBookingParams, storeBookingParamsInSession } from '@/utils/booking-params';
import { resolveInitialStep } from '@/utils/booking-step-navigation';

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
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const analytics = useBookingAnalytics('new-online');
  
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
    
    // Track flow start
    if (cookies.organizationId) {
      analytics.trackFlowStart(cookies.organizationId, cookies.centerId || undefined);
    }
  }, [orgSlug, router, analytics]);

  useEffect(() => {
    if (!mounted) return;
    
    const parsedParams = parseBookingParams(searchParams);
    
    if (Object.keys(parsedParams).length > 0) {
      storeBookingParamsInSession(parsedParams);
      
      const initialStep = resolveInitialStep(parsedParams);
      
      // If no patientId, redirect to online onboarding page
      if (initialStep === 'onboarding') {
        router.replace(`/${orgSlug}/online`);
        return;
      }
      
      const updates: Partial<BookingData> = {};
      if (parsedParams.patientId) updates.patientId = parsedParams.patientId;
      if (parsedParams.centerId) updates.centerId = parsedParams.centerId;
      if (parsedParams.serviceId) updates.treatmentId = parsedParams.serviceId;
      if (parsedParams.consultantId) updates.consultantId = parsedParams.consultantId;
      if (parsedParams.treatmentPrice) updates.treatmentPrice = parseInt(parsedParams.treatmentPrice);
      if (parsedParams.treatmentDuration) updates.treatmentDuration = parseInt(parsedParams.treatmentDuration);
      if (parsedParams.slotStart && parsedParams.slotEnd) {
        const slotStartDate = new Date(parseInt(parsedParams.slotStart) * 1000);
        updates.selectedTimeSlot = {
          startTime: slotStartDate.toISOString(),
          endTime: new Date(parseInt(parsedParams.slotEnd) * 1000).toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
        updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        updates.selectedFullDate = slotStartDate;
      }
      
      setBookingData(prev => ({ ...prev, ...updates }));
      
      const stepMap: Record<string, BookingStep> = {
        'center-selection': 'session-details',
        'session-details': 'session-details',
        'slot-selection': 'slot-selection',
        'payment-confirmation': 'payment-confirmation',
        'booking-confirmed': 'booking-confirmed',
      };
      setCurrentStep(stepMap[initialStep] || 'session-details');
      return;
    }
    
    // Fallback to sessionStorage — read ALL stored params
    const storedPatientId = sessionStorage.getItem('patientId');
    if (storedPatientId) {
      const storedCenterId = sessionStorage.getItem('centerId');
      const storedServiceId = sessionStorage.getItem('serviceId');
      const storedConsultantId = sessionStorage.getItem('consultantId');
      const storedTreatmentPrice = sessionStorage.getItem('treatmentPrice');
      const storedTreatmentDuration = sessionStorage.getItem('treatmentDuration');
      const storedSlotStart = sessionStorage.getItem('slotStart');
      const storedSlotEnd = sessionStorage.getItem('slotEnd');
      
      const updates: Partial<BookingData> = { patientId: storedPatientId };
      if (storedCenterId) updates.centerId = storedCenterId;
      if (storedServiceId) updates.treatmentId = storedServiceId;
      if (storedConsultantId) updates.consultantId = storedConsultantId;
      if (storedTreatmentPrice) updates.treatmentPrice = parseInt(storedTreatmentPrice);
      if (storedTreatmentDuration) updates.treatmentDuration = parseInt(storedTreatmentDuration);
      if (storedSlotStart && storedSlotEnd) {
        const slotStartDate = new Date(parseInt(storedSlotStart) * 1000);
        updates.selectedTimeSlot = {
          startTime: slotStartDate.toISOString(),
          endTime: new Date(parseInt(storedSlotEnd) * 1000).toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
        updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        updates.selectedFullDate = slotStartDate;
      }
      
      setBookingData(prev => ({ ...prev, ...updates }));
      
      // Resolve the correct step based on what data we have
      const resolvedStep = resolveInitialStep({
        patientId: storedPatientId,
        centerId: storedCenterId || undefined,
        serviceId: storedServiceId || undefined,
        slotStart: storedSlotStart || undefined,
        slotEnd: storedSlotEnd || undefined,
        treatmentPrice: storedTreatmentPrice || undefined,
      });
      
      const stepMap: Record<string, BookingStep> = {
        'center-selection': 'session-details',
        'session-details': 'session-details',
        'slot-selection': 'slot-selection',
        'payment-confirmation': 'payment-confirmation',
        'booking-confirmed': 'booking-confirmed',
      };
      setCurrentStep(stepMap[resolvedStep] || 'session-details');
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [mounted, orgSlug, router, searchParams]);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'session-details',
      'slot-selection',
      'payment-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      analytics.trackStepComplete(currentStep);
      setCurrentStep(nextStep);
      analytics.trackStepView(nextStep);
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
      analytics.trackBackNavigation(currentStep);
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      analytics.trackExitIntent(currentStep, 0);
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
              analytics={analytics}
              onBack={goToPreviousStep}
              onContinue={(data: { serviceId: string; serviceDuration: number; servicePrice: number }) => {
                analytics.trackServiceSelected(data.serviceId, 'Service', data.servicePrice, data.serviceDuration);
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
              preSelectedDate={sessionStorage.getItem('slotDate') || undefined}
              analytics={analytics}
              onSlotSelect={(consultantId: string, slot: any) => {
                const slotDate = new Date(slot.startTimeRaw);
                analytics.trackSlotSelected(consultantId, slot.displayTime, slot.centerId);
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
              analytics={analytics}
              onNext={(appointmentId?: string) => {
                updateBookingData({ appointmentId });
                goToNextStep();
              }}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <NewUserOnlineBookingConfirmed 
              bookingData={bookingData}
              analytics={analytics}
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

