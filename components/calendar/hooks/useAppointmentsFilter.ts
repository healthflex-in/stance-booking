import React from 'react';
import { AppointmentEvent } from '@/gql/graphql';

/**
 * Custom hook to filter appointments based on selected consultants
 */
export function useAppointmentsFilter(
  appointments: Array<AppointmentEvent>,
  selectedConsultantIds: string[] = []
) {
  return React.useMemo(() => {
    if (!selectedConsultantIds.length) return appointments;

    return appointments.filter((apt) => {
      const consultant = apt.appointment?.consultant;
      // If "unassigned" is selected, show appointments with no consultant
      if (selectedConsultantIds.includes('unassigned') && !consultant) {
        return true;
      }
      // Otherwise, show appointments with selected consultants
      return consultant && selectedConsultantIds.includes(consultant._id);
    });
  }, [appointments, selectedConsultantIds]);
}
