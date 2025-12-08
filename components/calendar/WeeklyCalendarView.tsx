import React from 'react';

import { AppointmentEvent } from '@/gql/graphql';
import { CalendarViewCommonProps } from './types';
import { getDaysInWeek, isValidTimestamp, timeSlots } from '@/utils/standard-utils';

type WeeklyCalendarViewProps = CalendarViewCommonProps // no additional props needed beyond common ones

const AppointmentBlock: React.FC<{
  appointment: AppointmentEvent;
  onClick: (appointment: AppointmentEvent) => void;
  consultantIndex: number;
  consultantColorMap: { [key: string]: string };
  onEmptySlotClick?: (date: Date) => void;
}> = ({ appointment, onClick, consultantIndex, consultantColorMap, onEmptySlotClick }) => {
  if (!isValidTimestamp(appointment.startTime) || !isValidTimestamp(appointment.endTime)) {
    console.error('Invalid timestamp in appointment:', appointment);
    return null;
  }

  const startTime = new Date(appointment.startTime);
  const formattedTime = startTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
  });

  const patient = appointment.appointment?.patient;
  const consultant = appointment.appointment?.consultant;
  const fullName = patient ? `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() : 'Unknown';
  const trimmedName = fullName.length > 15 ? `${fullName.slice(0, 15)}...` : fullName;

  const bgColor = consultant ? consultantColorMap[consultant._id] || 'bg-gray-100' : 'bg-yellow-100';

  const borderStyle = appointment.isWaitlisted
      ? 'border-2 border-dashed border-red-300'
      : appointment.appointment.visitType === 'FIRST_VISIT'
          ? 'border-4 border-solid border-[#ddfe71]'
          : '';

  return (
    <div className="group relative">
      <div
          className={`${bgColor} ${borderStyle} rounded px-2 py-1 mb-1 cursor-pointer hover:opacity-90 transition-opacity relative`}
          onClick={() => onClick(appointment)}
      >
        <div className="flex items-center justify-between text-xs">
          <span>{trimmedName}</span>
          <span>{formattedTime}</span>
        </div>
        {appointment.isWaitlisted && (
            <div className="text-xs text-red-300 font-medium">Waitlisted</div>
        )}
        {appointment.appointment.visitType === 'FIRST_VISIT' && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md flex items-center justify-center z-10">
              {appointment.appointment.category === 'WEBSITE' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v13H7V4zm5 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              )}
            </div>
        )}
      </div>
      <button
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 
          opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center
          hover:bg-gray-300 shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          if (onEmptySlotClick) {
            onEmptySlotClick(new Date(appointment.startTime));
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default function WeeklyCalendarView({
  currentDate,
  appointments,
  consultantIndices,
  consultantColorMap,
  onAppointmentClick,
  onEmptySlotClick,
  consultantsData = [],
}: WeeklyCalendarViewProps) {
  const days = getDaysInWeek(currentDate);

  const handleEmptySlotClick = (day: string, time: string) => {
    if (!onEmptySlotClick) return;
    const [hours, minutes] = time.split(':').map(Number);
    const [year, month, dayOfMonth] = day.split('-').map(Number);
    const date = new Date(year, month - 1, dayOfMonth, hours, minutes);
    onEmptySlotClick(date);
  };

  return (
    <div className="overflow-hidden">
      <div className="w-full">
        <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b border-t">
          <div className="p-3 border-r bg-primary-light font-medium text-sm text-gray-600 text-center">Time</div>
          {days.map((day) => (
            <div 
              key={day.name} 
              className={`p-3 text-center border-r ${
                day.date.toDateString() === new Date().toDateString() 
                  ? 'bg-blue-50' 
                  : 'bg-primary-light'
              }`}
            >
              <div className="font-medium text-sm text-gray-700">{day.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{day.dayOfMonth}</div>
            </div>
          ))}
        </div>

        <div className="divide-y">
          {timeSlots.map((time, timeIndex) => (
            <div key={`weekly-time-${time}-${timeIndex}`} className="grid grid-cols-[90px_repeat(7,1fr)]">
              <div className="p-3 border-r sm text-gray-600 text-center">
                {new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
              {days.map((day) => {
                const slotAppointments = appointments
                  .filter(apt => {
                    if (!isValidTimestamp(apt.startTime)) return false;
                    const aptTime = new Date(apt.startTime);
                    return (
                      aptTime.getDate() === day.date.getDate() &&
                      aptTime.getMonth() === day.date.getMonth() &&
                      aptTime.getFullYear() === day.date.getFullYear() &&
                      aptTime.getHours() === parseInt(time.split(':')[0])
                    );
                  })
                  .sort((a, b) => {
                    const timeA = new Date(a.startTime).getTime();
                    const timeB = new Date(b.startTime).getTime();
                    return timeA - timeB;
                  });

                return (
                  <div 
                    key={`weekly-slot-${day.dateString}-${time}-${timeIndex}`}
                    className="p-2 border-r min-h-[4.5rem] relative"
                  >
                    <div className="space-y-1 relative z-20">
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
                    {/* Empty space click area */}
                    <div 
                      className="absolute inset-0 group hover:bg-gray-100 z-10 cursor-pointer"
                      onClick={() => handleEmptySlotClick(day.dateString, time)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
