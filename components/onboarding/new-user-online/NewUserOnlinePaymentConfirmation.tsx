'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GET_CENTERS, GET_SERVICES, GET_USER, CREATE_APPOINTMENT, UPDATE_PATIENT, UPDATE_APPOINTMENT, APPLY_COUPON, SEND_APPOINTMENT_EMAIL } from '@/gql/queries';
import NewUserOnlinePaymentProcessing from './NewUserOnlinePaymentProcessing';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { getWebTrackingForBooking } from '@/utils/web-tracking';
import { readStoredParams } from '@/lib/tracking';
import { Button } from '@/components/ui-atoms';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { EmailCollectionModal, CouponEntry, formatPaiseAsRupees, type CouponPreview } from '@/components/onboarding/shared';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import { bookingStorage } from '@/utils/booking-storage';
import { getBookingCookies } from '@/utils/booking-cookies';

interface BookingData {
  sessionType: 'online' | 'in-person';
  patientId: string;
  centerId: string;
  consultantId: string;
  treatmentId: string;
  treatmentPrice: number;
  selectedDate: string;
  selectedFullDate?: Date;
  selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
}

import { BookingAnalytics } from '@/services/booking-analytics';

interface NewUserOnlinePaymentConfirmationProps {
  bookingData: BookingData;
  onNext: (appointmentId: string) => void;
  analytics: BookingAnalytics;
}

