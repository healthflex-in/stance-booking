import React from 'react';

import { AppointmentEvent, AvailabilityStatus } from '@/gql/graphql';

interface TimeHeaderCellProps {
  time: string;
  currentTimePosition: { slotIndex: number; percentage: number } | null;
  index: number;
}

/**
 * Component to render the time header cell with current time indicator
 */
export const TimeHeaderCell = React.memo(({ time, currentTimePosition, index }: TimeHeaderCellProps) => {
  return (
    <td className="p-3 border-r text-sm text-gray-600 text-center min-w-[90px] sticky left-0 bg-white z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] overflow-visible">
      {new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}
      {currentTimePosition && currentTimePosition.slotIndex === index && (
        <div
          className="absolute right-0 z-50 -translate-y-1/2"
          style={{ top: `${currentTimePosition.percentage}%` }}
        >
          <div className="w-0 h-0 border-l-[10px] border-l-red-700 border-y-[6px] border-y-transparent"></div>
        </div>
      )}
    </td>
  );
});
TimeHeaderCell.displayName = 'TimeHeaderCell';

interface UnavailabilityEvent {
  title?: string;
  availabilityStatus?: string;
  startTime: number;
  endTime: number;
}

interface ConsultantHeaderCellProps {
  consultantId: string;
  consultantName: string;
  profilePicture?: string;
  unavailabilityEvents: UnavailabilityEvent[];
}

/**
 * Component to render consultant header cell with unavailability info
 */
export const ConsultantHeaderCell = React.memo(({
  consultantId,
  consultantName,
  profilePicture,
  unavailabilityEvents
}: ConsultantHeaderCellProps) => {
  return (
    <th
      key={consultantId}
      className="p-3 text-center border-r bg-primary-light min-w-[200px]"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-center gap-2">
          {profilePicture && (
            <img src={profilePicture} alt={consultantName} className="w-6 h-6 rounded-full" />
          )}
          <div className="font-medium text-sm text-gray-700">
            {consultantName}
          </div>
        </div>

        {unavailabilityEvents?.map((event, idx) => {
          const startHours = Math.floor(event.startTime / 100);
          const startMinutes = event.startTime % 100;
          const endHours = Math.floor(event.endTime / 100);
          const endMinutes = event.endTime % 100;

          const startTime = new Date();
          startTime.setHours(startHours, startMinutes, 0, 0);
          const endTime = new Date();
          endTime.setHours(endHours, endMinutes, 0, 0);

          const formattedStart = startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          const formattedEnd = endTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          // Determine color and text based on availability status
          const getStatusDisplay = (status: string, title: string) => {
            switch (status) {
              case AvailabilityStatus.Available:
                return { color: 'text-green-600', text: title || 'Available' };
              case AvailabilityStatus.Leave:
                return { color: 'text-red-600', text: title || 'On Leave' };
              case AvailabilityStatus.Holiday:
                return { color: 'text-red-600', text: title || 'Holiday' };
              case AvailabilityStatus.Interview:
                return { color: 'text-red-600', text: title || 'Interview' };
              case AvailabilityStatus.Meeting:
                return { color: 'text-red-600', text: title || 'Meeting' };
              case AvailabilityStatus.Unavailable:
                return { color: 'text-red-600', text: title || 'Unavailable' };
              case AvailabilityStatus.Break:
                return { color: 'text-yellow-600', text: title || 'Break' };
              default:
                return { color: 'text-red-600', text: title || status };
            }
          };

          const { color, text } = getStatusDisplay(event.availabilityStatus || '', event.title || '');

          return (
            <div
              key={`${consultantId}-unavail-${idx}`}
              className={`text-xs ${color} mt-1`}
            >
{text.length > 50 ? text.substring(0, 50) + '...' : text}: {formattedStart} - {formattedEnd}
            </div>
          );
        })}
      </div>
    </th>
  );
});
ConsultantHeaderCell.displayName = 'ConsultantHeaderCell';

