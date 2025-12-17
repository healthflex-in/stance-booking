'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, UserCircle, ChevronRight } from 'lucide-react';
import { useCenterAvailability } from '@/hooks';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { ConsultantSelectionModal } from '../shared';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';

interface RepeatUserOnlineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  designation?: string;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  isAvailable: boolean;
  consultantIds: string[];
  consultantNames: string[];
  centerIds: string[];
  centerNames: string[];
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

export default function RepeatUserOnlineSlotSelection({
  centerId,
  serviceDuration,
  designation,
  onSlotSelect,
  onBack,
}: RepeatUserOnlineSlotSelectionProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [showConsultantModal, setShowConsultantModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: TimeSlot[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    designation,
    deliveryMode: 'ONLINE',
    enabled: !!currentSelectedDate,
  });

  const consultants = React.useMemo(() => {
    return availabilityConsultants.map((ac: any) => ({
      _id: ac.consultantId,
      profileData: {
        firstName: ac.consultantName.split(' ')[0] || '',
        lastName: ac.consultantName.split(' ').slice(1).join(' ') || '',
        designation: designation || 'Consultant',
      }
    }));
  }, [availabilityConsultants, designation]);

  const availableSlots = React.useMemo(() => {
    let filteredConsultants = availabilityConsultants;
    
    if (selectedConsultant) {
      filteredConsultants = filteredConsultants.filter(c => c.consultantId === selectedConsultant._id);
    }
    
    return filteredConsultants.flatMap(consultant => 
      consultant.availableSlots.map(slot => ({
        startTime: new Date(slot.startTime * 1000),
        endTime: new Date(slot.endTime * 1000),
        consultantId: consultant.consultantId,
        centerId: slot.centerId,
        centerName: slot.centerName,
      }))
    );
  }, [availabilityConsultants, selectedConsultant]);

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
    
    const slotMap = new Map();
    availableSlots.forEach(slot => {
      const timeKey = new Date(slot.startTime).toISOString();
      const consultant = availabilityConsultants.find((ac: any) => ac.consultantId === slot.consultantId);
      const consultantName = consultant?.consultantName?.trim() || '';
      
      if (!slotMap.has(timeKey)) {
        slotMap.set(timeKey, {
          startTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          endTime: new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          displayTime: `${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
          isAvailable: true,
          consultantIds: [slot.consultantId],
          consultantNames: consultantName ? [consultantName] : [],
          centerIds: [slot.centerId],
          centerNames: [slot.centerName],
          startTimeRaw: new Date(slot.startTime).toISOString(),
          endTimeRaw: new Date(slot.endTime).toISOString(),
        });
      } else {
        const existing = slotMap.get(timeKey);
        if (!existing.consultantIds.includes(slot.consultantId)) {
          existing.consultantIds.push(slot.consultantId);
          if (consultantName) existing.consultantNames.push(consultantName);
          existing.centerIds.push(slot.centerId);
          existing.centerNames.push(slot.centerName);
        }
      }
    });
    
    const processedSlots = Array.from(slotMap.values()).sort((a, b) => 
      new Date(a.startTimeRaw).getTime() - new Date(b.startTimeRaw).getTime()
    );
    
    setDateSlots(prev => ({ ...prev, [dateKey]: processedSlots }));
    
    setAvailableDates(prev =>
      prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedSlots.length };
        }
        return date;
      })
    );
  }, [currentSelectedDate, availableSlots, slotsLoading, availabilityConsultants]);

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
      const randomIndex = Math.floor(Math.random() * selectedTimeSlot.consultantIds.length);
      const consultantId = selectedConsultant?._id || selectedTimeSlot.consultantIds[randomIndex];
      const slotWithCenter = {
        ...selectedTimeSlot,
        centerId: selectedTimeSlot.centerIds[randomIndex],
        centerName: selectedTimeSlot.centerNames[randomIndex],
      };
      onSlotSelect(consultantId, slotWithCenter);
    }
  };

  const handleConsultantSelect = (consultant: any | null) => {
    setSelectedConsultant(consultant);
    setShowConsultantModal(false);
  };

  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];
  const canProceed = !!selectedTimeSlot;

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select preferred consultant</h3>
            <div className="bg-white rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    {selectedConsultant ? (
                      <>
                        <p className="text-sm font-bold text-gray-900">
                          {selectedConsultant.profileData?.firstName || selectedConsultant.profileData?.lastName ? (
                            <>Dr. {selectedConsultant.profileData?.firstName || ''} {selectedConsultant.profileData?.lastName || ''}</>
                          ) : (
                            <>Consultant</>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedConsultant.profileData?.designation || 'Consultant'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-900">Any available</p>
                        <p className="text-xs text-gray-500">First available consultant for your session</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowConsultantModal(true)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

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
                          {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (
                            <div className="text-xs text-gray-500 mt-1">
                              {slot.consultantNames && slot.consultantNames.length > 0 
                                ? slot.consultantNames.filter(n => n).join(', ') || `${slot.consultantNames.length} consultants`
                                : 'No consultant'}
                            </div>
                          )}
                          {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (
                            <div className="text-xs text-gray-400 mt-1">
                              {slot.centerNames && slot.centerNames.length > 0
                                ? slot.centerNames.filter(n => n).join(', ')
                                : 'No center'}
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
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-semibold text-black transition-all ${
            canProceed ? '' : 'bg-gray-300 cursor-not-allowed'
          }`}
          style={{ backgroundColor: canProceed ? '#DDFE71' : '#D1D5DB' }}
        >
          Continue
        </button>
      </div>

      <ConsultantSelectionModal
        isOpen={showConsultantModal}
        onClose={() => setShowConsultantModal(false)}
        consultants={consultants}
        sessionType="online"
        centerId={centerId}
        onSelect={handleConsultantSelect}
        selectedConsultant={selectedConsultant}
      />
    </div>
  );
}
