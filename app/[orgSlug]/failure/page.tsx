'use client';

import React from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui-atoms';

export default function FailurePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;
  const error = searchParams.get('error') || 'Payment failed';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="w-full space-y-3">
            <Button
              onClick={() => router.back()}
              variant="primary"
              size="lg"
              fullWidth
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={() => router.push(`/${orgSlug}`)}
              variant="secondary"
              size="lg"
              fullWidth
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
