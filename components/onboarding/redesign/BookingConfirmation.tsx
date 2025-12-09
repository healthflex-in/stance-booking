'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { SessionDetailItem, PrimaryButton } from '@/components/ui-atoms';
import MobilePaymentProcessing from '@/components/onboarding/shared/MobilePaymentProcessing';
import { GET_USER, CREATE_APPOINTMENT } from '@/gql/queries';

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

  const [createAppointment, { loading: creatingAppointment }] = useMutation(CREATE_APPOINTMENT);

  // Fetch patient details
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
    fetchPolicy: 'network-only',
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get display values with proper fallbacks - all dynamic
  const sessionType = bookingData.sessionType === 'online' ? 'Online' : 'In Person';
  const location = bookingData.selectedCenter?.name || bookingData.location || 'Not selected';
  const service = bookingData.selectedService?.name || bookingData.treatmentName || 'Not selected';
  const consultant = bookingData.selectedConsultant?.profileData?.firstName 
    ? `${bookingData.selectedConsultant.profileData.firstName} ${bookingData.selectedConsultant.profileData.lastName || ''}`.trim()
    : bookingData.consultantName || 'Any available';
  const servicePrice = bookingData.selectedService?.bookingAmount || bookingData.selectedService?.price || bookingData.treatmentPrice || 0;
  const dateTime = bookingData.selectedTimeSlot?.startTimeRaw 
    ? `${formatDate(bookingData.selectedTimeSlot.startTimeRaw)} from ${formatTime(bookingData.selectedTimeSlot.startTimeRaw)} - ${formatTime(bookingData.selectedTimeSlot.endTimeRaw)}`
    : bookingData.selectedTimeSlot?.startTime
    ? `${formatDate(bookingData.selectedTimeSlot.startTime)} from ${formatTime(bookingData.selectedTimeSlot.startTime)} - ${formatTime(bookingData.selectedTimeSlot.endTime)}`
    : 'Not selected';

  const handleProceedToPay = () => {
    if (!bookingData.patientId || !bookingData.centerId || servicePrice <= 0) {
      toast.error('Missing required booking information');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      // Validate required fields
      if (!bookingData.patientId || !bookingData.centerId) {
        toast.error('Missing required booking information');
        return;
      }

      // Get start and end times - using timestamps like onboarding-patient route
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

      // Get treatment ID - required field
      const treatmentId = bookingData.treatmentId || bookingData.selectedService?._id;
      if (!treatmentId) {
        toast.error('Service is required');
        return;
      }

      // Build input object exactly like onboarding-patient route
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

      console.log('Creating appointment with input:', JSON.stringify(input, null, 2));

      // Create appointment after successful payment
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
      console.error('Error creating appointment after payment:', error);
      toast.error(error.message || 'Failed to create appointment. Payment was successful but appointment creation failed. Please contact support.');
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
        amount={servicePrice}
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={bookingData.centerId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} flex flex-col bg-gray-50`}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Booking Confirmation</h1>
      </div>

      {/* Scrollable Content */}
      <div className={`flex-1 overflow-y-auto px-4 py-5 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
        {/* Session Details */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Session details</h2>
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] px-4">
            <SessionDetailItem
              label="Session type"
              value={sessionType}
            />
            <SessionDetailItem
              label="Location"
              value={location}
            />
            <SessionDetailItem
              label="Service"
              value={service}
            />
            <SessionDetailItem
              label="Consultant"
              value={consultant}
            />
            <SessionDetailItem
              label="Date & time"
              value={dateTime}
            />
          </div>
        </div>

        {/* Payment Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-[#1C1A4B]">Total Payable amount:</h2>
            <p className="text-2xl font-semibold text-[#1C1A4B]">INR {servicePrice}</p>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-4 h-4 rounded-full border-[#132644] bg-[#132644] flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="text-sm font-medium text-[rgba(28,26,75,0.6)] mb-1">
                  Pay Online
                </div>
                <div className="text-sm text-[#1C1A4B]">
                  UPI, Card, Netbanking
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-[#D3D3D3] p-4`}>
        <PrimaryButton 
          onClick={handleProceedToPay} 
          disabled={!bookingData.patientId || !bookingData.centerId || servicePrice <= 0}
        >
          Proceed to Pay INR {servicePrice}
        </PrimaryButton>
      </div>
    </div>
  );
}
