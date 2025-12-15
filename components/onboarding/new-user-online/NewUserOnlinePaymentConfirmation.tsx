'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle } from 'lucide-react';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT } from '@/gql/queries';
import NewUserOnlinePaymentProcessing from './NewUserOnlinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';

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

interface NewUserOnlinePaymentConfirmationProps {
  bookingData: BookingData;
  onNext: (appointmentId: string) => void;
}

export default function NewUserOnlinePaymentConfirmation({
  bookingData,
  onNext,
}: NewUserOnlinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const [amountError, setAmountError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS);
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
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
      console.log('📋 Creating appointment with data:', {
        patient: bookingData.patientId || null,
        consultant: bookingData.consultantId,
        center: bookingData.centerId,
        treatment: bookingData.treatmentId,
        medium: bookingData.sessionType,
      });
      
      // Create appointment FIRST
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId || null,
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

      const appointmentId = appointmentResult?.data?.createAppointment?._id;
      console.log('✅ Appointment created:', appointmentId);
      
      if (!appointmentId) {
        throw new Error('Failed to create appointment');
      }

      // Store appointment ID for payment
      sessionStorage.setItem('appointmentId', appointmentId);
      sessionStorage.setItem('paymentType', 'invoice');
      sessionStorage.setItem('paymentAmount', bookingData.treatmentPrice.toString());
      console.log('💾 Stored appointmentId in sessionStorage:', appointmentId);
      setIsProcessingPayment(true);
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      console.error('❌ Error details:', error.message, error.graphQLErrors);
      setAmountError('Failed to create appointment. Please try again.');
    }
  };

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
                <span className="text-sm text-gray-600 font-medium block">Location</span>
                <p className="text-sm font-bold text-gray-900">{currentCenter?.name}</p>
                <p className="text-sm text-gray-500">
                  {bookingData.sessionType === 'online' ? 'Online Consultation' : 'In Person Consultation'}
                </p>
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
          fullWidth
          variant="primary"
          size="lg"
        >
          Pay ₹{bookingData.treatmentPrice}
        </Button>
      </div>
    </div>
  );
}
