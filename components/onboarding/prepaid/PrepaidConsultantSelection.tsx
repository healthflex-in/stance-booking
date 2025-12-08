'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_FILTERED_CONSULTANTS } from '@/gql/queries';
import { User } from 'lucide-react';

interface PrepaidConsultantSelectionProps {
  centerId: string;
  onConsultantSelect: (consultantId: string) => void;
}

export default function PrepaidConsultantSelection({
  centerId,
  onConsultantSelect,
}: PrepaidConsultantSelectionProps) {
  const { data: consultantsData, loading, error } = useQuery(GET_FILTERED_CONSULTANTS, {
    variables: {
      filter: {
        allowOnlineBooking: true,
        allowOnlineDelivery: ['ONLINE', 'BOTH'],
        centers: [centerId],
      },
    },
    fetchPolicy: 'network-only',
  });



  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const consultants = consultantsData?.getFilteredConsultants || [];

  if (!Array.isArray(consultants) || consultants.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-4">
            No consultants available at this time.
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-2">
              Error: {error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Select Consultant</h2>
        {consultants.map((consultant: any, index: number) => (
          <button
            key={consultant._id}
            onClick={() => onConsultantSelect(consultant._id)}
            className={`w-full py-6 text-black font-semibold rounded-xl transition-all text-left px-6 ${
              index === 0
                ? 'bg-[#DDFE71]'
                : 'border-2 border-[#DDFE71] bg-transparent hover:bg-[#DDFE71]/10'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  Dr. {consultant.profileData?.firstName} {consultant.profileData?.lastName}
                </div>
                {consultant.profileData?.specialization && (
                  <div className="text-sm text-gray-600">{consultant.profileData.specialization}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
