'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { SessionDetailItem, PrimaryButton } from '@/components/ui-atoms';

interface BookingConfirmedProps {
  bookingData: any;
  onGoHome: () => void;
}

export default function BookingConfirmed({
  bookingData,
  onGoHome,
}: BookingConfirmedProps) {
  const { isInDesktopContainer } = useContainerDetection();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not selected';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short',
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

  // Get dynamic values from bookingData
  const sessionType = bookingData.sessionType === 'online' ? 'Online' : 'In Person';
  const location = bookingData.selectedCenter?.name || bookingData.location || 'Not selected';
  const service = bookingData.selectedService?.name || bookingData.treatmentName || 'Not selected';
  const consultant = bookingData.selectedConsultant?.profileData?.firstName 
    ? `${bookingData.selectedConsultant.profileData.firstName} ${bookingData.selectedConsultant.profileData.lastName || ''}`.trim()
    : bookingData.consultantName || 'Any available';

  // Handle time slot - support both old and new format
  let dateTimeDisplay = 'Not selected';
  if (bookingData.selectedTimeSlot) {
    const slot = bookingData.selectedTimeSlot;
    if (slot.startTimeRaw && slot.endTimeRaw) {
      // New format with raw timestamps
      dateTimeDisplay = `${formatDate(slot.startTimeRaw)} from ${formatTime(slot.startTimeRaw)} - ${formatTime(slot.endTimeRaw)}`;
    } else if (slot.displayTime) {
      // Format with displayTime
      const date = bookingData.selectedDate || bookingData.selectedFullDate;
      dateTimeDisplay = date ? `${formatDate(date)} at ${slot.displayTime}` : slot.displayTime;
    } else if (slot.startTime && slot.endTime) {
      // Old format
      dateTimeDisplay = `${formatDate(slot.startTime)} from ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
    }
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} flex flex-col bg-gray-50`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Booking Confirmed</h1>
        <button 
          onClick={onGoHome} 
          className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className={`flex-1 overflow-y-auto px-4 py-5 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
        {/* Session Details */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Session details</h2>
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] px-4">
            <SessionDetailItem
              label="Session type"
              value={sessionType}
            />
            <SessionDetailItem
              label="Location"
              value={location}
            />
            <SessionDetailItem
              label="Service"
              value={service}
            />
            <SessionDetailItem
              label="Consultant"
              value={consultant}
            />
            <SessionDetailItem
              label="Date & time"
              value={dateTimeDisplay}
            />
          </div>
        </div>

        {/* Things to Bring */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Things to bring</h2>
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b border-dashed border-[rgba(28,26,75,0.1)]">
                <div className="text-lg">👕</div>
                <div className="text-sm text-[#1C1A4B]">Workout clothes</div>
              </div>
              <div className="flex items-center space-x-3 pb-4 border-b border-dashed border-[rgba(28,26,75,0.1)]">
                <div className="text-lg">💧</div>
                <div className="text-sm text-[#1C1A4B]">Water bottle</div>
              </div>
              <div className="flex items-center space-x-3 pb-4 border-b border-dashed border-[rgba(28,26,75,0.1)]">
                <div className="text-lg">🧘</div>
                <div className="text-sm text-[#1C1A4B]">Towel</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-lg">🧘‍♀️</div>
                <div className="text-sm text-[#1C1A4B]">Yoga Mat</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-[#D3D3D3] p-4`}>
        <PrimaryButton onClick={onGoHome}>
          Go to Homepage
        </PrimaryButton>
      </div>
    </div>
  );
}
