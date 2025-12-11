'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import RazorpayScriptLoader from '@/components/loader/RazorpayScriptLoader';
import RazorpayLoader from '@/components/loader/RazorLoader';

interface RazorpayOptions {
  key: string;
  notes?: any;
  name: string;
  amount: number;
  currency: string;
  order_id: string;
  description: string;
  theme?: { color?: string;};
  handler: (response: any) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  method?: {
    upi?: boolean;
    card?: boolean;
    wallet?: boolean;
    netbanking?: boolean;
  };
  upi?: { vpa?: string; flow?: 'collect' | 'intent'; };
  modal: { ondismiss: () => void; };
}

interface PublicRazorpayPaymentProps {
  amount: number;
  paymentType?: 'invoice' | 'package';
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: any) => void;
  patientDetails: {
    name?: string;
    email?: string;
    phone?: string;
  };
  patientId: string;
  centerId: string;
  consultantId?: string;
  treatmentId?: string;
  isFromGenerateLink?: boolean;
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
      razorpayOrderId
      payment {
        razorpayPaymentId
      }
    }
  }
`;

const GET_CENTERS = gql`
  query GetCenters {
    centers {
      _id
      name
    }
  }
`;

const PublicRazorpayPayment: React.FC<PublicRazorpayPaymentProps> = ({ amount, paymentType = 'package', onPaymentSuccess, onPaymentFailure, patientDetails, patientId, centerId, consultantId, treatmentId, isFromGenerateLink = false }) => {
  const [isRazorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [createOrderMutation] = useMutation(CREATE_ORDER);
  const [updateOrderMutation] = useMutation(UPDATE_ORDER);
  const { data: centersData } = useQuery(GET_CENTERS);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollAttempts = 200; // 10 minutes (200 * 3 seconds)
  const pollAttemptsRef = useRef(0);
  const isPollingRef = useRef(false);
  const [loaderMessage, setLoaderMessage] = useState<string | null>(null);


  // Cleanup function to clear polling interval
  const clearPollingInterval = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPollingInterval();
  }, [clearPollingInterval]);

  const pollPaymentStatus = useCallback(async (orderDbId: string) => {
      // Prevent multiple polling intervals
      if (isPollingRef.current) {
        console.log('🔄 PAYMENT TESTING LOGS - Polling already in progress');
        return;
      }

      console.log('🔍 PAYMENT TESTING LOGS - Starting payment status polling for order:', orderDbId);
      isPollingRef.current = true;

      // First check immediately (no delay)
      try {
        setLoaderMessage("Completing your Payment...");
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const { data, errors } = await updateOrderMutation({
          variables: { orderId: orderDbId },
        });

        console.log('📊 PAYMENT TESTING LOGS - Initial status check response:');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Errors:', JSON.stringify(errors, null, 2));

        // Handle GraphQL errors
        if (errors && errors.length > 0) {
        const errorMessage = errors[0]?.message || 'Unknown error';
        console.log('⚠️ PAYMENT TESTING LOGS - GraphQL Error:', errorMessage);

        if (errorMessage.includes('Invoice is already paid') || errorMessage.includes('already paid')) {
          console.log('✅ PAYMENT TESTING LOGS - Payment already processed, success!');
            isPollingRef.current = false;
            setPaymentProcessed(true);
          onPaymentSuccess('payment_success');
            return;
          }
        }

      if (data?.updateOrder?.status === 'PAID') {
        console.log('✅ PAYMENT TESTING LOGS - Payment successful on first check!');
        console.log('Payment ID:', data.updateOrder.payment?.razorpayPaymentId);
          isPollingRef.current = false;
          setPaymentProcessed(true);
        onPaymentSuccess(data.updateOrder.payment?.razorpayPaymentId || 'payment_success');
          return;
      } else if (data?.updateOrder?.status === 'ATTEMPTED') {
        console.log('❌ PAYMENT TESTING LOGS - Payment failed on first check');
          isPollingRef.current = false;
          setPaymentProcessed(true);
        onPaymentFailure('Payment failed');
          return;
        }
      } catch (error) {
      console.error('❌ PAYMENT TESTING LOGS - Initial status check failed:', error);
      console.error('❌ PAYMENT TESTING LOGS - Initial check error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        graphQLErrors: (error as any)?.graphQLErrors,
        networkError: (error as any)?.networkError,
        extraInfo: (error as any)?.extraInfo,
        fullError: error
      });
      
      // Log the first GraphQL error in detail
      if ((error as any)?.graphQLErrors?.[0]) {
        console.error('❌ PAYMENT TESTING LOGS - First GraphQL Error Details:', {
          code: (error as any).graphQLErrors[0].code,
          name: (error as any).graphQLErrors[0].name,
          message: (error as any).graphQLErrors[0].message,
          info: (error as any).graphQLErrors[0].info
        });
      }
      }
      pollAttemptsRef.current = 0;

      pollingIntervalRef.current = setInterval(async () => {
        try {
          pollAttemptsRef.current += 1;
          console.log(`🔄 PAYMENT TESTING LOGS - Polling attempt ${pollAttemptsRef.current}/${maxPollAttempts}`);

          if (pollAttemptsRef.current > maxPollAttempts) {
            console.log('⏰ PAYMENT TESTING LOGS - Polling timeout reached');
            clearPollingInterval();
          onPaymentFailure('Payment timeout - no response after 10 minutes');
            return;
          }

          const { data, errors } = await updateOrderMutation({
          variables: { orderId: orderDbId }
          });

          console.log(`📊 PAYMENT TESTING LOGS - Polling response (attempt ${pollAttemptsRef.current}):`);
          console.log('Data:', JSON.stringify(data, null, 2));
          console.log('Errors:', JSON.stringify(errors, null, 2));

          if (errors && errors.length > 0) {
          const errorMessage = errors[0]?.message || 'Unknown error';
          console.log('⚠️ PAYMENT TESTING LOGS - Polling GraphQL Error:', errorMessage);
          if (errorMessage.includes('Invoice is already paid') || errorMessage.includes('already paid')) {
              console.log('✅ PAYMENT TESTING LOGS - Payment confirmed during polling!');
              clearPollingInterval();
              setPaymentProcessed(true);
            onPaymentSuccess('payment_success');
              return;
            }
            return;
          }

        if (data?.updateOrder?.status === 'PAID') {
          console.log('✅ PAYMENT TESTING LOGS - Payment successful during polling!');
          console.log('Payment ID:', data.updateOrder.payment?.razorpayPaymentId);
            clearPollingInterval();
            setPaymentProcessed(true);
          onPaymentSuccess(data.updateOrder.payment?.razorpayPaymentId || 'payment_success');
        } else if (data?.updateOrder?.status === 'ATTEMPTED') {
          console.log('❌ PAYMENT TESTING LOGS - Payment failed during polling');
            clearPollingInterval();
            setPaymentProcessed(true);
          onPaymentFailure('Payment failed');
          }
        } catch (error) {
        console.error('❌ PAYMENT TESTING LOGS - Polling error:', error);
        console.error('❌ PAYMENT TESTING LOGS - Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          graphQLErrors: (error as any)?.graphQLErrors,
          networkError: (error as any)?.networkError,
          extraInfo: (error as any)?.extraInfo
        });
        }
      }, 3000);
  }, [onPaymentSuccess, onPaymentFailure, clearPollingInterval, updateOrderMutation]);

  const createOrder = async () => {
    try {
      let orderInput: any;
      
      // Determine order type based on paymentType prop
      const orderType = paymentType === 'invoice' ? 'INVOICE' : 'ADVANCE';
      
      console.log('💳 PAYMENT TYPE:', paymentType, '→ ORDER TYPE:', orderType);
      
      // Only add packageId for ADVANCE (partial payment) and NOT from generate link
      if (!isFromGenerateLink && orderType === 'ADVANCE') {
        // Find center by ID and map to package based on center name
        const center = centersData?.centers?.find((c: any) => c._id === centerId);
        const centerName = center?.name?.toLowerCase() || '';
        
        console.log('🏥 CENTER INFO - Center ID:', centerId, 'Name:', center?.name);
        
        const getPackageIdForCenter = (centerName: string) => {
          if (centerName.includes('indiranagar')) return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID || '68d64545bd448a9f282aa3b3';
          if (centerName.includes('whitefield')) return process.env.NEXT_PUBLIC_WHITEFIELD_PACKAGE_ID || '68da370d862df251a77c3b0c';
          if (centerName.includes('hsr')) return process.env.NEXT_PUBLIC_HSR_PACKAGE_ID || '68da3760862df251a77c3b2e';
          return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID || '68d64545bd448a9f282aa3b3';
        };
        
        const tokenPackageId = getPackageIdForCenter(centerName);
        console.log('📦 PACKAGE ID:', tokenPackageId);
        
        orderInput = {
          amount: amount,
          currency: 'INR',
          center: centerId,
          patient: patientId,
          type: 'ADVANCE',
          packageId: tokenPackageId,
        };
      } else {
        // For INVOICE (full payment) or generate link
        console.log('📄 Creating', orderType, 'order with consultant and treatment');
        
        orderInput = {
          amount: amount,
          currency: 'INR',
          center: centerId,
          patient: patientId,
          type: orderType,
        };
        
        // Add consultant and treatment for invoice
        if (orderType === 'INVOICE' && consultantId && treatmentId) {
          orderInput.consultant = consultantId;
          orderInput.treatment = treatmentId;
          console.log('✅ Added consultant:', consultantId, 'and treatment:', treatmentId);
        }
      }
      
      console.log('📝 PAYMENT TESTING LOGS - ORDER INPUT:');
      console.log(JSON.stringify(orderInput, null, 2));
      
      const { data } = await createOrderMutation({
        variables: {
          input: orderInput,
        },
      });
      
      console.log('✅ PAYMENT TESTING LOGS - ORDER CREATED SUCCESSFULLY:');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      return {
        razorpayOrderId: data.createOrder.razorpayOrderId,
        orderDbId: data.createOrder._id
      };
    } catch (error) {
      console.error('❌ PAYMENT TESTING LOGS - ORDER CREATION FAILED:');
      console.error('Error:', error);
      onPaymentFailure('Failed to create payment order.');
      return null;
    }
  };

  const initiatePayment = useCallback(async () => {
    setIsLoading(true);
    const orderData = await createOrder();
    if (!orderData) {
      onPaymentFailure('Order creation failed');
      setIsLoading(false);
      return;
    }

    console.log('🚀 PAYMENT TESTING LOGS - ORDER CREATED:');
    console.log('Order DB ID:', orderData.orderDbId);
    console.log('Razorpay Order ID:', orderData.razorpayOrderId);
    console.log('Amount:', amount);
    console.log('Patient ID:', patientId);
    console.log('Center ID:', centerId);

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      amount: amount * 100,
      currency: 'INR',
      name: 'Stance Health',
      description: 'Appointment Booking',
      order_id: orderData.razorpayOrderId,
      handler: (response) => {
        console.log('💳 PAYMENT TESTING LOGS - RAZORPAY RESPONSE:');
        console.log('Payment ID:', response.razorpay_payment_id);
        console.log('Order ID:', response.razorpay_order_id);
        console.log('Signature:', response.razorpay_signature);
        console.log('Full Response:', JSON.stringify(response, null, 2));
        
        // Start polling for payment status using the database order ID
        pollPaymentStatus(orderData.orderDbId);
      },
      prefill: {
        name: patientDetails.name,
        email: patientDetails.email,
        contact: patientDetails.phone,
      },
      method: {
        netbanking: true,
        card: true,
        upi: true,
      },
      upi: {
        flow: "collect",
      },
      theme: {
        color: "#3399cc",
      },
      modal: {
        ondismiss: () => {
          console.log('❌ PAYMENT TESTING LOGS - PAYMENT CANCELLED');
          setPaymentProcessed(true);
          onPaymentFailure('Payment cancelled by user');
          setIsLoading(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      console.log('💥 PAYMENT TESTING LOGS - PAYMENT FAILED:');
      console.log('Error:', JSON.stringify(response.error, null, 2));
      setPaymentProcessed(true);
      onPaymentFailure(response.error);
      setIsLoading(false);
    });
    rzp.open();
  }, [amount, patientDetails, onPaymentFailure, pollPaymentStatus]);

  useEffect(() => {
    if (isRazorpayLoaded && !paymentProcessed) {
      // Only initiate payment if not already processed
      console.log('🚀 PAYMENT TESTING LOGS - Initiating payment flow');
      initiatePayment();
    } else if (paymentProcessed) {
      console.log('✅ PAYMENT TESTING LOGS - Payment already processed, skipping');
    }
  }, [isRazorpayLoaded, initiatePayment, paymentProcessed]);

  if (paymentProcessed || loaderMessage) {
    return (
      <div className="text-center">
    <RazorpayLoader message={loaderMessage || 'Processing...'} />
      </div>
    );
  }

  return (
    <>
      <RazorpayScriptLoader onLoad={() => setRazorpayLoaded(true)} />
      <div className="text-center">
        {isLoading && <RazorpayLoader/>}
      </div>
    </>
  );
};

export default PublicRazorpayPayment;
