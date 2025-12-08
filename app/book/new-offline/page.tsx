'use client';

import { Suspense } from 'react';
import { MobileBookingFlow } from '@/components/onboarding/regular';

export default function NewOfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto bg-white shadow-lg">
        <div className="bg-purple-600 text-white p-4 text-center font-semibold">
          New User - In Center (Offline)
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <MobileBookingFlow />
        </Suspense>
      </div>
    </div>
  );
}
