import { RRule } from 'rrule';
import {
  AvailabilityEvent,
  AvailabilitySlot,
} from '@/types/staff-availability';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&auto=format&q=80';

export const parseRecurrenceRule = (
  rule: AvailabilityEvent['recurrenceRule'],
  event: AvailabilityEvent,
  selectedDate: string
) => {
  try {
    if (!rule?.rrule) return false;

    const cleanRule = rule.rrule.replace('RRULE:', '');
    const rruleInstance = RRule.fromString(cleanRule);

    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (rruleInstance.options.count === 1) {
      if (!rule.startDate) {
        console.error(
          'Recurrence rule startDate is missing for one-time event.'
        );
        return false;
      }

      let eventUTCDatestr: string;

      if (typeof rule.startDate === 'string') {
        eventUTCDatestr = rule.startDate.split('T')[0];
      } else if (typeof rule.startDate === 'number') {
        eventUTCDatestr = new Date(rule.startDate).toISOString().split('T')[0];
      } else {
        console.error(
          'Recurrence rule startDate for one-time event has unexpected type:',
          rule.startDate
        );
        return false;
      }
      return eventUTCDatestr === selectedDate;
    }

    const occurrences = rruleInstance.between(
      selectedDateObj,
      new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000 - 1),
      true
    );

    return occurrences.length > 0;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return false;
  }
};

export const splitAvailabilitySlots = (
  events: AvailabilityEvent[],
  selectedDate: string
): AvailabilitySlot[] => {
  const visibleEvents = events.filter((event) => {
    const willShow = parseRecurrenceRule(
      event.recurrenceRule,
      event,
      selectedDate
    );
    return willShow;
  });

  const availableEvents = visibleEvents.filter((event) => event.isAvailable);
  const unavailableEvents = visibleEvents.filter((event) => !event.isAvailable);

  const splitSlots: AvailabilitySlot[] = [];

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

export const normalizeTime = (time: number | string): number => {
  if (typeof time === 'number') {
    return time;
  }
  const cleanTime = time.replace(':', '');
  return parseInt(cleanTime);
};

export const getMinutesFromTime = (time: number) => {
  const timeStr = time.toString().padStart(4, '0');
  const hours = parseInt(timeStr.slice(0, 2));
  const minutes = parseInt(timeStr.slice(2));
  return hours * 60 + minutes;
};

export const calculatePositionAndWidth = (
  startTime: number,
  endTime: number,
  blockStartHour: number,
  cellWidth: number,
  cellGap: number
) => {
  const startMinutes = getMinutesFromTime(startTime);
  const endMinutes = getMinutesFromTime(endTime);
  const blockStartMinutes = blockStartHour * 60;

  const offsetFromBlockStart = startMinutes - blockStartMinutes;
  const left = (offsetFromBlockStart / 60) * (cellWidth + cellGap);

  const durationMinutes = endMinutes - startMinutes;
  const width = (durationMinutes / 60) * (cellWidth + cellGap);

  return {
    width: Math.max(width, 70),
    left,
  };
};

export const formatHourTo12Hour = (hour: number) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${ampm}`;
};

export { DEFAULT_AVATAR };
