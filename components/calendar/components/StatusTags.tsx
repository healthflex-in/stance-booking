import React from 'react';
import { Calendar, Clock, Tag, Stethoscope, Video, Users, Info } from 'lucide-react';

import {
  getStatusColor,
  getMediumLabel,
  getMediumColor,
  getVisitTypeColor,
  getVisitTypeLabel
} from '../utils/appointmentFormatters';
import { formatDate, formatTime } from '../utils/dateTimeFormatters';

import { AppointmentEvent, AppointmentMedium } from '@/gql/graphql';

interface StatusTagsProps {
  appointment: AppointmentEvent;
}

export const StatusTags: React.FC<StatusTagsProps> = ({ appointment }) => {
  if (!appointment) return null;

  // Get the appropriate icon for the appointment medium
  const getMediumIcon = (medium?: AppointmentMedium) => {
    switch (medium) {
      case AppointmentMedium.InPerson:
        return <Users className="w-4 h-4" />;
      case AppointmentMedium.Online:
        return <Video className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {appointment?.isWaitlisted && (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white flex items-center gap-1.5 w-fit">
          <Clock className="w-4 h-4" />
          Waitlisted
        </span>
      )}

      {appointment?.appointment?.status && !appointment?.isWaitlisted && (
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${getStatusColor(appointment.appointment.status)}`}>
          <Tag className="w-4 h-4" />
          {appointment.appointment.status}
        </span>
      )}

      {appointment?.appointment?.visitType && (
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${getVisitTypeColor(appointment.appointment.visitType)}`}>
          <Stethoscope className="w-4 h-4" />
          {getVisitTypeLabel(appointment.appointment.visitType)}
        </span>
      )}

      {appointment?.appointment?.medium && (
        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${getMediumColor(appointment.appointment.medium)}`}>
          {getMediumIcon(appointment.appointment.medium)}
          {getMediumLabel(appointment.appointment.medium)}
        </span>
      )}

      {appointment && (
        <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 bg-gray-200 text-gray-800">
          <Calendar className="w-4 h-4" />
          {formatDate(appointment.startTime)} • {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </span>
      )}
    </div>
  );
};
