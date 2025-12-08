import React from 'react';
import { AppointmentEvent } from '@/gql/graphql';
import { isValidTimestamp } from '@/utils/standard-utils';

/**
 * Custom hook that organizes appointments by time slot and consultant
 */
export function useAppointmentsBySlot(
  appointments: Array<AppointmentEvent>,
  currentDate: Date
) {
  return React.useMemo(() => {
    const map = new Map<string, AppointmentEvent[]>();
    if (!appointments) return map;

    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (const apt of appointments) {
      if (!isValidTimestamp(apt.startTime)) continue;
      const aptTime = new Date(apt.startTime);
      const aptConsultantId = apt.appointment?.consultant?._id || 'unassigned';

      if (
        aptTime.getDate() === currentDay &&
        aptTime.getMonth() === currentMonth &&
        aptTime.getFullYear() === currentYear
      ) {
        const aptHour = aptTime.getHours();
        const slotTimeKey = `${String(aptHour).padStart(2, '0')}:00`;
        const key = `${aptConsultantId}-${slotTimeKey}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(apt);
      }
    }

    // Sort appointments within each slot by start time
    for (const [key, appointments] of map.entries()) {
      appointments.sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
      });
    }
    return map;
  }, [appointments, currentDate]);
}
