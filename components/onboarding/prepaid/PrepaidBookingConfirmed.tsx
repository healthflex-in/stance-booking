'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, GET_CENTERS, SEND_APPOINTMENT_EMAIL, SEND_CONSULTANT_MEET_INVITE, GET_USER, GET_SERVICES, GET_APPOINTMENT_BY_ID } from '@/gql/queries';
import { CheckCircle, Shirt, Droplets, Package } from 'lucide-react';
import { Button } from '@/components/ui-atoms/Button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
    sessionType?: 'online' | 'in-person';
  };
}

export default function PrepaidBookingConfirmed({ bookingData }: PrepaidBookingConfirmedProps) {
  const router = useRouter();
  const [appointmentCreated, setAppointmentCreated] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    onCompleted: (data) => {
      console.log('📋 Consultant data loaded:', data?.user);
      console.log('📋 Consultant name:', data?.user?.profileData?.firstName, data?.user?.profileData?.lastName);
    },
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
    skip: !bookingData.centerId,
  });
  const { data: appointmentData } = useQuery(GET_APPOINTMENT_BY_ID, {
    variables: { id: bookingData.appointmentId },
    skip: !bookingData.appointmentId,
  });

  const currentCenter = centersData?.centers.find(
    (center: any) => center._id === bookingData.centerId
  );

  useEffect(() => {
    // Appointment should already be created - just send emails
    if (bookingData.appointmentId) {
      setAppointmentCreated(true);
      setIsCreating(false);
    }

    // Send emails if all data is loaded
    if (bookingData.appointmentId && !creationInProgress.current && userData && consultantData && centersData && servicesData && appointmentData) {
      creationInProgress.current = true;
      
      const sendEmails = async () => {
        try {
          const timeSlot = typeof bookingData.selectedTimeSlot === 'string' 
            ? { startTime: bookingData.selectedTimeSlot, endTime: bookingData.selectedTimeSlot, displayTime: bookingData.selectedTimeSlot }
            : bookingData.selectedTimeSlot;
          const center = centersData?.centers?.find((c: any) => c._id === bookingData.centerId);
          const service = servicesData?.services?.find((s: any) => s._id === bookingData.treatmentId);
          const patient = userData?.user;
          const consultant = consultantData?.user;
          
          const consultantName = `${consultant?.profileData?.firstName || ''} ${consultant?.profileData?.lastName || ''}`.trim();
          const patientName = `${patient?.profileData?.firstName || ''} ${patient?.profileData?.lastName || ''}`.trim();
          const treatmentName = service?.name || 'Online Consultation';
          
          if (patient?.email && center) {
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
                    meetingLink: appointmentData?.appointment?.meetingLink,
                  },
                },
              });
            } catch (emailErr) {
              console.error('Error sending patient email:', emailErr);
            }
          }
          
          if (consultant?.email) {
            try {
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
                    meetingLink: appointmentData?.appointment?.meetingLink,
                  },
                },
              });
            } catch (emailErr) {
              console.error('Error sending consultant email:', emailErr);
            }
          }
        } catch (err) {
          console.error('Error sending emails:', err);
        }
      };

      sendEmails();
    }
  }, [bookingData, sendAppointmentEmail, sendConsultantMeetInvite, userData, consultantData, centersData, servicesData, appointmentData]);

  const thingsToBring = [
    { icon: Shirt, label: 'Workout clothes' },
    { icon: Droplets, label: 'Water bottle' },
    { icon: Package, label: 'Towel' },
  ];

  if (!bookingData.appointmentId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">No appointment found</p>
          <p className="text-sm text-gray-600">Please go back and try again.</p>
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
            {/* Service */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600 font-medium block">Service</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">
                  {bookingData.isNewUser ? 'Stance PrePaid Services' : currentCenter?.name || 'Online Center'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {servicesData?.services?.find((s: any) => s._id === bookingData.treatmentId)?.name || 'Online Consultation'}
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

            {/* Consultant */}
            {consultantData?.user && (
              <div className="space-y-2">
                <span className="text-sm text-gray-600 font-medium block">Consultant</span>
                <p className="text-sm font-bold text-gray-900">
                  {(() => {
                    const firstName = consultantData.user.profileData?.firstName?.trim();
                    const lastName = consultantData.user.profileData?.lastName?.trim();
                    
                    if (firstName || lastName) {
                      return `${firstName || ''} ${lastName || ''}`.trim();
                    }
                    
                    // Fallback: try to get name from user object
                    const userName = consultantData.user.name?.trim();
                    if (userName) return userName;
                    
                    return 'Your Consultant';
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Things to Bring - Only show for offline sessions */}
        {bookingData.sessionType !== 'online' && (
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
        )}
    
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => router.push('/book-prepaid')}
            className="flex-1 py-4 text-black rounded-xl font-semibold transition-all"
            style={{ backgroundColor: '#DDFE71' }}
          >
            Return to Home
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const timeSlot = typeof bookingData.selectedTimeSlot === 'string' 
                  ? bookingData.selectedTimeSlot 
                  : bookingData.selectedTimeSlot.displayTime;
                const meetingLink = appointmentData?.appointment?.meetingLink;
                const message = bookingData.sessionType === 'online' && meetingLink
                  ? `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${timeSlot}\n\nJoin meeting: ${meetingLink}`
                  : `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${timeSlot}\nLocation: ${currentCenter?.name || 'Stance Health'}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center"
              title="Share on WhatsApp"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </button>
            <button
              onClick={() => {
                const timeSlot = typeof bookingData.selectedTimeSlot === 'string' 
                  ? bookingData.selectedTimeSlot 
                  : bookingData.selectedTimeSlot.displayTime;
                const meetingLink = appointmentData?.appointment?.meetingLink;
                const message = bookingData.sessionType === 'online' && meetingLink
                  ? `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${timeSlot}\n\nJoin meeting: ${meetingLink}`
                  : `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${timeSlot}\nLocation: ${currentCenter?.name || 'Stance Health'}`;
                window.open(`sms:?&body=${encodeURIComponent(message)}`, '_blank');
              }}
              className="w-14 h-14 bg-blue-500 text-white rounded-xl flex items-center justify-center"
              title="Share via Message"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-gray-500">Share appointment details via WhatsApp or Message</p>
      </div>
    </div>
  );
}
