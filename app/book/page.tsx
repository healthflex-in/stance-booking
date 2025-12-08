'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import { MobilePatientOnboarding, MobilePaymentSuccess } from '@/components/onboarding/shared';
import {
  MobileCenterSelection,
  MobileSessionDetails,
  MobileBookingConfirmation,
  MobileBookingConfirmed,
} from '@/components/onboarding/regular';

type BookingStep =
  | 'patient-onboarding'
  | 'center-selection'
  | 'session-details'
  | 'booking-confirmation'
  | 'payment-success'
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
  patientId: string;
  centerId: string;
  assessmentType?: 'in-person' | 'online';
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient-onboarding');
  const [showBookingTypeModal, setShowBookingTypeModal] = useState(true);
  const [showSessionTypeModal, setShowSessionTypeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    sessionType: null,
    location: '',
    selectedDate: '',
    selectedTimeSlot: '',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    patientId: '',
    centerId: process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '67fe36545e42152fb5185a6c',
    assessmentType: 'in-person',
  });

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'patient-onboarding',
      'center-selection',
      'session-details',
      'booking-confirmation',
      'payment-success',
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
      'center-selection',
      'session-details',
      'booking-confirmation',
      'payment-success',
      'booking-confirmed',
    ];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showSessionTypeModal) {
    const SessionTypeModal = () => (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Choose Session Type</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            <button
              onClick={() => {
                // Store patient data in session storage before routing
                sessionStorage.setItem('patientId', bookingData.patientId);
                sessionStorage.setItem('centerId', bookingData.centerId);
                if (isNewUser) {
                  router.push('/book/new-online');
                } else {
                  router.push('/book/repeat-online');
                }
              }}
              className="w-full py-6 text-black font-semibold rounded-xl transition-all text-left px-6"
              style={{ backgroundColor: '#DDFE71' }}
            >
              <div className="text-xl font-bold mb-1">Online Consultation</div>
              <div className="text-sm text-gray-700">Video consultation with our experts</div>
            </button>
            <button
              onClick={() => {
                // Store patient data in session storage before routing
                sessionStorage.setItem('patientId', bookingData.patientId);
                sessionStorage.setItem('centerId', bookingData.centerId);
                if (isNewUser) {
                  updateBookingData({ sessionType: 'in-person', assessmentType: 'in-person' });
                  setShowSessionTypeModal(false);
                  goToNextStep();
                } else {
                  router.push('/book/repeat-offline');
                }
              }}
              className="w-full py-6 border-2 text-black font-semibold rounded-xl hover:border-gray-400 transition-all text-left px-6"
              style={{ borderColor: '#DDFE71', backgroundColor: 'transparent' }}
            >
              <div className="text-xl font-bold mb-1">In-Center Consultation</div>
              <div className="text-sm text-gray-600">Visit our center for consultation</div>
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ height: '90vh' }}>
              <div className="h-full overflow-y-auto">
                <SessionTypeModal />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <SessionTypeModal />;
  }

  if (showBookingTypeModal) {
    const ModalContent = () => (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900">Choose Booking Type</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            <button
              onClick={() => setShowBookingTypeModal(false)}
              className="w-full py-6 text-black font-semibold rounded-xl transition-all text-left px-6"
              style={{ backgroundColor: '#DDFE71' }}
            >
              <div className="text-xl font-bold mb-1">Online Booking</div>
              <div className="text-sm text-gray-700">Book appointments with consultants</div>
            </button>
            <button
              onClick={() => router.push('/book-prepaid')}
              className="w-full py-6 border-2 text-black font-semibold rounded-xl hover:border-gray-400 transition-all text-left px-6"
              style={{ borderColor: '#DDFE71', backgroundColor: 'transparent' }}
            >
              <div className="text-xl font-bold mb-1">Pre-Paid Online Services</div>
              <div className="text-sm text-gray-600">Browse and book online services</div>
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ height: '90vh' }}>
              <div className="h-full overflow-y-auto">
                <ModalContent />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <ModalContent />;
  }

  const BookingContent = () => (
    <>
      <RazorpayScriptLoader />
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
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center ml-6">
            {getStepTitle()}
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-hidden">
          {currentStep === 'patient-onboarding' && (
            <MobilePatientOnboarding
              centerId={bookingData.centerId}
              onNext={() => {
                // Show session type selection modal after patient creation
                setShowSessionTypeModal(true);
              }}
              onPatientCreated={(patientId, isNewUser) => {
                updateBookingData({ patientId });
                setIsNewUser(isNewUser);
              }}
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

export default function BookPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BookPageContent />
    </React.Suspense>
  );
}
