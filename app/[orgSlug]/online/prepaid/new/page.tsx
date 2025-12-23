'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { CREATE_APPOINTMENT, UPDATE_PATIENT } from '@/gql/queries';
import { getBookingCookies } from '@/utils/booking-cookies';
import { PrepaidNewSessionDetails } from '@/components/onboarding/prepaid-new';
import { PrepaidNewSlotSelection } from '@/components/onboarding/prepaid-new';
import { PrepaidNewConfirmation } from '@/components/onboarding/prepaid-new';
import { PrepaidNewBookingConfirmed } from '@/components/onboarding/prepaid-new';

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
  appointmentId?: string;
  designation?: string;
}

export default function PrepaidNewPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('session-details');
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const [bookingData, setBookingData] = useState<BookingData>({
    patientId: '',
    centerId: '',
    consultantId: '',
    treatmentId: '',
    treatmentPrice: 0,
    treatmentDuration: 20,
    selectedDate: '',
    selectedTimeSlot: { startTime: '', endTime: '', displayTime: '' },
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
      setBookingData(prev => ({ ...prev, patientId: storedPatientId }));
      sessionStorage.removeItem('patientId');
    } else {
      router.push(`/${orgSlug}`);
    }
  }, [mounted, router, orgSlug]);

  const goToNextStep = () => {
    const stepOrder: BookingStep[] = ['session-details', 'slot-selection', 'confirmation', 'booking-confirmed'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) setCurrentStep(stepOrder[currentIndex + 1]);
  };

  const goToPreviousStep = () => {
    const stepOrder: BookingStep[] = ['session-details', 'slot-selection', 'confirmation', 'booking-confirmed'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) setCurrentStep(stepOrder[currentIndex - 1]);
    else router.push(`/${orgSlug}`);
  };

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const handleSlotSelect = (consultantId: string, slot: any) => {
    const slotDate = new Date(slot.startTimeRaw);
    setBookingData(prev => ({
      ...prev,
      consultantId,
      centerId: slot.centerId || prev.centerId,
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
      const input = {
        patient: bookingData.patientId,
        consultant: bookingData.consultantId || null,
        treatment: bookingData.treatmentId,
        medium: 'ONLINE',
        notes: 'Prepaid appointment',
        center: bookingData.centerId,
        category: 'WEBSITE',
        status: 'PRE_PAID',
        visitType: 'FIRST_VISIT',
        event: {
          startTime: new Date(bookingData.selectedTimeSlot.startTime).getTime(),
          endTime: new Date(bookingData.selectedTimeSlot.endTime).getTime(),
        },
      };

      const appointmentResult = await createAppointment({ variables: { input } });
      const appointmentId = appointmentResult.data?.createAppointment?._id;
      
      if (appointmentId) {
        // Update patient status to ACTIVE for prepaid bookings
        try {
          await updatePatient({
            variables: {
              patientId: bookingData.patientId,
              input: {
                status: 'ACTIVE',
              },
            },
          });
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.log('✅ Patient status updated to ACTIVE');
          }
        } catch (error) {
          console.error('❌ Failed to update patient status:', error);
        }
        
        setBookingData(prev => ({ ...prev, appointmentId }));
        goToNextStep();
      } else {
        throw new Error('Appointment creation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
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
      default: return 'Prepaid New User';
    }
  };

  const canGoBack = currentStep !== 'session-details' && currentStep !== 'booking-confirmed';

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <PrepaidNewSessionDetails
            patientId={bookingData.patientId}
            onBack={goToPreviousStep}
            onContinue={(data) => {
              updateBookingData({
                treatmentId: data.serviceId,
                treatmentDuration: data.serviceDuration,
                treatmentPrice: data.servicePrice,
                designation: data.designation,
              });
              goToNextStep();
            }}
          />
        )}

        {currentStep === 'slot-selection' && (
          <PrepaidNewSlotSelection
            serviceDuration={bookingData.treatmentDuration}
            designation={bookingData.designation}
            onSlotSelect={handleSlotSelect}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === 'confirmation' && (
          <PrepaidNewConfirmation
            bookingData={bookingData}
            onConfirm={handleConfirmBooking}
            isCreating={isCreatingAppointment}
          />
        )}

        {currentStep === 'booking-confirmed' && (
          <PrepaidNewBookingConfirmed bookingData={bookingData} />
        )}
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
              <BookingContent />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <BookingContent />;
}

