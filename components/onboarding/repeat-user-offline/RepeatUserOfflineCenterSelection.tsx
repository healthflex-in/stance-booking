'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS } from '@/gql/queries';
import { MapPin, ChevronRight } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { PrimaryButton } from '@/components/ui-atoms';

interface RepeatUserOfflineCenterSelectionProps {
  selectedCenterId: string;
  onCenterSelect: (centerId: string) => void;
  onNext: () => void;
}

export default function RepeatUserOfflineCenterSelection({
  selectedCenterId,
  onCenterSelect,
  onNext,
}: RepeatUserOfflineCenterSelectionProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const { data: centersData, loading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  const incenterCenters = centersData?.centers?.filter(
    (center: any) => center.isOnline === true
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
              Location
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Select your preferred location
            </p>
            <div className="space-y-3">
              {incenterCenters.map((center: any) => (
                <button
                  key={center._id}
                  onClick={() => onCenterSelect(center._id)}
                  className="w-full"
                  type="button"
                >
                  <div className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                    selectedCenterId === center._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-gray-900">{center.name}</h3>
                          <p className="text-sm text-gray-500">
                            {center.address?.street || ''}, {center.address?.city || ''}, {center.address?.state || ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <PrimaryButton
          onClick={onNext}
          disabled={!selectedCenterId}
          variant="primary"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
