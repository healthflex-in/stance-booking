'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { AlertCircle } from 'lucide-react';
import { GET_SERVICES, GET_USER, UPDATE_PATIENT } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { EmailCollectionModal } from '@/components/onboarding/shared';

interface BookingData {
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
}

interface PrepaidNewConfirmationProps {
  bookingData: BookingData;
  onConfirm: () => void;
  isCreating?: boolean;
}

export default function PrepaidNewConfirmation({ bookingData, onConfirm, isCreating = false }: PrepaidNewConfirmationProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [error, setError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
  });

  const [updatePatient, { loading: updatingPatient }] = useMutation(UPDATE_PATIENT);

  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const isLoading = servicesLoading || userLoading;

  const handleConfirmBooking = async () => {
    try {
      if (!bookingData.patientId) {
        setError('Patient ID is missing. Please start over.');
        return;
      }

      if (!patient?.email) {
        setShowEmailModal(true);
        return;
      }

      // Update patient's center to the selected center
      await updatePatient({
        variables: {
          patientId: bookingData.patientId,
          input: {
            centers: [bookingData.centerId],
          },
        },
      });
      
      onConfirm();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      setError('Failed to update patient. Please try again.');
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
                <p className="text-sm font-bold text-gray-900">Stance Online Services</p>
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
              </div>
            </div>
          </div>

          {/* Prepaid Notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Prepaid Session</p>
                <p className="text-xs mt-1 text-green-700">This is a prepaid session. No payment required.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={handleConfirmBooking}
          disabled={updatingPatient || isCreating}
          isLoading={updatingPatient || isCreating}
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
