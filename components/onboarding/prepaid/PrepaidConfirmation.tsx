'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS, GET_SERVICES, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { EmailCollectionModal } from '@/components/onboarding/shared';

interface PrepaidConfirmationProps {
  bookingData: any;
  onConfirm: () => void;
}

export default function PrepaidConfirmation({
  bookingData,
  onConfirm,
}: PrepaidConfirmationProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [isCreating, setIsCreating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
  });

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const isLoading = centersLoading || servicesLoading || userLoading;

  const handleConfirm = async () => {
    if (!patient?.email) {
      setShowEmailModal(true);
      return;
    }
    
    setIsCreating(true);
    try {
      await onConfirm();
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Loading details..." />
      </div>
    );
  }

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
                <p className="text-sm font-bold text-gray-900">
                  {bookingData.isNewUser ? 'Stance PrePaid Services' : currentCenter?.name}
                </p>
                <p className="text-sm text-gray-500">Online Consultation</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Date & Time</span>
                <p className="text-sm font-medium text-gray-900">
                  {bookingData.selectedDate}, {typeof bookingData.selectedTimeSlot === 'string' ? bookingData.selectedTimeSlot : bookingData.selectedTimeSlot.displayTime}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Service</span>
                <p className="text-sm font-medium text-gray-900">{currentService?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleConfirm}
          disabled={isCreating}
          isLoading={isCreating}
          fullWidth
          variant="primary"
          size="lg"
        >
          Confirm Booking
        </Button>
      </div>

      <EmailCollectionModal
        isOpen={showEmailModal}
        patientId={bookingData.patientId}
        patientName={patientDetails.name}
        onEmailSaved={() => setShowEmailModal(false)}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}
