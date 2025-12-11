'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SERVICES } from '@/gql/queries';
import { Flame, ChevronRight } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';

interface RepeatUserOfflineServiceSelectionProps {
  centerId: string;
  selectedServiceId?: string;
  onServiceSelect: (serviceId: string, serviceDuration: number, servicePrice: number) => void;
  onBack?: () => void;
}

export default function RepeatUserOfflineServiceSelection({
  centerId,
  selectedServiceId,
  onServiceSelect,
  onBack,
}: RepeatUserOfflineServiceSelectionProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const { data: servicesData, loading } = useQuery(GET_SERVICES, {
    variables: { centerId: [centerId] },
    fetchPolicy: 'network-only',
  });

  const repeatUserIncenterServices = servicesData?.services?.filter(
    (service: any) => !service.allowOnlineDelivery && !service.isPrePaid && service.allowOnlineBooking
  ) || [];

  if (loading) {
    return (
      <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Service
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Choose the service you need
            </p>
            <div className="space-y-3">
              {repeatUserIncenterServices.length === 0 ? (
                <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 text-center">
                  <p className="text-gray-500">No services available</p>
                </div>
              ) : (
                repeatUserIncenterServices.map((service: any) => (
                  <button
                    key={service._id}
                    onClick={() => onServiceSelect(service._id, service.duration, service.price || service.bookingAmount || 0)}
                    className="w-full"
                    type="button"
                  >
                    <div className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                      selectedServiceId === service._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Flame className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">
                              {service.duration} minutes • ₹{service.price || service.bookingAmount || 0}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
