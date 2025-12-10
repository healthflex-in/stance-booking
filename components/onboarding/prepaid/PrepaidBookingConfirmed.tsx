'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, GET_CENTERS, SEND_APPOINTMENT_EMAIL, SEND_CONSULTANT_MEET_INVITE, GET_USER, GET_SERVICES } from '@/gql/queries';
import { CheckCircle, Shirt, Droplets, Package } from 'lucide-react';
import { Button } from '@/components/ui-atoms/Button';
import { toast } from 'sonner';

interface PrepaidBookingConfirmedProps {
  bookingData: {
    patientId: string;
    consultantId: string;
    centerId: string;
    treatmentId: string;
    treatmentPrice: number;
    selectedTimeSlot: string | { startTime: string; endTime: string; displayTime: string };
    selectedDate: string;
    isNewUser: boolean;
    appointmentId?: string;
  };
}

export default function PrepaidBookingConfirmed({ bookingData }: PrepaidBookingConfirmedProps) {
  const [appointmentCreated, setAppointmentCreated] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const creationInProgress = useRef(false);

  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);
  const [sendConsultantMeetInvite] = useMutation(SEND_CONSULTANT_MEET_INVITE);
  const { data: centersData } = useQuery(GET_CENTERS);
  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
    skip: !bookingData.patientId,
  });
  const { data: consultantData, loading: consultantLoading } = useQuery(GET_USER, {
    variables: { userId: bookingData.consultantId },
    skip: !bookingData.consultantId,
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
    skip: !bookingData.centerId,
  });

  const currentCenter = centersData?.centers.find(
    (center: any) => center._id === bookingData.centerId
  );

  useEffect(() => {
    console.log('useEffect triggered:', {
      appointmentCreated,
      creationInProgress: creationInProgress.current,
      patientId: bookingData.patientId,
      consultantId: bookingData.consultantId,
      appointmentId: bookingData.appointmentId,
      userLoading,
      consultantLoading,
      hasUserData: !!userData,
      hasConsultantData: !!consultantData,
    });
    
    // Skip appointment creation if already created (appointmentId provided)
    if (bookingData.appointmentId) {
      console.log('✅ Appointment already created, skipping creation. AppointmentId:', bookingData.appointmentId);
      setAppointmentCreated(true);
      setIsCreating(false);
      return;
    }

    // Only create appointment if appointmentId is NOT provided (fallback for old flow)
    if (!appointmentCreated && !creationInProgress.current && bookingData.patientId && bookingData.consultantId && !bookingData.appointmentId && !userLoading && !consultantLoading && userData && consultantData) {
      creationInProgress.current = true;
      console.log('✅ All conditions met, creating appointment...');
      
      const createPrepaidAppointment = async () => {
        try {
          const timeSlot = typeof bookingData.selectedTimeSlot === 'string' 
            ? { startTime: bookingData.selectedTimeSlot, endTime: bookingData.selectedTimeSlot, displayTime: bookingData.selectedTimeSlot }
            : bookingData.selectedTimeSlot;
          
          const startTime = new Date(timeSlot.startTime).getTime();
          const endTime = new Date(timeSlot.endTime).getTime();

          // Build input object - exactly like redesign
          const input = {
            patient: bookingData.patientId,
            consultant: bookingData.consultantId || null,
            treatment: bookingData.treatmentId,
            medium: 'ONLINE',
            notes: '',
            center: bookingData.centerId,
            category: 'WEBSITE',
            status: 'BOOKED',
            visitType: bookingData.isNewUser ? 'FIRST_VISIT' : 'FOLLOW_UP',
            event: {
              startTime,
              endTime,
            },
          };

          await createAppointment({
            variables: { input },
          });

          setAppointmentCreated(true);
          
          console.log('=== EMAIL SENDING PROCESS START ===');
          console.log('Patient Data:', userData?.user);
          console.log('Consultant Data:', consultantData?.user);
          console.log('Centers Data:', centersData?.centers);
          console.log('Services Data:', servicesData?.services);
          
          const center = centersData?.centers?.find((c: any) => c._id === bookingData.centerId);
          const service = servicesData?.services?.find((s: any) => s._id === bookingData.treatmentId);
          const patient = userData?.user;
          const consultant = consultantData?.user;
          
          console.log('Found Center:', center);
          console.log('Found Service:', service);
          console.log('Patient Email:', patient?.email);
          console.log('Consultant Email:', consultant?.email);
          
          const consultantName = `${consultant?.profileData?.firstName || ''} ${consultant?.profileData?.lastName || ''}`.trim();
          const patientName = `${patient?.profileData?.firstName || ''} ${patient?.profileData?.lastName || ''}`.trim();
          const treatmentName = service?.name || 'Online Consultation';
          
          console.log('Consultant Name:', consultantName);
          console.log('Patient Name:', patientName);
          console.log('Treatment Name:', treatmentName);
          
          // Send Meet link emails to both patient and consultant
          if (patient?.email && center) {
            console.log('✅ Sending patient Meet link to:', patient.email);
            try {
              await sendAppointmentEmail({
                variables: {
                  input: {
                    email: patient.email,
                    patientName,
                    date: bookingData.selectedDate,
                    time: timeSlot.displayTime,
                    centerName: center.name || 'Stance Health',
                    centerAddress: center.address?.street || 'Online',
                    centerPhone: center.phone || '',
                    treatmentName,
                    amount: bookingData.treatmentPrice || 0,
                    centerLocation: center.location || '',
                    startDateTime: timeSlot.startTime,
                    endDateTime: timeSlot.endTime,
                    isOnlineAssessment: true,
                  },
                },
              });
              console.log('✅ Patient Meet link sent successfully');
            } catch (emailErr) {
              console.error('❌ Error sending patient email:', emailErr);
            }
          }
          
          if (consultant?.email) {
            console.log('✅ Sending consultant email to:', consultant.email);
            try {
              const result = await sendConsultantMeetInvite({
                variables: {
                  input: {
                    consultantEmail: consultant.email,
                    consultantName,
                    patientName,
                    date: bookingData.selectedDate,
                    time: timeSlot.displayTime,
                    treatmentName,
                    startDateTime: timeSlot.startTime,
                    endDateTime: timeSlot.endTime,
                  },
                },
              });
              console.log('✅ Consultant email sent successfully:', result);
            } catch (emailErr) {
              console.error('❌ Error sending consultant email:', emailErr);
            }
          } else {
            console.log('❌ Cannot send consultant email - Missing email:', consultant?.email);
          }
          
          console.log('=== EMAIL SENDING PROCESS END ===');
          
          setIsCreating(false);
        } catch (err) {
          console.error('Error creating appointment:', err);
          setError(err instanceof Error ? err.message : 'Failed to create appointment');
          setIsCreating(false);
          creationInProgress.current = false;
        }
      };

      createPrepaidAppointment();
    }
  }, [appointmentCreated, bookingData, createAppointment, sendAppointmentEmail, sendConsultantMeetInvite, userData, consultantData, centersData, userLoading, consultantLoading]);

  const thingsToBring = [
    { icon: Shirt, label: 'Workout clothes' },
    { icon: Droplets, label: 'Water bottle' },
    { icon: Package, label: 'Towel' },
  ];

  if (isCreating) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your appointment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to create appointment</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
        {/* Logo and Success Icon */}
        <div className="flex ml-6 mb-4">
          <img 
            src="/stance-logo.png" 
            alt="Stance Health" 
            className="h-20 w-auto"
          />
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        {/* Success Header */}
        <div className="text-center mb-6">
          <p className="text-green-700 text-sm font-medium mb-2">
            ✨ Your booking is confirmed. Below are the details of your upcoming session.
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
              <span className="text-sm text-gray-600 font-medium block">Location</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">
                  {currentCenter?.name || 'Online Center'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Online Consultation
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <div className="text-gray-600 text-sm mb-1">Date & time</div>
              <div className="font-medium text-gray-900">
                {bookingData.selectedDate}, {typeof bookingData.selectedTimeSlot === 'string' ? bookingData.selectedTimeSlot : bookingData.selectedTimeSlot.displayTime}
              </div>
            </div>

            {/* Type */}
            <div>
              <div className="text-gray-600 text-sm mb-1">Type</div>
              <div className="font-medium text-gray-900">
                Online Consultation (20 mins)
              </div>
            </div>
          </div>
        </div>

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
    
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 space-y-3">
        <button
          onClick={async () => {
            setResendingEmail(true);
            try {
              const timeSlot = typeof bookingData.selectedTimeSlot === 'string' 
                ? { startTime: bookingData.selectedTimeSlot, endTime: bookingData.selectedTimeSlot, displayTime: bookingData.selectedTimeSlot }
                : bookingData.selectedTimeSlot;
              
              const center = centersData?.centers?.find((c: any) => c._id === bookingData.centerId);
              const service = servicesData?.services?.find((s: any) => s._id === bookingData.treatmentId);
              const patient = userData?.user;
              const consultant = consultantData?.user;
              
              const patientName = `${patient?.profileData?.firstName || ''} ${patient?.profileData?.lastName || ''}`.trim();
              const consultantName = `${consultant?.profileData?.firstName || ''} ${consultant?.profileData?.lastName || ''}`.trim();
              const treatmentName = service?.name || 'Online Consultation';
              
              await sendAppointmentEmail({
                variables: {
                  input: {
                    email: patient.email,
                    patientName,
                    date: bookingData.selectedDate,
                    time: timeSlot.displayTime,
                    centerName: center.name || 'Stance Health',
                    centerAddress: center.address?.street || 'Online',
                    centerPhone: center.phone || '',
                    treatmentName,
                    amount: bookingData.treatmentPrice || 0,
                    centerLocation: center.location || '',
                    startDateTime: timeSlot.startTime,
                    endDateTime: timeSlot.endTime,
                    isOnlineAssessment: true,
                  },
                },
              });
              
              await sendConsultantMeetInvite({
                variables: {
                  input: {
                    consultantEmail: consultant.email,
                    consultantName,
                    patientName,
                    date: bookingData.selectedDate,
                    time: timeSlot.displayTime,
                    treatmentName,
                    startDateTime: timeSlot.startTime,
                    endDateTime: timeSlot.endTime,
                  },
                },
              });
              
              toast.success('Emails sent successfully!');
            } catch (err) {
              console.error('Error resending emails:', err);
              toast.error('Failed to send emails');
            } finally {
              setResendingEmail(false);
            }
          }}
          disabled={resendingEmail}
          className="w-full py-4 text-black rounded-xl font-semibold transition-all border border-gray-300"
        >
          {resendingEmail ? 'Sending...' : 'Resend Email'}
        </button>
        <button
          onClick={() => window.location.href = '/book-prepaid'}
          className="w-full py-4 text-black rounded-xl font-semibold transition-all"
          style={{ backgroundColor: '#DDFE71' }}
        >
          Return to Home Screen
        </button>
      </div>
    </div>
  );
}
