'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, GET_CENTERS, SEND_APPOINTMENT_EMAIL, SEND_CONSULTANT_MEET_INVITE, GET_USER, GET_SERVICES, GET_APPOINTMENT_BY_ID } from '@/gql/queries';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NewUserOnlineBookingConfirmedProps {
  bookingData: {
    patientId: string;
    consultantId: string;
    centerId: string;
    treatmentId: string;
    treatmentPrice: number;
    selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
    selectedDate: string;
    appointmentId?: string;
  };
}

export default function NewUserOnlineBookingConfirmed({ bookingData }: NewUserOnlineBookingConfirmedProps) {
  const router = useRouter();
  const [emailsSent, setEmailsSent] = useState(false);
  const emailSendInProgress = useRef(false);
  const appointmentId = bookingData.appointmentId;

  const [sendAppointmentEmail] = useMutation(SEND_APPOINTMENT_EMAIL);
  const [sendConsultantMeetInvite] = useMutation(SEND_CONSULTANT_MEET_INVITE);
  
  const { data: centersData } = useQuery(GET_CENTERS);
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
  });
  const { data: consultantData } = useQuery(GET_USER, {
    variables: { userId: bookingData.consultantId },
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });
  const { data: appointmentData, loading: appointmentLoading, error: appointmentError } = useQuery(GET_APPOINTMENT_BY_ID, {
    variables: { id: appointmentId },
    skip: !appointmentId,
    fetchPolicy: 'network-only',
  });
  
  console.log('=== APPOINTMENT QUERY STATUS ===');
  console.log('appointmentId:', appointmentId);
  console.log('loading:', appointmentLoading);
  console.log('error:', appointmentError);
  console.log('data:', appointmentData);
  console.log('=== END QUERY STATUS ===');

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;
  const consultant = consultantData?.user;

  console.log('=== NEW USER ONLINE COMPONENT STATE ===');
  console.log('appointmentId:', appointmentId);
  console.log('emailsSent:', emailsSent);
  console.log('emailSendInProgress:', emailSendInProgress.current);
  console.log('patient:', !!patient);
  console.log('consultant:', !!consultant);
  console.log('currentCenter:', !!currentCenter);
  console.log('currentService:', !!currentService);
  console.log('appointmentData:', !!appointmentData);
  console.log('appointmentData.appointment:', appointmentData?.appointment);
  console.log('=== END COMPONENT STATE ===');

  useEffect(() => {
    console.log('=== USEEFFECT TRIGGERED ===');
    console.log('Condition check:', {
      emailsSent: !emailsSent,
      emailSendInProgress: !emailSendInProgress.current,
      patient: !!patient,
      consultant: !!consultant,
      currentCenter: !!currentCenter,
      currentService: !!currentService,
      appointmentData: !!appointmentData,
      allConditionsMet: !emailsSent && !emailSendInProgress.current && patient && consultant && currentCenter && currentService && appointmentData
    });
    
    if (!emailsSent && !emailSendInProgress.current && patient && consultant && currentCenter && currentService && appointmentData) {
      console.log('✅ ALL CONDITIONS MET - SENDING EMAILS');
      emailSendInProgress.current = true;
      
      const sendEmails = async () => {
        try {
          const patientName = `${patient.profileData.firstName} ${patient.profileData.lastName}`;
          const consultantName = `${consultant.profileData.firstName} ${consultant.profileData.lastName}`;
          
          console.log('=== FRONTEND EMAIL SEND DEBUG ===');
          console.log('appointmentId:', appointmentId);
          console.log('appointmentData:', appointmentData);
          console.log('meetingLink from DB:', appointmentData?.appointment?.meetingLink);
          console.log('=== END FRONTEND DEBUG ===');
          
          // Send email to patient
          if (patient.email) {
            await sendAppointmentEmail({
              variables: {
                input: {
                  email: patient.email,
                  patientName,
                  date: bookingData.selectedDate,
                  time: bookingData.selectedTimeSlot.displayTime,
                  centerName: currentCenter.name,
                  centerAddress: currentCenter.address?.street || 'Online',
                  centerPhone: currentCenter.phone || '',
                  treatmentName: currentService.name,
                  amount: bookingData.treatmentPrice,
                  centerLocation: currentCenter.location || '',
                  startDateTime: bookingData.selectedTimeSlot.startTime,
                  endDateTime: bookingData.selectedTimeSlot.endTime,
                  isOnlineAssessment: true,
                  meetingLink: appointmentData?.appointment?.meetingLink,
                },
              },
            });
          }
          
          // Send email to consultant
          if (consultant.email) {
            await sendConsultantMeetInvite({
              variables: {
                input: {
                  consultantEmail: consultant.email,
                  consultantName,
                  patientName,
                  date: bookingData.selectedDate,
                  time: bookingData.selectedTimeSlot.displayTime,
                  treatmentName: currentService.name,
                  startDateTime: bookingData.selectedTimeSlot.startTime,
                  endDateTime: bookingData.selectedTimeSlot.endTime,
                  meetingLink: appointmentData?.appointment?.meetingLink,
                },
              },
            });
          }
          
          setEmailsSent(true);
        } catch (error) {
          console.error('Error sending emails:', error);
        }
      };
      
      sendEmails();
    }
  }, [emailsSent, patient, consultant, currentCenter, currentService, appointmentData]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
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
          
          <div className="text-center mb-6">
            <p className="text-green-700 text-sm font-medium mb-2">
              ✨ Your booking is confirmed. Below are the details of your upcoming session.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session details
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm text-gray-600 font-medium block">Service</span>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    Stance Online Services
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {currentService?.name || 'Online Consultation'}
                  </p>
                </div>
              </div>

              <div>
                <div className="text-gray-600 text-sm mb-1">Date & time</div>
                <div className="font-medium text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => router.push('/book')}
            className="flex-1 py-4 text-black rounded-xl font-semibold transition-all"
            style={{ backgroundColor: '#DDFE71' }}
          >
            Return to Home
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const meetingLink = appointmentData?.appointment?.meetingLink;
                const message = meetingLink
                  ? `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${bookingData.selectedTimeSlot.displayTime}\n\nJoin meeting: ${meetingLink}`
                  : `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${bookingData.selectedTimeSlot.displayTime}\nLocation: Stance Online Services`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center"
              title="Share on WhatsApp"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </button>
            <button
              onClick={() => {
                const meetingLink = appointmentData?.appointment?.meetingLink;
                const message = meetingLink
                  ? `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${bookingData.selectedTimeSlot.displayTime}\n\nJoin meeting: ${meetingLink}`
                  : `Your appointment with Stance Health is confirmed!\n\nDate: ${bookingData.selectedDate}\nTime: ${bookingData.selectedTimeSlot.displayTime}\nLocation: Stance Online Services`;
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
