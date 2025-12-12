'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import RazorpayLoader from '@/components/loader/RazorLoader';
import MobileLoadingScreen from '../shared/MobileLoadingScreen';

interface NewUserOfflinePaymentProcessingProps {
  amount: number;
  paymentType: 'invoice' | 'package';
  patientDetails: { name?: string; email?: string; phone?: string };
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: any) => void;
}

const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      _id
      razorpayOrderId
    }
  }
`;

const UPDATE_ORDER = gql`
  mutation UpdateOrder($orderId: ObjectID!) {
    updateOrder(orderId: $orderId) {
      _id
      status
      payment { razorpayPaymentId }
    }
  }
`;

const GET_CENTERS = gql`
  query GetCenters {
    centers { _id name }
  }
`;

export default function NewUserOfflinePaymentProcessing({
  amount,
  paymentType,
  patientDetails,
  patientId,
  centerId,
  consultantId,
  treatmentId,
  onPaymentSuccess,
  onPaymentFailure,
}: NewUserOfflinePaymentProcessingProps) {
  const [isRazorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);
  const [createOrderMutation] = useMutation(CREATE_ORDER);
  const [updateOrderMutation] = useMutation(UPDATE_ORDER);
  const { data: centersData } = useQuery(GET_CENTERS);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const isPollingRef = useRef(false);
  const paymentInitiatedRef = useRef(false);

  useEffect(() => {
    toast.warning('Do not close or refresh this page during payment!', {
      duration: 5000,
      position: 'top-center',
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return 'Payment is being processed. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const pollPaymentStatus = useCallback(async (orderDbId: string) => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    setLoaderMessage("Completing your Payment...");

    try {
      const { data, errors } = await updateOrderMutation({ variables: { orderId: orderDbId } });

      if (errors?.[0]?.message?.includes('already paid')) {
        isPollingRef.current = false;
        onPaymentSuccess('payment_success');
        return;
      }

      if (data?.updateOrder?.status === 'PAID') {
        isPollingRef.current = false;
        onPaymentSuccess(data.updateOrder.payment?.razorpayPaymentId || 'payment_success');
        return;
      } else if (data?.updateOrder?.status === 'ATTEMPTED') {
        isPollingRef.current = false;
        onPaymentFailure('Payment failed');
        return;
      }
    } catch (error) {
      console.error('Initial status check failed:', error);
    }

    pollAttemptsRef.current = 0;
    pollingIntervalRef.current = setInterval(async () => {
      try {
        pollAttemptsRef.current += 1;

        if (pollAttemptsRef.current > 200) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          onPaymentFailure('Payment timeout');
          return;
        }

        const { data, errors } = await updateOrderMutation({ variables: { orderId: orderDbId } });

        if (errors?.[0]?.message?.includes('already paid')) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentSuccess('payment_success');
          return;
        }

        if (data?.updateOrder?.status === 'PAID') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentSuccess(data.updateOrder.payment?.razorpayPaymentId || 'payment_success');
        } else if (data?.updateOrder?.status === 'ATTEMPTED') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentFailure('Payment failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  }, [onPaymentSuccess, onPaymentFailure, updateOrderMutation]);

  const createOrder = async () => {
    try {
      let orderInput: any = {
        amount,
        currency: 'INR',
        center: centerId,
        patient: patientId,
        type: paymentType === 'invoice' ? 'INVOICE' : 'ADVANCE',
      };

      if (paymentType === 'invoice') {
        orderInput.consultant = consultantId;
        orderInput.treatment = treatmentId;
      } else {
        const center = centersData?.centers?.find((c: any) => c._id === centerId);
        const centerName = center?.name?.toLowerCase() || '';
        
        const getPackageId = (name: string) => {
          if (name.includes('indiranagar')) return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID || '68d64545bd448a9f282aa3b3';
          if (name.includes('whitefield')) return process.env.NEXT_PUBLIC_WHITEFIELD_PACKAGE_ID || '68da370d862df251a77c3b0c';
          if (name.includes('hsr')) return process.env.NEXT_PUBLIC_HSR_PACKAGE_ID || '68da3760862df251a77c3b2e';
          return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID || '68d64545bd448a9f282aa3b3';
        };
        
        orderInput.packageId = getPackageId(centerName);
      }

      const { data } = await createOrderMutation({ variables: { input: orderInput } });
      return { razorpayOrderId: data.createOrder.razorpayOrderId, orderDbId: data.createOrder._id };
    } catch (error) {
      console.error('Order creation failed:', error);
      onPaymentFailure('Failed to create payment order');
      return null;
    }
  };

  const initiatePayment = useCallback(async () => {
    if (paymentInitiatedRef.current) return;
    paymentInitiatedRef.current = true;

    const orderData = await createOrder();
    if (!orderData) return;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: amount * 100,
      currency: 'INR',
      name: 'Stance Health',
      description: 'Appointment Booking',
      order_id: orderData.razorpayOrderId,
      handler: (response: any) => {
        pollPaymentStatus(orderData.orderDbId);
      },
      prefill: {
        name: patientDetails.name,
        email: patientDetails.email,
        contact: patientDetails.phone,
      },
      method: { netbanking: true, card: true, upi: true },
      upi: { flow: "collect" },
      theme: { color: "#3399cc" },
      modal: {
        ondismiss: () => {
          onPaymentFailure('Payment cancelled by user');
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      onPaymentFailure(response.error);
    });
    rzp.open();
  }, [amount, patientDetails, pollPaymentStatus, onPaymentFailure]);

  useEffect(() => {
    if (isRazorpayLoaded) {
      initiatePayment();
    }
  }, [isRazorpayLoaded, initiatePayment]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <MobileLoadingScreen message={loaderMessage || "Processing Payment - Please Wait"} animationData="/lottie1.json" />
      <div className="hidden">
        <RazorpayScriptLoader onLoad={() => setRazorpayLoaded(true)} />
        {loaderMessage && <RazorpayLoader message={loaderMessage} />}
      </div>
    </div>
  );
}
