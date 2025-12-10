'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT } from '@/gql/queries';
import { MobilePaymentProcessing } from '../shared';
import { useContainerDetection } from '@/hooks/useContainerDetection';

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

  const handleProceedToPayment = () => {
    setIsProcessingPayment(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Get start and end times
      let startTime: number;
      let endTime: number;

      if (bookingData.selectedTimeSlot?.startTime) {
        startTime = new Date(bookingData.selectedTimeSlot.startTime).getTime();
        endTime = new Date(bookingData.selectedTimeSlot.endTime || bookingData.selectedTimeSlot.startTime).getTime();
      } else {
        throw new Error('No time slot selected');
      }

      // Verify the dates are valid and in the future
      const now = Date.now();
      if (startTime <= now) {
        throw new Error('Selected time slot is in the past');
      }

      // Build input object - exactly like redesign
      const input = {
        patient: bookingData.patientId,
        consultant: bookingData.consultantId || null,
        treatment: bookingData.treatmentId,
        medium: 'ONLINE',
        notes: '',
        center: bookingData.centerId,
        category: 'WEBSITE',
        status: 'BOOKED',
        visitType: 'FOLLOW_UP',
        event: {
          startTime,
          endTime,
        },
      };

      // Create appointment AFTER payment success
      const result = await createAppointment({
        variables: { input },
      });

      const appointmentId = result.data?.createAppointment?._id;
      if (appointmentId) {
        toast.success('Appointment booked successfully!');
        setIsProcessingPayment(false);
        onNext(appointmentId); // Pass appointmentId to parent
      } else {
        throw new Error('Appointment creation failed - no ID returned');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      setIsProcessingPayment(false);
      toast.error(error.message || 'Failed to create appointment. Please try again.');
    }
  };

  const handlePaymentFailure = (error: any) => {
    setIsProcessingPayment(false);
    const errorMsg = typeof error === 'string' ? error : error?.description || error?.message || 'Payment failed';
    router.push(`/onboarding-patient/failure?error=${encodeURIComponent(errorMsg)}`);
  };

  if (isProcessingPayment) {
    return (
      <MobilePaymentProcessing
        amount={bookingData.treatmentPrice}
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
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
        <button
          onClick={handleProceedToPayment}
          className="w-full py-4 text-black font-semibold rounded-xl transition-all"
          style={{ backgroundColor: '#DDFE71' }}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}

