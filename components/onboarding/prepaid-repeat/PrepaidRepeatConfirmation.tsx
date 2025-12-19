'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS, GET_SERVICES, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { EmailCollectionModal } from '@/components/onboarding/shared';

interface PrepaidRepeatConfirmationProps {
  bookingData: any;
  onConfirm: () => void;
  isCreating?: boolean;
}

export default function PrepaidRepeatConfirmation({ bookingData, onConfirm, isCreating = false }: PrepaidRepeatConfirmationProps) {
  const { isInDesktopContainer } = useContainerDetection();
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
    await onConfirm();
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
        <div className={`${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="px-4 pt-4 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Patient Details</h2>
          </div>

          <div className="px-4 pt-6 space-y-4 mb-6">
            <div>
              <span className="text-sm text-gray-600 block mb-1">Name</span>
              <p className="text-base font-medium text-gray-900">{patientDetails.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">Phone</span>
              <p className="text-base font-medium text-gray-900">{patientDetails.phone}</p>
            </div>
            {patientDetails.email && (
              <div>
                <span className="text-sm text-gray-600 block mb-1">Email</span>
                <p className="text-base font-medium text-gray-900">{patientDetails.email}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200"></div>

          <div className="px-4 pt-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
          </div>

          <div className="px-4 pt-6 space-y-4">
            <div>
              <span className="text-sm text-gray-600 block mb-1">Location</span>
              <p className="text-base font-semibold text-gray-900">{currentCenter?.name}</p>
              <p className="text-sm text-gray-500 mt-1">Online Consultation</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">Date & Time</span>
              <p className="text-base font-medium text-gray-900">
                {bookingData.selectedDate}, {typeof bookingData.selectedTimeSlot === 'string' ? bookingData.selectedTimeSlot : bookingData.selectedTimeSlot.displayTime}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">Service</span>
              <p className="text-base font-medium text-gray-900">{currentService?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button onClick={handleConfirm} disabled={isCreating} isLoading={isCreating} fullWidth variant="primary" size="lg">
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
