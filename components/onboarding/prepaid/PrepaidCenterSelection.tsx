'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS } from '@/gql/queries';
import { MapPin } from 'lucide-react';

interface PrepaidCenterSelectionProps {
  selectedCenterId: string;
  onCenterSelect: (centerId: string) => void;
  onNext: () => void;
}

export default function PrepaidCenterSelection({
  selectedCenterId,
  onCenterSelect,
  onNext,
}: PrepaidCenterSelectionProps) {
  const { data: centersData, loading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'network-only',
  });

  // Filter only online centers
  const onlineCenters = centersData?.centers?.filter(
    (center: any) => center.isOnline === true
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!onlineCenters || onlineCenters.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-4">
            No online centers available at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Select Online Center
        </h2>

        <div className="space-y-3">
          {onlineCenters.map((center: any) => (
            <button
              key={center._id}
              onClick={() => onCenterSelect(center._id)}
              className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                selectedCenterId === center._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {center.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {center.address?.city}, {center.address?.state}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Online Booking Available
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!selectedCenterId}
          className="w-full py-4 text-black font-semibold rounded-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
          style={{
            backgroundColor: selectedCenterId ? '#DDFE71' : '#9CA3AF',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
