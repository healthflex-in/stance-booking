import React from 'react';
import { AvailabilityEvent } from '../types/staff-availability';
import {
  filterEventsByCenter,
  getStaffMembers,
  getCenterAvailabilities,
  getAvailabilityForStaff,
} from '../utils/gantt-data';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&auto=format&q=80';

export const useGanttData = (
  availabilityEvents: AvailabilityEvent[],
  selectedCenterIds: string[],
  selectedDate: string,
  consultants: any[] = []
) => {
  // First filter events by center (center events + all consultant events)
  const centerFilteredEvents = React.useMemo(
    () => filterEventsByCenter(availabilityEvents, selectedCenterIds),
    [availabilityEvents, selectedCenterIds]
  );
  
  // Then filter consultant events to only show events for consultants assigned to selected centers
  const filteredEvents = React.useMemo(() => {
    const consultantIds = new Set(consultants.map(c => c._id));
    
    return centerFilteredEvents.filter(event => {
      if (event.hostType === 'CENTER') {
        // Keep all center events (already filtered by selected centers)
        return true;
      }
      
      if (event.hostType === 'USER' && event.host.userType === 'CONSULTANT') {
        // Only keep consultant events for consultants assigned to selected centers
        return consultantIds.has(event.host._id);
      }
      
      return false;
    });
  }, [centerFilteredEvents, consultants]);

  const staffMembers = React.useMemo(() => {
    // Get staff from availability events
    const staffFromEvents = getStaffMembers(filteredEvents);
    
    // Get all consultants from direct query
    const allConsultants = consultants.map((consultant: any) => ({
      id: consultant._id,
      email: consultant.email,
      name: `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() || consultant.email,
      specialty: consultant.profileData?.designation || consultant.profileData?.specialization || consultant.profileData?.department || 'Consultant',
      avatar: consultant.profileData?.profilePicture || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&auto=format&q=80',
      status: 'Available', // Default status for consultants without events
    }));
    
    // Merge and deduplicate
    const staffMap = new Map();
    
    // Add consultants from direct query first
    allConsultants.forEach(consultant => {
      staffMap.set(consultant.id, consultant);
    });
    
    // Override with data from events (which may have more accurate status)
    staffFromEvents.forEach(staff => {
      staffMap.set(staff.id, staff);
    });
    
    return Array.from(staffMap.values());
  }, [filteredEvents, consultants]);

  const centerAvailabilities = React.useMemo(
    () => getCenterAvailabilities(filteredEvents),
    [filteredEvents]
  );

  const getStaffAvailability = (staffId: string) =>
    getAvailabilityForStaff(filteredEvents, staffId);

  return {
    staffMembers,
    filteredEvents,
    centerAvailabilities,
    getAvailabilityForStaff: getStaffAvailability,
  };
};
