'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { GET_CENTERS } from '@/gql/queries';

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  centers: any[];
  sessionType?: 'in-person' | 'online';
  onSelect: (center: any) => void;
}

export default function LocationSelectionModal({
  isOpen,
  onClose,
  centers,
  sessionType,
  onSelect,
}: LocationSelectionModalProps) {
  const { isInDesktopContainer } = useContainerDetection();

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    skip: !isOpen || centers.length > 0,
    fetchPolicy: 'cache-first',
  });

  const displayCenters = centers.length > 0 ? centers : (centersData?.centers || []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 bg-black bg-opacity-50 z-[100] flex items-end animate-fade-in`}
      onClick={onClose}
      style={{ touchAction: 'none' }}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[65vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Select preferred location
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {centersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : displayCenters.length > 0 ? (
            <div className="space-y-2">
              {displayCenters.map((center: any) => (
                <button
                  key={center._id}
                  onClick={() => onSelect(center)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50 hover:border-gray-300 transition-all"
                  type="button"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-0.5">
                        {center.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {center.address?.street || 'Address not available'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No locations available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
