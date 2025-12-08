'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapPin, Calendar, Clock, ChevronRight, Loader } from 'lucide-react';
import { useQuery, useApolloClient } from '@apollo/client';
import { GET_CENTERS, GET_CONSULTANTS } from '@/gql/queries';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import { WhatsAppButton, MobileLoadingScreen } from '../shared';

interface MobileSessionDetailsProps {
  bookingData: {
    centerId: string;
    consultantId: string;
    treatmentId: string;
    treatmentPrice: number;
    sessionType: 'in-person' | 'online' | null;
    patientId: string;
    selectedDate?: string;
    selectedTimeSlot?: any;
    isReturningUser?: boolean;
    service?: {
      name: string;
      duration: number;
    };
  };
  onUpdateData: (updates: any) => void;
  onNext: () => void;
}

interface TimeSlot {
  startTime: number;
  endTime: number;
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
  isToday: boolean;
}

interface DateSlots {
  [dateKey: string]: TimeSlot[];
}

export default function MobileSessionDetails({
  bookingData,
  onUpdateData,
  onNext,
}: MobileSessionDetailsProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    bookingData.selectedDate || ''
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [dateSlots, setDateSlots] = useState<DateSlots>({});
  const [loadingDateKey, setLoadingDateKey] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isInDesktopContainer } = useContainerDetection();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [trackedInteractions, setTrackedInteractions] = useState({
    dateSelected: false,
    timeSlotClicked: false
  });
  
  // Track component mount and slot search start
  useEffect(() => {
    mobileAnalytics.trackSessionDetailsStart(bookingData.centerId, bookingData.patientId);
    mobileAnalytics.trackSlotSearchStart(bookingData.centerId, bookingData.patientId);
  }, [bookingData.centerId, bookingData.patientId, mobileAnalytics]);
  
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Track the last requested date to prevent race conditions
  const lastRequestedDateRef = useRef<string | null>(null);

  // Apollo client for manual queries
  const client = useApolloClient();
  
  // Fetch centers data
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS);

  // Use the availability slots hook without consultantId for first-time users
  const {
    availableSlots: rawAvailableSlots,
    loading: slotsLoading,
    error: slotsError
  } = useAvailableSlots({
    centerId: bookingData.centerId,
    date: currentSelectedDate || new Date(),
    serviceDurationInMinutes: bookingData.service?.duration || 75,
    consultantId: null,
    isReturningUser:  bookingData.isReturningUser || false
  });

  // Find current center
  const currentCenter = centersData?.centers.find(
    (center: any) => center._id === bookingData.centerId
  );

  // Convert raw slots to display format and filter past slots
  const processedTimeSlots = useMemo(() => {
    const now = new Date();
    const next15Minutes = new Date(now.getTime() + 15 * 60 * 1000); // Current time + 15 minutes
    
    const filteredSlots = rawAvailableSlots
      .filter(slot => {
        // Filter out past slots for today
        if (currentSelectedDate && currentSelectedDate.toDateString() === now.toDateString()) {
          // Check if slot is within next 15 minutes
          if (slot.startTime <= next15Minutes.getTime()) {
            console.log(`🚫 Slot removed: ${new Date(slot.startTime).toLocaleTimeString()} - ${new Date(slot.endTime).toLocaleTimeString()} (lies between current time and next 15 minutes)`);
            return false;
          }
          return slot.startTime > now.getTime();
        }
        return true;
      });

    // Group slots by time to avoid duplicates
    const uniqueSlots = new Map();
    filteredSlots.forEach(slot => {
      const timeKey = `${slot.startTime}-${slot.endTime}`;
      if (!uniqueSlots.has(timeKey)) {
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        };
        
        uniqueSlots.set(timeKey, {
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayTime: `${formatTime(startTime)} - ${formatTime(endTime)}`,
          isAvailable: true,
          consultantId: slot.consultantId,
          availableConsultants: [slot.consultantId]
        });
      } else {
        // Add consultant to existing slot
        const existingSlot = uniqueSlots.get(timeKey);
        if (!existingSlot.availableConsultants.includes(slot.consultantId)) {
          existingSlot.availableConsultants.push(slot.consultantId);
        }
      }
    });

    return Array.from(uniqueSlots.values()).sort((a, b) => a.startTime - b.startTime);
  }, [rawAvailableSlots, currentSelectedDate]);

  // Generate dates for next 2 weeks (14 days)
  const generateNext14Days = (): DateOption[] => {
    const dates: DateOption[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    // Generate 14 days starting from today
    for (let i = 0; i < 14; i++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + i);
      dateObj.setHours(0, 0, 0, 0);

      const dayOfWeek = dateObj.getDay();
      const dateKey = `${days[dayOfWeek]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
      
      // Get slot count from dateSlots if available
      const slotsForDate = dateSlots[dateKey];
      let slotCount;
      
      if (loadingDateKey === dateKey || (dateObj.toDateString() === currentSelectedDate?.toDateString() && slotsLoading)) {
        // Currently loading slots for this date
        slotCount = 'Loading...';
      } else if (slotsForDate !== undefined) {
        // Slots have been loaded for this date
        slotCount = slotsForDate.length;
      } else {
        // Haven't loaded slots for this date yet
        slotCount = 'Click to see slots';
      }

      dates.push({
        id: i,
        day: days[dayOfWeek],
        date: dateObj.getDate().toString(),
        month: months[dateObj.getMonth()],
        slots: slotCount,
        fullDate: new Date(dateObj),
        isToday: dateObj.toDateString() === new Date().toDateString(),
      });
    }

    return dates;
  };

  // Handle loading state changes
  useEffect(() => {
    if (currentSelectedDate && slotsLoading) {
      // Regenerate dates with loading state
      const updatedDates = generateNext14Days();
      setAvailableDates(updatedDates.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: 'Loading...' };
        }
        return date;
      }));
    }
  }, [currentSelectedDate, slotsLoading]);

  // Update date slots when processed time slots change
  useEffect(() => {
    if (currentSelectedDate && !slotsLoading) {
      const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
      
      // Store the slots data
      setDateSlots(prev => ({
        ...prev,
        [dateKey]: processedTimeSlots
      }));
      
      // Update the slot count for the current date
      setAvailableDates(prev => prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedTimeSlots.length };
        }
        return date;
      }));
      
      // Clear loading state
      setLoadingDateKey(null);
    }
  }, [currentSelectedDate, processedTimeSlots, slotsLoading]);

  // Load initial dates (next 14 days)
  useEffect(() => {
    const initialDates = generateNext14Days();
    setAvailableDates(initialDates);
    
    // Set first date as selected if no date is selected
    if (!selectedDate && initialDates.length > 0) {
      const firstDate = initialDates[0];
      const dateKey = `${firstDate.day}, ${firstDate.date} ${firstDate.month}`;
      setSelectedDate(dateKey);
      setCurrentSelectedDate(firstDate.fullDate);
      setLoadingDateKey(dateKey); // Set initial loading state
    }
  }, []);



  const handleDateSelect = (date: DateOption) => {
    const dateKey = `${date.day}, ${date.date} ${date.month}`;
    
    // Track date picker interaction
    mobileAnalytics.trackDatePickerInteraction('date_select', dateKey, bookingData.centerId, bookingData.patientId);
    
    // If clicking on the same date that's already selected, do nothing
    if (selectedDate === dateKey) {
      return;
    }
    
    // Prevent date switching if slots are currently loading
    if (slotsLoading || loadingDateKey) {
      return;
    }
    
    // Track this as the last requested date to prevent race conditions
    lastRequestedDateRef.current = dateKey;
    
    setSelectedDate(dateKey);
    setCurrentSelectedDate(date.fullDate);
    setSelectedTimeSlot(null);
    setLoadingDateKey(dateKey);
    
    // Clear any existing slots for this date to prevent showing stale data
    setDateSlots(prev => {
      const newSlots = { ...prev };
      delete newSlots[dateKey];
      return newSlots;
    });
    
    // Regenerate dates with updated loading state
    const updatedDates = generateNext14Days();
    setAvailableDates(updatedDates.map(d => {
      if (d.fullDate.toDateString() === date.fullDate.toDateString()) {
        return { ...d, slots: 'Loading...' };
      }
      return d;
    }));
    
    onUpdateData({
      selectedDate: dateKey,
      selectedFullDate: date.fullDate,
      selectedTimeSlot: null,
    });
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    // Track time slot selection
    mobileAnalytics.trackTimeSlotSelected(
      slot.displayTime, 
      selectedDate || '', 
      bookingData.centerId, 
      bookingData.patientId,
      slot.consultantId
    );
    
    // Track appointment scheduling completion (custom event)
    mobileAnalytics.trackAppointmentSchedulingComplete({
      appointmentId: `temp_${Date.now()}`,
      patientId: bookingData.patientId,
      centerId: bookingData.centerId,
      selectedDate: selectedDate || '',
      selectedTime: slot.displayTime
    });
    
    // Get random consultant from available slots for this time
    const randomConsultantId = getRandomConsultantFromSlots(slot);
    
    setSelectedTimeSlot(slot);
    onUpdateData({
      selectedTimeSlot: slot,
      consultantId: randomConsultantId,
    });
  };

  // Function to get random consultant from available consultants for the slot
  const getRandomConsultantFromSlots = (selectedSlot: TimeSlot): string => {
    const availableConsultants = selectedSlot.availableConsultants || [selectedSlot.consultantId];
    
    if (availableConsultants.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableConsultants.length);
      return availableConsultants[randomIndex];
    }
    
    return selectedSlot.consultantId;
  };

  const canProceed = selectedDate && selectedTimeSlot;
  const isLoading = centersLoading || slotsLoading;
  
  // Get current time slots for selected date
  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
        {/* Location Section */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Location</h3>
                  <p className="text-sm font-bold text-gray-900">
                    {currentCenter?.name || 'Loading...'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentCenter?.address ? 
                      `${currentCenter.address.street}, ${currentCenter.address.city}, ${currentCenter.address.state}` : 
                      'Address not available'
                    }
                  </p>
                </div>
              </div>
              {currentCenter?.location && (
                <a
                  href={currentCenter.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Session Type Display */}
        {bookingData.sessionType && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {bookingData.sessionType === 'online' ? '💻' : '🏥'}
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">
                    {bookingData.sessionType === 'online'
                      ? 'Online Session'
                      : 'In-Person Session'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {bookingData.sessionType === 'online'
                      ? 'Video consultation from your home'
                      : 'Visit our center for treatment'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                const isDisabled = Boolean((slotsLoading || loadingDateKey) && !isCurrentDate);
                
                return (
                <button
                  key={`date-${dateOption.fullDate.getTime()}`}
                  onClick={() => {
                    if (!trackedInteractions.dateSelected) {
                      mobileAnalytics.trackDateSelected(`${dateOption.day}, ${dateOption.date} ${dateOption.month}`, bookingData.centerId, bookingData.patientId);
                      setTrackedInteractions(prev => ({ ...prev, dateSelected: true }));
                    }
                    handleDateSelect(dateOption);
                  }}
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
                      selectedDate === `${dateOption.day}, ${dateOption.date} ${dateOption.month}`
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
                        : dateOption.isToday
                        ? 'text-blue-500'
                        : typeof dateOption.slots === 'number' && dateOption.slots > 0
                        ? 'text-blue-600'
                        : dateOption.slots === 'Click to see slots'
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
                <div className="py-8">
                  <MobileLoadingScreen 
                    message="Loading Available Slots..." 
                    animationData="/lottie3.json" 
                  />
                </div>
              ) : slotsError ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-red-600">Error loading slots: {slotsError}</span>
                </div>
              ) : currentTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {currentTimeSlots.map((slot, index) => (
                    <button
                      key={`slot-${index}-${slot.startTime}`}
                      onClick={() => {
                        if (!trackedInteractions.timeSlotClicked) {
                          mobileAnalytics.trackTimeSlotClicked(slot.displayTime, bookingData.centerId, bookingData.patientId);
                          setTrackedInteractions(prev => ({ ...prev, timeSlotClicked: true }));
                        }
                        handleTimeSlotSelect(slot);
                      }}
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
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Clock className="w-12 h-12 text-red-300 mb-3" />
                  <span className="text-red-500 font-medium">No available time slots for this date</span>
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
          onClick={() => {
            mobileAnalytics.trackContinueButtonClicked('session_details', bookingData.centerId, bookingData.patientId);
            onNext();
          }}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-semibold text-black transition-all ${
            canProceed ? '' : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{ backgroundColor: canProceed ? '#DDFE71' : '#D1D5DB' }}
        >
          Continue
        </button>
      </div>
      
      <WhatsAppButton context="session_details" />
    </div>
  );
}