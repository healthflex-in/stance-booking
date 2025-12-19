'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { LocationSelectionModal, ServiceSelectionModal } from '@/components/onboarding/shared';

interface RepeatUserOnlineSessionDetailsProps {
  patientId: string;
  organizationId: string;
  onBack: () => void;
  onContinue: (data: { organizationId: string; serviceId: string; serviceDuration: number; servicePrice: number; designation: string }) => void;
}

export default function RepeatUserOnlineSessionDetails({
  patientId,
  organizationId,
  onBack,
  onContinue,
}: RepeatUserOnlineSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Physiotherapist');

  // Modal states
  const [showServiceModal, setShowServiceModal] = useState(false);



  // Fetch patient data for welcome message
  const { data: patientData } = useQuery(GET_USER, {
    variables: {
      userId: patientId,
    },
    skip: !patientId,
    fetchPolicy: 'cache-first',
  });

  const patient = patientData?.user;
  const patientFirstName = patient?.profileData?.firstName || '';
  const patientLastName = patient?.profileData?.lastName || '';
  const patientFullName = patientFirstName && patientLastName 
    ? `${patientFirstName} ${patientLastName}`.trim()
    : patientFirstName || '';



  const handleContinue = () => {
    if (!selectedService) return;

    onContinue({
      organizationId,
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
      designation: selectedDesignation,
    });
  };

  const canProceed = selectedService;

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Welcome Back Message */}
          <div className="px-4 pt-4 pb-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome back{patientFullName ? `, ${patientFullName}` : ''}!
            </h3>
            <p className="text-sm text-gray-600">Book your online session</p>
          </div>

          <div className="px-4 pt-6">

          {/* Designation Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Consultant Type
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Select the type of consultant you need
            </p>
            <div className="bg-white rounded-xl p-1 border border-gray-200 flex">
              <button
                type="button"
                onClick={() => setSelectedDesignation('Physiotherapist')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                  selectedDesignation === 'Physiotherapist'
                    ? 'text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: selectedDesignation === 'Physiotherapist' ? '#DDFE71' : 'transparent'
                }}
              >
                Physiotherapist
              </button>
              <button
                type="button"
                onClick={() => setSelectedDesignation('S&C Coach')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                  selectedDesignation === 'S&C Coach'
                    ? 'text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: selectedDesignation === 'S&C Coach' ? '#DDFE71' : 'transparent'
                }}
              >
                S&C Coach
              </button>
            </div>
          </div>

          {/* Service Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Service
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the service you need
            </p>
            <button
              onClick={() => setShowServiceModal(true)}
              className="w-full"
            >
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedService ? '#DDFE71' : '#e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    {selectedService ? (
                      <>
                        <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedService.duration} minutes • ₹{selectedService.bookingAmount || selectedService.price || 0}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900">Select a service</h3>
                        <p className="text-sm text-gray-500">Tap to choose a service</p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: '#203A37' }} />
                </div>
              </div>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <PrimaryButton
          onClick={handleContinue}
          disabled={!canProceed}
          fullWidth={true}
          variant="primary"
        >
          Continue
        </PrimaryButton>
      </div>

      {/* Modals */}
      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        patientId={patientId}
        organizationId={organizationId}
        isNewUser={false}
        sessionType="online"
        designation={selectedDesignation}
        onSelect={(service) => {
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />
    </div>
  );
}