export default function NewUserOnlinePaymentConfirmation({
  bookingData,
  onNext,
  analytics,
}: NewUserOnlinePaymentConfirmationProps) {
  const router = useRouter();
  const { isInDesktopContainer } = useContainerDetection();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [amountError, setAmountError] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const resolvedCenterIdRef = useRef<string>('');

  // Coupon: couponPreview is the live validateCoupon preview shown on this
  // screen; effectiveAmount is only updated to the authoritative applyCoupon
  // result once the user actually proceeds to pay (see handleProceedToPayment).
  const [initialCoupon] = useState<string | undefined>(() => readStoredParams().coupon);
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [effectiveAmount, setEffectiveAmount] = useState<number>(bookingData.treatmentPrice);
  const invoiceAmountPaise = Math.round(bookingData.treatmentPrice * 100);

  React.useEffect(() => {
    // Track booking confirmation start
    mobileAnalytics.trackBookingConfirmationStart(bookingData);
  }, [bookingData]);

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
  });

  const [createAppointment, { loading: creatingAppointment }] = useMutation(CREATE_APPOINTMENT);
  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);
  const [applyCoupon] = useMutation(APPLY_COUPON);
  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;

  const patientDetails = {
    name: patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '',
    phone: patient?.phone || '',
    email: patient?.email || '',
  };

  const isLoading = centersLoading || servicesLoading || userLoading;

  const handleProceedToPayment = async (overrideEmail?: string) => {
    if (!bookingData.patientId) {
      setAmountError('Patient ID is missing. Please start over.');
      return;
    }

    const effectiveEmail = overrideEmail || patient?.email;
    if (!effectiveEmail) {
      setShowEmailModal(true);
      return;
    }

    analytics.trackProceedToPaymentClicked(
      bookingData.treatmentPrice,
      bookingData.treatmentId,
      bookingData.consultantId
    );

    // Track payment method selected (invoice/razorpay)
    mobileAnalytics.trackPaymentMethodSelected('razorpay', bookingData);

    setIsCreatingAppointment(true);
    const startTime = Date.now();
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Appointment creation taking longer than expected...');
      toast.info('Setting up your online session...', { 
        duration: 3000,
        position: 'top-center',
        className: 'text-sm',
      });
    }, 5000);
    
    try {
      console.log('⏱️ Starting appointment creation...');

      const webTracking = getWebTrackingForBooking();

      const resolvedCenterId =
        bookingData.centerId ||
        getBookingCookies().centerId ||
        bookingStorage.getItem('centerId') ||
        centersData?.centers?.[0]?._id;

      if (!resolvedCenterId) {
        throw new Error('Center ID is required to create an appointment');
      }

      // Store resolved center ID for payment processing
      resolvedCenterIdRef.current = resolvedCenterId;

      // Update patient's center to the selected center
      const updateStart = Date.now();
      await updatePatient({
        variables: {
          patientId: bookingData.patientId,
          input: {
            centers: [resolvedCenterId],
          },
        },
      });
      console.log(`✅ Patient center updated in ${Date.now() - updateStart}ms`);
      
      // Create appointment
      const appointmentStart = Date.now();
      const appointmentResult = await createAppointment({
        variables: {
          input: {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId,
            center: resolvedCenterId,
            treatment: bookingData.treatmentId,
            medium: bookingData.sessionType === 'online' ? 'ONLINE' : 'IN_PERSON',
            visitType: 'FIRST_VISIT',
            status: 'TOKEN_PENDING',
            category: 'WEBSITE',
            event: {
              startTime: new Date(bookingData.selectedTimeSlot.startTime).getTime(),
              endTime: new Date(bookingData.selectedTimeSlot.endTime).getTime(),
            },
            webTracking: webTracking ?? undefined,
          },
        },
      });
      console.log(`✅ Appointment created in ${Date.now() - appointmentStart}ms`);

      const appointmentId = appointmentResult?.data?.createAppointment?._id;
      
      if (!appointmentId) {
        throw new Error('Failed to create appointment');
      }

      console.log('✅ Appointment ID:', appointmentId);

      // Coupon: the preview shown on this screen is never trusted as the
      // final price. Now that a real appointmentId exists, reserve the code
      // for real and use ITS quote (re-validated server-side) as what gets
      // charged. If this fails for any reason (race condition, code just
      // exhausted, etc.) fall back to full price rather than block the booking.
      let finalAmount = bookingData.treatmentPrice;
      if (couponPreview) {
        const applyCouponInput = {
          code: couponPreview.code,
          patientId: bookingData.patientId,
          appointmentId,
          centerId: resolvedCenterId,
          serviceId: bookingData.treatmentId,
          invoiceAmountPaise,
          anonymousId: webTracking?.anonymousId,
          sessionId: webTracking?.sessionId,
        };
        console.log('[applyCoupon] CALLING with input:', applyCouponInput);
        try {
          const couponResult = await applyCoupon({ variables: { input: applyCouponInput } });
          console.log('[applyCoupon] RAW RESULT:', JSON.stringify(couponResult?.data, null, 2));
          const reservation = couponResult?.data?.applyCoupon;
          console.log('[applyCoupon] reservation:', {
            ok: reservation?.ok,
            rejectReason: reservation?.rejectReason,
            message: reservation?.message,
            usageId: reservation?.usage?._id,
            usageStatus: reservation?.usage?.status,
            discountPaise: reservation?.usage?.quote?.discountPaise,
            netPaise: reservation?.usage?.quote?.netPaise,
            campaign: reservation?.usage?.campaign,
          });
          if (reservation?.ok && reservation.usage?.quote?.netPaise != null) {
            finalAmount = reservation.usage.quote.netPaise / 100;
            const promotionInput = {
              code: couponPreview.code,
              applicationId: reservation.usage._id,
              campaignId: reservation.usage.campaign,
              discountPaise: Math.round(reservation.usage.quote.discountPaise ?? 0),
            };
            console.log('[updateAppointment] CALLING to stamp promotion:', {
              appointmentId,
              promotion: promotionInput,
            });
            try {
              const updateResult = await updateAppointment({
                variables: { id: appointmentId, input: { promotion: promotionInput } },
              });
              console.log('[updateAppointment] RESULT:', JSON.stringify(updateResult?.data, null, 2));
            } catch (linkError) {
              // Non-blocking: the reservation + correct charge already succeeded.
              console.error('⚠️ Failed to attach promotion to appointment:', linkError);
            }
          } else {
            console.warn('⚠️ Coupon could not be reserved at payment time — reservation:', reservation);
            toast.info(reservation?.message || "This coupon couldn't be applied — continuing at full price.", {
              position: 'top-center',
            });
          }
        } catch (couponError) {
          console.error('⚠️ applyCoupon failed — continuing at full price:', couponError);
          toast.info("This coupon couldn't be applied — continuing at full price.", { position: 'top-center' });
        }
      }
      setEffectiveAmount(finalAmount);

      bookingStorage.setItem('appointmentId', appointmentId);
      bookingStorage.setItem('paymentType', 'invoice');
      bookingStorage.setItem('paymentAmount', finalAmount.toString());
      
      analytics.trackPaymentInitiated(finalAmount, appointmentId);
      
      // Verify storage was written
      const storedId = bookingStorage.getItem('appointmentId');
      console.log('✅ Verified stored appointment ID:', storedId);
      
      if (!storedId) {
        throw new Error('Failed to store appointment ID');
      }
      
      clearTimeout(timeoutId);
      console.log(`⏱️ Total time: ${Date.now() - startTime}ms`);
      
      // Now show payment processing screen
      setIsCreatingAppointment(false);
      setIsProcessingPayment(true);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Error creating appointment:', error);
      console.error('❌ Error details:', error.message, error.graphQLErrors);
      setAmountError('Failed to create appointment. Please try again.');
      setIsCreatingAppointment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Loading details..." />
      </div>
    );
  }

  if (isCreatingAppointment) {
    return (
      <div className="h-full flex items-center justify-center">
        <StanceHealthLoader message="Creating appointment..." />
      </div>
    );
  }

  if (isProcessingPayment) {
    return (
      <NewUserOnlinePaymentProcessing
        amount={effectiveAmount}
        paymentType="invoice"
        patientDetails={patientDetails}
        patientId={bookingData.patientId}
        centerId={resolvedCenterIdRef.current || bookingData.centerId}
        consultantId={bookingData.consultantId}
        treatmentId={bookingData.treatmentId}
        onPaymentSuccess={async (paymentId, invoiceId) => {
          // Update patient status to ACTIVE after successful payment
          try {
            await updatePatient({
              variables: {
                patientId: bookingData.patientId,
                input: {},
              },
            });
          } catch (error) {
            console.error('❌ Failed to update patient:', error);
          }
          
          const storedAppointmentId = bookingStorage.getItem('appointmentId');
          bookingStorage.removeItem('appointmentId');
          bookingStorage.removeItem('paymentType');
          bookingStorage.removeItem('paymentAmount');
          setIsProcessingPayment(false);
          if (storedAppointmentId) {
            onNext(storedAppointmentId);
          }
        }}
        onPaymentFailure={async (error) => {
          setIsProcessingPayment(false);
          bookingStorage.removeItem('paymentType');
          bookingStorage.removeItem('paymentAmount');
          const errorMsg = typeof error === 'string' ? error : error?.description || error?.message || 'Payment failed';
          setAmountError(errorMsg);
        }}
      />
    );
  }



  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Patient Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 font-medium block">Name</span>
                <p className="text-sm font-medium text-gray-900">{patientDetails.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Phone</span>
                <p className="text-sm font-medium text-gray-900">{patientDetails.phone}</p>
              </div>
              {patientDetails.email && (
                <div>
                  <span className="text-sm text-gray-600 font-medium block">Email</span>
                  <p className="text-sm font-medium text-gray-900">{patientDetails.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Stance Online Services</p>
                <p className="text-sm text-gray-500">Online Consultation</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Date & Time</span>
                <p className="text-sm font-medium text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-medium block">Service</span>
                <p className="text-sm font-medium text-gray-900">{currentService?.name}</p>
                <p className="text-sm text-gray-500">₹{bookingData.treatmentPrice}</p>
              </div>
            </div>
          </div>

          {/* Coupon Code */}
          <CouponEntry
            initialCode={initialCoupon}
            patientId={bookingData.patientId}
            centerId={resolvedCenterIdRef.current || bookingData.centerId}
            serviceId={bookingData.treatmentId}
            invoiceAmountPaise={invoiceAmountPaise}
            onPreviewChange={setCouponPreview}
            disabled={creatingAppointment || isProcessingPayment || isCreatingAppointment}
          />

          {/* Payment Amount */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Amount</h3>
            {couponPreview && couponPreview.discountPaise > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Original Amount</span>
                  <span>₹{formatPaiseAsRupees(couponPreview.originalPaise)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-700">
                  <span>Coupon Discount ({couponPreview.code})</span>
                  <span>-₹{formatPaiseAsRupees(couponPreview.discountPaise)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">₹{formatPaiseAsRupees(couponPreview.netPaise)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">₹{bookingData.treatmentPrice}</span>
              </div>
            )}
            <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Full Payment Required</p>
                  <p className="text-xs mt-1 text-green-700">Online bookings require full payment. An invoice will be generated.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Non-refundable Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                This payment is non-refundable. Please review all details before proceeding.
              </p>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1">Cancellation Policy</p>
                <p className="text-xs text-blue-800">
                  Cancellations made less than one day prior to the appointment will incur a ₹300 cancellation fee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={() => handleProceedToPayment()}
          disabled={creatingAppointment || isProcessingPayment || isCreatingAppointment}
          isLoading={creatingAppointment || isProcessingPayment || isCreatingAppointment}
          fullWidth
          variant="primary"
          size="lg"
        >
          {creatingAppointment || isProcessingPayment || isCreatingAppointment
            ? 'Creating Appointment...'
            : `Pay ₹${couponPreview ? formatPaiseAsRupees(couponPreview.netPaise) : bookingData.treatmentPrice}`}
        </Button>
      </div>

      <EmailCollectionModal
        isOpen={showEmailModal}
        patientId={bookingData.patientId}
        patientName={patientDetails.name}
        onEmailSaved={async (savedEmail: string) => {
          setShowEmailModal(false);
          await refetchUser();
          handleProceedToPayment(savedEmail);
        }}
        onClose={() => setShowEmailModal(false)}
      />
    </div>
  );
}
