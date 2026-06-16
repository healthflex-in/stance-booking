'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { NewUserOfflineBookingConfirmed, NewUserOfflinePaymentConfirmation, NewUserOfflineSessionDetails, NewUserOfflineSlotSelection } from '@/components/onboarding/new-user-offline';
import { parseBookingParams, storeBookingParamsInSession, captureUTMParams } from '@/utils/booking-params';
import { bookingStorage } from '@/utils/booking-storage';
import { resolveInitialStep } from '@/utils/booking-step-navigation';
import NewUserServiceModal from '@/components/onboarding/shared/NewUserServiceModal';

type BookingStep =
  | 'session-details'
  | 'slot-selection'
  | 'payment-confirmation'
  | 'booking-confirmed';

interface BookingData {
  sessionType: 'in-person';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  treatmentDuration: number;
  designation?: string;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
  isNewUser: boolean;
}

export default function NewOfflinePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('session-details');
  const analytics = useBookingAnalytics('new-offline');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showNewUserServiceModal, setShowNewUserServiceModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: 'in-person',
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
    captureUTMParams();
    setIsDesktop(window.innerWidth >= 768);
    analytics.trackFlowStart(process.env.NEXT_PUBLIC_ORGANIZATION_ID || '', bookingData.centerId);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const stepNames: Record<BookingStep, string> = {
      'session-details': 'Session Details',
      'slot-selection': 'Slot Availability',
      'payment-confirmation': 'Payment',
      'booking-confirmed': 'Booking Confirmed',
    };
    analytics.trackStepView(currentStep, { step_name: stepNames[currentStep] || currentStep });
  }, [currentStep, mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    // Check URL params first
    const parsedParams = parseBookingParams(searchParams);
    
    if (Object.keys(parsedParams).length > 0) {
      storeBookingParamsInSession(parsedParams);
      
      const initialStep = resolveInitialStep(parsedParams);
      
      // If no patientId, redirect to offline onboarding page
      // The params are already in session storage and will survive the redirect
      if (initialStep === 'onboarding') {
        router.replace(`/${orgSlug}/offline`);
        return;
      }
      
      // Map parsed params to bookingData
      const updates: Partial<BookingData> = {};
      if (parsedParams.patientId) updates.patientId = parsedParams.patientId;
      if (parsedParams.centerId) updates.centerId = parsedParams.centerId;

      // If this is a new-user-only service link but the patient already exists (repeat user),
      // block them from proceeding — show the modal instead
      const isNewUserServiceLink = parsedParams.isNewUserService === 'true'
        || sessionStorage.getItem('isNewUserService') === 'true';
      if (isNewUserServiceLink && parsedParams.patientId) {
        setShowNewUserServiceModal(true);
        setIsInitializing(false);
        return;
      }
      if (parsedParams.serviceId) updates.treatmentId = parsedParams.serviceId;
      if (parsedParams.consultantId) updates.consultantId = parsedParams.consultantId;
      if (parsedParams.consultantType) {
        updates.designation = parsedParams.consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist';
      }
      if (parsedParams.treatmentPrice) updates.treatmentPrice = parseInt(parsedParams.treatmentPrice);
      if (parsedParams.treatmentDuration) updates.treatmentDuration = parseInt(parsedParams.treatmentDuration);
      
      // Handle slotDate (date only) or slotStart/slotEnd (specific time slot)
      if (parsedParams.slotStart && parsedParams.slotEnd) {
        const slotStartDate = new Date(parseInt(parsedParams.slotStart) * 1000);
        const slotEndDate = new Date(parseInt(parsedParams.slotEnd) * 1000);
        updates.selectedTimeSlot = {
          startTime: slotStartDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
        updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        updates.selectedFullDate = slotStartDate;
      } else if (parsedParams.slotDate) {
        // Store slotDate in tab storage for slot selection component to use
        bookingStorage.setItem('slotDate', parsedParams.slotDate);
      }
      
      setBookingData(prev => ({ ...prev, ...updates }));
      
      // Map DynamicBookingStep to this page's BookingStep type
      const stepMap: Record<string, BookingStep> = {
        'center-selection': 'session-details',
        'session-details': 'session-details',
        'slot-selection': 'slot-selection',
        'payment-confirmation': 'payment-confirmation',
        'booking-confirmed': 'booking-confirmed',
      };
      setCurrentStep(stepMap[initialStep] || 'session-details');
      
      // Clean up URL by removing query params (data is now in sessionStorage)
      router.replace(`/${orgSlug}/offline/new`, { scroll: false });
      
      // Add a small delay to ensure loading screen is visible
      setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      return;
    }
    
    // Fallback to tab storage — read ALL stored params, not just patientId/centerId
    const storedPatientId = bookingStorage.getItem('patientId');
    const storedCenterId = bookingStorage.getItem('centerId');
    const storedServiceId = bookingStorage.getItem('serviceId');
    const storedConsultantId = bookingStorage.getItem('consultantId');
    const storedConsultantType = bookingStorage.getItem('consultantType');
    const storedTreatmentPrice = bookingStorage.getItem('treatmentPrice');
    const storedTreatmentDuration = bookingStorage.getItem('treatmentDuration');
    const storedSlotStart = bookingStorage.getItem('slotStart');
    const storedSlotEnd = bookingStorage.getItem('slotEnd');
    
    if (storedPatientId) {
      const updates: Partial<BookingData> = {
        patientId: storedPatientId,
        centerId: storedCenterId || '',
      };
      if (storedServiceId) updates.treatmentId = storedServiceId;
      if (storedConsultantId) updates.consultantId = storedConsultantId;
      if (storedConsultantType) {
        updates.designation = storedConsultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist';
      }
      if (storedTreatmentPrice) updates.treatmentPrice = parseInt(storedTreatmentPrice);
      if (storedTreatmentDuration) updates.treatmentDuration = parseInt(storedTreatmentDuration);
      if (storedSlotStart && storedSlotEnd) {
        const slotStartDate = new Date(parseInt(storedSlotStart) * 1000);
        const slotEndDate = new Date(parseInt(storedSlotEnd) * 1000);
        updates.selectedTimeSlot = {
          startTime: slotStartDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
        updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        updates.selectedFullDate = slotStartDate;
      }
      // Note: slotDate is already in sessionStorage if it was provided
      
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
    }
    setIsInitializing(false);
  }, [mounted, searchParams]);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'session-details',
      'slot-selection',
      'payment-confirmation',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      analytics.trackStepComplete(currentStep);
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
        return 'New User - In Center';
    }
  };

  const canGoBack = currentStep !== 'session-details' && currentStep !== 'booking-confirmed';

  // Show loading screen while initializing
  if (!mounted || isInitializing) {    const LoadingScreen = () => (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );

    // For desktop, wrap in container
    if (isDesktop) {
      return (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gray-100" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ height: '90vh' }}>
              <LoadingScreen />
            </div>
          </div>
        </div>
      );
    }

    return <LoadingScreen />;
  }

  const BookingContent = () => (
    <>
      <div className="h-full bg-gray-50 flex flex-col">        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
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
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center ml-6">
            {getStepTitle()}
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentStep === 'session-details' && (
            <NewUserOfflineSessionDetails
              patientId={bookingData.patientId}
              centerId={bookingData.centerId}
              serviceId={bookingData.treatmentId}
              onBack={goToPreviousStep}
              onContinue={(data) => {
                updateBookingData({
                  centerId: data.centerId,
                  treatmentId: data.serviceId,
                  treatmentDuration: data.serviceDuration,
                  treatmentPrice: data.servicePrice,
                  designation: data.designation,
                });
                goToNextStep();
              }}
              analytics={analytics}
            />
          )}

          {currentStep === 'slot-selection' && (
            <NewUserOfflineSlotSelection
              centerId={bookingData.centerId}
              serviceDuration={bookingData.treatmentDuration}
              patientId={bookingData.patientId}
              designation={bookingData.designation}
              preSelectedDate={bookingStorage.getItem('slotDate') || undefined}
              preSelectedSlot={bookingData.selectedTimeSlot.startTime ? bookingData.selectedTimeSlot : undefined}
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
              analytics={analytics}
            />
          )}

          {currentStep === 'payment-confirmation' && (
            <NewUserOfflinePaymentConfirmation
              bookingData={bookingData}
              onNext={goToNextStep}
              analytics={analytics}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <NewUserOfflineBookingConfirmed bookingData={bookingData} analytics={analytics} />
          )}
        </div>
      </div>
    </>
  );

  // Desktop container view
  if (isDesktop) {
    return (
      <>
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
        <NewUserServiceModal
          isOpen={showNewUserServiceModal}
          onClose={() => router.replace(`/${orgSlug}`)}
          onCallNow={() => { window.location.href = 'tel:+919019410049'; }}
          isInDesktopContainer={true}
        />
      </>
    );
  }

  // Mobile view
  return (
    <>
      <BookingContent />
      <NewUserServiceModal
        isOpen={showNewUserServiceModal}
        onClose={() => router.replace(`/${orgSlug}`)}
        onCallNow={() => { window.location.href = 'tel:+919019410049'; }}
        isInDesktopContainer={isDesktop}
      />
    </>
  );
}
