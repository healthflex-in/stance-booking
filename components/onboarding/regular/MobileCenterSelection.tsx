'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MapPin, ChevronDown } from 'lucide-react';
import { GET_CENTERS, UPDATE_PATIENT } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import { WhatsAppButton, MobileLoadingScreen } from '../shared';
import { toast } from 'sonner';

interface MobileCenterSelectionProps {
  selectedCenterId: string;
  onCenterSelect: (centerId: string) => void;
  onNext: () => void;
  patientId?: string;
}

export default function MobileCenterSelection({
  selectedCenterId,
  onCenterSelect,
  onNext,
  patientId,
}: MobileCenterSelectionProps) {
  const mobileAnalytics = useMobileFlowAnalytics();
  const [showCenterList, setShowCenterList] = useState(true);
  const [trackedCenterViews, setTrackedCenterViews] = useState(new Set<string>());
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);

  // Track component mount and center search start
  React.useEffect(() => {
    mobileAnalytics.trackCenterSelectionStart(patientId || '');
    mobileAnalytics.trackCenterSearchStart(patientId || '');
  }, [patientId, mobileAnalytics]);
  
  const [updatePatient] = useMutation(UPDATE_PATIENT, {
    onCompleted: () => {
      toast.success('Center updated successfully');
    },
    onError: (error) => {
      console.error('Error updating patient center:', error);
      toast.error('Failed to update center');
    },
  });

  const selectedCenter = centersData?.centers.find(
    (center: any) => center._id === selectedCenterId
  );

  const { isInDesktopContainer } = useContainerDetection();

  const handleCenterSelect = async (centerId: string) => {
    const center = centersData?.centers.find((c: any) => c._id === centerId);
    
    // Track center selection
    mobileAnalytics.trackCenterSelected(centerId, center?.name || '', patientId || '');
    
    onCenterSelect(centerId);
    setShowCenterList(false);
    console.log("added api key for public route in .env of frontend")
    
    // Store center ID and organization ID in localStorage
    localStorage.setItem('centerId', centerId);
    const selectedCenter = centersData?.centers.find(
      (center: any) => center._id === centerId
    );
    if (selectedCenter?.organization?._id) {
      localStorage.setItem('organizationId', selectedCenter.organization._id);
    } else {
      localStorage.removeItem('organizationId');
    }
    
    // Update patient's center if patientId is provided
    if (patientId) {
      try {
        await updatePatient({
          variables: {
            patientId: patientId,
            input: {
              centers: [centerId],
            },
          },
        });
      } catch (error) {
        console.error('Error updating patient center:', error);
      }
    }
  };

  const formatCenterAddress = (center: any) => {
    const { address } = center;
    return `${address.street}, ${address.city}, ${address.state}`;
  };

  const canProceed = selectedCenterId !== '';

  if (centersLoading) {
    return (
      <MobileLoadingScreen 
        message="Loading Centers" 
        animationData="/lottie2.json" 
      />
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col relative`}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select Center
            </h2>
            <p className="text-gray-600 text-sm">
              Choose your preferred Stance Health center
            </p>
          </div>

        {/* Center Selection */}
        <div className="mb-6">
          {/* Selected Center Display */}
          <div
            className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
              selectedCenter
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => setShowCenterList(true)}
          >
         <div className="flex items-center space-x-3 flex-1">
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
      selectedCenter ? 'bg-blue-100' : 'bg-gray-100'
    }`}
  >
    <MapPin
      className={`w-6 h-6 ${
        selectedCenter ? 'text-blue-600' : 'text-gray-600'
      }`}
    />
  </div>
  <div className="flex-1 min-w-0">
   <div className="flex items-center justify-between">
  <h3 className="font-semibold text-gray-900 break-words whitespace-normal">
    {selectedCenter ? selectedCenter.name : 'Choose a center'}
  </h3>
  <ChevronDown className="w-5 h-5 text-blue-600 ml-2 flex-shrink-0" />
</div>

    {selectedCenter && (
      <p className="text-sm text-gray-500 break-words whitespace-normal">
        {formatCenterAddress(selectedCenter)}
      </p>
    )}
  </div>
</div>

          </div>

          {/* Centers List Modal */}
          {showCenterList && (
            <div className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 z-50 bg-black bg-opacity-50 flex items-end`}>
              <div className={`bg-white rounded-t-3xl w-full ${isInDesktopContainer ? 'max-h-[70%]' : 'max-h-[80vh]'} flex flex-col`}>
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select Center
                    </h3>
                    <button
                      onClick={() => setShowCenterList(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Centers List - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-3">
                    {centersData?.centers
                      .filter((center: any) => 
                        (['HSR', 'Indiranagar', 'Whitefield'].some(location => 
                          center.name?.toLowerCase().includes(location.toLowerCase())
                        ))
                      )
                      .map((center: any) => (
                      <div
                        key={center._id}
                        className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                          selectedCenterId === center._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (!trackedCenterViews.has(center._id)) {
                            mobileAnalytics.trackCenterViewed(center._id, center.name, patientId || '');
                            setTrackedCenterViews(prev => new Set(prev).add(center._id));
                          }
                          handleCenterSelect(center._id);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              selectedCenterId === center._id
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            <MapPin
                              className={`w-5 h-5 ${
                                selectedCenterId === center._id
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {center.name}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              {formatCenterAddress(center)}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Phone: {center.phone}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedCenterId === center._id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedCenterId === center._id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>

                        {/* Location Link */}
                        {center.location && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <a
                              href={center.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              View on Maps
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Organization Info */}
          {/* {selectedCenter?.organization && (
            <div className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  {selectedCenter.organization.logo && (
                    <img
                      src={selectedCenter.organization.logo}
                      alt={selectedCenter.organization.brandName}
                      className="w-12 h-12 rounded-xl object-cover bg-black"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedCenter.organization.brandName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedCenter.organization.companyName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Continue Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <div className="flex items-center space-x-3">
          {/* <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M13 3a1 1 0 011 1v12a1 1 0 11-2 0V5.414l-7.293 7.293a1 1 0 01-1.414-1.414L10.586 4H4a1 1 0 110-2h9z"
                clipRule="evenodd"
              />
            </svg>
          </div> */}
          <button
            onClick={() => {
              mobileAnalytics.trackButtonClick('continue', 'center_selection', { 
                selected_center_id: selectedCenterId,
                patient_id: patientId 
              });
              onNext();
            }}
            disabled={!canProceed}
            className={`flex-1 py-4 rounded-2xl font-semibold text-black transition-all ${
              canProceed ? '' : 'bg-gray-300 cursor-not-allowed'
            }`}
            style={{ backgroundColor: canProceed ? '#DDFE71' : '#D1D5DB' }}
          >
            Continue
          </button>
        </div>
      </div>
      
      <WhatsAppButton context="center_selection" />
    </div>
  );
}