'use client';

import React from 'react';
import { Calendar, User } from 'lucide-react';

interface LeadDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSlots: () => void;
  patientData: {
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
  };
}

export default function LeadDetectionModal({
  isOpen,
  onClose,
  onBookSlots,
  patientData,
}: LeadDetectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Welcome back, {patientData.firstName}!
          </h2>
          <p className="text-gray-600 mb-6">
            We found your profile. Would you like to book your first appointment?
          </p>
          <div className="space-y-3">
            <button
              onClick={onBookSlots}
              className="w-full py-3 text-black font-semibold rounded-xl transition-all"
              style={{ backgroundColor: '#DDFE71' }}
            >
              Book Appointment
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}