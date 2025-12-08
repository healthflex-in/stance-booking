'use client';

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import RazorpayLoader from '@/components/loader/RazorLoader';
import PublicRazorpayPayment from '@/components/payment/PublicRazorpayPayment';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import MobileLoadingScreen from './MobileLoadingScreen';
import Spinner from '@/components/ui/Spinner';

interface MobilePaymentProcessingProps {
  amount: number;
  patientDetails: {
    name?: string;
    email?: string;
    phone?: string;
  };
  patientId: string;
  centerId: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: any) => void;
  isFromGenerateLink?: boolean;
}

export default function MobilePaymentProcessing({
  amount,
  patientDetails,
  patientId,
  centerId,
  onPaymentSuccess,
  onPaymentFailure,
  isFromGenerateLink = false,
}: MobilePaymentProcessingProps) {
  const mobileAnalytics = useMobileFlowAnalytics();

  useEffect(() => {
    // Track payment initiation
    mobileAnalytics.trackPaymentInitiated({
      orderId: `order_${Date.now()}`,
      amount,
      paymentMethod: 'razorpay',
      patientId,
      centerId
    });

    // Show warning toast
    toast.warning('Do not close or refresh this page during payment!', {
      duration: 5000,
      position: 'top-center',
    });
  }, [amount, patientId, centerId, mobileAnalytics]);

  // Prevent accidental page close/refresh during payment processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = '';
      // Some browsers show this message, others show a generic message
      return 'Payment is being processed. Are you sure you want to leave?';
    };

    // Add the event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: Remove the event listener when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  const handlePaymentSuccess = (paymentId: string) => {
    mobileAnalytics.trackPaymentSuccess({
      orderId: `order_${Date.now()}`,
      paymentId,
      amount,
      paymentMethod: 'razorpay',
      patientId,
      centerId,
      appointmentId: `apt_${Date.now()}`
    });
    onPaymentSuccess(paymentId);
  };
  
  const handlePaymentFailure = (error: any) => {
    mobileAnalytics.trackPaymentFailure({
      orderId: `order_${Date.now()}`,
      amount,
      paymentMethod: 'razorpay',
      errorCode: error?.code,
      errorMessage: error?.description || error?.message,
      patientId,
      centerId
    });
    onPaymentFailure(error);
  };
  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <MobileLoadingScreen 
        message="Processing Payment - Please Wait" 
        animationData="/lottie1.json" 
      />
      
      <div className="hidden">
        <PublicRazorpayPayment
          amount={amount}
          patientDetails={patientDetails}
          patientId={patientId}
          centerId={centerId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          isFromGenerateLink={isFromGenerateLink}
        />
      </div>
    </div>
  );
}
