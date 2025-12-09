'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import { GET_CENTERS, GET_CONSULTANTS } from '@/gql/queries';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import {
  SessionTypeCard,
  SessionDetailItem,
  DateSelector,
  TimeSlotButton,
  PrimaryButton,
  InfoBanner,
} from '@/components/ui-atoms';
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

    for (let i = 0; i < 14; i++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + i);
      const dayOfWeek = dateObj.getDay();

      dates.push({
        id: i,
        day: days[dayOfWeek],
        date: dateObj.getDate().toString(),
        month: months[dateObj.getMonth()],
        slots: 'Loading...',
        fullDate: new Date(dateObj),
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
        selectedDate,
        selectedFullDate: currentSelectedDate,
      });
    }
  };

  const currentTimeSlots = selectedDate ? (dateSlots[selectedDate] || []) : [];
  const canProceed = selectedService && selectedTimeSlot;

  return (
    <div className={`${isInDesktopContainer ? 'h-full relative' : 'min-h-screen'} flex flex-col bg-gray-50`}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Book Appointment</h1>
      </div>

      {/* Scrollable Content */}
      <div className={`px-4 py-5 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
        {/* Session Type */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Session type</h2>
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] p-4">
            <div className="grid grid-cols-2 gap-4">
              <SessionTypeCard
                image="/doc2.png"
                label="In Person"
                selected={sessionType === 'in-person'}
                onSelect={() => setSessionType('in-person')}
              />
              <SessionTypeCard
                image="/doc.png"
                label="Online"
                selected={sessionType === 'online'}
                onSelect={() => setSessionType('online')}
              />
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Session details</h2>
          <div className="bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] px-4">
            <SessionDetailItem
              label="Location"
              value={selectedCenter?.name || 'Stance, HSR layout'}
              onClick={() => setShowLocationModal(true)}
            />
            <SessionDetailItem
              label="Service"
              value={selectedService?.name || 'Select service'}
              onClick={() => setShowServiceModal(true)}
            />
            {!isNewUser && (
              <SessionDetailItem
                label="Consultant"
                value={selectedConsultant ? `Dr. ${selectedConsultant.profileData?.firstName} ${selectedConsultant.profileData?.lastName}` : 'Any available'}
                onClick={() => setShowConsultantModal(true)}
              />
            )}
          </div>
        </div>

        {/* Visit Details */}
        {selectedService && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-[#1C1A4B] mb-4">Visit details</h2>
            
            {/* Date Selection */}
            <div className="mb-4">
              <DateSelector
                dates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                isLoading={slotsLoading}
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <>
                {slotsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#132644]"></div>
                  </div>
                ) : currentTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTimeSlots.map((slot: any, index: number) => {
                      // Check if this slot is selected - compare by startTime or startTimeRaw
                      const isSelected = selectedTimeSlot && (
                        (selectedTimeSlot.startTime && slot.startTime && selectedTimeSlot.startTime === slot.startTime) ||
                        (selectedTimeSlot.startTimeRaw && slot.startTimeRaw && selectedTimeSlot.startTimeRaw === slot.startTimeRaw) ||
                        (selectedTimeSlot.displayTime && slot.displayTime && selectedTimeSlot.displayTime === slot.displayTime)
                      );
                      
                      return (
                        <TimeSlotButton
                          key={`${slot.startTime || slot.startTimeRaw || slot.displayTime}-${index}`}
                          time={slot.displayTime || 'Select time'}
                          selected={!!isSelected}
                          onSelect={() => setSelectedTimeSlot(slot)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[rgba(28,26,75,0.6)] text-sm">
                    No slots available for this date
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Info Banner */}
        {selectedService && (
          <InfoBanner
            message="We charge INR 99 to ensure your booking. It will be adjusted in your final payment."
            icon={<PartyPopper className="w-3 h-3 text-[#1C1A4B]" />}
          />
        )}
      </div>

      {/* Bottom Button */}
      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-[#D3D3D3] p-4`}>
        <PrimaryButton onClick={handleContinue} disabled={!canProceed}>
          Proceed to Confirm
        </PrimaryButton>
      </div>

      {/* Modals */}
      <LocationSelectionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        centers={filteredCenters}
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

