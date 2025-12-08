'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GET_FILTERED_CONSULTANTS } from '@/gql/queries';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useContainerDetection } from '@/hooks/useContainerDetection';

interface PrepaidSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  consultantId?: string;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailable: boolean;
  consultantId: string;
  availableConsultants: string[];
}

interface DateOption {
  id: number;
  day: string;
  date: string;
  month: string;
  slots: number | string;
  fullDate: Date;
  isToday?: boolean;
}

export default function PrepaidSlotSelection({
  centerId,
  serviceDuration,
  consultantId,
  onSlotSelect,
  onBack,
}: PrepaidSlotSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: TimeSlot[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch filtered consultants directly from backend
  const { data: consultantsData, loading: consultantsLoading } = useQuery(
    GET_FILTERED_CONSULTANTS,
    {
      variables: {
        filter: {
          allowOnlineBooking: true,
          allowOnlineDelivery: ['ONLINE', 'BOTH'],
          centers: [centerId],
        },
      },
      fetchPolicy: 'network-only',
    }
  );

  const onlineConsultants = consultantsData?.getFilteredConsultants || [];

  // Use available slots hook - pass consultant IDs to skip fetching all consultants
  const { availableSlots, loading: slotsLoading, refetch } = useAvailableSlots({
    centerId,
    date: currentSelectedDate || new Date(),
    serviceDurationInMinutes: serviceDuration,
    consultantId: consultantId || null,
    isReturningUser: !!consultantId,
    consultantIds: consultantId ? [consultantId] : onlineConsultants.map((c: any) => c._id),
    preFilteredConsultants: consultantId ? onlineConsultants.filter((c: any) => c._id === consultantId) : onlineConsultants
  });

  // Clear cache when service duration changes
  useEffect(() => {
    if (refetch) {
      refetch();
    }
  }, [serviceDuration]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 PrepaidSlotSelection Debug:');
      console.log('Service Duration:', serviceDuration, 'minutes');
      console.log('Available Slots:', availableSlots.length);
      if (availableSlots.length > 0) {
        const firstSlot = availableSlots[0];
        const duration = (firstSlot.endTime - firstSlot.startTime) / (1000 * 60);
        console.log('First Slot Duration:', duration, 'minutes');
        console.log('First Slot:', new Date(firstSlot.startTime).toLocaleTimeString(), '-', new Date(firstSlot.endTime).toLocaleTimeString());
      }
    }
  }, [availableSlots, serviceDuration]);

  // Filter slots to only include online consultants
  const consultantIds = onlineConsultants.map((c: any) => c._id);
  const filteredSlots = availableSlots.filter(slot => 
    consultantIds.includes(slot.consultantId)
  );

  // Generate next 14 days
  const generateNext14Days = (): DateOption[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dates: DateOption[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + i);
      const dayOfWeek = dateObj.getDay();

      dates.push({
        id: i,
        day: days[dayOfWeek],
        date: dateObj.getDate().toString(),
        month: months[dateObj.getMonth()],
        slots: 'Click to see slots',
        fullDate: new Date(dateObj),
        isToday: dateObj.toDateString() === new Date().toDateString(),
      });
    }

    return dates;
  };

  // Load initial dates
  useEffect(() => {
    const initialDates = generateNext14Days();
    setAvailableDates(initialDates);
    
    if (!selectedDate && initialDates.length > 0) {
      const firstDate = initialDates[0];
      const dateKey = `${firstDate.day}, ${firstDate.date} ${firstDate.month}`;
      setSelectedDate(dateKey);
      setCurrentSelectedDate(firstDate.fullDate);
    }
  }, []);

  // Update date slots when available slots change
  useEffect(() => {
    if (!currentSelectedDate || slotsLoading) return;
    
    const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
    
    const processedSlots = filteredSlots.map(slot => ({
      startTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      endTime: new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      displayTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isAvailable: true,
      consultantId: slot.consultantId,
      availableConsultants: [slot.consultantId],
      startTimeRaw: slot.startTime,
      endTimeRaw: slot.endTime
    }));
    
    setDateSlots(prev => {
      if (JSON.stringify(prev[dateKey]) === JSON.stringify(processedSlots)) return prev;
      return { ...prev, [dateKey]: processedSlots };
    });
    
    setAvailableDates(prev => {
      const updated = prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedSlots.length };
        }
        return date;
      });
      if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
      return updated;
    });
  }, [currentSelectedDate?.getTime(), slotsLoading, filteredSlots.length]);

  const handleDateSelect = (date: DateOption) => {
    const dateKey = `${date.day}, ${date.date} ${date.month}`;
    
    if (selectedDate === dateKey) return;
    if (slotsLoading) return;
    
    setSelectedDate(dateKey);
    setCurrentSelectedDate(date.fullDate);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: any) => {
    if (!slot.isAvailable) return;
    setSelectedTimeSlot(slot);
  };

  const getConsultantName = (consultantId: string) => {
    const consultant = onlineConsultants.find((c: any) => c._id === consultantId);
    return consultant ? `${consultant.profileData?.firstName} ${consultant.profileData?.lastName}` : '';
  };

  const handleContinue = () => {
    if (selectedTimeSlot) {
      const randomConsultantId = selectedTimeSlot.availableConsultants?.[0] || selectedTimeSlot.consultantId;
      onSlotSelect(randomConsultantId, selectedTimeSlot);
    }
  };

  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];
  const { isInDesktopContainer } = useContainerDetection();

  if (consultantsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Visit Details Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Visit details
            </h3>

            {/* Date Selection */}
            <div className="mb-4">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {availableDates.map((dateOption) => {
                  const isCurrentDate = selectedDate === `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
                  const isDisabled = Boolean(slotsLoading && !isCurrentDate);
                  
                  return (
                    <button
                      key={`date-${dateOption.fullDate.getTime()}`}
                      onClick={() => handleDateSelect(dateOption)}
                      disabled={isDisabled}
                      className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all text-center min-w-[120px] ${
                        isCurrentDate
                          ? 'border-blue-500 bg-blue-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isCurrentDate
                            ? 'text-blue-700'
                            : dateOption.isToday
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {dateOption.day}, {dateOption.date} {dateOption.month}
                      </div>
                      <div
                        className={`text-xs ${
                          typeof dateOption.slots === 'number' && dateOption.slots === 0
                            ? 'text-red-500'
                            : dateOption.slots === 'Loading...'
                            ? 'text-blue-600'
                            : isCurrentDate
                            ? 'text-blue-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {typeof dateOption.slots === 'number'
                          ? dateOption.slots === 0 
                            ? '0 slots'
                            : `${dateOption.slots} slots`
                          : dateOption.slots}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Selection */}
            {selectedDate && (
              <div className="mb-6 pb-20">
                <h4 className="text-base font-medium text-gray-900 mb-3">
                  Available time slots
                </h4>
                
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : currentTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTimeSlots.map((slot, index) => (
                      <button
                        key={`slot-${index}-${slot.startTime}`}
                        onClick={() => handleTimeSlotSelect(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedTimeSlot &&
                          selectedTimeSlot.startTime === slot.startTime &&
                          selectedTimeSlot.endTime === slot.endTime
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : slot.isAvailable
                            ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <div>{slot.displayTime}</div>
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {getConsultantName(slot.consultantId)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No slots available for this date
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <button
          onClick={handleContinue}
          disabled={!selectedTimeSlot}
          className="w-full py-4 text-black font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
          style={{
            backgroundColor: selectedTimeSlot ? '#DDFE71' : '#9CA3AF',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
