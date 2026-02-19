'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, UPDATE_PATIENT, GET_USER, SEND_APPOINTMENT_EMAIL } from '@/gql/queries';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import {
  RepeatUserOfflineSessionDetails,
  RepeatUserOfflineBookingConfirmed,
  RepeatUserOfflineSlotSelection,
  RepeatUserOfflineConfirmation,
} from '@/components/onboarding/repeat-user-offline';
import { getBookingCookies } from '@/utils/booking-cookies';
import { parseBookingParams, storeBookingParamsInSession } from '@/utils/booking-params';
import { resolveInitialStep } from '@/utils/booking-step-navigation';

type BookingStep = 'session-details' | 'slot-selection' | 'confirmation' | 'booking-confirmed';

interface BookingData {
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  treatmentDuration: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
  sessionType: 'in-person';
  designation?: string;
  appointmentId?: string;
}

export default function RepeatOfflinePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('session-details');
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const analytics = useBookingAnalytics('repeat-offline');
  const [bookingData, setBookingData] = useState<BookingData>({
    patientId: '',
    centerId: '',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    treatmentDuration: 20,
    selectedDate: '',
    selectedTimeSlot: { startTime: '', endTime: '', displayTime: '' },
    sessionType: 'in-person',
  });

  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);
  
  const { data: patientData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
    fetchPolicy: 'cache-first',
    errorPolicy: 'ignore',
  });

  useEffect(() => {
    setMounted(true);
    const cookies = getBookingCookies();
    analytics.trackFlowStart(cookies.organizationId || '', cookies.centerId || undefined);
  }, [analytics]);

  useEffect(() => {
    analytics.trackStepView(currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (!mounted) return;
    
    const parsedParams = parseBookingParams(searchParams);
    
    if (Object.keys(parsedParams).length > 0) {
      storeBookingParamsInSession(parsedParams);
      
      const initialStep = resolveInitialStep(parsedParams);
      
      // If no patientId, redirect to offline onboarding page
      if (initialStep === 'onboarding') {
        router.replace(`/${orgSlug}/offline`);
        return;
      }
      
      const updates: Partial<BookingData> = {};
      if (parsedParams.patientId) updates.patientId = parsedParams.patientId;
      if (parsedParams.centerId) updates.centerId = parsedParams.centerId;
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
        updates.selectedTimeSlot = {
          startTime: slotStartDate.toISOString(),
          endTime: new Date(parseInt(parsedParams.slotEnd) * 1000).toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
        updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        updates.selectedFullDate = slotStartDate;
      } else if (parsedParams.slotDate) {
        // Store slotDate in sessionStorage for slot selection component to use
        sessionStorage.setItem('slotDate', parsedParams.slotDate);
      }
      
      updateBookingData(updates);
      
      // Map DynamicBookingStep to this page's BookingStep type
      const stepMap: Record<string, BookingStep> = {
        'center-selection': 'session-details',
        'session-details': 'session-details',
        'slot-selection': 'slot-selection',
        'payment-confirmation': 'confirmation',
        'booking-confirmed': 'booking-confirmed',
      };
      setCurrentStep(stepMap[initialStep] || 'session-details');
      return;
    }
    
    // Fallback to sessionStorage — read ALL stored params
    if (typeof window !== 'undefined') {
      const storedPatientId = sessionStorage.getItem('patientId');
      const storedCenterId = sessionStorage.getItem('centerId');
      if (storedPatientId) {
        const storedServiceId = sessionStorage.getItem('serviceId');
        const storedConsultantId = sessionStorage.getItem('consultantId');
        const storedConsultantType = sessionStorage.getItem('consultantType');
        const storedTreatmentPrice = sessionStorage.getItem('treatmentPrice');
        const storedTreatmentDuration = sessionStorage.getItem('treatmentDuration');
        const storedSlotStart = sessionStorage.getItem('slotStart');
        const storedSlotEnd = sessionStorage.getItem('slotEnd');
        
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
          updates.selectedTimeSlot = {
            startTime: slotStartDate.toISOString(),
            endTime: new Date(parseInt(storedSlotEnd) * 1000).toISOString(),
            displayTime: slotStartDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          };
          updates.selectedDate = slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          updates.selectedFullDate = slotStartDate;
        }
        
        updateBookingData(updates);
        
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
          'payment-confirmation': 'confirmation',
          'booking-confirmed': 'booking-confirmed',
        };
        setCurrentStep(stepMap[resolvedStep] || 'session-details');
      } else if (storedCenterId) {
        updateBookingData({ centerId: storedCenterId });
      }
    }
  }, [mounted, searchParams]);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = [
      'session-details',
      'slot-selection',
      'confirmation',
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
      'confirmation',
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

  const handleSlotSelect = (consultantId: string, slot: any) => {
    const slotDate = new Date(slot.startTimeRaw);
    setBookingData(prev => ({
      ...prev,
      consultantId,
      selectedTimeSlot: {
        startTime: new Date(slot.startTimeRaw).toISOString(),
        endTime: new Date(slot.endTimeRaw).toISOString(),
        displayTime: slot.displayTime
      },
      selectedDate: slotDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      selectedFullDate: slotDate,
    }));
    goToNextStep();
  };

  const handleConfirmBooking = async () => {
    if (isCreatingAppointment) return;
    
    setIsCreatingAppointment(true);
    try {
      const existingCenters = patientData?.user?.profileData?.centers || [];
      const centerIds = existingCenters.map((c: any) => c._id);
      
      if (!centerIds.includes(bookingData.centerId)) {
        try {
          await updatePatient({
            variables: {
              patientId: bookingData.patientId,
              input: {
                centers: [...centerIds, bookingData.centerId],
              },
            },
          });
        } catch (error) {
          console.error('Failed to add center to patient:', error);
        }
      }
      
      const input = {
        patient: bookingData.patientId,
        consultant: bookingData.consultantId || null,
        treatment: bookingData.treatmentId,
        medium: 'IN_PERSON',
        notes: '',
        center: bookingData.centerId,
        category: 'WEBSITE',
        status: 'BOOKED',
        visitType: 'FOLLOW_UP',
        event: {
          startTime: new Date(bookingData.selectedTimeSlot.startTime).getTime(),
          endTime: new Date(bookingData.selectedTimeSlot.endTime).getTime(),
        },
      };

      const appointmentResult = await createAppointment({
        variables: { input },
      });

      const appointmentId = appointmentResult.data?.createAppointment?._id;
      if (appointmentId) {
        setBookingData(prev => ({ ...prev, appointmentId }));
        goToNextStep();
      } else {
        throw new Error('Appointment creation failed - no ID returned');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(error.message || 'Failed to create appointment. Please try again.');
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'session-details': return 'Session Details';
      case 'slot-selection': return 'Slot Availability';
      case 'confirmation': return 'Confirm Booking';
      case 'booking-confirmed': return 'Booking Confirmed';
      default: return 'Repeat User - In Center';
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
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        {canGoBack && (
          <button onClick={goToPreviousStep} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {!canGoBack && (
          <button onClick={() => router.push(`/${orgSlug}`)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center ml-6">{getStepTitle()}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-hidden">
        {currentStep === 'session-details' && (
          <RepeatUserOfflineSessionDetails
            patientId={bookingData.patientId}
            centerId={bookingData.centerId}
            serviceId={bookingData.treatmentId || undefined}
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
          <RepeatUserOfflineSlotSelection
            centerId={bookingData.centerId}
            serviceDuration={bookingData.treatmentDuration}
            designation={bookingData.designation}
            preSelectedDate={sessionStorage.getItem('slotDate') || undefined}
            onSlotSelect={handleSlotSelect}
            onBack={goToPreviousStep}
            analytics={analytics}
          />
        )}

        {currentStep === 'confirmation' && (
          <RepeatUserOfflineConfirmation
            bookingData={bookingData}
            onConfirm={handleConfirmBooking}
            isCreating={isCreatingAppointment}
          />
        )}

        {currentStep === 'booking-confirmed' && (
          <RepeatUserOfflineBookingConfirmed bookingData={bookingData} />
        )}
      </div>
    </div>
  );

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

  return <BookingContent />;
}

