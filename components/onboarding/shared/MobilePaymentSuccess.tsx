'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface MobilePaymentSuccessProps {
  bookingData: any;
  onNext: () => void;
}

export default function MobilePaymentSuccess({
  bookingData,
  onNext,
}: MobilePaymentSuccessProps) {
  const [countdown, setCountdown] = useState(4);

  // Countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-advance to next step after countdown
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 4000); // Wait 4 seconds then proceed

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-4">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-white text-center mb-4">
        Payment completed
      </h2>

      <p className="text-white text-center text-lg opacity-90">
        INR {bookingData.treatmentPrice || 100} has been debited from your
        account
      </p>

      {/* Countdown Message */}
      <p className="text-white text-center text-sm mt-6 opacity-80">
        This screen will close in {countdown} second{countdown !== 1 && 's'}...
      </p>

      {/* Loading indicator */}
      <div className="mt-8">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
