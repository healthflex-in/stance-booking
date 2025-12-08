import React from 'react';

import { AppointmentEvent } from '@/gql/graphql';
import { isValidTimestamp } from '@/utils/standard-utils';

interface AppointmentBlockProps {
  consultantIndex: number;
  appointment: AppointmentEvent;
  consultantColorMap: { [key: string]: string };
  onClick: (appointment: AppointmentEvent) => void;
  onEmptySlotClick?: (date: Date, consultantId?: string) => void;
}

/**
 * Component that renders an individual appointment block
 */
const AppointmentBlock = React.memo(({
  appointment,
  onClick,
  consultantColorMap,
  onEmptySlotClick,
  consultantIndex
}: AppointmentBlockProps) => {
  if (!isValidTimestamp(appointment.startTime) || !isValidTimestamp(appointment.endTime)) {
    console.error('Invalid timestamp in appointment:', appointment);
    return null;
  }

  const startTime = new Date(appointment.startTime);
  const formattedTime = startTime.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
  });

  const patient = appointment.appointment?.patient;
  const consultant = appointment.appointment?.consultant;
  const fullName = patient ? `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() : 'Unknown';
  const trimmedName = fullName.length > 20 ? `${fullName.slice(0, 20)}...` : fullName;
  
  // Debug log
  console.log('Appointment data:', {
    visitType: appointment.appointment.visitType,
    category: appointment.appointment.category,
    patientName: fullName
  });

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
        {appointment.appointment.visitType === 'FIRST_VISIT' && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md flex items-center justify-center z-10">
              {(() => {
                console.log('Category:', appointment.appointment.category);
                return appointment.appointment.category === 'WEBSITE' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v13H7V4zm5 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                );
              })()}
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
            onEmptySlotClick(new Date(appointment.startTime), consultant?._id || 'unassigned');
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
});
AppointmentBlock.displayName = 'AppointmentBlock';

export default AppointmentBlock;
