'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { getBookingCookies } from '@/utils/booking-cookies';

interface SessionTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sessionType: 'in-person' | 'online') => void;
  selectedSessionType?: 'in-person' | 'online';
}

export default function SessionTypeSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedSessionType,
}: SessionTypeSelectionModalProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const cookies = getBookingCookies();
  const isHyfit = cookies.orgSlug === 'hyfit' || cookies.orgSlug === 'devhyfit';

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
        className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[50vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Session Type
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
          <div className="space-y-3">
            <button
              onClick={() => {
                onSelect('in-person');
                onClose();
              }}
              className="w-full rounded-xl border-2 p-4 text-left transition-all"
              style={{ borderColor: selectedSessionType === 'in-person' ? '#DDFE71' : '#e5e7eb' }}
              type="button"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">In Person</h3>
                  <p className="text-sm text-gray-500">Visit our clinic for your session</p>
                </div>
                {selectedSessionType === 'in-person' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DDFE71' }}>
                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {!isHyfit && (
              <button
                onClick={() => {
                  onSelect('online');
                  onClose();
                }}
                className="w-full rounded-xl border-2 p-4 text-left transition-all"
                style={{ borderColor: selectedSessionType === 'online' ? '#DDFE71' : '#e5e7eb' }}
                type="button"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Online</h3>
                    <p className="text-sm text-gray-500">Join your session remotely</p>
                  </div>
                  {selectedSessionType === 'online' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DDFE71' }}>
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
