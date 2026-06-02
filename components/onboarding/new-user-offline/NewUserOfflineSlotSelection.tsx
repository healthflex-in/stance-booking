'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Clock } from 'lucide-react';
import { GET_CONSULTANTS, GET_USER } from '@/gql/queries';
import { useCenterAvailability } from '@/hooks';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { BookingAnalytics } from '@/services/booking-analytics';
import { isParamFromUrl } from '@/utils/booking-params';

interface NewUserOfflineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  patientId: string;
  designation?: string;
  preSelectedDate?: string;
  preSelectedSlot?: { startTime: string; endTime: string; displayTime: string };
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
  analytics?: BookingAnalytics;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailable: boolean;
  consultantIds: string[];
  consultantNames: string[];
  centerName?: string;
  startTimeRaw: string;
  endTimeRaw: string;
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

export default function NewUserOfflineSlotSelection({
  centerId,
  serviceDuration,
  patientId,
  designation,
  preSelectedDate,
  preSelectedSlot,
  onSlotSelect,
  onBack = () => {},
  analytics,
}: NewUserOfflineSlotSelectionProps) {
  console.log('🚀 NewUserOfflineSlotSelection RENDERED - centerId:', centerId);
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: TimeSlot[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDateFromParams, setIsDateFromParams] = useState(false);
  const [isSlotFromParams, setIsSlotFromParams] = useState(false);

  const [isFetchingPatient, setIsFetchingPatient] = useState(false);

  const { data: consultantsData, loading: consultantsLoading } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: 'CONSULTANT',
      centerId: [centerId],
    },
    fetchPolicy: 'network-only',
  });

  const { refetch: refetchPatient } = useQuery(GET_USER, {
    variables: { userId: patientId },
    skip: true,
  });

  const allConsultants = React.useMemo(() => {
    if (!consultantsData?.users?.data) return [];
    return consultantsData.users.data;
  }, [consultantsData]);

  const startOfDay = React.useMemo(() => {
    if (!currentSelectedDate) return new Date();
    const start = new Date(currentSelectedDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [currentSelectedDate]);

  const endOfDay = React.useMemo(() => {
    if (!currentSelectedDate) return new Date();
    const end = new Date(currentSelectedDate);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentSelectedDate]);

  const designationMap: Record<string, string> = {
    'S&C Coach': 'SNC_Coach',
    'Orthopaedic Doctor': 'Orthopaedic_Doctor',
    'Sports Massage Therapist': 'Sports_Massage_Therapist',
    'Physiotherapist': 'Physiotherapist',
  };
  const backendDesignation = designation ? (designationMap[designation] || designation) : undefined;

  const { consultants: availabilityConsultants, loading: slotsLoading } = useCenterAvailability({
    centerId,
    startDate: startOfDay,
    endDate: endOfDay,
    serviceDuration,
    designation: backendDesignation,
    deliveryMode: 'OFFLINE',
    enabled: !!currentSelectedDate,
  });

  console.log('🔍 API Call Parameters:', {
    centerId,
    startDate: startOfDay.toISOString(),
    endDate: endOfDay.toISOString(),
    serviceDuration,
    designation: 'Physiotherapist',
    deliveryMode: 'OFFLINE'
  });

  const availableSlots = React.useMemo(() => {
    console.log('📊 Backend returned consultants:', availabilityConsultants.length);
    availabilityConsultants.forEach(c => {
      console.log(`  - ${c.consultantName}: ${c.availableSlots.length} slots`);
      c.availableSlots.forEach((s, i) => {
        const start = new Date(s.startTime * 1000);
        const end = new Date(s.endTime * 1000);
        console.log(`    ${i+1}. ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
      });
    });
    
    const slots = availabilityConsultants.flatMap(consultant => 
      consultant.availableSlots.map(slot => ({
        startTime: new Date(slot.startTime * 1000),
        endTime: new Date(slot.endTime * 1000),
        consultantId: consultant.consultantId,
        centerName: slot.centerName,
      }))
    );
    console.log('✅ Total slots after flatMap:', slots.length);
    return slots;
  }, [availabilityConsultants]);

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

  useEffect(() => {
    const initialDates = generateNext14Days();
    setAvailableDates(initialDates);
    
    // Check if slot is from URL params
    const slotFromUrl = isParamFromUrl('slotStart') && isParamFromUrl('slotEnd');
    setIsSlotFromParams(slotFromUrl);
    
    // Priority 1: If preSelectedSlot is provided (user navigated back from payment), use its date
    if (preSelectedSlot && preSelectedSlot.startTime) {
      const slotDate = new Date(preSelectedSlot.startTime);
      const matchingDate = initialDates.find(d => d.fullDate.toDateString() === slotDate.toDateString());
      if (matchingDate) {
        const dateKey = `${matchingDate.day}, ${matchingDate.date} ${matchingDate.month}`;
        setSelectedDate(dateKey);
        setCurrentSelectedDate(matchingDate.fullDate);
        // Only lock date if it came from URL params (either slotDate or slotStart/slotEnd)
        setIsDateFromParams(isParamFromUrl('slotDate') || slotFromUrl);
        return;
      }
    }
    
    // Priority 2: If preSelectedDate is provided from URL params
    if (preSelectedDate) {
      const preSelected = new Date(preSelectedDate);
      const matchingDate = initialDates.find(d => d.fullDate.toDateString() === preSelected.toDateString());
      if (matchingDate) {
        const dateKey = `${matchingDate.day}, ${matchingDate.date} ${matchingDate.month}`;
        setSelectedDate(dateKey);
        setCurrentSelectedDate(matchingDate.fullDate);
        // Only lock date if it came from URL params (either slotDate or slotStart/slotEnd)
        setIsDateFromParams(isParamFromUrl('slotDate') || slotFromUrl);
        return;
      }
    }
    
    // Priority 3: Default to first date
    if (!selectedDate && initialDates.length > 0) {
      const firstDate = initialDates[0];
      const dateKey = `${firstDate.day}, ${firstDate.date} ${firstDate.month}`;
      setSelectedDate(dateKey);
      setCurrentSelectedDate(firstDate.fullDate);
    }
  }, [preSelectedDate, preSelectedSlot]);

  useEffect(() => {
    if (!currentSelectedDate || slotsLoading) return;
    
    const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
    console.log('\n🔄 Processing slots for:', dateKey);
    console.log('📥 Available slots to process:', availableSlots.length);
    
    const slotMap = new Map();
    availableSlots.forEach(slot => {
      if (!slot.consultantId) return;
      
      const startDate = new Date(slot.startTime);
      const timeKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}-${startDate.getHours()}-${startDate.getMinutes()}`;
      const consultant = availabilityConsultants.find((ac: any) => ac.consultantId === slot.consultantId);
      const consultantName = consultant ? consultant.consultantName : '';
      
      if (!slotMap.has(timeKey)) {
        slotMap.set(timeKey, {
          startTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endTime: new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          displayTime: `${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
          isAvailable: true,
          consultantIds: [slot.consultantId],
          consultantNames: consultantName ? [consultantName] : [],
          centerName: slot.centerName,
          startTimeRaw: new Date(slot.startTime).toISOString(),
          endTimeRaw: new Date(slot.endTime).toISOString(),
        });
      } else {
        const existing = slotMap.get(timeKey);
        if (!existing.consultantIds.includes(slot.consultantId)) {
          existing.consultantIds.push(slot.consultantId);
          if (consultantName) existing.consultantNames.push(consultantName);
        }
      }
    });
    
    const processedSlots = Array.from(slotMap.values()).sort((a, b) => 
      new Date(a.startTimeRaw).getTime() - new Date(b.startTimeRaw).getTime()
    );
    
    console.log('✅ Processed into', processedSlots.length, 'unique time slots');
    console.log('📋 Displaying slots:');
    processedSlots.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.displayTime} - ${s.consultantNames.join(', ')}`);
    });
    
    setDateSlots(prev => ({ ...prev, [dateKey]: processedSlots }));
    
    setAvailableDates(prev =>
      prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedSlots.length };
        }
        return date;
      })
    );
    
    // Auto-select the pre-selected slot if provided and from URL params
    if (preSelectedSlot && isSlotFromParams && !selectedTimeSlot) {
      const matchingSlot = processedSlots.find(slot => {
        const slotStart = new Date(slot.startTimeRaw);
        const preSelectedStart = new Date(preSelectedSlot.startTime);
        return slotStart.getTime() === preSelectedStart.getTime();
      });
      if (matchingSlot) {
        setSelectedTimeSlot(matchingSlot);
      }
    }
  }, [currentSelectedDate, availableSlots, slotsLoading, availabilityConsultants, preSelectedSlot, isSlotFromParams]);

  const handleDateSelect = (date: DateOption) => {
    if (isDateFromParams) return;
    const dateKey = `${date.day}, ${date.date} ${date.month}`;
    analytics?.trackDateSelected(dateKey);
    setSelectedDate(dateKey);
    setCurrentSelectedDate(date.fullDate);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable || isSlotFromParams) return;
    analytics?.trackTimeSlotClicked(slot.displayTime, slot.consultantIds.length);
    setSelectedTimeSlot(slot);
  };

  const handleContinue = async () => {
    if (selectedTimeSlot) {
      const randomIndex = Math.floor(Math.random() * selectedTimeSlot.consultantIds.length);
      const randomConsultantId = selectedTimeSlot.consultantIds[randomIndex];
      analytics?.trackSlotSelectionContinueClicked(randomConsultantId, selectedTimeSlot.displayTime, centerId);
      setIsFetchingPatient(true);
      try {
        await refetchPatient();
        onSlotSelect(randomConsultantId, selectedTimeSlot);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        onSlotSelect(randomConsultantId, selectedTimeSlot);
      } finally {
        setIsFetchingPatient(false);
      }
    }
  };

  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];
  const canProceed = !!selectedTimeSlot;

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit details</h3>
            {isDateFromParams && (
              <p className="text-sm text-gray-600 mb-3">Pre-selected date</p>
            )}

            <div className="mb-4">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', opacity: isDateFromParams ? 0.7 : 1 }}
              >
                {availableDates.map((dateOption) => {
                  const dateKey = `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
                  const isCurrentDate = selectedDate === dateKey;
                  const isDisabled = Boolean((slotsLoading && !isCurrentDate) || isDateFromParams);
                  
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
                            : dateOption.isToday
                            ? 'text-blue-500'
                            : typeof dateOption.slots === 'number' && dateOption.slots > 0
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

            {selectedDate && (
              <div className="mb-6">
                <h4 className="text-base font-medium text-gray-900 mb-3">Available time slots</h4>
                {isSlotFromParams && (
                  <p className="text-sm text-gray-600 mb-3">Pre-selected time slot</p>
                )}
                
                {slotsLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <StanceHealthLoader message="Loading slots..." />
                  </div>
                ) : currentTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3" style={{ opacity: isSlotFromParams ? 0.7 : 1 }}>
                    {currentTimeSlots.map((slot: TimeSlot, index: number) => {
                      const isSelected = selectedTimeSlot && (
                        selectedTimeSlot.startTimeRaw === slot.startTimeRaw &&
                        selectedTimeSlot.endTimeRaw === slot.endTimeRaw
                      );
                      
                      return (
                        <button
                          key={`slot-${index}-${slot.startTimeRaw}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.isAvailable || isSlotFromParams}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : slot.isAvailable && !isSlotFromParams
                              ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                              : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                          style={{ cursor: isSlotFromParams ? 'not-allowed' : undefined }}
                        >
                          <div className="text-sm font-semibold">{slot.displayTime}</div>
                          {slot.consultantNames && slot.consultantNames.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {slot.consultantNames.length === 1
                                ? slot.consultantNames[0]
                                : `${slot.consultantNames.length} consultants`}
                            </div>
                          )}
                        </button>
                      );
                    })}
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

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <button
          onClick={handleContinue}
          disabled={!canProceed || isFetchingPatient}
          className={`w-full py-4 rounded-2xl font-semibold text-black transition-all flex items-center justify-center ${
            canProceed && !isFetchingPatient ? '' : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{ backgroundColor: canProceed && !isFetchingPatient ? '#DDFE71' : '#D1D5DB' }}
        >
          {isFetchingPatient ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Loading...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
}
