'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { ChevronRight } from 'lucide-react';
import { GET_SERVICES } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';

interface NewUserOnlineSessionDetailsProps {
  patientId: string;
  onBack: () => void;
  onContinue: (data: { serviceId: string; serviceDuration: number; servicePrice: number }) => void;
}

export default function NewUserOnlineSessionDetails({
  patientId,
  onBack,
  onContinue,
}: NewUserOnlineSessionDetailsProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedService, setSelectedService] = useState<any>(null);

  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: null },
    fetchPolicy: 'network-only',
  });

  const onlineServices = React.useMemo(() => {
    if (!servicesData?.services) return [];
    return servicesData.services.filter((service: any) => 
      service.allowOnlineBooking === true && 
      service.isNewUserService === true &&
      service.allowOnlineDelivery === true &&
      service.isPrePaid === false
    );
  }, [servicesData]);

  const handleContinue = () => {
    if (!selectedService) return;
    onContinue({
      serviceId: selectedService._id,
      serviceDuration: selectedService.duration,
      servicePrice: selectedService.bookingAmount || selectedService.price || 0,
    });
  };

  const canProceed = !!selectedService;

  if (servicesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Service</h2>
            <p className="text-gray-600 text-sm mb-4">Choose the service you need</p>
            
            {onlineServices.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <p className="text-yellow-800">No services available at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {onlineServices.map((service: any) => (
                <button
                  key={service._id}
                  onClick={() => setSelectedService(service)}
                  className={`w-full bg-white rounded-2xl p-4 border-2 transition-all text-left ${
                    selectedService?._id === service._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
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
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <PrimaryButton onClick={handleContinue} disabled={!canProceed} fullWidth={true} variant="primary">
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
