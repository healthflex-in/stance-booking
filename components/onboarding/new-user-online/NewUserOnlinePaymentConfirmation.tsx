'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT, UPDATE_PATIENT, SEND_APPOINTMENT_EMAIL } from '@/gql/queries';
import NewUserOnlinePaymentProcessing from './NewUserOnlinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { EmailCollectionModal } from '@/components/onboarding/shared';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';

interface BookingData {
  sessionType: 'online' | 'in-person';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
}

import { BookingAnalytics } from '@/services/booking-analytics';

interface NewUserOnlinePaymentConfirmationProps {
  bookingData: BookingData;
  onNext: (appointmentId: string) => void;
  analytics: BookingAnalytics;
}

export default function NewUserOnlinePaymentConfirmation({
  bookingData,
  onNext,
  analytics,
}: NewUserOnlinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [amountError, setAmountError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  React.useEffect(() => {
    // Track booking confirmation start
    mobileAnalytics.trackBookingConfirmationStart(bookingData);
  }, [bookingData]);

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
  });

  const [createAppointment, { loading: creatingAppointment }] = useMutation(CREATE_APPOINTMENT);
  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const isLoading = centersLoading || servicesLoading || userLoading;

  const handleProceedToPayment = async () => {
    if (!bookingData.patientId) {
      setAmountError('Patient ID is missing. Please start over.');
      return;
    }

    if (!patient?.email) {
      setShowEmailModal(true);
      return;
    }

    analytics.trackProceedToPaymentClicked(
      bookingData.treatmentPrice,
      bookingData.treatmentId,
      bookingData.consultantId
    );

    // Track payment method selected (invoice/razorpay)
    mobileAnalytics.trackPaymentMethodSelected('razorpay', bookingData);

    setIsProcessingPayment(true);
    const startTime = Date.now();
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Appointment creation taking longer than expected...');
      toast.info('Setting up your online session...', { 
        duration: 3000,
        position: 'top-center',
        className: 'text-sm',
      });
    }, 5000);
    
    try {
      console.log('⏱️ Starting appointment creation...');

      // Update patient's center to the selected center
      const updateStart = Date.now();
      await updatePatient({
        variables: {
          patientId: bookingData.patientId,
          input: {
            centers: [bookingData.centerId],
          },
        },
      });
      console.log(`✅ Patient center updated in ${Date.now() - updateStart}ms`);
      
      // Create appointment
      const appointmentStart = Date.now();
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId,
            center: bookingData.centerId,
            treatment: bookingData.treatmentId,
            medium: bookingData.sessionType === 'online' ? 'ONLINE' : 'IN_PERSON',
            visitType: 'FIRST_VISIT',
            status: 'BOOKED',
            category: 'WEBSITE',
            event: {
              startTime: new Date(bookingData.selectedTimeSlot.startTime).getTime(),
              endTime: new Date(bookingData.selectedTimeSlot.endTime).getTime(),
            },
          },
        },
      });
      console.log(`✅ Appointment created in ${Date.now() - appointmentStart}ms`);

      const appointmentId = appointmentResult?.data?.createAppointment?._id;
      
      if (!appointmentId) {
        throw new Error('Failed to create appointment');
      }

      console.log('✅ Appointment ID:', appointmentId);
      sessionStorage.setItem('appointmentId', appointmentId);
      sessionStorage.setItem('paymentType', 'invoice');
      sessionStorage.setItem('paymentAmount', bookingData.treatmentPrice.toString());
      
      analytics.trackPaymentInitiated(bookingData.treatmentPrice, appointmentId);
      
      // Verify sessionStorage was written
      const storedId = sessionStorage.getItem('appointmentId');
      console.log('✅ Verified stored appointment ID:', storedId);
      
      if (!storedId) {
        throw new Error('Failed to store appointment ID');
      }
      
      clearTimeout(timeoutId);
      console.log(`⏱️ Total time: ${Date.now() - startTime}ms`);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Error creating appointment:', error);
      console.error('❌ Error details:', error.message, error.graphQLErrors);
      setAmountError('Failed to create appointment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Loading details..." />
      </div>
    );
  }

  if (isProcessingPayment) {
    return (
      <NewUserOnlinePaymentProcessing
        amount={bookingData.treatmentPrice}
        paymentType="invoice"
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
        consultantId={bookingData.consultantId}
        treatmentId={bookingData.treatmentId}
        onPaymentSuccess={async (paymentId, invoiceId) => {
          // Update patient status to ACTIVE after successful payment
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
          
          const storedAppointmentId = sessionStorage.getItem('appointmentId');
          sessionStorage.removeItem('appointmentId');
          sessionStorage.removeItem('paymentType');
          sessionStorage.removeItem('paymentAmount');
          setIsProcessingPayment(false);
          if (storedAppointmentId) {
            onNext(storedAppointmentId);
          }
        }}
        onPaymentFailure={async (error) => {
          setIsProcessingPayment(false);
          sessionStorage.removeItem('paymentType');
          sessionStorage.removeItem('paymentAmount');
          const errorMsg = typeof error === 'string' ? error : error?.description || error?.message || 'Payment failed';
          setAmountError(errorMsg);
        }}
      />
    );
  }



  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Patient Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 font-medium block">Name</span>
                <p className="text-sm font-medium text-gray-900">{patientDetails.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Phone</span>
                <p className="text-sm font-medium text-gray-900">{patientDetails.phone}</p>
              </div>
              {patientDetails.email && (
                <div>
                  <span className="text-sm text-gray-600 font-medium block">Email</span>
                  <p className="text-sm font-medium text-gray-900">{patientDetails.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Stance Online Services</p>
                <p className="text-sm text-gray-500">Online Consultation</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Date & Time</span>
                <p className="text-sm font-medium text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Service</span>
                <p className="text-sm font-medium text-gray-900">{currentService?.name}</p>
                <p className="text-sm text-gray-500">₹{bookingData.treatmentPrice}</p>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Amount</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">₹{bookingData.treatmentPrice}</span>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Full Payment Required</p>
                  <p className="text-xs mt-1 text-green-700">Online bookings require full payment. An invoice will be generated.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Non-refundable Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                This payment is non-refundable. Please review all details before proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleProceedToPayment}
          disabled={creatingAppointment || isProcessingPayment}
          isLoading={creatingAppointment || isProcessingPayment}
          fullWidth
          variant="primary"
          size="lg"
        >
          {creatingAppointment || isProcessingPayment ? 'Creating Appointment...' : `Pay ₹${bookingData.treatmentPrice}`}
        </Button>
      </div>

      <EmailCollectionModal
        isOpen={showEmailModal}
        patientId={bookingData.patientId}
        patientName={patientDetails.name}
        onEmailSaved={async () => {
          await refetchUser();
          setShowEmailModal(false);
        }}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}
