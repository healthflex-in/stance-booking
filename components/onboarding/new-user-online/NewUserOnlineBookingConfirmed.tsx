'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_APPOINTMENT, GET_CENTERS, SEND_APPOINTMENT_EMAIL, SEND_CONSULTANT_MEET_INVITE, GET_USER, GET_SERVICES } from '@/gql/queries';
import { CheckCircle, Shirt, Droplets, Package } from 'lucide-react';
import { toast } from 'sonner';

interface NewUserOnlineBookingConfirmedProps {
  bookingData: {
    patientId: string;
    consultantId: string;
    centerId: string;
    treatmentId: string;
    treatmentPrice: number;
    selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
    selectedDate: string;
  };
}

export default function NewUserOnlineBookingConfirmed({ bookingData }: NewUserOnlineBookingConfirmedProps) {
  const [emailsSent, setEmailsSent] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const emailSendInProgress = useRef(false);

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

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;
  const consultant = consultantData?.user;

  useEffect(() => {
    if (!emailsSent && !emailSendInProgress.current && patient && consultant && currentCenter && currentService) {
      emailSendInProgress.current = true;
      
      const sendEmails = async () => {
        try {
          const patientName = `${patient.profileData.firstName} ${patient.profileData.lastName}`;
          const consultantName = `${consultant.profileData.firstName} ${consultant.profileData.lastName}`;
          
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
  }, [emailsSent, patient, consultant, currentCenter, currentService]);

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
          onClick={() => window.location.href = '/book'}
          className="w-full py-4 text-black rounded-xl font-semibold transition-all"
          style={{ backgroundColor: '#DDFE71' }}
        >
          Return to Home Screen
        </button>
      </div>
    </div>
  );
}
