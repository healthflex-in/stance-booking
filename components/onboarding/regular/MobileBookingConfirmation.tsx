'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Calendar, CreditCard, Package } from 'lucide-react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { Button } from '@/components/ui-atoms/Button';
import { toast } from 'sonner';
import { GET_CENTERS, GET_SERVICES, GET_USER, GET_PACKAGES, GET_ADVANCES, UPDATE_APPOINTMENT_STATUS, CREATE_PATIENT, PATIENT_BY_PHONE, CREATE_APPOINTMENT_WITH_PACKAGE, CREATE_INVOICE } from '@/gql/queries';
import { AppointmentMedium, AppointmentStatus } from '@/gql/graphql';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppointmentForm } from '@/components/calendar/hooks/useAppointmentForm';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import { WhatsAppButton, MobileLoadingScreen, MobilePaymentProcessing } from '../shared';

interface PatientDetails {
  name: string;
  email: string;
  phone: string;
}
interface MobileBookingConfirmationProps {
  bookingData: any;
  onUpdateData: (updates: any) => void;
  onNext: () => void;
}
export default function MobileBookingConfirmation({
  bookingData,
  onUpdateData,
  onNext,
}: MobileBookingConfirmationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [patientDetails, setPatientDetails] = useState<PatientDetails>(() => {
    // Get details from bookingData (URL params)
    return {
      name: `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim() || '',
      email: bookingData.email || '',
      phone: bookingData.phone || '',
    };
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const { isInDesktopContainer } = useContainerDetection();
  const mobileAnalytics = useMobileFlowAnalytics();
  
  // Track component mount and checkout start
  useEffect(() => {
    // Ensure organization ID is set for mobile booking
    if (typeof window !== 'undefined') {
      const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;
      if (orgId) {
        localStorage.setItem('mobile-organizationID', orgId);
      }
    }
    mobileAnalytics.trackBookingConfirmationStart(bookingData);
    mobileAnalytics.trackCheckoutStarted(bookingData);
  }, [bookingData, mobileAnalytics]);

  // Fetch patient data if we have a patientId
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: {
      userId: bookingData.patientId,
    },
    skip: !bookingData.patientId,
    fetchPolicy: 'network-only',
  });

  // Update patient details when user data is loaded
  useEffect(() => {
    if (userData?.user?.profileData) {
      const { firstName, lastName } = userData.user.profileData;
      const fullName = `${firstName || ''} ${(lastName || '').trim()}`.trim();
      
      setPatientDetails({
        name: fullName || 'Patient',
        email: userData.user.email || '',
        phone: userData.user.phone || '',
      });
    }
  }, [userData]);
  // Fetch centers data
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  
  // Log center data to find organization ID
  useEffect(() => {
    if (centersData?.centers) {
      const center = centersData.centers.find((c: any) => c._id === bookingData.centerId);
      console.log('🏥 CENTER DATA:', center);
      console.log('🏢 ORGANIZATION ID:', center?.organization?._id || center?.organization);
    }
  }, [centersData, bookingData.centerId]);
  // Fetch services data to get actual treatment prices
  const { data: servicesData, loading: servicesLoading } = useQuery(
    GET_SERVICES,
    {
      variables: {
        centerId: bookingData.centerId,
      },
      skip: !bookingData.centerId,
      fetchPolicy: 'network-only',
    }
  );
  
  // Fetch packages data to get MWEB Token package
  const { data: packagesData, loading: packagesLoading } = useQuery(
    GET_PACKAGES,
    {
      variables: {
        centerId: [bookingData.centerId],
      },
      skip: !bookingData.centerId,
      fetchPolicy: 'network-only',
    }
  );

  // Fetch patient's advances (packages) if packageId is in URL
  const packageId = searchParams.get('packageId');
  const { data: advancesData, loading: advancesLoading } = useQuery(
    GET_ADVANCES,
    {
      variables: {
        filter: {
          patient: bookingData.patientId,
          centers: [bookingData.centerId],
        },
      },
      skip: !packageId || !bookingData.patientId,
      fetchPolicy: 'network-only',
    }
  );
  
  // Mutation to update appointment status
  const [updateAppointmentStatus] = useMutation(UPDATE_APPOINTMENT_STATUS);
  
  // Mutation to create appointment with package
  const [createAppointmentWithPackage] = useMutation(CREATE_APPOINTMENT_WITH_PACKAGE);
  
  // Mutation to create invoice
  const [createInvoice] = useMutation(CREATE_INVOICE);
  // Find current center from bookingData.centerId
  const currentCenter = centersData?.centers.find(
    (center: any) => center._id === bookingData.centerId
  );
  // Find selected treatment and get its price
  const selectedTreatment = useMemo(() => {
    if (!servicesData?.services?.length) {
      return { _id: bookingData.treatmentId || null, name: 'First Visit', price: 1200 };
    }
    // Find the service that matches the treatmentId from URL
    const service = servicesData.services.find(
      (s: any) => s._id === bookingData.treatmentId
    );
    if (service) {
      console.log('Found service:', service);
      return service;
    }
    // Fallback to first visit assessment
    const firstVisit = servicesData.services.find(
      (service: any) => service.name === '2025 - First visit assessment'
    );
    return firstVisit || { _id: bookingData.treatmentId || null, name: 'First Visit', price: 1200 };
  }, [servicesData, bookingData.treatmentId]);
  
  // Find MWEB Token package using center-specific mapping
  const mwebTokenPackage = useMemo(() => {
    // Map center name to package ID from env
    const getPackageIdForCenter = (centerId: string) => {
      const center = centersData?.centers?.find((c: any) => c._id === centerId);
      const centerName = center?.name?.toLowerCase() || '';
      
      if (centerName.includes('indiranagar')) {
        return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID;
      }
      if (centerName.includes('whitefield')) {
        return process.env.NEXT_PUBLIC_WHITEFIELD_PACKAGE_ID;
      }
      if (centerName.includes('hsr')) {
        return process.env.NEXT_PUBLIC_HSR_PACKAGE_ID;
      }
      return process.env.NEXT_PUBLIC_INDIRANAGAR_PACKAGE_ID;
    };
    
    const tokenPackageId = getPackageIdForCenter(bookingData.centerId);
    
    if (!packagesData?.packages?.length || !tokenPackageId) {
      return null;
    }
    
    const tokenPackage = packagesData.packages.find(
      (pkg: any) => pkg._id === tokenPackageId
    );
    
    console.log('📦 Found MWEB Token Package:', tokenPackage);
    return tokenPackage || null;
  }, [packagesData, centersData, bookingData.centerId]);

  useEffect(() => {
    if (selectedTreatment && servicesData?.services?.length) {
      const treatmentPrice = mwebTokenPackage?.price || 100;
      
      console.log('💰 Package Price:', treatmentPrice);
      
      onUpdateData({
        treatmentId: selectedTreatment._id || null,
        treatmentPrice: treatmentPrice,
      });
    }
  }, [selectedTreatment, mwebTokenPackage, onUpdateData, servicesData]);


  // Check if we need Razorpay (only for onboarding route)
  const needsPayment = useMemo(() => {
    const isOnboardingPath = pathname === '/onboarding-patient/slots' || pathname?.includes('/onboarding-patient');
    const hasPatientId = searchParams.get('patient_id') || bookingData.patientId;
    const hasCenterId = searchParams.get('center_id') || bookingData.centerId;
    return isOnboardingPath && hasPatientId && hasCenterId;
  }, [pathname, searchParams, bookingData]);
  // Use the same appointment form hook as desktop
  const { createAppointment } = useAppointmentForm(
    bookingData.centerId,
    () => {}, // onSuccess
    () => {}, // onClose
    null, // initialDateTime
    null, // appointmentToEdit - we're creating new appointment, not editing
    null, // initialConsultantId
    true // isOpen
  );

  const handlePaymentMethodSelect = (method: string) => {
    mobileAnalytics.trackPaymentMethodSelected(method as 'razorpay' | 'cash' | 'card', bookingData);
    
    // Track payment method selection (custom event)
    mobileAnalytics.trackPaymentMethodSelection(
      method,
      bookingData.treatmentPrice || 100,
      bookingData.patientId,
      bookingData.centerId
    );
    
    setSelectedPaymentMethod(method);
  };

// WhatsApp messaging functions removed for mobile web experience

const handleCreateAppointment = async (appointmentStatus = AppointmentStatus.TokenPending, patientId?: string) => {
  try {
    // Use provided patientId or fallback to bookingData
    const finalPatientId = patientId || bookingData.patientId;
    
    if (!finalPatientId) {
      throw new Error('Patient ID is required');
    }

    // Use the selectedFullDate from bookingData instead of parsing selectedDate string
    let selectedDate: Date;
    
    if (bookingData.selectedFullDate) {
      // Use the full Date object that was stored when date was selected
      selectedDate = new Date(bookingData.selectedFullDate);
    } else {
      // Fallback: try to parse from selectedTimeSlot timestamps
      if (bookingData.selectedTimeSlot?.startTime) {
        selectedDate = new Date(bookingData.selectedTimeSlot.startTime);
      } else {
        throw new Error('No valid date found in booking data');
      }
    }

    // Ensure we have the time slot data
    if (!bookingData.selectedTimeSlot) {
      throw new Error('No time slot selected');
    }

    // Create start and end times using the selected date and time slot
    const startTime = new Date(bookingData.selectedTimeSlot.startTime);
    let endTime = new Date(bookingData.selectedTimeSlot.endTime);
    
    // For online assessments, override duration to 20 minutes
    if (bookingData.assessmentType === 'online') {
      endTime = new Date(startTime.getTime() + 20 * 60 * 1000);
    }

    // Verify the dates are valid and in the future
    const now = new Date();
    if (startTime <= now) {
      throw new Error('Selected time slot is in the past');
    }

    const createInput = {
      patient: finalPatientId,
      consultant: bookingData.consultantId || null,
      treatment: selectedTreatment._id,
      medium: bookingData.sessionType === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
      notes: bookingData.notes || '',
      center: bookingData.centerId,
      category: 'WEBSITE',
      status: appointmentStatus,
      event: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const appointmentId = await createAppointment(createInput);

    // WhatsApp messaging removed for mobile web experience

    return appointmentId;
  } catch (error:any) {
    console.error('Error creating appointment:', error);
    if (needsPayment) {
      router.push(
        '/onboarding-patient/failure?error=' + encodeURIComponent('Failed to create appointment: ' + (error.message || error))
      );
    }
    throw error;
  }
};

  const [createPatient] = useMutation(CREATE_PATIENT);
  const [getPatientByPhone, { client }] = useLazyQuery(PATIENT_BY_PHONE);

  const ensurePatientExists = async () => {
    // PatientId should always be in bookingData from URL
    if (bookingData.patientId) return bookingData.patientId;
    throw new Error('Patient ID is required');
  };

  const handleProceedToPay = async () => {
    mobileAnalytics.trackBookingDetailsReviewed(bookingData);
    setIsCreatingBooking(true);
    
    // Show loading toast immediately
    const loadingToast = toast.loading('Creating your booking...');
    
    try {
      // Ensure patient exists before creating appointment
      const patientId = await ensurePatientExists();
      
      // If no payment needed, create appointment and go to confirmed
      if (!needsPayment) {
        await handleCreateAppointment(AppointmentStatus.Booked, patientId);
        toast.dismiss(loadingToast);
        toast.success('Booking confirmed!');
        setIsCreatingBooking(false);
        onNext(); // Go to booking-confirmed
        return;
      }
      
      // Check if this is a package payment
      if (packageId) {
        // packageId from URL is the advance ID
        const advanceId = packageId;
        
        // Find the advance to verify it exists
        const advanceEntry = advancesData?.advances?.data?.find(
          (adv: any) => adv?.advance?._id === advanceId
        );
        
        if (!advanceEntry?.advance) {
          throw new Error('Package not found. Please ensure the package is still active.');
        }
        
        // Get the actual package ID from advance itemsWithBalance
        const packageItemId = advanceEntry.advance.itemsWithBalance?.[0]?.advanceItem?.item?._id;
        if (!packageItemId) {
          throw new Error('Package details not found. Please contact support.');
        }
        
        // Create appointment with package payment
        const startTime = new Date(bookingData.selectedTimeSlot.startTime);
        const endTime = new Date(bookingData.selectedTimeSlot.endTime);
        
        const appointmentResult = await createAppointmentWithPackage({
          variables: {
            input: {
              patient: patientId,
              consultant: bookingData.consultantId || null,
              treatment: selectedTreatment._id,
              medium: bookingData.sessionType === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
              notes: bookingData.notes || '',
              center: bookingData.centerId,
              category: 'WEBSITE',
              advanceId: advanceId,
              event: {
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
              },
            },
          },
        });
        
        const appointmentId = appointmentResult.data?.createAppointmentWithPackage?._id;
        console.log('✅ Appointment created:', appointmentId);
        
        // Create invoice with package payment
        await createInvoice({
          variables: {
            input: {
              patient: patientId,
              center: bookingData.centerId,
              appointment: appointmentId,
              amount: selectedTreatment.price || 0,
              dueDate: Math.floor(Date.now() / 1000),
              items: [{
                item: selectedTreatment._id,
                price: selectedTreatment.price || 0,
                amount: selectedTreatment.price || 0,
                quantity: 1,
                discount: 0,
              }],
              payment: {
                payment: {
                  mode: 'PACKAGE',
                  amount: selectedTreatment.price || 0,
                  source: advanceId,
                  subSource: packageItemId,
                },
              },
            },
          },
        });
        
        console.log('✅ Invoice created successfully');
        toast.dismiss(loadingToast);
        toast.success('Appointment booked successfully with package!');
        setIsCreatingBooking(false);
        onNext();
        return;
      }
      
      if (needsPayment) {
        // Track Razorpay gateway loading (custom event)
        mobileAnalytics.trackRazorpayGatewayLoaded(
          sessionDetails.amount,
          patientId,
          bookingData.centerId
        );
        
        // Create appointment with TOKEN_PENDING status initially, passing patientId
        const appointmentId = await handleCreateAppointment(AppointmentStatus.TokenPending, patientId);
        console.log('Appointment created with TOKEN_PENDING status:', appointmentId);
        
        // Store appointment ID for status updates after payment
        sessionStorage.setItem('pendingAppointmentId', appointmentId || '');
        
        toast.dismiss(loadingToast);
        setIsCreatingBooking(false);
        setIsProcessingPayment(true);
      }
    } catch (error) {
      console.error('Failed to process booking:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to process booking. Please try again.');
      setIsCreatingBooking(false);
    }
  };

// Format session details using real data
 // In MobileBookingConfirmation.tsx, replace the sessionDetails object with this:

const sessionDetails = {
  type: bookingData.assessmentType === 'online' ? 'Online (20 mins)' : 'In Person (45 mins)',
  location: currentCenter
    ? `${currentCenter.name}, ${currentCenter.address.street}`
    : 'Loading...',
  dateTime: (() => {
    // Helper function to format time consistently
    const formatTime = (date: Date) => {
      if (!date || isNaN(date.getTime())) return '';
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Primary: Use selectedTimeSlot startTime and endTime for both date and time
    if (bookingData.selectedTimeSlot?.startTime) {
      const startTime = new Date(bookingData.selectedTimeSlot.startTime);
      const endTime = new Date(bookingData.selectedTimeSlot.endTime);
      
      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return 'Invalid date selected';
      }
      
      const formattedDate = startTime.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      
      const timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      return `${formattedDate}, ${timeDisplay}`;
    }
    
    // Fallback: Try to use selectedFullDate with displayTime
    if (bookingData.selectedFullDate && bookingData.selectedTimeSlot?.displayTime) {
      let date: Date;
      
      // Handle different date formats
      if (typeof bookingData.selectedFullDate === 'string') {
        date = new Date(bookingData.selectedFullDate);
      } else if (bookingData.selectedFullDate instanceof Date) {
        date = bookingData.selectedFullDate;
      } else {
        return 'Invalid date format';
      }
      
      // Validate date
      if (isNaN(date.getTime())) {
        return 'Invalid date selected';
      }
      
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      
      // Handle displayTime - ensure it's a string
      let timeDisplay = '';
      if (typeof bookingData.selectedTimeSlot.displayTime === 'string') {
        timeDisplay = bookingData.selectedTimeSlot.displayTime;
      } else {
        timeDisplay = 'Time not available';
      }
      
      return `${formattedDate}, ${timeDisplay}`;
    }
    
    return 'Date & time not selected';
  })(),

  amount: mwebTokenPackage?.price || 100,

};

  if (centersLoading || servicesLoading || userLoading || packagesLoading || (packageId && advancesLoading)) {
    return (
      <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col relative`}>
        <MobileLoadingScreen 
          message="Preparing Your Booking" 
          animationData="/lottie1.json" 
        />
        <WhatsAppButton />
      </div>
    );
  }

  if (needsPayment && isProcessingPayment) {
   return (
    <div className="relative">
      <MobilePaymentProcessing
      amount={sessionDetails.amount}
      patientDetails={patientDetails}
      patientId={bookingData.patientId}
      centerId={bookingData.centerId}
      onPaymentSuccess={async (paymentId) => {
        if (paymentCompleted) {
          return;
        }

        setPaymentCompleted(true);
        const appointmentId = sessionStorage.getItem('pendingAppointmentId');
        
        // Setup background status update in case user closes page
        const handleBeforeUnload = () => {
          if (appointmentId) {
            // Use sendBeacon for reliable background status update
            navigator.sendBeacon('/api/graphql', JSON.stringify({
              query: `mutation UpdateAppointmentStatus($id: ID!, $status: AppointmentStatus!) {
                updateAppointmentStatus(id: $id, status: $status) {
                  _id
                  status
                }
              }`,
              variables: {
                id: appointmentId,
                status: 'TOKEN_PAID'
              }
            }));
          }
        };
        
        if (appointmentId) {
          window.addEventListener('beforeunload', handleBeforeUnload);
        }
        
        // Immediately proceed to success screen
        setIsProcessingPayment(false);
        onNext();
        
        // Update appointment status in background (non-blocking)
        if (appointmentId) {
          updateAppointmentStatus({
            variables: {
              id: appointmentId,
              status: AppointmentStatus.TokenPaid
            }
          }).then(() => {
            console.log('Updated appointment status to TOKEN_PAID for appointment:', appointmentId);
            sessionStorage.removeItem('pendingAppointmentId');
            // Remove beforeunload handler since update succeeded
            window.removeEventListener('beforeunload', handleBeforeUnload);
          }).catch((error) => {
            console.error('Error updating appointment status (non-blocking):', error);
            // Keep beforeunload handler active for retry
          });
        }
      }}
      onPaymentFailure={async (error) => {
        setIsProcessingPayment(false);
        
        // Payment failed - keep appointment as TOKEN_PENDING
        const appointmentId = sessionStorage.getItem('pendingAppointmentId');
        if (appointmentId) {
          console.log('Payment failed - appointment remains TOKEN_PENDING:', appointmentId);
          sessionStorage.removeItem('pendingAppointmentId');
        }

        const errorMsg =
          typeof error === 'string'
            ? error
            : error?.description ||
              error?.message ||
              'Payment process failed';

        router.push(
          `/onboarding-patient/failure?error=${encodeURIComponent(errorMsg)}`
        );
      }}
      />
      <WhatsAppButton />
    </div>
  );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
        {/* Patient Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Patient Details
          </h3>

          <div className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <span className="text-sm text-gray-600 font-medium block">Name</span>
              <p className="text-sm font-medium text-gray-900">
                {patientDetails.name || 'Loading...'}
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <span className="text-sm text-gray-600 font-medium block">Phone</span>
              <p className="text-sm font-medium text-gray-900">
                {patientDetails.phone || 'Loading...'}
              </p>
            </div>

            {/* Email */}
            {patientDetails.email && (
              <div className="space-y-1">
                <span className="text-sm text-gray-600 font-medium block">Email</span>
                <p className="text-sm font-medium text-gray-900">
                  {patientDetails.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Session Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Session details
          </h3>

          <div className="space-y-4">
            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">Location</span>
                {currentCenter?.location && (
                  <a
                    href={currentCenter.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    View Map
                  </a>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">
                  {currentCenter?.name || 'Center Name'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {currentCenter?.address ? 
                    `${currentCenter.address.street}, ${currentCenter.address.city}, ${currentCenter.address.state}` : 
                    'Address not available'
                  }
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600 font-medium block">Date & Time</span>
              <p className="text-sm font-medium text-gray-900">
                {sessionDetails.dateTime}
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600 font-medium block">Phone</span>
              <a 
                href={`tel:${currentCenter?.phone}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
              >
                {currentCenter?.phone || 'Phone not available'}
              </a>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        {needsPayment && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900">
                Total Payable amount:
              </span>
              <span className="text-2xl font-bold text-gray-900">
                INR {sessionDetails.amount}
              </span>
            </div>
            
            {/* Non-refundable Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 text-xs font-bold">!</span>
                </div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  <span className="font-semibold">Important:</span> This advance payment of INR {sessionDetails.amount} is non-refundable and will be adjusted against your final service bill.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {needsPayment && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Payment Method
            </h3>

          <div className="space-y-3">
            {/* UPI Payment */}
            <div
              className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                selectedPaymentMethod === 'upi'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
              onClick={() => handlePaymentMethodSelect('upi')}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedPaymentMethod === 'upi'
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <CreditCard
                    className={`w-5 h-5 ${
                      selectedPaymentMethod === 'upi'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Pay Online</h4>
                  <p className="text-sm text-gray-500">UPI, Card, Netbanking</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedPaymentMethod === 'upi' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Package Balance */}
            {/* <div
              className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${
                selectedPaymentMethod === 'package'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
              onClick={() => handlePaymentMethodSelect('package')}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedPaymentMethod === 'package'
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <Package
                    className={`w-5 h-5 ${
                      selectedPaymentMethod === 'package'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    Avl. Package balance
                  </h4>
                  <p className="text-sm text-gray-500">INR 3,150</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === 'package'
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedPaymentMethod === 'package' && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div> */}
          </div>
        </div>
        )}
        </div>
      </div>

      {/* Proceed to Pay Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <Button
          onClick={async () => {
            if (needsPayment) {
              mobileAnalytics.trackProceedToPayClicked(sessionDetails.amount, bookingData.centerId, bookingData.patientId);
            }
            await handleProceedToPay();
          }}
          isLoading={isCreatingBooking}
          className="w-full py-4 rounded-2xl font-semibold text-white bg-lime-500 hover:bg-lime-600 active:bg-lime-700"
        >
          {packageId ? 'Confirm Booking with Package' : needsPayment ? `Proceed to pay INR ${sessionDetails.amount}` : 'Confirm Booking'}
        </Button>
      </div>
      
      <WhatsAppButton context="booking_confirmation" />
    </div>
  );
}
