'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { gql, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import RazorpayLoader from '@/components/loader/RazorLoader';
import MobileLoadingScreen from '../shared/MobileLoadingScreen';

interface RepeatUserOnlinePaymentProcessingProps {
  amount: number;
  patientDetails: { name?: string; email?: string; phone?: string };
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  onPaymentSuccess: (paymentId: string, invoiceId?: string) => void;
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
  mutation UpdateOrderRepeatUserOnline($orderId: ObjectID!) {
    updateOrder(orderId: $orderId) {
      _id
      status
      invoice {
        _id
      }
      payment {
        razorpayPaymentId
      }
    }
  }
`;

const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($orderId: ObjectID!, $razorpayPaymentId: String!) {
    verifyPayment(orderId: $orderId, razorpayPaymentId: $razorpayPaymentId) {
      success
      message
    }
  }
`;



export default function RepeatUserOnlinePaymentProcessing({
  amount,
  patientDetails,
  patientId,
  centerId,
  consultantId,
  treatmentId,
  onPaymentSuccess,
  onPaymentFailure,
}: RepeatUserOnlinePaymentProcessingProps) {
  const [isRazorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);
  const [createOrderMutation] = useMutation(CREATE_ORDER);
  const [updateOrderMutation] = useMutation(UPDATE_ORDER);
  const [verifyPaymentMutation] = useMutation(VERIFY_PAYMENT);

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
    setLoaderMessage("Verifying Payment...");
    pollAttemptsRef.current = 0;

    // Wait 3 seconds before first poll
    await new Promise(resolve => setTimeout(resolve, 3000));

    const doPoll = async () => {
      try {
        pollAttemptsRef.current += 1;

        if (pollAttemptsRef.current > 10) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentFailure('Payment verification timeout');
          return;
        }

        const { data, errors } = await updateOrderMutation({ 
          variables: { orderId: orderDbId },
          fetchPolicy: 'network-only'
        });

        if (errors?.length && errors[0].message.includes('already paid')) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentSuccess('payment_success', data?.updateOrder?.invoice?._id);
          return;
        }

        if (data?.updateOrder?.status === 'PAID') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentSuccess(
            data.updateOrder.payment?.razorpayPaymentId || 'payment_success',
            data.updateOrder.invoice?._id
          );
        } else if (data?.updateOrder?.status === 'ATTEMPTED') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;
          onPaymentFailure('Payment failed');
        }
      } catch (error: any) {
        console.error('❌ Poll error:', error.message);
        console.error('❌ Full error:', error);
      }
    };

    pollingIntervalRef.current = setInterval(doPoll, 30000);
  }, [onPaymentSuccess, onPaymentFailure, updateOrderMutation]);

  const createOrder = async () => {
    try {
      const appointmentId = sessionStorage.getItem('appointmentId');
      console.log('📝 Attempting to create order with appointmentId:', appointmentId);
      
      if (!appointmentId) {
        console.error('❌ No appointmentId found in sessionStorage');
        console.error('❌ SessionStorage contents:', {
          appointmentId: sessionStorage.getItem('appointmentId'),
          paymentType: sessionStorage.getItem('paymentType'),
          paymentAmount: sessionStorage.getItem('paymentAmount'),
        });
        throw new Error('Appointment ID not found in session');
      }

      const orderInput: any = {
        amount,
        currency: 'INR',
        center: centerId,
        patient: patientId,
        type: 'INVOICE',
        appointment: appointmentId,
      };

      console.log('📝 Creating order with input:', orderInput);
      const { data } = await createOrderMutation({ variables: { input: orderInput } });
      console.log('✅ Order created:', data.createOrder);
      return { razorpayOrderId: data.createOrder.razorpayOrderId, orderDbId: data.createOrder._id };
    } catch (error) {
      console.error('❌ Order creation failed:', error);
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
      handler: async (response: any) => {
        // Call verifyPayment immediately after payment succeeds
        try {
          const verifyResult = await verifyPaymentMutation({
            variables: {
              orderId: orderData.orderDbId,
              razorpayPaymentId: response.razorpay_payment_id,
            },
          });
          
          if (verifyResult.data?.verifyPayment?.success) {
            // Get the order to retrieve invoice ID
            const { data } = await updateOrderMutation({ 
              variables: { orderId: orderData.orderDbId },
              fetchPolicy: 'network-only'
            });
            onPaymentSuccess(
              response.razorpay_payment_id,
              data?.updateOrder?.invoice?._id
            );
            return;
          }
        } catch (error: any) {
          console.error('Payment verification failed, falling back to polling:', error);
        }
        
        // Fallback: start polling if verifyPayment failed
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
