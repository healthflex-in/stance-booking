'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_CENTERS, GET_USER, GET_SERVICES } from '@/gql/queries';
import { CheckCircle, Shirt, Droplets, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NewUserOfflineBookingConfirmedProps {
  bookingData: {
    patientId: string;
    centerId: string;
    treatmentId: string;
    treatmentPrice: number;
    selectedTimeSlot: { startTime: string; endTime: string; displayTime: string };
    selectedDate: string;
  };
}

export default function NewUserOfflineBookingConfirmed({ bookingData }: NewUserOfflineBookingConfirmedProps) {
  const router = useRouter();
  
  const { data: centersData } = useQuery(GET_CENTERS);
  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: bookingData.patientId },
  });
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { centerId: [bookingData.centerId] },
  });

  const currentCenter = centersData?.centers.find((c: any) => c._id === bookingData.centerId);
  const currentService = servicesData?.services.find((s: any) => s._id === bookingData.treatmentId);
  const patient = userData?.user;
  const patientName = patient?.profileData ? `${patient.profileData.firstName} ${patient.profileData.lastName}` : '';

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
              <div>
                <div className="text-gray-600 text-sm mb-1">Patient</div>
                <div className="font-medium text-gray-900">{patientName}</div>
              </div>

              <div>
                <div className="text-gray-600 text-sm mb-1">Location</div>
                <div className="font-medium text-gray-900">{currentCenter?.name}</div>
              </div>

              <div>
                <div className="text-gray-600 text-sm mb-1">Service</div>
                <div className="font-medium text-gray-900">{currentService?.name}</div>
              </div>

              <div>
                <div className="text-gray-600 text-sm mb-1">Date &amp; time</div>
                <div className="font-medium text-gray-900">
                  {bookingData.selectedDate}, {bookingData.selectedTimeSlot.displayTime}
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

      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
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
