'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, Monitor, Building2, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_USER } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import LocationSelectionModal from './LocationSelectionModal';
import ServiceSelectionModal from './ServiceSelectionModal';

interface SessionDetailsProps {
  patientId: string;
  centerId: string;
  isNewUser: boolean;
  defaultSessionType?: 'in-person' | 'online';
  isPrePaid?: boolean; // New prop to indicate prepaid flow
  onBack: () => void;
  onContinue: (data: { sessionType: 'in-person' | 'online'; centerId: string; serviceId: string; serviceDuration: number; servicePrice: number }) => void;
}

export default function SessionDetails({
  patientId,
  centerId,
  isNewUser,
  defaultSessionType = 'in-person',
  isPrePaid = false,
  onBack,
  onContinue,
}: SessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [sessionType, setSessionType] = useState<'in-person' | 'online'>(defaultSessionType);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Fetch centers
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  // Fetch patient data for repeat users to show name in welcome message
  const { data: patientData } = useQuery(GET_USER, {
    variables: {
      userId: patientId,
    },
    skip: isNewUser || !patientId,
    fetchPolicy: 'cache-first',
  });

  const patient = patientData?.user;
  const patientFirstName = patient?.profileData?.firstName || '';
  const patientLastName = patient?.profileData?.lastName || '';
  const patientFullName = patientFirstName && patientLastName 
    ? `${patientFirstName} ${patientLastName}`.trim()
    : patientFirstName || '';

  // Filter centers based on session type
  const filteredCenters = React.useMemo(() => {
    if (!centersData?.centers) return [];
    return centersData.centers.filter((center: any) => {
      if (sessionType === 'online') {
        return center.isOnline === true;
      }
      return true; // For in-person, show all centers
    });
  }, [centersData, sessionType]);

  // Set initial center only after session type is selected
  useEffect(() => {
    if (centersData?.centers && sessionType && !selectedCenter) {
      const center = centersData.centers.find((c: any) => c._id === centerId);
      if (center) {
        // Check if center matches session type
        if (sessionType === 'online' && center.isOnline === true) {
          setSelectedCenter(center);
        } else if (sessionType === 'in-person') {
          setSelectedCenter(center);
        }
      }
    }
  }, [centersData, centerId, sessionType, selectedCenter]);

  // Reset center and service when session type changes
  useEffect(() => {
    setSelectedCenter(null);
    setSelectedService(null);
  }, [sessionType]);

  // Reset service when center changes
  useEffect(() => {
    setSelectedService(null);
  }, [selectedCenter]);

  const handleContinue = () => {
    if (!selectedService || !selectedCenter || !sessionType) return;

    onContinue({
      sessionType,
      centerId: selectedCenter._id,
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
    });
  };

  const canProceed = selectedService && selectedCenter && sessionType;

  // Find current center
  const currentCenter = centersData?.centers.find((center: any) => 
    center._id === (selectedCenter?._id || centerId)
  );

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Welcome Back Message for Repeat Users */}
          {!isNewUser && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  Welcome back{patientFullName ? `, ${patientFullName}` : ''}!
                </h3>
                <p className="text-sm text-blue-700">
                  We're glad to see you again. Let's book your next session.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Location Section */}
          {(
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Location
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Select your preferred location
              </p>
              <button
                onClick={() => setShowLocationModal(true)}
                className="w-full"
              >
                <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 hover:border-blue-500 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">
                          {currentCenter?.name || selectedCenter?.name || 'Select location'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {currentCenter?.address || selectedCenter?.address ? 
                            `${(currentCenter?.address || selectedCenter?.address)?.street || ''}, ${(currentCenter?.address || selectedCenter?.address)?.city || ''}, ${(currentCenter?.address || selectedCenter?.address)?.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                            'Tap to select a location'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Service Selection - Always visible */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Service
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the service you need
            </p>
            <button
              onClick={() => {
                if (selectedCenter || currentCenter) {
                  setShowServiceModal(true);
                }
              }}
              disabled={!selectedCenter && !currentCenter}
              className="w-full"
            >
              <div className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                !selectedCenter && !currentCenter 
                  ? 'border-gray-200 opacity-50 cursor-not-allowed' 
                  : 'border-gray-200 hover:border-blue-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    {selectedService ? (
                      <>
                        <h3 className="font-semibold text-gray-900">{selectedService.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedService.duration} minutes • INR {selectedService.bookingAmount || selectedService.price || 0}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900">Select a service</h3>
                        <p className="text-sm text-gray-500">
                          {!selectedCenter && !currentCenter ? 'Please select a location first' : 'Tap to choose a service'}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className={`w-5 h-5 ${!selectedCenter && !currentCenter ? 'text-gray-300' : 'text-gray-400'}`} />
                </div>
              </div>
            </button>
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
        sessionType={sessionType || 'in-person'}
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
        isNewUser={isNewUser}
        sessionType={sessionType || 'in-person'}
        isPrePaid={isPrePaid}
        onSelect={(service) => {
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />
    </div>
  );
}
