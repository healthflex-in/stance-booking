import React from 'react';
import { StaffScheduleGanttProps, AvailabilityEvent } from '@/types/staff-availability';
import {
  filterEventsByCenter,
  getStaffMembers,
  getCenterAvailabilities,
  getAvailabilityForStaff,
  splitAvailabilitySlots,
} from '@/utils/staff-schedule';

export function useStaffScheduleData({
  selectedDate,
  availabilityEvents = [],
  loading = false,
  selectedCenterIds,
}: StaffScheduleGanttProps) {
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);

  const filteredEvents = React.useMemo(
    () => filterEventsByCenter(availabilityEvents, selectedCenterIds),
    [availabilityEvents, selectedCenterIds]
  );

  const staffMembers = React.useMemo(
    () => getStaffMembers(filteredEvents),
    [filteredEvents]
  );

  const centerAvailabilities = React.useMemo(
    () => getCenterAvailabilities(filteredEvents),
    [filteredEvents]
  );

  const getStaffAvailability = (staffId: string) =>
    getAvailabilityForStaff(filteredEvents, staffId);

  const getSplitSlots = (events: AvailabilityEvent[]) =>
    splitAvailabilitySlots(events, selectedDate);

  return {
    timeSlots,
    hasData: staffMembers.length > 0 || centerAvailabilities.length > 0,
    loading,
    staffMembers,
    centerAvailabilities,
    getStaffAvailability,
    getSplitSlots,
  };
}
