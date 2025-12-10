'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  MapPin,
  Shirt,
  Droplets,
  Package,
  Waves,
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { GET_CENTERS } from '@/gql/queries';

interface BookingConfirmedProps {
  bookingData: any;
  onGoHome: () => void;
}

export default function BookingConfirmed({
  bookingData,
  onGoHome,
}: BookingConfirmedProps) {
  const { isInDesktopContainer } = useContainerDetection();
  
  // Fetch centers
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  // Find current center
  const currentCenter = centersData?.centers.find((center: any) => 
    center._id === (bookingData.selectedCenter?._id || bookingData.centerId)
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  };

  // Get session details
  const sessionDetails = {
    dateTime: bookingData.selectedTimeSlot?.startTimeRaw 
      ? `${formatDate(bookingData.selectedTimeSlot.startTimeRaw)} at ${formatTime(bookingData.selectedTimeSlot.startTimeRaw)} - ${formatTime(bookingData.selectedTimeSlot.endTimeRaw)}`
      : bookingData.selectedTimeSlot?.startTime
      ? `${formatDate(bookingData.selectedTimeSlot.startTime)} at ${formatTime(bookingData.selectedTimeSlot.startTime)} - ${formatTime(bookingData.selectedTimeSlot.endTime)}`
      : 'Not selected',
    advancePayment: bookingData.selectedService?.bookingAmount || bookingData.selectedService?.price || bookingData.treatmentPrice || 0,
  };

  const thingsToBring = [
    { icon: Shirt, label: 'Workout clothes' },
    { icon: Droplets, label: 'Water bottle' },
    { icon: Waves, label: 'Towel' },
    { icon: Package, label: 'Yoga Mat' },
  ];

  if (centersLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finalizing Your Appointment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
          {/* Logo */}
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
                    {currentCenter?.name || bookingData.selectedCenter?.name || bookingData.location || 'Center Name'}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {currentCenter?.address || bookingData.selectedCenter?.address ? 
                      `${(currentCenter?.address || bookingData.selectedCenter?.address)?.street || ''}, ${(currentCenter?.address || bookingData.selectedCenter?.address)?.city || ''}, ${(currentCenter?.address || bookingData.selectedCenter?.address)?.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                      'Address not available'}
                  </p>
                </div>
              </div>

              {/* Phone Number */}
              {currentCenter?.phone && (
                <div>
                  <div className="text-gray-600 text-sm mb-1">Phone</div>
                  <a 
                    href={`tel:${currentCenter.phone}`}
                    className="font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    {currentCenter.phone}
                  </a>
                </div>
              )}

              {/* Date & Time */}
              <div>
                <div className="text-gray-600 text-sm mb-1">Date & time</div>
                <div className="font-medium text-gray-900">
                  {sessionDetails.dateTime}
                </div>
              </div>

              {/* Advance Payment */}
              {sessionDetails.advancePayment > 0 && (
                <div>
                  <div className="text-gray-600 text-sm mb-1">Advance Payment</div>
                  <div className="font-medium text-gray-900">
                    INR {sessionDetails.advancePayment}
                  </div>
                </div>
              )}
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
    
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onGoHome}
              className="w-full py-4 text-black rounded-2xl font-semibold transition-all"
              style={{ backgroundColor: '#DDFE71' }}
            >
              Return to Home Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
