'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Clock } from 'lucide-react';
import { GET_CONSULTANTS, GET_USER } from '@/gql/queries';
import { useCenterAvailability } from '@/hooks';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface NewUserOfflineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  patientId: string;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailable: boolean;
  consultantId: string;
  consultantName?: string;
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
  onSlotSelect,
  onBack = () => {},
}: NewUserOfflineSlotSelectionProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: TimeSlot[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const { consultants: availabilityConsultants, loading: slotsLoading } = useCenterAvailability({
    centerId,
    startDate: startOfDay,
    endDate: endOfDay,
    serviceDuration,
    designation: 'Physiotherapist',
    enabled: !!currentSelectedDate,
  });

  const consultants = React.useMemo(() => {
    if (!consultantsData?.users?.data) return [];
    return consultantsData.users.data.filter((consultant: any) => {
      if (consultant.profileData?.allowOnlineBooking !== true) return false;
      if (consultant.profileData?.designation !== 'Physiotherapist') return false;
      const allowOnlineDelivery = consultant.profileData?.allowOnlineDelivery;
      if (allowOnlineDelivery !== 'OFFLINE') return false;
      
      const hasAvailableSlots = availabilityConsultants.some((ac: any) => ac.consultantId === consultant._id);
      return hasAvailableSlots;
    });
  }, [consultantsData, availabilityConsultants]);

  const availableSlots = React.useMemo(() => {
    return availabilityConsultants.flatMap(consultant => 
      consultant.availableSlots.map(slot => ({
        startTime: new Date(slot.startTime * 1000),
        endTime: new Date(slot.endTime * 1000),
        consultantId: consultant.consultantId,
      }))
    );
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
    
    if (!selectedDate && initialDates.length > 0) {
      const firstDate = initialDates[0];
      const dateKey = `${firstDate.day}, ${firstDate.date} ${firstDate.month}`;
      setSelectedDate(dateKey);
      setCurrentSelectedDate(firstDate.fullDate);
    }
  }, []);

  useEffect(() => {
    if (!currentSelectedDate || slotsLoading) return;
    
    const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
    
    const processedSlots = availableSlots
      .filter(slot => {
        if (!slot.consultantId) return false;
        return consultants.some((c: any) => c._id === slot.consultantId);
      })
      .map(slot => {
        const consultant = consultants.find((c: any) => c._id === slot.consultantId);
        let consultantName = '';
        if (consultant) {
          const firstName = consultant.profileData?.firstName || '';
          const lastName = consultant.profileData?.lastName || '';
          consultantName = `${firstName} ${lastName}`.trim();
        }
        
        return {
          startTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endTime: new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          displayTime: `${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
          isAvailable: true,
          consultantId: slot.consultantId,
          consultantName: consultantName,
          startTimeRaw: new Date(slot.startTime).toISOString(),
          endTimeRaw: new Date(slot.endTime).toISOString(),
        };
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
  }, [currentSelectedDate, availableSlots, slotsLoading, consultants, allConsultants]);

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

  const handleContinue = async () => {
    if (selectedTimeSlot) {
      setIsFetchingPatient(true);
      try {
        await refetchPatient();
        onSlotSelect(selectedTimeSlot.consultantId, selectedTimeSlot);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        onSlotSelect(selectedTimeSlot.consultantId, selectedTimeSlot);
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

            <div className="mb-4">
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto space-x-3 pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {availableDates.map((dateOption) => {
                  const dateKey = `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
                  const isCurrentDate = selectedDate === dateKey;
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
                
                {slotsLoading ? (
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
                          {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && slot.consultantName && (
                            <div className="text-xs text-gray-500 mt-1">{slot.consultantName}</div>
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
