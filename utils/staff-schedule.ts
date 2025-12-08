import { RRule } from 'rrule';
import { AvailabilityEvent } from '@/types/staff-availability';

export const filterEventsByCenter = (
  events: AvailabilityEvent[],
  selectedCenterIds: string[]
) => {
  return events.filter((event) => {
    // If the event has a center field, use it for filtering
    if (event.center && event.center._id) {
      return selectedCenterIds.includes(event.center._id);
    }

    // Fallback for legacy events without center field
    if (event.hostType === 'CENTER') {
      return selectedCenterIds.includes(event.host._id);
    }
    if (event.hostType === 'USER') {
      // Legacy: check if consultant works at any of the selected centers
      return event.host.profileData?.centers?.some((center) =>
        selectedCenterIds.includes(center._id)
      );
    }
    return false;
  });
};

export const getStaffMembers = (events: AvailabilityEvent[]) => {
  const unique = new Map();
  events.forEach((event) => {
    if (
      event.hostType === 'USER' &&
      event.host.userType === 'CONSULTANT' &&
      !unique.has(event.host._id)
    ) {
      unique.set(event.host._id, {
        id: event.host._id,
        email: event.host.email,
        name:
          `${event.host.profileData?.firstName || ''} ${
            event.host.profileData?.lastName || ''
          }`.trim() || event.host.email,
        specialty:
          event.host.profileData?.specialization ||
          event.host.profileData?.department ||
          'Consultant',
        avatar:
          event.host.profileData?.profilePicture ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&auto=format&q=80',
      });
    }
  });
  return Array.from(unique.values());
};

export const getCenterAvailabilities = (events: AvailabilityEvent[]) => {
  const map = new Map();
  events.forEach((event) => {
    if (event.hostType === 'CENTER') {
      if (!map.has(event.host._id)) {
        map.set(event.host._id, {
          id: event.host._id,
          name: event.host.name,
          events: [],
        });
      }
      map.get(event.host._id).events.push(event);
    }
  });
  return Array.from(map.values());
};

export const getAvailabilityForStaff = (
  events: AvailabilityEvent[],
  staffId: string
) => events.filter((e) => e.host._id === staffId && e.hostType === 'USER');

export const parseRecurrenceRule = (
  rule: AvailabilityEvent['recurrenceRule'],
  selectedDate: string
) => {
  try {
    if (!rule.rrule) return false;
    const cleanRule = rule.rrule.replace('RRULE:', '');
    const r = RRule.fromString(cleanRule);
    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);
    const occurrences = r.between(
      selDate,
      new Date(selDate.getTime() + 86400000 - 1),
      true
    );
    return occurrences.length > 0;
  } catch {
    return false;
  }
};

export const splitAvailabilitySlots = (
  events: AvailabilityEvent[],
  selectedDate: string
) => {
  const visibleEvents = events.filter((event) => {
    const willShow = parseRecurrenceRule(event.recurrenceRule, selectedDate);
    return willShow;
  });

  const availableEvents = visibleEvents.filter((event) => event.isAvailable);
  const unavailableEvents = visibleEvents.filter((event) => !event.isAvailable);

  const splitSlots: Array<{
    startTime: number;
    endTime: number;
    isAvailable: boolean;
    title: string;
    event: AvailabilityEvent;
  }> = [];

  unavailableEvents.forEach((unavailEvent) => {
    splitSlots.push({
      startTime: unavailEvent.startTime,
      endTime: unavailEvent.endTime,
      isAvailable: false,
      title: unavailEvent.title,
      event: unavailEvent,
    });
  });

  availableEvents.forEach((availableEvent) => {
    let currentStartTime = availableEvent.startTime;

    const overlappingUnavailable = unavailableEvents
      .filter(
        (unavailEvent) =>
          unavailEvent.startTime >= availableEvent.startTime &&
          unavailEvent.startTime < availableEvent.endTime
      )
      .sort((a, b) => a.startTime - b.startTime);

    if (overlappingUnavailable.length === 0) {
      splitSlots.push({
        startTime: availableEvent.startTime,
        endTime: availableEvent.endTime,
        isAvailable: true,
        title: availableEvent.title,
        event: availableEvent,
      });
    } else {
      overlappingUnavailable.forEach((unavailEvent) => {
        if (currentStartTime < unavailEvent.startTime) {
          splitSlots.push({
            startTime: currentStartTime,
            endTime: unavailEvent.startTime,
            isAvailable: true,
            title: availableEvent.title,
            event: availableEvent,
          });
        }

        currentStartTime = unavailEvent.endTime;
      });

      if (currentStartTime < availableEvent.endTime) {
        splitSlots.push({
          startTime: currentStartTime,
          endTime: availableEvent.endTime,
          isAvailable: true,
          title: availableEvent.title,
          event: availableEvent,
        });
      }
    }
  });

  return splitSlots.sort((a, b) => a.startTime - b.startTime);
}; 