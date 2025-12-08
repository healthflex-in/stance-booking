'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Droplets,
  Package,
  Waves,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { GET_CENTERS, GET_USER, SEND_APPOINTMENT_EMAIL, UPDATE_PATIENT, CREATE_APPOINTMENT } from '@/gql/queries';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import { WhatsAppButton, MobileLoadingScreen } from '../shared';

interface MobileBookingConfirmedProps {
  bookingData: any;
  isPrepaid?: boolean;
}

export default function MobileBookingConfirmed({
  bookingData,
  isPrepaid = false,
}: MobileBookingConfirmedProps) {
  const router = useRouter();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [userEmail, setUserEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [hasTrackedEmailEntry, setHasTrackedEmailEntry] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const isOnlineAssessment = bookingData.assessmentType === 'online';
  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const hasAttemptedAutoSend = React.useRef(false);
  
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [appointmentCreated, setAppointmentCreated] = useState(false);

  // Create prepaid appointment
  useEffect(() => {
    if (isPrepaid && !appointmentCreated && bookingData.patientId && bookingData.consultantId) {
      const createPrepaidAppointment = async () => {
        try {
          const startTime = new Date(bookingData.selectedTimeSlot.startTime).getTime();
          const endTime = new Date(bookingData.selectedTimeSlot.endTime).getTime();

          await createAppointment({
            variables: {
              input: {
                patient: bookingData.patientId,
                consultant: bookingData.consultantId,
                center: bookingData.centerId,
                treatment: bookingData.treatmentId,
                medium: 'ONLINE',
                visitType: 'FIRST_VISIT',
                status: 'BOOKED',
                isPrepaid: true,
                event: {
                  startTime,
                  endTime,
                },
              },
            },
          });

          setAppointmentCreated(true);
        } catch (err) {
          console.error('Error creating prepaid appointment:', err);
        }
      };

      createPrepaidAppointment();
    }
  }, [isPrepaid, appointmentCreated, bookingData, createAppointment]);

  // Track component mount
  useEffect(() => {
    mobileAnalytics.trackBookingConfirmationViewed(
      `apt_${Date.now()}`,
      bookingData.patientId,
      bookingData.centerId
    );
    
    // Track booking completion
    mobileAnalytics.trackBookingCompleted({
      appointmentId: `apt_${Date.now()}`,
      patientId: bookingData.patientId,
      centerId: bookingData.centerId,
      consultantId: bookingData.consultantId || '',
      treatmentId: bookingData.treatmentId || '',
      amount: bookingData.treatmentPrice || 100,
      sessionType: bookingData.sessionType || 'in-person',
      appointmentDate: bookingData.selectedDate || '',
      appointmentTime: bookingData.selectedTimeSlot?.displayTime || ''
    });
    
    // Track booking success completion (custom event)
    mobileAnalytics.trackBookingSuccessComplete({
      appointmentId: `apt_${Date.now()}`,
      patientId: bookingData.patientId,
      centerId: bookingData.centerId,
      amount: bookingData.treatmentPrice || 100
    });
  }, [bookingData, mobileAnalytics]);

  // Fetch centers data
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);
  
  // Fetch user data
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
  });

  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);

  // Find current center from bookingData.centerId
  const currentCenter = centersData?.centers.find(
    (center: any) => center._id === bookingData.centerId
  );

  const handleSendEmail = async () => {
    console.log('handleSendEmail called with email:', userEmail);
    if (!userEmail.trim() || isSendingEmail) {
      console.log('Email send skipped - email empty or already sending');
      return;
    }

    console.log('Starting email send process...');
    setIsSendingEmail(true);
    
    // If email was entered manually, save it to database first
    if (showEmailInput && userEmail && bookingData.patientId) {
      try {
        // Note: UPDATE_PATIENT mutation doesn't support email field
        // Email will be sent but not saved to patient profile
        // Backend needs to support email update for this to work
        console.log('Email entered:', userEmail);
      } catch (error) {
        console.error('Note: Could not save email to patient profile:', error);
      }
    }

    // Track send email button click
    mobileAnalytics.trackSendEmailClicked(userEmail, bookingData.centerId, bookingData.patientId);
    
    // Track email details request (custom event)
    mobileAnalytics.trackEmailDetailsRequested(userEmail, bookingData.patientId, bookingData.centerId);

    try {
      const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      let date = '';
      let time = '';

      if (bookingData.selectedTimeSlot?.startTime) {
        const startTime = new Date(bookingData.selectedTimeSlot.startTime);
        const endTime = new Date(bookingData.selectedTimeSlot.endTime);
        
        date = startTime.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        time = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      }

      const patientName = userData?.user?.profileData ? 
        `${userData.user.profileData.firstName || ''} ${userData.user.profileData.lastName || ''}`.trim() || 'Patient' :
        'Patient';

      const centerAddress = currentCenter?.address ? 
        `${currentCenter.address.street}, ${currentCenter.address.city}, ${currentCenter.address.state}` : 
        'Address not available';

      const emailInput = {
        email: userEmail.trim(),
        patientName,
        date,
        time,
        centerName: currentCenter?.name || 'Our Center',
        centerAddress,
        centerPhone: currentCenter?.phone || 'Phone not available',
        treatmentName: isOnlineAssessment ? 'Online Assessment (20 mins)' : 'First Visit Assessment',
        amount: bookingData.treatmentPrice || 100,
        centerLocation: currentCenter?.location,
        startDateTime: bookingData.selectedTimeSlot?.startTime ? new Date(bookingData.selectedTimeSlot.startTime).toISOString() : undefined,
        endDateTime: bookingData.selectedTimeSlot?.endTime ? new Date(bookingData.selectedTimeSlot.endTime).toISOString() : undefined,
        isOnlineAssessment: isOnlineAssessment,
      };

      console.log('Sending email with data:', emailInput);
      
      const result = await sendAppointmentEmail({
        variables: { input: emailInput },
      });
      
      console.log('Email mutation result:', result);
      
      if (result.data?.sendAppointmentEmail?.success) {
        console.log('Email sent successfully!');
      } else {
        console.error('Email send failed:', result.data?.sendAppointmentEmail?.message);
        throw new Error(result.data?.sendAppointmentEmail?.message || 'Failed to send email');
      }

      // Track successful email send
      mobileAnalytics.trackEmailSentSuccess(userEmail, bookingData.centerId, bookingData.patientId);

      setEmailSent(true);
      setShowEmailInput(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
      
      // Track email send failure
      mobileAnalytics.trackEmailSentFailure(
        userEmail, 
        bookingData.centerId, 
        bookingData.patientId, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Auto-send email if available, otherwise show input
  useEffect(() => {
    if (userData?.user?.email) {
      setUserEmail(userData.user.email);
      setShowEmailInput(false);
    } else {
      setShowEmailInput(true);
    }
  }, [userData]);

  // Separate effect to auto-send after userEmail is set
  useEffect(() => {
    if (userEmail && !emailSent && !isSendingEmail && currentCenter && !showEmailInput && !hasAttemptedAutoSend.current) {
      console.log('Auto-sending email to:', userEmail);
      hasAttemptedAutoSend.current = true;
      handleSendEmail();
    }
  }, [userEmail, currentCenter]);

  const sessionDetails = {
    type: bookingData.sessionType === 'in-person' ? 'In Person' : 'Online',
    location: currentCenter
      ? `${currentCenter.name}, ${currentCenter.address.street}, ${currentCenter.address.city}, ${currentCenter.address.state}`
      : 'Loading location...',
    locationUrl: currentCenter?.location || '#',
    dateTime: (() => {
      const formatTime = (date: Date) => {
        if (!date || isNaN(date.getTime())) return '';
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      if (bookingData.selectedTimeSlot?.startTime) {
        const startTime = new Date(bookingData.selectedTimeSlot.startTime);
        const endTime = new Date(bookingData.selectedTimeSlot.endTime);
        
        const formattedDate = startTime.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        
        const timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        return `${formattedDate}, ${timeDisplay}`;
      }
      
      if (bookingData.selectedFullDate) {
        const formattedDate = bookingData.selectedFullDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        
        const timeSlot = bookingData.selectedTimeSlot?.displayTime || 'Time not available';
        return `${formattedDate}, ${timeSlot}`;
      }
      
      return 'Date & time not available';
    })(),
    advancePayment: bookingData.treatmentPrice || 100,
  };

  const thingsToBring = [
    { icon: Shirt, label: 'Workout clothes' },
    { icon: Droplets, label: 'Water bottle' },
    { icon: Package, label: 'Towel' },
  ];

  if (centersLoading) {
    return (
      <MobileLoadingScreen 
        message="Finalizing Your Appointment" 
        animationData="/lottie2.json" 
      />
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
        {/* Logo */}
        <div className="flex ml-6">
          <img 
            src="/stance-logo.png" 
            alt="Stance Health" 
            className="h-20 w-auto"
          />
           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        {/* Success Header */}
        <div className="text-center mb-6">
          {/* <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div> */}
          <p className="text-green-700 text-sm font-medium mb-2">
            ✨ Your booking is confirmed. Below are the details of your upcoming
            session.
          </p>
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

            {/* Phone Number */}
            <div>
              <div className="text-gray-600 text-sm mb-1">Phone</div>
              <a 
                href={`tel:${currentCenter?.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700 underline"
              >
                {currentCenter?.phone || 'Phone not available'}
              </a>
            </div>

            {/* Date & Time */}
            <div>
              <div className="text-gray-600 text-sm mb-1">Date & time</div>
              <div className="font-medium text-gray-900">
                {sessionDetails.dateTime}
              </div>
            </div>

            {/* Advance Payment */}
            <div>
              <div className="text-gray-600 text-sm mb-1">Advance Payment</div>
              <div className="font-medium text-gray-900">
                INR {sessionDetails.advancePayment}
              </div>
            </div>
          </div>
        </div>

          {showEmailInput && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Email Address
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              In order to receive all appointment details, please provide us your email address:
            </p>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => {
                setUserEmail(e.target.value);
                // Only track once when user starts typing
                if (e.target.value.trim().length > 0 && !hasTrackedEmailEntry) {
                  mobileAnalytics.trackAppointmentEmailEntered(bookingData.centerId, bookingData.patientId);
                  // Track email details request start (custom event)
                  mobileAnalytics.trackEmailDetailsRequested(e.target.value, bookingData.patientId, bookingData.centerId);
                  setHasTrackedEmailEntry(true);
                }
              }}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 mb-4"
            />
            <button
              onClick={handleSendEmail}
              disabled={!userEmail.trim() || isSendingEmail}
              className="w-full py-3 rounded-xl font-semibold text-white bg-lime-500 hover:bg-lime-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {isSendingEmail ? 'Sending...' : 'Send Appointment Details'}
            </button>
          </div>
        )}

         {emailSent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                {isOnlineAssessment 
                  ? `Google Meet link and calendar invite sent to ${userEmail}` 
                  : `Appointment details sent to ${userEmail}`}
              </p>
            </div>
          </div>
        )}



        {/* Things to Bring */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Things to bring
          </h3>

          <div className="space-y-3">
            {thingsToBring.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-[#DDFE71]" />
                </div>
                <span className="text-gray-900">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
    
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              mobileAnalytics.trackReturnHomeClicked(bookingData.centerId, bookingData.patientId);
              window.location.href = '/onboarding-patient';
            }}
            className="w-full py-4 text-black rounded-2xl font-semibold transition-all"
            style={{ backgroundColor: '#DDFE71' }}
          >
             Return to Home Screen
          </button>
        </div>
        </div>
      </div>
      
      <WhatsAppButton context="booking_confirmed" />
    </div>
  );
}
