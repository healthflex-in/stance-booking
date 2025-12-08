'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SERVICES } from '@/gql/queries';

interface RepeatUserIncenterServiceSelectionProps {
  centerId: string;
  onServiceSelect: (serviceId: string, serviceDuration: number, servicePrice: number) => void;
}

export default function RepeatUserIncenterServiceSelection({
  centerId,
  onServiceSelect,
}: RepeatUserIncenterServiceSelectionProps) {
  const { data: servicesData, loading } = useQuery(GET_SERVICES, {
    variables: { centerId: [centerId] },
    fetchPolicy: 'network-only',
  });

  const repeatUserIncenterServices = servicesData?.services?.filter(
    (service: any) => !service.allowOnlineDelivery && !service.isPrePaid
  ) || [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Select Service</h2>
        {repeatUserIncenterServices.map((service: any, index: number) => (
          <button
            key={service._id}
            onClick={() => onServiceSelect(service._id, service.duration, service.price)}
            className={`w-full py-6 text-black font-semibold rounded-xl transition-all text-left px-6 ${
              index === 0
                ? 'bg-[#DDFE71]'
                : 'border-2 border-[#DDFE71] bg-transparent hover:bg-[#DDFE71]/10'
            }`}
          >
            <div className="text-xl font-bold mb-1">{service.name}</div>
            <div className="text-sm text-gray-700 mb-2">{service.duration} minutes</div>
            {service.description && (
              <div className="text-xs text-gray-600">{service.description}</div>
            )}
            <div className="text-sm font-semibold mt-2">₹{service.price}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
