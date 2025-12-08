'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useLazyQuery } from '@apollo/client';
import { VALIDATE_ONBOARDING_TOKEN } from '@/gql/queries';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import { MobilePatientOnboarding, MobilePaymentSuccess } from '../shared';
import MobileCenterSelection from './MobileCenterSelection';
import MobileSessionSelection from './MobileSessionSelection';
import MobileSessionDetails from './MobileSessionDetails';
import MobileBookingConfirmation from './MobileBookingConfirmation';
import MobileBookingConfirmed from './MobileBookingConfirmed';
import { useHealthFlexAnalytics } from '@/services/analytics';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';

export type MobileBookingStep =
  | 'patient-onboarding'
  | 'center-selection'
  // | 'consultant-selection'
  // | 'treatment-selection'
  | 'session-details'
  | 'booking-confirmation'
  | 'payment-success'
  | 'booking-confirmed';

interface MobileBookingData {
  sessionType: 'in-person' | 'online' | null;
  location: string;
  selectedDate: string;
  selectedTimeSlot: string | { startTime: string; endTime: string; displayTime: string };
  selectedFullDate?: Date;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  patientId: string;
  centerId: string;
  assessmentType?: 'in-person' | 'online';
}

export default function MobileBookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useHealthFlexAnalytics();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [sessionStartTime] = useState(Date.now());
  const [stepStartTime, setStepStartTime] = useState(Date.now());

  // Initialize step based on URL parameters
  const getInitialStep = (): MobileBookingStep => {
    const patientId = searchParams.get('patientId');
    const centerId = searchParams.get('centerId');
    const serviceId = searchParams.get('serviceId');
    const slotStart = searchParams.get('slotStart');
    const slotEnd = searchParams.get('slotEnd');
    const defaultCenterId = process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c';

    // If centerId is default center, go to center selection
    if (patientId && centerId === defaultCenterId && serviceId) {
      return 'center-selection';
    }

    // If patient, center, service exist but no slots, go to session details
    if (patientId && centerId && serviceId && (!slotStart || !slotEnd)) {
      return 'session-details';
    }

    // If all booking params exist, go directly to confirmation
    if (patientId && centerId && serviceId && slotStart && slotEnd) {
      return 'booking-confirmation';
    }
    
    return 'patient-onboarding';
  };

  const [currentStep, setCurrentStep] = useState<MobileBookingStep>(
    getInitialStep()
  );
  const [bookingData, setBookingData] = useState<MobileBookingData>(() => {
    const patientId = searchParams.get('patientId');
    const centerId = searchParams.get('centerId');
    const serviceId = searchParams.get('serviceId');
    const slotStart = searchParams.get('slotStart');
    const slotEnd = searchParams.get('slotEnd');
    const consultantId = searchParams.get('consultantId');
    const assessmentType = searchParams.get('assessmentType') as 'in-person' | 'online' || 'in-person';

    // If URL params exist with slots, pre-fill booking data
    if (patientId && centerId && serviceId && slotStart && slotEnd) {
      return {
        sessionType: assessmentType === 'online' ? 'online' : 'in-person',
        location: '',
        selectedDate: '',
        selectedTimeSlot: {
          startTime: new Date(parseInt(slotStart) * 1000).toISOString(),
          endTime: new Date(parseInt(slotEnd) * 1000).toISOString(),
          displayTime: `${new Date(parseInt(slotStart) * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(parseInt(slotEnd) * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        },
        selectedFullDate: new Date(parseInt(slotStart) * 1000),
        consultantId: consultantId || '',
        treatmentId: serviceId,
        treatmentPrice: 0,
        patientId: patientId,
        centerId: centerId,
        assessmentType: assessmentType,
      };
    }

    // If URL params exist without slots, pre-fill partial data
    if (patientId && centerId && serviceId) {
      return {
        sessionType: assessmentType === 'online' ? 'online' : 'in-person',
        location: '',
        selectedDate: '',
        selectedTimeSlot: '',
        consultantId: consultantId || '',
        treatmentId: serviceId,
        treatmentPrice: 0,
        patientId: patientId,
        centerId: centerId,
        assessmentType: assessmentType,
      };
    }

    const defaultCenterId = process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c';
    return {
      sessionType: assessmentType === 'online' ? 'online' : 'in-person',
      location: '',
      selectedDate: '',
      selectedTimeSlot: '',
      consultantId: '',
      treatmentId: '',
      treatmentPrice: 0,
      patientId: '',
      centerId: defaultCenterId,
      assessmentType: assessmentType,
    };
  });
  const [tokenValidated, setTokenValidated] = useState(false);

  const [validateToken] = useLazyQuery(VALIDATE_ONBOARDING_TOKEN, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const tokenData = data.validateOnboardingToken;
      if (tokenData) {
        // Pre-fill booking data from token
        setBookingData((prev) => ({
          ...prev,
          patientId: tokenData.patient?._id || '',
          centerId: tokenData.centerId,
          treatmentId: tokenData.serviceId,
          consultantId: tokenData.consultantId || '',
          selectedTimeSlot: {
            startTime: new Date(tokenData.slotStart * 1000).toISOString(),
            endTime: new Date(tokenData.slotEnd * 1000).toISOString(),
            displayTime: `${new Date(tokenData.slotStart * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(tokenData.slotEnd * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
          },
          selectedFullDate: new Date(tokenData.slotStart * 1000),
        }));
        setTokenValidated(true);
        
        // If returning user, skip directly to confirmation
        if (tokenData.isReturningUser && tokenData.patient?._id) {
          setCurrentStep('booking-confirmation');
        } else {
          // New user - go to patient onboarding with pre-filled data
          setCurrentStep('patient-onboarding');
        }
      }
    },
    onError: (error) => {
      console.error('Token validation error:', error);
      mobileAnalytics.trackError('token_validation_failed', error.message, 'onboarding_flow');
      // Fallback to normal flow
      setCurrentStep('patient-onboarding');
    },
  });

  useEffect(() => {
    // Track mobile flow start
    const source = searchParams.get('source') as 'direct' | 'qr_code' | 'link' | 'referral' || 'direct';
    mobileAnalytics.trackMobileFlowStart(source, bookingData.centerId);
    mobileAnalytics.trackSessionStart();
    
    // Track booking start when component mounts
    if (bookingData.centerId) {
      analytics.trackAppointmentBookingStart(
        bookingData.centerId,
        bookingData.patientId || undefined,
        'mobile'
      );
    }
  }, []);

  useEffect(() => {
    const stepEndTime = Date.now();
    const timeSpentOnPreviousStep = stepEndTime - stepStartTime;
    
    if (bookingData.centerId) {
      analytics.trackAppointmentBookingStep(
        currentStep,
        bookingData.centerId,
        bookingData.patientId || undefined,
        bookingData.consultantId || undefined
      );
      
      // Track step timing
      if (timeSpentOnPreviousStep > 1000) { // Only track if more than 1 second
        mobileAnalytics.trackLoadTime(`step_${currentStep}`, timeSpentOnPreviousStep);
      }
    }
    
    setStepStartTime(Date.now());
  }, [currentStep]);

  // Step navigation
  const goToNextStep = () => {
    const paymentType = searchParams.get('paymentType');
    const needsPayment = paymentType !== 'null';
    
    const stepOrder: MobileBookingStep[] = [
      'patient-onboarding',
      'center-selection',
      'session-details',
      'booking-confirmation',
      ...(needsPayment ? ['payment-success' as MobileBookingStep] : []),
      'booking-confirmed',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: MobileBookingStep[] = [
      'patient-onboarding',
      'center-selection',
      'session-details',
      'booking-confirmation',
      'payment-success',
      'booking-confirmed',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Track back button click
    mobileAnalytics.trackButtonClick('back_button', currentStep, {
      current_step_index: currentIndex,
      total_steps: stepOrder.length
    });

    if (currentStep === 'booking-confirmed') {
      // Track session end
      const sessionDuration = Date.now() - sessionStartTime;
      mobileAnalytics.trackSessionEnd(sessionDuration, stepOrder.length, 100);
      window.location.href = "/onboarding-patient";
      return;
    }
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      // Track exit intent
      const timeSpent = Date.now() - sessionStartTime;
      const completionPercentage = (currentIndex / stepOrder.length) * 100;
      mobileAnalytics.trackExitIntent(currentStep, timeSpent, completionPercentage);
      router.back();
    }
  };

  const updateBookingData = useCallback((updates: Partial<MobileBookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  }, []);

  const getStepTitle = () => {
    switch (currentStep) {
      case 'patient-onboarding':
        return 'Stance Health';
      case 'center-selection':
        return 'Select Center';

      case 'session-details':
        return 'Session Details';
      case 'booking-confirmation':
        return 'Booking Confirmation';
      case 'payment-success':
        return 'Payment Completed';
      case 'booking-confirmed':
        return 'Booking Confirmed';
      default:
        return 'Book Appointment';
    }
  };

const canGoBack = currentStep !== 'payment-success' && currentStep !== 'patient-onboarding' && currentStep !== 'booking-confirmed';


  return (
    <>
      {/* Load Razorpay Script */}
      <RazorpayScriptLoader />

      <div className="h-full bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          {canGoBack && (
            <button
              onClick={goToPreviousStep}
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

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'patient-onboarding' && (
            <MobilePatientOnboarding
              centerId={bookingData.centerId}
              onNext={goToNextStep}
              onPatientCreated={(patientId) => updateBookingData({ patientId })}
            />
          )}

          {currentStep === 'center-selection' && (
            <MobileCenterSelection
              selectedCenterId={bookingData.centerId}
              onCenterSelect={(centerId) => updateBookingData({ centerId })}
              onNext={goToNextStep}
              patientId={bookingData.patientId}
            />
          )}


          {currentStep === 'session-details' && (
            <MobileSessionDetails
              bookingData={bookingData}
              onUpdateData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'booking-confirmation' && (
            <MobileBookingConfirmation
              bookingData={bookingData}
              onUpdateData={updateBookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'payment-success' && (
            <MobilePaymentSuccess
              bookingData={bookingData}
              onNext={goToNextStep}
            />
          )}

          {currentStep === 'booking-confirmed' && (
            <MobileBookingConfirmed bookingData={bookingData} />
          )}
        </div>
      </div>
    </>
  );
}