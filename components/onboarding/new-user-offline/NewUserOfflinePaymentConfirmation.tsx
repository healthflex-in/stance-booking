'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT, GET_TOKENS_FOR_SERVICE, PURCHASE_TOKEN } from '@/gql/queries';
import NewUserOfflinePaymentProcessing from './NewUserOfflinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { BookingAnalytics } from '@/services/booking-analytics';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { isParamFromUrl } from '@/utils/booking-params';
import { bookingStorage } from '@/utils/booking-storage';

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
  analytics?: BookingAnalytics;
}

export default function NewUserOfflinePaymentConfirmation({
  bookingData,
  onNext,
  analytics,
}: NewUserOfflinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
  const [selectedTokenAmount, setSelectedTokenAmount] = useState<number>(100);
  const [amountError, setAmountError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentTypeFromParams, setIsPaymentTypeFromParams] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    fetchPolicy: 'network-only',
  });

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const actualPrice = bookingData.treatmentPrice || currentService?.price || 0;

  // Get token amount from service, fallback to 100
  const serviceTokenAmount = currentService?.tokenAmount || 100;
  const tokenAmounts = [serviceTokenAmount];

  React.useEffect(() => {
    try {
      const storedPaymentType = bookingStorage.getItem('paymentType');
      if (storedPaymentType === 'token') {
        setPaymentAmount(serviceTokenAmount);
        setSelectedTokenAmount(serviceTokenAmount);
        setIsPaymentTypeFromParams(isParamFromUrl('paymentType'));
      } else if (storedPaymentType === 'full') {
        setPaymentAmount(null);
        setIsPaymentTypeFromParams(isParamFromUrl('paymentType'));
      }
    } catch {
      // storage unavailable
    }
  }, [serviceTokenAmount]);

  React.useEffect(() => {
    try {
      const storedPaymentType = bookingStorage.getItem('paymentType');
      if (storedPaymentType === 'full' && actualPrice > 0 && paymentAmount === null) {
        setPaymentAmount(actualPrice);
      }
    } catch {
      // storage unavailable
    }
  }, [actualPrice, paymentAmount]);

  // Handle loading state - wait for all data to be available
  React.useEffect(() => {
    const isDataLoading = centersLoading || servicesLoading || userLoading;
    const hasRequiredData = currentCenter && currentService && patient;
    
    console.log('Loading state check:', {
      centersLoading,
      servicesLoading,
      userLoading,
      hasCurrentCenter: !!currentCenter,
      hasCurrentService: !!currentService,
      hasPatient: !!patient,
      patientId: bookingData.patientId,
    });
    
    if (!isDataLoading && hasRequiredData) {
      // Add a small delay to ensure loading screen is visible
      setTimeout(() => {
        setIsLoadingData(false);
      }, 300);
    } else if (!isDataLoading && !hasRequiredData) {
      // If loading is done but we don't have required data, still show the component
      // This handles cases where queries might fail or return empty
      console.warn('Loading complete but missing required data:', {
        hasCurrentCenter: !!currentCenter,
        hasCurrentService: !!currentService,
        hasPatient: !!patient,
      });
      setTimeout(() => {
        setIsLoadingData(false);
      }, 300);
    }
  }, [centersLoading, servicesLoading, userLoading, currentCenter, currentService, patient, bookingData.patientId]);

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const handlePayFullClick = () => {
    if (!isPaymentTypeFromParams) {
      setPaymentAmount(actualPrice);
      setAmountError('');
    }
  };

  const handleTokenPayClick = (amount: number) => {
    if (!isPaymentTypeFromParams) {
      setSelectedTokenAmount(amount);
      setPaymentAmount(amount);
      setAmountError('');
    }
  };

  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);

  const handleProceedToPayment = async () => {
    if (!paymentAmount) {
      setAmountError('Please select a payment option');
      return;
    }

    const isFullPayment = paymentAmount === actualPrice;
    const isTokenPayment = paymentAmount === serviceTokenAmount;

    analytics?.trackProceedToPaymentClicked(paymentAmount, bookingData.treatmentId, bookingData.consultantId);
    setIsCreatingAppointment(true);
    
    try {
      // Store the token amount if token payment is selected
      if (isTokenPayment) {
        bookingStorage.setItem('selectedTokenAmount', paymentAmount.toString());
        bookingStorage.setItem('selectedServiceId', bookingData.treatmentId);
        console.log('✅ Stored token amount and service ID for payment:', paymentAmount, bookingData.treatmentId);
      }
      
      // Create appointment with appropriate status
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId,
            center: bookingData.centerId,
            treatment: bookingData.treatmentId,
            medium: 'IN_PERSON',
            visitType: 'FIRST_VISIT',
            status: isFullPayment ? 'BOOKED' : 'TOKEN_PENDING',
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

      analytics?.trackPaymentInitiated(paymentAmount, appointmentId);
      bookingStorage.setItem('appointmentId', appointmentId);
      bookingStorage.setItem('paymentType', isFullPayment ? 'invoice' : 'token');
      bookingStorage.setItem('paymentAmount', paymentAmount.toString());
      
      setIsCreatingAppointment(false);
      setIsProcessingPayment(true);
    } catch (error) {
      console.error('Error creating appointment:', error);
      setAmountError('Failed to create appointment. Please try again.');
      setIsCreatingAppointment(false);
    }
  };

  // Show loading screen while data is being fetched
  if (isLoadingData) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Loading payment details..." />
      </div>
    );
  }

  if (isCreatingAppointment) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Creating appointment..." />
      </div>
    );
  }

  if (isProcessingPayment) {
    const isFullPayment = paymentAmount === actualPrice;

    return (
      <NewUserOfflinePaymentProcessing
        amount={paymentAmount!}
        paymentType={isFullPayment ? 'invoice' : 'package'}
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
        consultantId={bookingData.consultantId}
        treatmentId={bookingData.treatmentId}
        onPaymentSuccess={async (paymentId, invoiceId) => {
          const appointmentId = bookingStorage.getItem('appointmentId') || '';
          analytics?.trackPaymentSuccess(paymentId, paymentAmount!, appointmentId);
          bookingStorage.removeItem('appointmentId');
          bookingStorage.removeItem('paymentType');
          bookingStorage.removeItem('paymentAmount');
          setIsProcessingPayment(false);
          onNext();
        }}
        onPaymentFailure={async (error) => {
          const appointmentId = bookingStorage.getItem('appointmentId') || undefined;
          analytics?.trackPaymentFailure(typeof error === 'string' ? error : error?.description || 'Payment failed', appointmentId);
          setIsProcessingPayment(false);
          bookingStorage.removeItem('paymentType');
          bookingStorage.removeItem('paymentAmount');
          const errorMsg = typeof error === 'string' ? error : error?.description || error?.message || 'Payment failed';
          setAmountError(errorMsg);
        }}
      />
    );
  }

  const isFullPayment = paymentAmount === actualPrice;

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
                <p className="text-sm text-gray-500">₹{actualPrice}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Option</h3>
            {isPaymentTypeFromParams && (
              <p className="text-sm text-gray-600 mb-3">Pre-selected payment option</p>
            )}
            
            <div className="space-y-3" style={{ opacity: isPaymentTypeFromParams ? 0.7 : 1 }}>
              <button
                onClick={handlePayFullClick}
                disabled={isPaymentTypeFromParams}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  paymentAmount === actualPrice
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isPaymentTypeFromParams ? 'cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Pay Full</p>
                    <p className="text-sm text-gray-600">₹{actualPrice}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentAmount === actualPrice
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {paymentAmount === actualPrice && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>

              <div className="border-2 border-gray-200 rounded-xl p-4">
                <p className="font-semibold text-gray-900 mb-3">Token Payment</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTokenPayClick(serviceTokenAmount)}
                    disabled={isPaymentTypeFromParams}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      paymentAmount === serviceTokenAmount
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isPaymentTypeFromParams ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">₹{serviceTokenAmount}</p>
                        <p className="text-xs text-gray-500">Token Amount</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentAmount === serviceTokenAmount
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentAmount === serviceTokenAmount && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {amountError && (
              <p className="text-red-600 text-sm mt-3">{amountError}</p>
            )}

            {paymentAmount && (
              <div className={`mt-4 p-3 rounded-xl ${
                isFullPayment
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isFullPayment ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <p className={`text-sm font-semibold ${
                      isFullPayment ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      {isFullPayment ? 'Full Payment - Invoice' : `Token Payment - ₹${paymentAmount}`}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isFullPayment ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {isFullPayment
                        ? 'Paying full service amount. An invoice will be generated.'
                        : `A token of ₹${paymentAmount} will be created. Balance: ₹${actualPrice - paymentAmount}`}
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

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1">Cancellation Policy</p>
                <p className="text-xs text-blue-800">
                  Cancellations made less than one day prior to the appointment will incur a ₹300 cancellation fee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleProceedToPayment}
          disabled={!paymentAmount || isCreatingAppointment}
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
