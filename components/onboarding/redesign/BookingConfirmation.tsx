'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, CreditCard } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import MobilePaymentProcessing from '@/components/onboarding/shared/MobilePaymentProcessing';
import { GET_USER, CREATE_APPOINTMENT, GET_CENTERS } from '@/gql/queries';
import { Button } from '@/components/ui-atoms/Button';

interface BookingConfirmationProps {
  bookingData: any;
  onBack: () => void;
  onConfirm: (appointmentId: string) => void;
}

export default function BookingConfirmation({
  bookingData,
  onBack,
  onConfirm,
}: BookingConfirmationProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [showPayment, setShowPayment] = useState(false);
  const [patientDetails, setPatientDetails] = useState({
    name: 'Patient',
    email: '',
    phone: '',
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  const [createAppointment, { loading: creatingAppointment }] = useMutation(CREATE_APPOINTMENT);

  // Fetch patient details
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
    fetchPolicy: 'network-only',
  });

  // Fetch centers
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (userData?.user) {
      const { firstName, lastName } = userData.user.profileData || {};
      const fullName = `${firstName || ''} ${(lastName || '').trim()}`.trim();
      setPatientDetails({
        name: fullName || 'Patient',
        email: userData.user.email || '',
        phone: userData.user.phone || '',
      });
    }
  }, [userData]);

  // Find current center
  const currentCenter = centersData?.centers.find((center: any) => 
    center._id === (bookingData.selectedCenter?._id || bookingData.centerId)
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  };

  // Get session details
  const sessionDetails = {
    dateTime: bookingData.selectedTimeSlot?.startTimeRaw 
      ? `${formatDate(bookingData.selectedTimeSlot.startTimeRaw)} at ${formatTime(bookingData.selectedTimeSlot.startTimeRaw)} - ${formatTime(bookingData.selectedTimeSlot.endTimeRaw)}`
      : bookingData.selectedTimeSlot?.startTime
      ? `${formatDate(bookingData.selectedTimeSlot.startTime)} at ${formatTime(bookingData.selectedTimeSlot.startTime)} - ${formatTime(bookingData.selectedTimeSlot.endTime)}`
      : 'Not selected',
    amount: bookingData.selectedService?.bookingAmount || bookingData.selectedService?.price || bookingData.treatmentPrice || 0,
  };

  const needsPayment = sessionDetails.amount > 0;

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedToPay = async () => {
    if (!bookingData.patientId || !bookingData.centerId) {
      toast.error('Missing required booking information');
      return;
    }
    
    if (needsPayment) {
      setShowPayment(true);
    } else {
      // No payment needed, create appointment directly
      await handlePaymentSuccess('free');
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setIsCreatingBooking(true);
      
      // Validate required fields
      if (!bookingData.patientId || !bookingData.centerId) {
        toast.error('Missing required booking information');
        return;
      }

      // Get start and end times
      let startTime: number;
      let endTime: number;

      if (bookingData.selectedTimeSlot?.startTime) {
        startTime = new Date(bookingData.selectedTimeSlot.startTime).getTime();
        endTime = new Date(bookingData.selectedTimeSlot.endTime || bookingData.selectedTimeSlot.startTime).getTime();
      } else if (bookingData.selectedTimeSlot?.startTimeRaw) {
        startTime = new Date(bookingData.selectedTimeSlot.startTimeRaw).getTime();
        endTime = new Date(bookingData.selectedTimeSlot.endTimeRaw || bookingData.selectedTimeSlot.startTimeRaw).getTime();
      } else {
        toast.error('No time slot selected');
        return;
      }

      // Verify the dates are valid and in the future
      const now = Date.now();
      if (startTime <= now) {
        toast.error('Selected time slot is in the past');
        return;
      }

      // Get treatment ID
      const treatmentId = bookingData.treatmentId || bookingData.selectedService?._id;
      if (!treatmentId) {
        toast.error('Service is required');
        return;
      }

      // Build input object
      const input = {
        patient: bookingData.patientId,
        consultant: bookingData.consultantId || bookingData.selectedConsultant?._id || null,
        treatment: treatmentId,
        medium: bookingData.sessionType === 'online' ? 'ONLINE' : 'IN_PERSON',
        notes: bookingData.notes || '',
        center: bookingData.centerId,
        category: 'WEBSITE',
        status: 'BOOKED',
        visitType: bookingData.isNewUser ? 'FIRST_VISIT' : 'FOLLOW_UP',
        event: {
          startTime,
          endTime,
        },
      };

      // Create appointment
      const result = await createAppointment({
        variables: { input },
      });

      const appointmentId = result.data?.createAppointment?._id;
      if (appointmentId) {
        toast.success('Appointment booked successfully!');
        onConfirm(appointmentId);
      } else {
        throw new Error('Appointment creation failed - no ID returned');
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || 'Failed to create appointment. Please try again.');
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentFailure = (error: any) => {
    setShowPayment(false);
    console.error('Payment failed:', error);
    toast.error('Payment failed. Please try again.');
  };

  if (showPayment) {
    return (
      <MobilePaymentProcessing
        amount={sessionDetails.amount}
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
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Patient Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Patient Details
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <span className="text-sm text-gray-600 font-medium block">Name</span>
                <p className="text-sm font-medium text-gray-900">
                  {patientDetails.name || 'Loading...'}
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <span className="text-sm text-gray-600 font-medium block">Phone</span>
                <p className="text-sm font-medium text-gray-900">
                  {patientDetails.phone || 'Loading...'}
                </p>
              </div>

              {/* Email */}
              {patientDetails.email && (
                <div className="space-y-1">
                  <span className="text-sm text-gray-600 font-medium block">Email</span>
                  <p className="text-sm font-medium text-gray-900">
                    {patientDetails.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Session Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session details
            </h3>

            <div className="space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Location</span>
                  {currentCenter?.location && (
                    <a
                      href={currentCenter.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      View Map
                    </a>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    {currentCenter?.name || bookingData.selectedCenter?.name || bookingData.location || 'Center Name'}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {currentCenter?.address || bookingData.selectedCenter?.address ? 
                      `${(currentCenter?.address || bookingData.selectedCenter?.address)?.street || ''}, ${(currentCenter?.address || bookingData.selectedCenter?.address)?.city || ''}, ${(currentCenter?.address || bookingData.selectedCenter?.address)?.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                      'Address not available'}
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <span className="text-sm text-gray-600 font-medium block">Date & Time</span>
                <p className="text-sm font-medium text-gray-900">
                  {sessionDetails.dateTime}
                </p>
              </div>

              {/* Phone Number */}
              {currentCenter?.phone && (
                <div className="space-y-2">
                  <span className="text-sm text-gray-600 font-medium block">Phone</span>
                  <a 
                    href={`tel:${currentCenter.phone}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    {currentCenter.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Total Amount */}
          {needsPayment && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-900">
                  Total Payable amount:
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  INR {sessionDetails.amount}
                </span>
              </div>
              
              {/* Non-refundable Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    <span className="font-semibold">Important:</span> This advance payment of INR {sessionDetails.amount} is non-refundable and will be adjusted against your final service bill.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {needsPayment && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Payment Method
              </h3>

              <div className="space-y-3">
                {/* UPI Payment */}
                <div
                  className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onClick={() => handlePaymentMethodSelect('upi')}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedPaymentMethod === 'upi'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <CreditCard
                        className={`w-5 h-5 ${
                          selectedPaymentMethod === 'upi'
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">Pay Online</h4>
                      <p className="text-sm text-gray-500">UPI, Card, Netbanking</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'upi'
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPaymentMethod === 'upi' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proceed to Pay Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleProceedToPay}
          isLoading={isCreatingBooking || creatingAppointment}
          className="w-full py-4 rounded-2xl font-semibold text-white bg-lime-500 hover:bg-lime-600 active:bg-lime-700"
        >
          {needsPayment ? `Proceed to pay INR ${sessionDetails.amount}` : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
}
