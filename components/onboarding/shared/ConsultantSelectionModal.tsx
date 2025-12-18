'use client';

import React, { useEffect } from 'react';
import { UserCircle, X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface ConsultantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultants: any[];
  sessionType: 'in-person' | 'online';
  centerId?: string;
  organizationId?: string;
  onSelect: (consultant: any | null) => void;
  selectedConsultant?: any | null;
  loading?: boolean;
}

export default function ConsultantSelectionModal({
  isOpen,
  onClose,
  consultants,
  sessionType,
  centerId,
  organizationId,
  onSelect,
  selectedConsultant = null,
  loading = false,
}: ConsultantSelectionModalProps) {
  const { isInDesktopContainer } = useContainerDetection();

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
            Select preferred consultant
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
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <StanceHealthLoader message="Loading consultants..." />
            </div>
          ) : consultants.length > 0 ? (
            <div className="space-y-2">
              <button
                onClick={() => onSelect(null)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  selectedConsultant === null
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                }`}
                type="button"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedConsultant === null ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <UserCircle className={`w-5 h-5 ${
                      selectedConsultant === null ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-0.5">
                      Any available
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">
                      First available consultant for your session
                    </div>
                  </div>
                </div>
              </button>

              {consultants.map((consultant: any) => {
                const isSelected = selectedConsultant?._id === consultant._id;
                return (
                  <button
                    key={consultant._id}
                    onClick={() => onSelect(consultant)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-blue-100' : 'bg-purple-50'
                      }`}>
                        <UserCircle className={`w-5 h-5 ${
                          isSelected ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 mb-0.5">
                          {consultant.profileData?.firstName || consultant.profileData?.lastName ? (
                            <>Dr. {consultant.profileData?.firstName || ''} {consultant.profileData?.lastName || ''}</>
                          ) : (
                            <>Consultant</>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {consultant.profileData?.designation || consultant.profileData?.bio || 'Senior Musculoskeletal & Sports Physiotherapist'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No consultants available for {sessionType === 'online' ? 'online' : 'in-person'} sessions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
