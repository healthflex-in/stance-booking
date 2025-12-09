'use client';

import React, { useEffect } from 'react';
import { UserCircle, X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';

interface ConsultantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultants: any[];
  sessionType: 'in-person' | 'online';
  centerId: string;
  onSelect: (consultant: any) => void;
}

export default function ConsultantSelectionModal({
  isOpen,
  onClose,
  consultants,
  sessionType,
  centerId,
  onSelect,
}: ConsultantSelectionModalProps) {
  const { isInDesktopContainer } = useContainerDetection();

  // Prevent body scroll when modal is open
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
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {consultants.length > 0 ? (
            <div className="space-y-2">
              {consultants.map((consultant) => (
                <button
                  key={consultant._id}
                  onClick={() => onSelect(consultant)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50 hover:border-gray-300 transition-all"
                  type="button"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-0.5">
                        Dr. {consultant.profileData?.firstName}{' '}
                        {consultant.profileData?.lastName}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {consultant.profileData?.designation || consultant.profileData?.bio || 'Senior Musculoskeletal & Sports Physiotherapist'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
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
