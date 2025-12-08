import React from 'react';
import { AvailabilityEvent } from '@/gql/graphql';
import { CalendarViewCommonProps } from './types';
import { timeSlots } from '@/utils/standard-utils';
import AppointmentBlock from './components/AppointmentBlock';

import { ConsultantHeaderCell, TimeHeaderCell, TimeSlotCell } from './components/CalendarCells';

// Import all the extracted hooks
import { useAppointmentsBySlot } from './hooks/useAppointmentsBySlot';
import { useSortedConsultantIds } from './hooks/useSortedConsultantIds';
import { useCurrentTimeIndicator } from './hooks/useCurrentTimeIndicator';
import { useConsultantDisplayData } from './hooks/useConsultantDisplayData';
import { useConsultantUnavailability } from './hooks/useConsultantUnavailability';

// Main component utilizing the extracted hooks
interface DailyCalendarViewProps extends CalendarViewCommonProps {
  selectedCenterIds: string[];
  selectedConsultantIds: string[];
  availabilityEvents: AvailabilityEvent[];
}



export default function DailyCalendarView(props: DailyCalendarViewProps) {
  const {
    currentDate,
    appointments,
    consultantIndices,
    consultantColorMap,
    onAppointmentClick,
    onEmptySlotClick,
    consultantsData = [],
    availabilityEvents,
    selectedConsultantIds,
    selectedCenterIds
  } = props;


  // Use the extracted custom hooks
  const consultantUnavailability = useConsultantUnavailability(availabilityEvents, currentDate, selectedConsultantIds);
  const memoizedAppointments = useAppointmentsBySlot(appointments, currentDate);
  const { consultantNames, consultantProfilePictures } = useConsultantDisplayData(consultantsData);
  const currentTimePosition = useCurrentTimeIndicator();
  const sortedConsultantIds = useSortedConsultantIds(consultantsData);

  // Handle empty slot click
  const handleEmptySlotClick = React.useCallback((consultantId: string, time: string) => {
    if (!onEmptySlotClick) return;
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date(currentDate);
    date.setHours(hours, minutes, 0, 0);
    onEmptySlotClick(date, consultantId);
  }, [onEmptySlotClick, currentDate]);

  // Early return if no consultants
  if (sortedConsultantIds.length === 0) {
    return (
      <div className="overflow-hidden">
        <div className="flex p-3 font-medium text-sm text-gray-600 text-center justify-center items-center h-[calc(100vh-16rem)]">
          No appointments found with the selected filters
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="max-w-[calc(100vw-380px)] overflow-x-auto">
        <table className="border-collapse table-fixed">
          <thead>
            <tr className="border-b">
              <th className="w-20 min-w-[80px] p-3 border-r bg-primary-light font-medium text-sm text-gray-600 text-center sticky left-0 bg-white z-40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">Time</th>
              {sortedConsultantIds.map((consultantId) => (
                <ConsultantHeaderCell
                  key={consultantId}
                  consultantId={consultantId}
                  consultantName={consultantNames[consultantId] || consultantId}
                  profilePicture={consultantProfilePictures[consultantId]}
                  unavailabilityEvents={consultantUnavailability[consultantId] || []}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, index) => (
              <tr key={`time-slot-${time}-${index}`} className="border-b relative">
                <TimeHeaderCell
                  time={time}
                  currentTimePosition={currentTimePosition}
                  index={index}
                />

                {sortedConsultantIds.map((consultantId) => {
                  const appointmentSlotKey = `${consultantId}-${time}`;
                  const slotAppointments = memoizedAppointments.get(appointmentSlotKey) || [];

                  return (
                    <TimeSlotCell
                      key={`slot-${consultantId}-${time}-${index}`}
                      consultantId={consultantId}
                      time={time}
                      slotAppointments={slotAppointments}
                      consultantIndices={consultantIndices}
                      consultantColorMap={consultantColorMap}
                      onAppointmentClick={onAppointmentClick}
                      onEmptySlotClick={onEmptySlotClick}
                      currentTimePosition={currentTimePosition}
                      index={index}
                      handleEmptySlotClick={handleEmptySlotClick}
                      AppointmentBlock={AppointmentBlock}
                      unavailabilityEvents={consultantUnavailability[consultantId] || []}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
