'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS, GET_SERVICES, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface BookingData {
  sessionType: 'in-person';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  selectedDate: string;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
}

interface RepeatUserOfflineConfirmationProps {
  bookingData: BookingData;
  onConfirm: () => void;
  isCreating?: boolean;
}

export default function RepeatUserOfflineConfirmation({
  bookingData,
  onConfirm,
  isCreating = false,
}: RepeatUserOfflineConfirmationProps) {
  const { isInDesktopContainer } = useContainerDetection();

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
  });
  const { data: consultantData, loading: consultantLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.consultantId },
    skip: !bookingData.consultantId,
  });

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;
  const consultant = consultantData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const isLoading = centersLoading || servicesLoading || userLoading || consultantLoading;

  const handleConfirm = async () => {
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
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Details</h3>
            <div className="border-t border-gray-200 mb-4"></div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-black font-bold block mb-1.5">Name</span>
                <p className="text-sm text-gray-900">{patientDetails.name}</p>
              </div>
              <div>
                <span className="text-xs text-black font-bold block mb-1.5">Phone</span>
                <p className="text-sm text-gray-900">{patientDetails.phone}</p>
              </div>
              {patientDetails.email && (
                <div>
                  <span className="text-xs text-black font-bold block mb-1.5">Email</span>
                  <p className="text-sm text-gray-900">{patientDetails.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Details</h3>
            <div className="border-t border-gray-200 mb-4"></div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-black font-bold block mb-1.5">Location</span>
                <p className="text-sm font-semibold text-gray-900">{currentCenter?.name}</p>
                <p className="text-xs text-gray-500 mt-1">In Person Consultation</p>
              </div>
              {bookingData.consultantId && consultant?.profileData?.firstName && (
                <div>
                  <span className="text-xs text-black font-bold block mb-1.5">Consultant</span>
                  <p className="text-sm text-gray-900">
                    {consultant.profileData.firstName} {consultant.profileData.lastName || ''}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-black font-bold block mb-1.5">Date & Time</span>
                <p className="text-sm text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
                </p>
              </div>
              <div>
                <span className="text-xs text-black font-bold block mb-1.5">Service</span>
                <p className="text-sm text-gray-900">{currentService?.name}</p>
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
    </div>
  );
}
