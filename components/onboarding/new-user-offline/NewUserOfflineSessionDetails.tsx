'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_SERVICES } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { LocationSelectionModal, ServiceSelectionModal } from '@/components/onboarding/shared';
import { BookingAnalytics } from '@/services/booking-analytics';
import { isParamFromUrl } from '@/utils/booking-params';

interface NewUserOfflineSessionDetailsProps {
  patientId: string;
  centerId: string;
  serviceId?: string;
  onBack: () => void;
  onContinue: (data: { centerId: string; serviceId: string; serviceDuration: number; servicePrice: number; designation: string }) => void;
  analytics?: BookingAnalytics;
}

export default function NewUserOfflineSessionDetails({
  patientId,
  centerId,
  serviceId,
  onBack,
  onContinue,
  analytics,
}: NewUserOfflineSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isCenterFromParams, setIsCenterFromParams] = useState(false);
  const [isServiceFromParams, setIsServiceFromParams] = useState(false);
  const [isLoadingPreselected, setIsLoadingPreselected] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: centerId ? [centerId] : [] },
    skip: !centerId || !serviceId,
    fetchPolicy: 'network-only',
  });

  const filteredCenters = React.useMemo(() => {
    if (!centersData?.centers) return [];
    return centersData.centers.filter((center: any) => center.isOnline === true);
  }, [centersData]);

  // Pre-populate center if provided from params
  useEffect(() => {
    if (centerId && filteredCenters.length > 0 && !selectedCenter) {
      const center = filteredCenters.find((c: any) => c._id === centerId);
      if (center) {
        setSelectedCenter(center);
        // Only lock if it came from URL params
        setIsCenterFromParams(isParamFromUrl('centerId'));
      }
      // Only show loading if we also need to preselect a service
      if (serviceId) {
        setIsLoadingPreselected(true);
      }
    }
  }, [centerId, filteredCenters, selectedCenter]);

  // Pre-populate service if provided from params
  useEffect(() => {
    if (serviceId && servicesData?.services && !selectedService) {
      const service = servicesData.services.find((s: any) => s._id === serviceId);
      if (service) {
        setSelectedService(service);
        // Only lock if it came from URL params
        setIsServiceFromParams(isParamFromUrl('serviceId'));
      }
      // Done loading preselected data
      setIsLoadingPreselected(false);
    }
  }, [serviceId, servicesData, selectedService]);

  useEffect(() => {
    setSelectedService(null);
  }, [selectedCenter]);

  const handleContinue = () => {
    if (!selectedService || !selectedCenter) return;
    // New users always use Physiotherapist
    const designation = 'Physiotherapist';
    analytics?.trackSessionDetailsContinueClicked(selectedService._id, designation);
    onContinue({
      centerId: selectedCenter._id,
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
      designation,
    });
  };

  const canProceed = selectedService && selectedCenter;

  // Show loading screen while preselected data is being fetched
  if (isLoadingPreselected || (centerId && serviceId && servicesLoading)) {
    return (
      <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Welcome!</h3>
            <p className="text-sm text-gray-600 mb-6">Book your in-person session</p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Location</h2>
            <p className="text-gray-600 text-sm mb-4">{isCenterFromParams ? 'Pre-selected location' : 'Select your preferred location'}</p>
            <button onClick={() => { if (!isCenterFromParams) setShowLocationModal(true); }} className="w-full" disabled={isCenterFromParams}>
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedCenter ? '#DDFE71' : '#e5e7eb', opacity: isCenterFromParams ? 0.7 : 1, cursor: isCenterFromParams ? 'not-allowed' : 'pointer' }}>
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

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service</h2>
            <p className="text-gray-600 text-sm mb-4">{isServiceFromParams ? 'Pre-selected service' : 'Choose the service you need'}</p>

            <button onClick={() => { if (selectedCenter && !isServiceFromParams) { analytics?.trackServiceModalOpened(); setShowServiceModal(true); } }} disabled={!selectedCenter || isServiceFromParams} className="w-full">
              <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedService ? '#DDFE71' : '#e5e7eb', opacity: !selectedCenter || isServiceFromParams ? 0.7 : 1, cursor: !selectedCenter || isServiceFromParams ? 'not-allowed' : 'pointer' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    {selectedService ? (
                      <h3 className="font-semibold text-gray-900">{selectedService.externalName}</h3>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-900">Select a service</h3>
                        <p className="text-sm text-gray-500">{!selectedCenter ? 'Please select a location first' : 'Tap to choose a service'}</p>
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

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <PrimaryButton onClick={handleContinue} disabled={!canProceed} fullWidth={true} variant="primary">
          Continue
        </PrimaryButton>
      </div>

      <LocationSelectionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        centers={filteredCenters}
        sessionType="in-person"
        onSelect={(center) => {
          analytics?.trackEvent('center_selected', { centerId: center._id, centerName: center.name });
          setSelectedCenter(center);
          setShowLocationModal(false);
        }}
      />

      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        patientId={patientId}
        centerId={selectedCenter?._id || centerId}
        isNewUser={true}
        sessionType="in-person"
        designation="Physiotherapist"
        selectedServiceId={selectedService?._id}
        onSelect={(service) => {
          analytics?.trackEvent('service_selected', { serviceId: service._id });
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />
    </div>
  );
}
