'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT } from '@/gql/queries';
import NewUserOfflinePaymentProcessing from './NewUserOfflinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';

interface BookingData {
  sessionType: 'in-person';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
}

interface NewUserOfflinePaymentConfirmationProps {
  bookingData: BookingData;
  onNext: () => void;
}

export default function NewUserOfflinePaymentConfirmation({
  bookingData,
  onNext,
}: NewUserOfflinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const [paymentAmount, setPaymentAmount] = useState(bookingData.treatmentPrice.toString());
  const [amountError, setAmountError] = useState('');
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

  const validateAmount = (value: string) => {
    const amount = parseFloat(value);
    
    if (isNaN(amount) || amount <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    
    if (amount < 100) {
      setAmountError('Amount must be at least ₹100');
      return false;
    }
    
    if (amount > bookingData.treatmentPrice) {
      setAmountError(`Amount cannot exceed service price ₹${bookingData.treatmentPrice}`);
      return false;
    }
    
    setAmountError('');
    return true;
  };

  const handleAmountChange = (value: string) => {
    setPaymentAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setAmountError('');
    }
  };

  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

  const handleProceedToPayment = async () => {
    if (!validateAmount(paymentAmount)) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    const isFullPayment = amount === bookingData.treatmentPrice;

    setIsCreatingAppointment(true);
    try {
      // Create appointment FIRST with appropriate status
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId,
            center: bookingData.centerId,
            treatment: bookingData.treatmentId,
            medium: 'IN_PERSON',
            visitType: 'FIRST_VISIT',
            status: isFullPayment ? 'BOOKED' : 'TOKEN_PAID',
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

      // Store appointment ID and payment info
      sessionStorage.setItem('appointmentId', appointmentId);
      sessionStorage.setItem('paymentType', isFullPayment ? 'invoice' : 'package');
      sessionStorage.setItem('paymentAmount', amount.toString());
      
      // Only set processing payment AFTER appointment is created and stored
      setIsProcessingPayment(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAmountError('Failed to create appointment. Please try again.');
      setIsCreatingAppointment(false);
    }
  };

  if (isProcessingPayment) {
    const amount = parseFloat(paymentAmount);
    const isFullPayment = amount === bookingData.treatmentPrice;

    return (
      <NewUserOfflinePaymentProcessing
        amount={amount}
        paymentType={isFullPayment ? 'invoice' : 'package'}
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
        consultantId={bookingData.consultantId}
        treatmentId={bookingData.treatmentId}
        onPaymentSuccess={async (paymentId, invoiceId) => {
          sessionStorage.removeItem('appointmentId');
          sessionStorage.removeItem('paymentType');
          sessionStorage.removeItem('paymentAmount');
          setIsProcessingPayment(false);
          onNext();
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

  const amount = paymentAmount ? parseFloat(paymentAmount) : 0;
  const isFullPayment = amount === bookingData.treatmentPrice;

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
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

          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 font-medium block">Location</span>
                <p className="text-sm font-bold text-gray-900">{currentCenter?.name}</p>
                <p className="text-sm text-gray-500">In Person Consultation</p>
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

          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Amount</h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-600 font-medium block mb-2">
                Enter Amount (₹100 - ₹{bookingData.treatmentPrice})
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                min="100"
                max={bookingData.treatmentPrice}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount"
              />
              {amountError && (
                <p className="text-red-600 text-sm mt-2">{amountError}</p>
              )}
            </div>

            {paymentAmount && !amountError && (
              <div className={`p-3 rounded-xl ${isFullPayment ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isFullPayment ? 'text-green-600' : 'text-blue-600'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isFullPayment ? 'text-green-900' : 'text-blue-900'}`}>
                      {isFullPayment ? 'Full Payment - Invoice' : 'Partial Payment - Package'}
                    </p>
                    <p className={`text-xs mt-1 ${isFullPayment ? 'text-green-700' : 'text-blue-700'}`}>
                      {isFullPayment 
                        ? 'Paying full service amount. An invoice will be generated.'
                        : 'Paying partial amount. A package will be created for future use.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleProceedToPayment}
          disabled={!paymentAmount || !!amountError || isCreatingAppointment}
          isLoading={isCreatingAppointment}
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
