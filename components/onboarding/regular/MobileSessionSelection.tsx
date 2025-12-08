'use client';

import React from 'react';
import { User, Monitor } from 'lucide-react';

interface MobileSessionSelectionProps {
  bookingData: any;
  onUpdateData: (updates: any) => void;
  onNext: () => void;
}

export default function MobileSessionSelection({
  bookingData,
  onUpdateData,
  onNext,
}: MobileSessionSelectionProps) {
  const handleSessionTypeSelect = (type: 'in-person' | 'online') => {
    onUpdateData({ sessionType: type });
  };

  const canProceed = bookingData.sessionType !== null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 p-4">
        {/* Session Type Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session type
          </h2>
          <p className="text-gray-600 text-sm">
            Choose how you'd like to attend your session
          </p>
        </div>

        {/* Session Type Options */}
        <div className="space-y-4">
          {/* In Person Option */}
          <div
            className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
              bookingData.sessionType === 'in-person'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => handleSessionTypeSelect('in-person')}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  bookingData.sessionType === 'in-person'
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}
              >
                <User
                  className={`w-6 h-6 ${
                    bookingData.sessionType === 'in-person'
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">In Person</h3>
                <p className="text-sm text-gray-500">
                  Visit our clinic for your session
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  bookingData.sessionType === 'in-person'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {bookingData.sessionType === 'in-person' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>

          {/* Online Option */}
          <div
            className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
              bookingData.sessionType === 'online'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => handleSessionTypeSelect('online')}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  bookingData.sessionType === 'online'
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}
              >
                <Monitor
                  className={`w-6 h-6 ${
                    bookingData.sessionType === 'online'
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Online</h3>
                <p className="text-sm text-gray-500">
                  Join your session remotely
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  bookingData.sessionType === 'online'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {bookingData.sessionType === 'online' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-semibold text-white transition-all ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
