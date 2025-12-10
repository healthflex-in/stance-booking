'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { GET_CENTERS, GET_CONSULTANTS } from '@/gql/queries';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import LocationSelectionModal from './LocationSelectionModal';
import ServiceSelectionModal from './ServiceSelectionModal';
import ConsultantSelectionModal from './ConsultantSelectionModal';

interface NewBookingMainProps {
  centerId: string;
  patientId: string;
  isNewUser: boolean;
  onConfirm: (bookingData: any) => void;
  onBack: () => void;
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

export default function NewBookingMain({
  centerId,
  patientId,
  isNewUser,
  onConfirm,
  onBack,
}: NewBookingMainProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [sessionType, setSessionType] = useState<'in-person' | 'online'>('in-person');
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null);
  const [dateSlots, setDateSlots] = useState<{ [key: string]: any[] }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showConsultantModal, setShowConsultantModal] = useState(false);

  // Fetch centers on component mount
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  // Filter centers based on session type
  const filteredCenters = React.useMemo(() => {
    if (!centersData?.centers) return [];
    return centersData.centers.filter((center: any) => {
      if (sessionType === 'online') {
        return center.isOnline === true;
      }
      return true; // For in-person, show all centers
    });
  }, [centersData, sessionType]);

  // Fetch all consultants when service is selected
  const { data: allConsultantsData, loading: consultantsLoading } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: 'CONSULTANT',
      centerId: [selectedCenter?._id || centerId],
    },
    skip: !selectedService,
    fetchPolicy: 'network-only',
  });

  // Filter consultants based on exact requirements
  const consultants = React.useMemo(() => {
    if (!allConsultantsData?.users?.data) return [];
    
    return allConsultantsData.users.data.filter((consultant: any) => {
      // Must have allowOnlineBooking = true (REQUIRED)
      if (consultant.profileData?.allowOnlineBooking !== true) return false;
      
      // Filter by session type and allowOnlineDelivery
      const allowOnlineDelivery = consultant.profileData?.allowOnlineDelivery;
      
      if (sessionType === 'online') {
        // Online: allowOnlineDelivery must be true or 'BOTH'
        return allowOnlineDelivery === true || allowOnlineDelivery === 'BOTH' || allowOnlineDelivery === 'ONLINE';
      } else {
        // In-center: allowOnlineDelivery must be false, 'BOTH', or 'INCENTER'
        return allowOnlineDelivery === false || allowOnlineDelivery === 'BOTH' || allowOnlineDelivery === 'INCENTER' || allowOnlineDelivery === 'OFFLINE';
      }
    });
  }, [allConsultantsData, sessionType]);

  // Use available slots hook - MUST be called before effects that use it
  const { availableSlots, loading: slotsLoading } = useAvailableSlots({
    centerId: selectedCenter?._id || centerId,
    date: currentSelectedDate || new Date(),
    serviceDurationInMinutes: selectedService?.duration || 45,
    consultantId: selectedConsultant?._id || null,
    isReturningUser: !isNewUser,
    consultantIds: selectedConsultant ? [selectedConsultant._id] : consultants.map((c: any) => c._id),
    preFilteredConsultants: selectedConsultant ? [selectedConsultant] : consultants,
  });

  // Set initial center
  useEffect(() => {
    if (centersData?.centers && !selectedCenter) {
      const center = centersData.centers.find((c: any) => c._id === centerId);
      if (center) {
        setSelectedCenter(center);
      }
    }
  }, [centersData, centerId, selectedCenter]);

  // Generate next 14 days
  const generateNext14Days = (): DateOption[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dates: DateOption[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + i);
      const dayOfWeek = dateObj.getDay();
      const isToday = i === 0;

      dates.push({
        id: i,
        day: days[dayOfWeek],
        date: dateObj.getDate().toString(),
        month: months[dateObj.getMonth()],
        slots: 'Loading...',
        fullDate: new Date(dateObj),
        isToday,
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
    if (!currentSelectedDate || !selectedService) return;
    
    const dateKey = `${currentSelectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${currentSelectedDate.getDate()} ${currentSelectedDate.toLocaleDateString('en-US', { month: 'short' })}`;
    
    const processedSlots = availableSlots.map(slot => ({
      startTime: new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      endTime: new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      displayTime: `${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${new Date(slot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      isAvailable: true,
      consultantId: slot.consultantId,
      startTimeRaw: slot.startTime,
      endTimeRaw: slot.endTime,
    }));
    
    setDateSlots(prev => ({ ...prev, [dateKey]: processedSlots }));
    
    setAvailableDates(prev =>
      prev.map(date => {
        if (date.fullDate.toDateString() === currentSelectedDate.toDateString()) {
          return { ...date, slots: processedSlots.length };
        }
        return date;
      })
    );
  }, [currentSelectedDate, availableSlots, selectedService]);

  const handleDateSelect = (date: DateOption) => {
    const dateKey = `${date.day}, ${date.date} ${date.month}`;
    setSelectedDate(dateKey);
    setCurrentSelectedDate(date.fullDate);
    setSelectedTimeSlot(null);
  };

  const handleContinue = () => {
    if (selectedTimeSlot && selectedService && selectedCenter) {
      onConfirm({
        sessionType,
        centerId: selectedCenter._id,
        selectedCenter,
        location: selectedCenter.name,
        consultantId: selectedTimeSlot.consultantId,
        selectedConsultant,
        treatmentId: selectedService._id,
        treatmentName: selectedService.name,
        treatmentDuration: selectedService.duration,
        treatmentPrice: selectedService.bookingAmount,
        selectedService,
        selectedDate,
        selectedTimeSlot: {
          startTime: new Date(selectedTimeSlot.startTimeRaw).toISOString(),
          endTime: new Date(selectedTimeSlot.endTimeRaw).toISOString(),
          startTimeRaw: selectedTimeSlot.startTimeRaw,
          endTimeRaw: selectedTimeSlot.endTimeRaw,
          displayTime: selectedTimeSlot.displayTime,
        },
        selectedFullDate: currentSelectedDate,
      });
    }
  };

  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];
  const canProceed = selectedService && selectedTimeSlot;

  // Find current center
  const currentCenter = centersData?.centers.find((center: any) => center._id === (selectedCenter?._id || centerId));

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
                      {currentCenter?.name || selectedCenter?.name || 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentCenter?.address || selectedCenter?.address ? 
                        `${(currentCenter?.address || selectedCenter?.address)?.street || ''}, ${(currentCenter?.address || selectedCenter?.address)?.city || ''}, ${(currentCenter?.address || selectedCenter?.address)?.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
                        'Address not available'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Session Type Display */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {sessionType === 'online' ? '💻' : '🏥'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">
                    {sessionType === 'online' ? 'Online Session' : 'In-Person Session'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {sessionType === 'online'
                      ? 'Video consultation from your home'
                      : 'Visit our center for treatment'}
                  </p>
                </div>
                <button
                  onClick={() => setSessionType(sessionType === 'online' ? 'in-person' : 'online')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          {!selectedService && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Service</h3>
                      <p className="text-sm text-gray-500">Select a service</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {selectedService && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Service</h3>
                    <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  </div>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Consultant Selection (for returning users) */}
          {!isNewUser && !selectedConsultant && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <button
                  onClick={() => setShowConsultantModal(true)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Consultant</h3>
                      <p className="text-sm text-gray-500">Any available</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {!isNewUser && selectedConsultant && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Consultant</h3>
                    <p className="text-sm font-medium text-gray-900">
                      Dr. {selectedConsultant.profileData?.firstName} {selectedConsultant.profileData?.lastName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConsultantModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Visit Details Section */}
          {selectedService && (
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
                    const dateKey = `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
                    const isCurrentDate = selectedDate === dateKey;
                    const isDisabled = Boolean((slotsLoading) && !isCurrentDate);
                    
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

              {/* Time Slots Selection */}
              {selectedDate && (
                <div className="mb-6">
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    Available time slots
                  </h4>
                  
                  {slotsLoading ? (
                    <div className="py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </div>
                  ) : currentTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {currentTimeSlots.map((slot: any, index: number) => {
                        const isSelected = selectedTimeSlot && (
                          (selectedTimeSlot.startTime && slot.startTime && selectedTimeSlot.startTime === slot.startTime) ||
                          (selectedTimeSlot.startTimeRaw && slot.startTimeRaw && selectedTimeSlot.startTimeRaw === slot.startTimeRaw) ||
                          (selectedTimeSlot.displayTime && slot.displayTime && selectedTimeSlot.displayTime === slot.displayTime)
                        );
                        
                        return (
                          <button
                            key={`slot-${index}-${slot.startTime || slot.startTimeRaw || slot.displayTime}`}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : slot.isAvailable
                                ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                                : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.displayTime || 'Select time'}
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
          )}
        </div>
      </div>

      {/* Continue Button */}
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

      {/* Modals */}
      <LocationSelectionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        centers={filteredCenters}
        sessionType={sessionType}
        onSelect={(center) => {
          setSelectedCenter(center);
          setShowLocationModal(false);
        }}
      />

      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        patientId={patientId}
        centerId={selectedCenter?._id || centerId}
        isNewUser={isNewUser}
        sessionType={sessionType}
        onSelect={(service) => {
          setSelectedService(service);
          setShowServiceModal(false);
        }}
      />

      {!isNewUser && (
        <ConsultantSelectionModal
          isOpen={showConsultantModal}
          onClose={() => setShowConsultantModal(false)}
          consultants={consultants}
          sessionType={sessionType}
          centerId={selectedCenter?._id || centerId}
          onSelect={(consultant) => {
            setSelectedConsultant(consultant);
            setShowConsultantModal(false);
          }}
        />
      )}
    </div>
  );
}
