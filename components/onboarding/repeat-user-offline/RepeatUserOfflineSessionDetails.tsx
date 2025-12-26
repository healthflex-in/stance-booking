'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { LocationSelectionModal, ServiceSelectionModal } from '@/components/onboarding/shared';
import { BookingAnalytics } from '@/services/booking-analytics';

interface RepeatUserOfflineSessionDetailsProps {
  patientId: string;
  centerId: string;
  onBack: () => void;
  onContinue: (data: { centerId: string; serviceId: string; serviceDuration: number; servicePrice: number; designation: string }) => void;
  analytics?: BookingAnalytics;
}

export default function RepeatUserOfflineSessionDetails({
  patientId,
  centerId,
  onBack,
  onContinue,
  analytics,
}: RepeatUserOfflineSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Physiotherapist');

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Fetch centers
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

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

  // Filter centers for in-center
  const filteredCenters = React.useMemo(() => {
    if (!centersData?.centers) return [];
    return centersData.centers.filter((center: any) => {
      return center.isOnline === true;
    });
  }, [centersData]);



  // Reset service when center changes
  useEffect(() => {
    setSelectedService(null);
  }, [selectedCenter]);

  const handleContinue = () => {
    if (!selectedService || !selectedCenter) return;

    const backendDesignation = selectedDesignation === 'S&C Coach' ? 'SNC_Coach' : selectedDesignation;

    analytics?.trackSessionDetailsContinueClicked(selectedService._id, backendDesignation);

    onContinue({
      centerId: selectedCenter._id,
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
      designation: backendDesignation,
    });
  };

  const canProceed = selectedService && selectedCenter;

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
            <p className="text-sm text-gray-600">Book your in-person session</p>
          </div>

          <div className="px-4 pt-6">

          {/* Location Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Location
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Select your preferred location
            </p>
            <button
              onClick={() => { setShowLocationModal(true); }}
              className="w-full"
            >
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedCenter ? '#DDFE71' : '#e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900">
                        {selectedCenter?.name || 'Tap to choose center'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedCenter?.address ? 
                          `${selectedCenter.address?.street || ''}, ${selectedCenter.address?.city || ''}, ${selectedCenter.address?.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                          'Select your preferred location'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: '#203A37' }} />
                </div>
              </div>
            </button>
          </div>

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
                onClick={() => { analytics?.trackDesignationToggled('Physiotherapist'); setSelectedDesignation('Physiotherapist'); }}
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
                onClick={() => { analytics?.trackDesignationToggled('S&C Coach'); setSelectedDesignation('S&C Coach'); }}
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
              onClick={() => {
                if (selectedCenter) {
                  analytics?.trackServiceModalOpened();
                  setShowServiceModal(true);
                }
              }}
              disabled={!selectedCenter}
              className="w-full"
            >
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedService ? '#DDFE71' : '#e5e7eb', opacity: !selectedCenter ? 0.5 : 1, cursor: !selectedCenter ? 'not-allowed' : 'pointer' }}>
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
                        <p className="text-sm text-gray-500">
                          {!selectedCenter ? 'Please select a location first' : 'Tap to choose a service'}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: !selectedCenter ? '#d1d5db' : '#203A37' }} />
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
      <LocationSelectionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        centers={filteredCenters}
        sessionType="in-person"
        onSelect={(center) => {
          setSelectedCenter(center);
          setShowLocationModal(false);
        }}
      />

      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        patientId={patientId}
        centerId={selectedCenter?._id || centerId}
        isNewUser={false}
        sessionType="in-person"
        designation={selectedDesignation}
        onSelect={(service) => {
          analytics?.trackServiceSelected(service._id, service.name, service.bookingAmount || service.price || 0, service.duration);
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />
    </div>
  );
}

