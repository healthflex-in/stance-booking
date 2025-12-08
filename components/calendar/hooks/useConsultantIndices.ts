import React from 'react';

import { AppointmentEvent } from '@/gql/graphql';

/**
 * Custom hook to create a map of consultant IDs to their indices for color coding
 */
export function useConsultantIndices(appointments: Array<AppointmentEvent>) {
  return React.useMemo(() => {
    const indices: { [key: string]: number } = {};
    appointments.forEach((apt) => {
      const consultant = apt.appointment?.consultant;
      if (consultant && !indices[consultant._id]) {
        indices[consultant._id] = Object.keys(indices).length;
      }
    });
    return indices;
  }, [appointments]);
}
