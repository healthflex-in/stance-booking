'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SERVICES } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface PrepaidNewSessionDetailsProps {
  patientId: string;
  onBack: () => void;
  onContinue: (data: { serviceId: string; serviceDuration: number; servicePrice: number; designation?: string }) => void;
}

export default function PrepaidNewSessionDetails({ patientId, onBack, onContinue }: PrepaidNewSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Physiotherapist');

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: null },
    fetchPolicy: 'network-only',
  });

  const prepaidServices = React.useMemo(() => {
    if (!servicesData?.services) return [];
    return servicesData.services.filter((service: any) => 
      service.allowOnlineBooking === true && 
      service.isNewUserService === true &&
      service.allowOnlineDelivery === true &&
      service.isPrePaid === true
    );
  }, [servicesData]);

  const handleContinue = () => {
    if (!selectedService) return;
    onContinue({
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
      designation: selectedDesignation,
    });
  };

  if (servicesLoading) {
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
                S&C Coach
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service</h2>
            <p className="text-gray-600 text-sm mb-4">Choose the service you need</p>
            {prepaidServices.length === 0 ? (
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
            )}
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <PrimaryButton onClick={handleContinue} disabled={!selectedService} fullWidth={true} variant="primary">
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
