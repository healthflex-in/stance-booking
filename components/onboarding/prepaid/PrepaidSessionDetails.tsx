'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_USER, GET_SERVICES } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { LocationSelectionModal, ServiceSelectionModal } from '@/components/onboarding/shared';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface PrepaidSessionDetailsProps {
  patientId: string;
  centerId: string;
  isNewUser: boolean;
  onBack: () => void;
  onContinue: (data: { centerId: string; serviceId: string; serviceDuration: number; servicePrice: number; designation?: string }) => void;
}

export default function PrepaidSessionDetails({
  patientId,
  centerId,
  isNewUser,
  onBack,
  onContinue,
}: PrepaidSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Physiotherapist');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: null },
    fetchPolicy: 'network-only',
    skip: !isNewUser,
  });

  const { data: patientData } = useQuery(GET_USER, {
    variables: { userId: patientId },
    skip: !patientId,
    fetchPolicy: 'cache-first',
  });

  const patient = patientData?.user;
  const patientFirstName = patient?.profileData?.firstName || '';
  const patientLastName = patient?.profileData?.lastName || '';
  const patientFullName = patientFirstName && patientLastName 
    ? `${patientFirstName} ${patientLastName}`.trim()
    : patientFirstName || '';

  const filteredCenters = React.useMemo(() => {
    if (!centersData?.centers) return [];
    return centersData.centers.filter((center: any) => center.isOnline === true);
  }, [centersData]);

  const prepaidServices = React.useMemo(() => {
    if (!servicesData?.services) return [];
    return servicesData.services.filter((service: any) => 
      service.allowOnlineBooking === true && 
      service.isNewUserService === true &&
      service.allowOnlineDelivery === true &&
      service.isPrePaid === true
    );
  }, [servicesData]);

  useEffect(() => {
    if (isNewUser && filteredCenters.length > 0 && !selectedCenter) {
      setSelectedCenter(filteredCenters[0]);
    }
  }, [isNewUser, filteredCenters, selectedCenter]);

  useEffect(() => {
    setSelectedService(null);
  }, [selectedCenter]);

  const handleContinue = () => {
    if (!selectedService || !selectedCenter) return;
    onContinue({
      centerId: selectedCenter._id,
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
      designation: 'Physiotherapist',
    });
  };

  const canProceed = selectedService && selectedCenter;

  if (isNewUser && servicesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Loading services..." />
      </div>
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {!isNewUser && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Welcome back{patientFullName ? `, ${patientFullName}` : ''}!
              </h3>
              <p className="text-sm text-gray-600">
                Book your prepaid session
              </p>
            </div>
          )}

          {!isNewUser && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Location</h2>
              <p className="text-gray-600 text-sm mb-4">Select your preferred location</p>
              <button onClick={() => setShowLocationModal(true)} className="w-full">
                <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedCenter ? '#DDFE71' : '#e5e7eb' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedCenter ? '#DDFE71' : '#f3f4f6' }}>
                        <MapPin className="w-5 h-5" style={{ color: selectedCenter ? '#000' : '#9ca3af' }} />
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
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {!isNewUser && (
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
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service</h2>
            <p className="text-gray-600 text-sm mb-4">Choose the service you need</p>
            
            {isNewUser ? (
              prepaidServices.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                  <p className="text-yellow-800">No prepaid services available at the moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prepaidServices.map((service: any) => (
                    <button
                      key={service._id}
                      onClick={() => setSelectedService(service)}
                      className="w-full bg-white rounded-2xl p-4 border-2 transition-all text-left"
                      style={{ borderColor: selectedService?._id === service._id ? '#DDFE71' : '#e5e7eb', backgroundColor: selectedService?._id === service._id ? '#f7ffe5' : '#fff' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {service.duration} minutes • ₹{service.bookingAmount || service.price || 0}
                          </p>
                          {service.description && (
                            <p className="text-xs text-gray-400 mt-1">{service.description}</p>
                          )}
                        </div>
                        {selectedService?._id === service._id && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center ml-3" style={{ backgroundColor: '#DDFE71' }}>
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <button onClick={() => setShowServiceModal(true)} className="w-full">
                <div className="bg-white rounded-2xl p-4 border-2 transition-all" style={{ borderColor: selectedService ? '#DDFE71' : '#e5e7eb', opacity: !selectedCenter ? 0.5 : 1, cursor: !selectedCenter ? 'not-allowed' : 'pointer' }}>
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
                          <p className="text-sm text-gray-500">{!selectedCenter ? 'Please select a location first' : 'Tap to choose a service'}</p>
                        </>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 ${!selectedCenter ? 'text-gray-300' : 'text-gray-400'}`} />
                  </div>
                </div>
              </button>
            )}
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