interface TimeSlotCellProps {
  consultantId: string;
  time: string;
  slotAppointments: AppointmentEvent[];
  consultantIndices: { [key: string]: number };
  consultantColorMap: { [key: string]: string };
  onAppointmentClick: (appointment: AppointmentEvent) => void;
  onEmptySlotClick?: (date: Date, consultantId?: string) => void;
  currentTimePosition: { slotIndex: number; percentage: number } | null;
  index: number;
  handleEmptySlotClick: (consultantId: string, time: string) => void;
  AppointmentBlock: React.ComponentType<{
    appointment: AppointmentEvent;
    onClick: (appointment: AppointmentEvent) => void;
    consultantIndex: number;
    consultantColorMap: { [key: string]: string };
    onEmptySlotClick?: (date: Date, consultantId?: string) => void;
  }>;
  unavailabilityEvents?: UnavailabilityEvent[];
}

/**
 * Component to render a time slot cell with appointments
 */
export const TimeSlotCell = React.memo(({
  consultantId,
  time,
  slotAppointments,
  consultantIndices,
  consultantColorMap,
  onAppointmentClick,
  onEmptySlotClick,
  currentTimePosition,
  index,
  handleEmptySlotClick,
  AppointmentBlock,
  unavailabilityEvents = []
}: TimeSlotCellProps) => {
  // Check if current time slot overlaps with any unavailability events
  const unavailableInfo = React.useMemo(() => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotTime = hours * 100 + minutes;
    const slotEndTime = slotTime + 60; // 1-hour slots
    
    const event = unavailabilityEvents.find(event => {
      // Only block non-available statuses (including BREAK)
      if (event.availabilityStatus === 'AVAILABLE') return false;
      
      // Check if slot overlaps with event
      return slotTime < event.endTime && slotEndTime > event.startTime;
    });

    if (!event) return null;

    // Calculate the blocking position and height
    const blockStart = Math.max(slotTime, event.startTime);
    const blockEnd = Math.min(slotEndTime, event.endTime);
    
    // Convert to minutes within the hour for positioning
    const startMinutes = (blockStart % 100);
    const endMinutes = (blockEnd % 100) || 60;
    
    const topPercent = (startMinutes / 60) * 100;
    const heightPercent = ((endMinutes - startMinutes) / 60) * 100;
    
    return {
      event,
      topPercent,
      heightPercent
    };
  }, [time, unavailabilityEvents]);

  const isUnavailable = !!unavailableInfo;

  const cellClassName = `p-2 border-r min-h-[4.5rem] min-w-[200px] relative group hover:bg-gray-50 transition-colors duration-150`;

  return (
    <td className={cellClassName}>
      {currentTimePosition && currentTimePosition.slotIndex === index && (
        <div
          className="absolute w-full h-[0.3px] bg-red-700 left-0 z-20"
          style={{ top: `${currentTimePosition.percentage}%` }}
        />
      )}
      {unavailableInfo && (
        <div 
          className={`absolute left-0 right-0 z-5 flex items-center px-1 ${
            unavailableInfo.event.availabilityStatus === 'BREAK' 
              ? 'bg-yellow-200 border-l-4 border-yellow-400' 
              : 'bg-red-200 border-l-4 border-red-400'
          }`}
          style={{
            top: `${unavailableInfo.topPercent}%`,
            height: `${unavailableInfo.heightPercent}%`
          }}
        >
          <div className={`text-xs font-medium truncate ${
            unavailableInfo.event.availabilityStatus === 'BREAK' 
              ? 'text-yellow-800' 
              : 'text-red-800'
          }`}>
{(unavailableInfo.event.title || 'Unavailable').length > 50 
              ? (unavailableInfo.event.title || 'Unavailable').substring(0, 50) + '...' 
              : (unavailableInfo.event.title || 'Unavailable')}
          </div>
        </div>
      )}
      
      <div className="space-y-1 relative z-10">
        {slotAppointments.map(apt => {
          const consultant = apt.appointment?.consultant;
          const consultantIndex = consultant ? consultantIndices[consultant._id] : 0;
          return (
            <AppointmentBlock
              key={apt._id}
              appointment={apt}
              onClick={onAppointmentClick}
              consultantIndex={consultantIndex}
              consultantColorMap={consultantColorMap}
              onEmptySlotClick={onEmptySlotClick}
            />
          );
        })}
      </div>

      {unavailableInfo?.heightPercent !== 100 && (
        <div
          className="absolute inset-0 z-5 cursor-pointer"
          onClick={() => handleEmptySlotClick(consultantId, time)}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-200 border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </td>
  );
});
TimeSlotCell.displayName = 'TimeSlotCell';
