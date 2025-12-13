'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT } from '@/gql/queries';
import RepeatUserOnlinePaymentProcessing from './RepeatUserOnlinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';

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
}

interface RepeatUserOnlinePaymentConfirmationProps {
  bookingData: BookingData;
  onNext: (appointmentId?: string) => void;
}

export default function RepeatUserOnlinePaymentConfirmation({
  bookingData,
  onNext,
}: RepeatUserOnlinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS);
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
  });

  const [createAppointment] = useMutation(CREATE_APPOINTMENT);

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const handleProceedToPayment = async () => {
    try {
      // Create appointment FIRST
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId,
            center: bookingData.centerId,
            treatment: bookingData.treatmentId,
            medium: 'ONLINE',
            visitType: 'FOLLOW_UP',
            status: 'BOOKED',
            category: 'WEBSITE',
            event: {
              startTime: new Date(bookingData.selectedTimeSlot.startTime).getTime(),
              endTime: new Date(bookingData.selectedTimeSlot.endTime).getTime(),
            },
          },
        },
      });

      const appointmentId = appointmentResult?.data?.createAppointment?._id;
      if (!appointmentId) {
        throw new Error('Failed to create appointment');
      }

      // Store appointment ID for payment
      sessionStorage.setItem('appointmentId', appointmentId);
      sessionStorage.setItem('paymentType', 'invoice');
      sessionStorage.setItem('paymentAmount', bookingData.treatmentPrice.toString());
      setIsProcessingPayment(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentId: string, invoiceId?: string) => {
    const appointmentId = sessionStorage.getItem('appointmentId');
    sessionStorage.removeItem('appointmentId');
    sessionStorage.removeItem('paymentType');
    sessionStorage.removeItem('paymentAmount');
    setIsProcessingPayment(false);
    onNext(appointmentId || undefined);
  };

  const handlePaymentFailure = (error: any) => {
    setIsProcessingPayment(false);
    sessionStorage.removeItem('appointmentId');
    sessionStorage.removeItem('paymentType');
    sessionStorage.removeItem('paymentAmount');
    const errorMsg = typeof error === 'string' ? error : error?.description || error?.message || 'Payment failed';
    router.push(`/onboarding-patient/failure?error=${encodeURIComponent(errorMsg)}`);
  };

  if (isProcessingPayment) {
    return (
      <RepeatUserOnlinePaymentProcessing
        amount={bookingData.treatmentPrice}
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
        consultantId={bookingData.consultantId}
        treatmentId={bookingData.treatmentId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
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
                <span className="text-sm text-gray-600 font-medium block">Location</span>
                <p className="text-sm font-bold text-gray-900">{currentCenter?.name}</p>
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
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">₹{bookingData.treatmentPrice}</span>
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
          fullWidth
          variant="primary"
          size="lg"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}

