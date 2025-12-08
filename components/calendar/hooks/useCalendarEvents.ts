'use client';

import React from 'react';
import { useQuery } from '@apollo/client';

import { EventType, AppointmentEvent, AvailabilityEvent, AppointmentStatus } from '@/gql/graphql';
import { GET_APPOINTMENTS, GET_AVAILABILITY_EVENTS } from '@/gql/queries';
import { isSessionExpired, handleSessionExpiry } from '@/utils/session-utils';

/**
 * Custom hook to fetch calendar appointment and availability data
 * Consolidates query logic in one place
 */
export function useCalendarEvents(
  startDate: Date,
  endDate: Date,
  selectedCenterIds: string[],
  selectedConsultants: string[],
  limit: number = 1000, // Add limit parameter with default 1000 (backward compatible)
  isMobile: boolean = false // Add mobile flag for mobile-specific behavior
) {


  // Debug center IDs
  const filteredCenterIds = selectedCenterIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
  console.log('🔍 Calendar Events Debug:', {
    originalCenterIds: selectedCenterIds,
    filteredCenterIds,
    isSkipping: selectedCenterIds.length === 0 || selectedCenterIds.every(id => !id || id.trim().length === 0)
  });

  // Fetch appointments with pagination
  const {
    data: eventsData,
    loading: eventsLoading,
    refetch: refetchEventsRaw,
    error: eventsError,
  } = useQuery(GET_APPOINTMENTS, {
    variables: {
      filter: {
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        eventType: 'APPOINTMENT',
        attendees:
          selectedConsultants.length > 0
            ? selectedConsultants.filter((id) => id !== 'unassigned')
            : undefined,
        appointmentFilter: {
          center: filteredCenterIds,
        },
      },
      pagination: {
        limit: limit,
      },
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: selectedCenterIds.length === 0 || selectedCenterIds.every(id => !id || id.trim().length === 0),
    onCompleted: (data) => {
      // Data received successfully
    },
    onError: (error) => {
      if (isSessionExpired(error)) {
        handleSessionExpiry();
      }
    },
  });

  // Fetch availability events with pagination - keep original behavior for backward compatibility
  const {
    data: availabilityData,
    loading: availabilityLoading,
    refetch: refetchAvailabilityEventsRaw,
    error: availabilityError,
  } = useQuery(GET_AVAILABILITY_EVENTS, {
    variables: {
      filter: {
        eventType: EventType.Availability,
      },
      pagination: {
        limit: limit,
      },
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    skip: selectedCenterIds.length === 0 || selectedCenterIds.every(id => !id || id.trim().length === 0),
    onCompleted: (data) => {
      // Data received successfully
    },
    onError: (error) => {
      if (isSessionExpired(error)) {
        handleSessionExpiry();
      }
    },
  });

  // Process appointments data using GraphQL types
  const appointments = React.useMemo(() => {
    if (!eventsData?.events?.data) {
      return [];
    }

    return eventsData.events.data
      .filter((event: AppointmentEvent) => {
        // Filter out cancelled appointments
        return event.appointment?.status !== AppointmentStatus.Cancelled;
      })
      .map((event: AppointmentEvent) => ({
        ...event,
        startTime: new Date(event.startTime).getTime(),
        endTime: new Date(event.endTime).getTime(),
      }));
  }, [eventsData, isMobile]);

  // Process availability events using GraphQL types
  const availabilityEvents = React.useMemo(() => {
    if (!availabilityData?.events?.data) {
      return [];
    }

    const events = availabilityData.events.data as AvailabilityEvent[];
    
    // For desktop, filter by center - show CENTER events for selected centers + USER events for consultants assigned to selected centers
    if (!isMobile && selectedCenterIds.length > 0) {
      return events.filter((event: AvailabilityEvent) => {
        // Show center events only for selected centers
        if (event.hostType === 'CENTER') {
          const eventCenter = event.host?._id;
          return eventCenter ? selectedCenterIds.includes(eventCenter) : false;
        }

        // Show consultant events only if they're assigned to a selected center
        if (event.hostType === 'USER' && (event.host as any)?.userType === 'CONSULTANT') {
          // Filter by the center field on the event (if it exists)
          if (event.center && event.center._id) {
            return selectedCenterIds.includes(event.center._id);
          }
          // Fallback for legacy events without center field
          return (event.host as any)?.profileData?.centers?.some((center: any) =>
            selectedCenterIds.includes(center._id)
          );
        }

        return false;
      });
    }

    return events;
  }, [availabilityData, selectedCenterIds, isMobile]);

  // Use useCallback to stabilize the refetch function reference
  const refetch = React.useCallback(() => {
    refetchEventsRaw();
    refetchAvailabilityEventsRaw();
  }, [refetchEventsRaw, refetchAvailabilityEventsRaw]);



  return {
    refetch,
    appointments,
    loading: eventsLoading || availabilityLoading,
    availabilityEvents,
    appointmentsPagination: eventsData?.events?.pagination,
    availabilityPagination: availabilityData?.events?.pagination,
    // Only include errors for mobile to maintain backward compatibility
    ...(isMobile && {
      errors: {
        eventsError,
        availabilityError,
      },
    }),
  };
}
