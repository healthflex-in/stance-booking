'use client';

import React from 'react';
import { Phone, X } from 'lucide-react';

interface NewUserServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallNow: () => void;
  isInDesktopContainer?: boolean;
}

export default function NewUserServiceModal({ isOpen, onClose, onCallNow, isInDesktopContainer = false }: NewUserServiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 z-50 flex items-end ${isInDesktopContainer ? 'items-center' : 'sm:items-center'} justify-center`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white ${isInDesktopContainer ? 'rounded-2xl max-w-sm mx-4' : 'rounded-t-2xl sm:rounded-2xl sm:max-w-sm mx-4'} shadow-2xl w-full p-6 animate-in fade-in ${isInDesktopContainer ? 'zoom-in' : 'slide-in-from-bottom sm:zoom-in'} duration-200`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          New Patient Service Only
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          This booking link is exclusively for new patients. As an existing patient, please contact us to schedule your appointment.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onCallNow}
            className="w-full py-3 rounded-xl font-semibold text-black transition-all hover:opacity-90"
            style={{ backgroundColor: '#DDFE71' }}
          >
            <div className="flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call Now
            </div>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
