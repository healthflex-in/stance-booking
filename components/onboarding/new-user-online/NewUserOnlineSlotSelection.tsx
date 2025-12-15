'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useAvailability } from '@/hooks';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface NewUserOnlineSlotSelectionProps {
  serviceDuration: number;
  onSlotSelect: (consultantId: string, centerId: string, slot: any) => void;
  onBack?: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailable: boolean;
  consultantId: string;
  consultantName?: string;
  centerId: string;
  centerName: string;
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

export default function NewUserOnlineSlotSelection({
  serviceDuration,
  onSlotSelect,
  onBack = () => {},
}: NewUserOnlineSlotSelectionProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: TimeSlot[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || '67fe35f25e42152fb5185a5e';
  
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

  const { consultants, loading: consultantsLoading } = useAvailability({
    organizationId,
    startDate: startOfDay,
    endDate: endOfDay,
    serviceDuration,
    designation: 'Physiotherapist',
    enabled: !!currentSelectedDate,
  });

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
    
    if (!selectedDate && initialDates.length > 0) {
      const firstDate = initialDates[0];
      const dateKey = `${firstDate.day}, ${firstDate.date} ${firstDate.month}`;
      setSelectedDate(dateKey);
      setCurrentSelectedDate(firstDate.fullDate);
    }
  }, []);

  useEffect(() => {
    if (!currentSelectedDate || consultantsLoading) return;
    
    const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
    
    const processedSlots: TimeSlot[] = [];
    
    consultants.forEach(consultant => {
      consultant.availableSlots.forEach(slot => {
        const slotStart = new Date(slot.startTime * 1000);
        const slotEnd = new Date(slot.endTime * 1000);
        
        processedSlots.push({
          startTime: slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endTime: slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          displayTime: `${slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
          isAvailable: true,
          consultantId: consultant.consultantId,
          consultantName: consultant.consultantName,
          centerId: slot.centerId,
          centerName: slot.centerName,
          startTimeRaw: slotStart.toISOString(),
          endTimeRaw: slotEnd.toISOString(),
        });
      });
    });
    
    processedSlots.sort((a, b) => new Date(a.startTimeRaw).getTime() - new Date(b.startTimeRaw).getTime());
    
    setDateSlots(prev => ({ ...prev, [dateKey]: processedSlots }));
    
    setAvailableDates(prev =>
      prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedSlots.length };
        }
        return date;
      })
    );
  }, [currentSelectedDate, consultants, consultantsLoading]);

  const handleDateSelect = (date: DateOption) => {
    const dateKey = `${date.day}, ${date.date} ${date.month}`;
    setSelectedDate(dateKey);
    setCurrentSelectedDate(date.fullDate);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    setSelectedTimeSlot(slot);
  };

  const handleContinue = () => {
    if (selectedTimeSlot) {
      onSlotSelect(selectedTimeSlot.consultantId, selectedTimeSlot.centerId, selectedTimeSlot);
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

            <div className="mb-4">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {availableDates.map((dateOption) => {
                  const dateKey = `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
                  const isCurrentDate = selectedDate === dateKey;
                  const isDisabled = Boolean(consultantsLoading && !isCurrentDate);
                  
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
                
                {consultantsLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <StanceHealthLoader message="Loading slots..." />
                  </div>
                ) : currentTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTimeSlots.map((slot: TimeSlot, index: number) => {
                      const isSelected = selectedTimeSlot && (
                        selectedTimeSlot.startTimeRaw === slot.startTimeRaw &&
                        selectedTimeSlot.endTimeRaw === slot.endTimeRaw
                      );
                      
                      return (
                        <button
                          key={`slot-${index}-${slot.startTimeRaw}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.isAvailable}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : slot.isAvailable
                              ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                              : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-sm font-semibold">{slot.displayTime}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {slot.consultantName} • {slot.centerName}
                          </div>
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
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-semibold text-black transition-all ${
            canProceed ? '' : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{ backgroundColor: canProceed ? '#DDFE71' : '#D1D5DB' }}
        >
          Continue
        </button>
      </div>

    </div>
  );
}
