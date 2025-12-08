import { StaffMember, AvailabilityEvent, CenterAvailability } from '../types/staff-availability';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&auto=format&q=80';

export const filterEventsByCenter = (
  availabilityEvents: AvailabilityEvent[],
  selectedCenterIds: string[]
) => {
  console.log('🔍 GANTT FILTER DEBUG - Input:', {
    availabilityEventsCount: availabilityEvents?.length || 0,
    selectedCenterIds,
    firstEvent: availabilityEvents?.[0]
  });
  
  if (!availabilityEvents || availabilityEvents.length === 0) {
    console.log('❌ GANTT FILTER - No availability events');
    return [];
  }
  
  if (!selectedCenterIds || selectedCenterIds.length === 0) {
    console.log('❌ GANTT FILTER - No selected center IDs');
    return [];
  }
  
  // Filter events: show CENTER events for selected centers + USER events for consultants assigned to selected centers
  const filtered = availabilityEvents.filter((event) => {
    if (event.hostType === 'CENTER') {
      // Show center events only for selected centers
      return selectedCenterIds.includes(event.host._id);
    }
    
    if (event.hostType === 'USER' && event.host.userType === 'CONSULTANT') {
      // Filter by the center field on the event (if it exists)
      if (event.center && event.center._id) {
        return selectedCenterIds.includes(event.center._id);
      }
      // Fallback for legacy events without center field
      return event.host.profileData?.centers?.some((center) =>
        selectedCenterIds.includes(center._id)
      );
    }
    
    return false;
  });
  
  console.log('🎯 GANTT FILTER - Filtered events:', {
    originalCount: availabilityEvents.length,
    filteredCount: filtered.length,
    centerEvents: filtered.filter(e => e.hostType === 'CENTER').length,
    userEvents: filtered.filter(e => e.hostType === 'USER').length
  });
  
  return filtered;

};

export const getStaffMembers = (filteredEvents: AvailabilityEvent[]) => {
  console.log('👥 GANTT STAFF - Processing filtered events:', filteredEvents.length);
  
  const uniqueStaff = new Map();
  let logCount = 0;
  filteredEvents.forEach((event) => {
    if (
      event.hostType === 'USER' &&
      event.host.userType === 'CONSULTANT' &&
      !uniqueStaff.has(event.host._id)
    ) {
      const staffMember = {
        id: event.host._id,
        email: event.host.email,
        name:
          `${event.host.profileData?.firstName || ''} ${
            event.host.profileData?.lastName || ''
          }`.trim() || event.host.email,
        specialty:
          event.host.profileData?.designation ||
          event.host.profileData?.specialization ||
          event.host.profileData?.department ||
          'Consultant',
        avatar: event.host.profileData?.profilePicture || DEFAULT_AVATAR,
        status: event.isAvailable ? 'Available' : 'Unavailable',
      };
      
      if (logCount < 3) {
        console.log('👤 GANTT STAFF - Adding staff member:', staffMember);
        logCount++;
      }
      uniqueStaff.set(event.host._id, staffMember);
    }
  });
  
  const result = Array.from(uniqueStaff.values()) as StaffMember[];
  console.log('👥 GANTT STAFF - Final staff members:', result.length);
  
  return result;
};

export const getCenterAvailabilities = (filteredEvents: AvailabilityEvent[]) => {
  console.log('🏢 GANTT CENTER - Processing filtered events:', filteredEvents.length);
  
  const centers = new Map();
  filteredEvents.forEach((event) => {
    if (event.hostType === 'CENTER') {
      if (!centers.has(event.host._id)) {
        const centerData = {
          id: event.host._id,
          name: event.host.name,
          events: [],
        };
        console.log('🏢 GANTT CENTER - Adding center:', centerData);
        centers.set(event.host._id, centerData);
      }
      centers.get(event.host._id).events.push(event);
    }
  });
  
  const result = Array.from(centers.values()) as CenterAvailability[];
  console.log('🏢 GANTT CENTER - Final centers:', result.length);
  
  return result;
};

export const getAvailabilityForStaff = (
  filteredEvents: AvailabilityEvent[],
  staffId: string
) => {
  const result = filteredEvents.filter(
    (event) =>
      event.hostType === 'USER' &&
      event.host._id === staffId &&
      event.host.userType === 'CONSULTANT'
  );
  
  // Only log for first 3 staff members
  if (Math.random() < 0.1) { // Random sampling to reduce logs
    console.log('👤 GANTT STAFF AVAILABILITY - For staff:', {
      staffId: staffId.substring(0, 8) + '...',
      eventsFound: result.length
    });
  }
  
  return result;
}; 