import React from 'react';
import { RRule } from "rrule";
import { AvailabilityEvent, AvailabilityStatus, EventHostType } from '@/gql/graphql';
/**
 * Custom hook for processing consultant unavailability events
 */
export function useConsultantUnavailability(
  availabilityEvents: AvailabilityEvent[],
  currentDate: Date,
  selectedConsultantIds?: string[]
) {
  interface RecurrenceRule {
    rrule?: string;
    startDate?: string | number;
  }
  const parseRecurrenceRule = React.useCallback((rule: RecurrenceRule, event: AvailabilityEvent) => {
    try {
      if (!rule?.rrule) return false;
      const cleanRule = rule.rrule.replace('RRULE:', '');
      const rruleInstance = RRule.fromString(cleanRule);
      const selectedDateObj = new Date(currentDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      // If it's a one-time event (justToday or oneTime)
      if (rruleInstance.options.count === 1) {
        if (!rule.startDate) {
          return false;
        }
        let eventDate: Date;
        if (typeof rule.startDate === 'string') {
          eventDate = new Date(rule.startDate);
        } else if (typeof rule.startDate === 'number') {
          eventDate = new Date(rule.startDate);
        } else {
          return false;
        }
        // Compare only the date parts (year, month, day)
        return eventDate.toDateString() === selectedDateObj.toDateString();
      }
    // For recurring events, check if there's an occurrence on the selected date
      const occurrences = rruleInstance.between(
        selectedDateObj,
        new Date(selectedDateObj.getTime() + 24 * 60 * 60 * 1000 - 1),
        true
      );
      return occurrences.length > 0;
    } catch (error) {
      return false;
    }
  }, [currentDate]);
  return React.useMemo(() => {
    const unavailabilityByConsultant: { [consultantId: string]: AvailabilityEvent[] } = {};
    if (!availabilityEvents) return unavailabilityByConsultant;
    
    // Filter events to only include selected consultants (if provided)
    const filteredEvents = selectedConsultantIds && selectedConsultantIds.length > 0 
      ? availabilityEvents.filter(event => {
          if (event.hostType === 'CENTER') {
            // Keep all center events
            return true;
          }
          if (event.hostType === 'USER') {
            // Only keep events for selected consultants
            return selectedConsultantIds.includes(event.host._id);
          }
          return false;
        })
      : availabilityEvents;
    
    filteredEvents.forEach((event) => {
      // Show all availability events (available, unavailable, leave, holiday, interview, break, etc.)
      // Check if this event is for the current date
      let shouldShowOnCurrentDate = false;
      // For events with recurrence rule
      if (event.recurrenceRule?.rrule) {
        shouldShowOnCurrentDate = parseRecurrenceRule(event.recurrenceRule, event);
      } else {
        // For non-recurring events, check if the event date matches current date
        const eventDate = new Date(event.recurrenceRule?.startDate || event.startTime || 0);
        const currentDateOnly = new Date(currentDate);
        currentDateOnly.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        shouldShowOnCurrentDate = eventDate.getTime() === currentDateOnly.getTime();
      }
      if (!shouldShowOnCurrentDate) {
        return; // Skip events that shouldn't show on current date
      }
      // Process the event based on host type
      if (event.hostType === EventHostType.User) {
        const consultantId = event.host._id;

        if (!unavailabilityByConsultant[consultantId]) {
          unavailabilityByConsultant[consultantId] = [];
        }
        unavailabilityByConsultant[consultantId].push(event);
      } else if (event.hostType === EventHostType.Center) {
        event.attendees?.forEach(attendee => {
          const consultantId = attendee._id;

          if (!unavailabilityByConsultant[consultantId]) {
            unavailabilityByConsultant[consultantId] = [];
          }
          unavailabilityByConsultant[consultantId].push(event);
        });
      }
    });

    return unavailabilityByConsultant;
  }, [availabilityEvents, parseRecurrenceRule, currentDate, selectedConsultantIds]);
}
