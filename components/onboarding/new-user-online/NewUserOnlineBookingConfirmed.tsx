'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, GET_CENTERS, SEND_APPOINTMENT_EMAIL, SEND_CONSULTANT_MEET_INVITE, GET_USER, GET_SERVICES, GET_APPOINTMENT_BY_ID } from '@/gql/queries';
import { CheckCircle, Shirt, Droplets, Package } from 'lucide-react';
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
  const [resendingEmail, setResendingEmail] = useState(false);
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

  const thingsToBring = [
    { icon: Shirt, label: 'Workout clothes' },
    { icon: Droplets, label: 'Water bottle' },
    { icon: Package, label: 'Towel' },
  ];

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

              <div>
                <div className="text-gray-600 text-sm mb-1">Date & time</div>
                <div className="font-medium text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
                </div>
              </div>

              <div>
                <div className="text-gray-600 text-sm mb-1">Type</div>
                <div className="font-medium text-gray-900">
                  Online Consultation ({currentService?.duration || 20} mins)
                </div>
              </div>
            </div>
          </div>

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

      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 space-y-3">
        <button
          onClick={async () => {
            setResendingEmail(true);
            try {
              console.log('=== RESEND BUTTON CLICKED ===');
              console.log('appointmentData:', appointmentData);
              console.log('meetingLink:', appointmentData?.appointment?.meetingLink);
              console.log('=== END RESEND DEBUG ===');
              
              const patientName = `${patient?.profileData.firstName} ${patient?.profileData.lastName}`;
              const consultantName = `${consultant?.profileData.firstName} ${consultant?.profileData.lastName}`;
              
              if (patient?.email) {
                await sendAppointmentEmail({
                  variables: {
                    input: {
                      email: patient.email,
                      patientName,
                      date: bookingData.selectedDate,
                      time: bookingData.selectedTimeSlot.displayTime,
                      centerName: currentCenter?.name || '',
                      centerAddress: currentCenter?.address?.street || 'Online',
                      centerPhone: currentCenter?.phone || '',
                      treatmentName: currentService?.name || '',
                      amount: bookingData.treatmentPrice,
                      centerLocation: currentCenter?.location || '',
                      startDateTime: bookingData.selectedTimeSlot.startTime,
                      endDateTime: bookingData.selectedTimeSlot.endTime,
                      isOnlineAssessment: true,
                      meetingLink: appointmentData?.appointment?.meetingLink,
                    },
                  },
                });
              }
              
              if (consultant?.email) {
                await sendConsultantMeetInvite({
                  variables: {
                    input: {
                      consultantEmail: consultant.email,
                      consultantName,
                      patientName,
                      date: bookingData.selectedDate,
                      time: bookingData.selectedTimeSlot.displayTime,
                      treatmentName: currentService?.name || '',
                      startDateTime: bookingData.selectedTimeSlot.startTime,
                      endDateTime: bookingData.selectedTimeSlot.endTime,
                      meetingLink: appointmentData?.appointment?.meetingLink,
                    },
                  },
                });
              }
              
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
          onClick={() => router.push('/book')}
          className="w-full py-4 text-black rounded-xl font-semibold transition-all"
          style={{ backgroundColor: '#DDFE71' }}
        >
          Return to Home Screen
        </button>
      </div>
    </div>
  );
}
