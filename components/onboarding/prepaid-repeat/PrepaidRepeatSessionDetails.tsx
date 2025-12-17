'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronRight } from 'lucide-react';
import { GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { ServiceSelectionModal } from '@/components/onboarding/shared';

interface PrepaidRepeatSessionDetailsProps {
  patientId: string;
  organizationId: string;
  isNewUser?: boolean;
  onBack: () => void;
  onContinue: (data: { organizationId: string; serviceId: string; serviceDuration: number; servicePrice: number; designation: string }) => void;
}

export default function PrepaidRepeatSessionDetails({ patientId, organizationId, isNewUser = false, onBack, onContinue }: PrepaidRepeatSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Physiotherapist');
  const [showServiceModal, setShowServiceModal] = useState(false);

  const { data: patientData } = useQuery(GET_USER, {
    variables: { userId: patientId },
    skip: !patientId,
    fetchPolicy: 'cache-first',
  });

  const patient = patientData?.user;
  const patientFullName = `${patient?.profileData?.firstName || ''} ${patient?.profileData?.lastName || ''}`.trim();

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
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              Welcome back{patientFullName ? `, ${patientFullName}` : ''}!
            </h3>
            <p className="text-sm text-gray-600">Book your prepaid session</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Consultant Type</h2>
            <p className="text-gray-600 text-sm mb-4">Select the type of consultant you need</p>
            <div className="bg-white rounded-xl p-1 border border-gray-200 flex">
              <button
                type="button"
                onClick={() => setSelectedDesignation('Physiotherapist')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                  selectedDesignation === 'Physiotherapist' ? 'text-black shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ backgroundColor: selectedDesignation === 'Physiotherapist' ? '#DDFE71' : 'transparent' }}
              >
                Physiotherapist
              </button>
              <button
                type="button"
                onClick={() => setSelectedDesignation('S&C Coach')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                  selectedDesignation === 'S&C Coach' ? 'text-black shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ backgroundColor: selectedDesignation === 'S&C Coach' ? '#DDFE71' : 'transparent' }}
              >
                S&amp;C Coach
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service</h2>
            <p className="text-gray-600 text-sm mb-4">Choose the service you need</p>
            <button onClick={() => setShowServiceModal(true)} className="w-full">
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedService ? '#DDFE71' : '#e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    {selectedService ? (
                      <>
                        <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                        <p className="text-sm text-gray-500">{selectedService.duration} minutes • ₹{selectedService.bookingAmount || selectedService.price || 0}</p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900">Select a service</h3>
                        <p className="text-sm text-gray-500">Tap to choose a service</p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <PrimaryButton onClick={handleContinue} disabled={!canProceed} fullWidth={true} variant="primary">
          Continue
        </PrimaryButton>
      </div>

      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        patientId={patientId}
        organizationId={organizationId}
        isNewUser={isNewUser}
        sessionType="online"
        isPrePaid={true}
        onSelect={(service) => {
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />
    </div>
  );
}
