import { useState, useEffect, useMemo } from 'react';
import { useApolloClient } from '@apollo/client';
import { RRule } from 'rrule';
import { GET_CONSULTANTS, GET_AVAILABILITY_EVENTS, GET_APPOINTMENTS_SAFE } from '@/gql/queries';

interface TimeSlot {
  startTime: number;
  endTime: number;
  consultantId: string;
}

interface UseAvailableSlotsParams {
  centerId: string;
  date: Date;
  serviceDurationInMinutes?: number;
  consultantId?: string | null;
  isReturningUser?: boolean;
  consultantIds?: string[];
  preFilteredConsultants?: any[];
}

interface UseAvailableSlotsReturn {
  availableSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper functions
function roundToNext15Minutes(timestamp: number): number {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  
  if (roundedMinutes >= 60) {
    date.setHours(date.getHours() + 1, 0, 0, 0);
  } else {
    date.setMinutes(roundedMinutes, 0, 0);
  }
  
  return date.getTime();
}

function roundToPrevious15Minutes(timestamp: number): number {
  const date = new Date(timestamp);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 15) * 15;
  date.setMinutes(roundedMinutes, 0, 0);
  return date.getTime();
}

function roundTimeSlots(slots: TimeSlot[]): TimeSlot[] {
  return slots.map(slot => ({
    ...slot,
    startTime: roundToNext15Minutes(slot.startTime),
    endTime: roundToNext15Minutes(slot.endTime)
  })).filter(slot => slot.startTime < slot.endTime);
}

function unionTimeRanges(slots: TimeSlot[]): TimeSlot[] {
  if (!slots || slots.length === 0) return [];
  
  const sortedSlots = slots.map(s => ({ ...s })).sort((a, b) => a.startTime - b.startTime);
  const merged: TimeSlot[] = [];
  
  if (sortedSlots.length === 0) return merged;
  
  let currentMerge = sortedSlots[0];
  
  for (let i = 1; i < sortedSlots.length; i++) {
    const nextSlot = sortedSlots[i];
    if (nextSlot.startTime <= currentMerge.endTime) {
      currentMerge.endTime = Math.max(currentMerge.endTime, nextSlot.endTime);
    } else {
      merged.push(currentMerge);
      currentMerge = nextSlot;
    }
  }
  merged.push(currentMerge);
  return merged.filter(slot => slot.startTime < slot.endTime);
}

function subtractTimeRanges(baseSlots: TimeSlot[], slotsToSubtract: TimeSlot[]): TimeSlot[] {
  let result = baseSlots.map(s => ({ ...s }));
  
  for (const sub of slotsToSubtract) {
    const nextResult: TimeSlot[] = [];
    for (const base of result) {
      if (base.endTime <= sub.startTime || base.startTime >= sub.endTime) {
        nextResult.push(base);
        continue;
      }
      if (sub.startTime <= base.startTime && sub.endTime >= base.endTime) {
        continue;
      }
      if (base.startTime < sub.startTime && base.endTime > sub.endTime) {
        nextResult.push({ startTime: base.startTime, endTime: sub.startTime, consultantId: base.consultantId });
        nextResult.push({ startTime: sub.endTime, endTime: base.endTime, consultantId: base.consultantId });
        continue;
      }
      if (sub.startTime <= base.startTime && sub.endTime > base.startTime && sub.endTime < base.endTime) {
        nextResult.push({ startTime: sub.endTime, endTime: base.endTime, consultantId: base.consultantId });
        continue;
      }
      if (sub.startTime > base.startTime && sub.startTime < base.endTime && sub.endTime >= base.endTime) {
        nextResult.push({ startTime: base.startTime, endTime: sub.startTime, consultantId: base.consultantId });
        continue;
      }
      nextResult.push(base);
    }
    result = nextResult;
  }
  return result.filter(slot => slot.startTime < slot.endTime);
}

export const useAvailableSlots = ({
  centerId,
  date,
  serviceDurationInMinutes = 75,
  consultantId = null,
  isReturningUser = false,
  consultantIds = [],
  preFilteredConsultants = []
}: UseAvailableSlotsParams): UseAvailableSlotsReturn => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, TimeSlot[]>>(new Map());
  const client = useApolloClient();

  const startOfDayTime = useMemo(() => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [date]);

  const endOfDayTime = useMemo(() => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [date]);

  const hhmmToTimestamp = (hhmm: number, baseDate: Date): number | null => {
    const newDate = new Date(baseDate);
    const hours = Math.floor(hhmm / 100);
    const mins = hhmm % 100;

    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
      console.error(`Invalid HHMM value: ${hhmm}`);
      return null;
    }

    newDate.setHours(hours, mins, 0, 0);
    return newDate.getTime();
  };

  const isDateInRecurrenceRule = (date: Date, recurrenceRule: any): boolean => {
    if (!recurrenceRule?.rrule) return false;

    try {
      const ruleActualStart = new Date(recurrenceRule.startDate);
      const ruleActualEnd = new Date(recurrenceRule.endDate);
      const queryDayStart = new Date(date);
      const queryDayEnd = new Date(date);
      queryDayEnd.setHours(23, 59, 59, 999);

      if (queryDayEnd < ruleActualStart || queryDayStart > ruleActualEnd) {
        return false;
      }

      const rruleObj = RRule.fromString(recurrenceRule.rrule);
      const effectiveOptions = { ...rruleObj.origOptions };
      effectiveOptions.dtstart = new Date(recurrenceRule.startDate);

      if (recurrenceRule.endDate) {
        const ruleOverallEndDateFromDB = new Date(recurrenceRule.endDate);
        let currentUntilInOptions = effectiveOptions.until;
        if (currentUntilInOptions && !(currentUntilInOptions instanceof Date)) {
          currentUntilInOptions = new Date(currentUntilInOptions);
        }

        if (!currentUntilInOptions || ruleOverallEndDateFromDB < currentUntilInOptions) {
          effectiveOptions.until = ruleOverallEndDateFromDB;
        }
      }

      const rule = new RRule(effectiveOptions);
      const occurrences = rule.between(queryDayStart, queryDayEnd, true);
      return occurrences.length > 0;
    } catch (error) {
      console.error('Error checking recurrence rule:', error);
      return false;
    }
  };

  const processAvailabilityEvents = (events: any[], date: Date, targetStatusType: 'POSITIVE' | 'NEGATIVE'): TimeSlot[] => {
    return events
      .filter(event => {
        const isActive = event.isActive;
        let hasTargetStatus;

        if (targetStatusType === 'POSITIVE') {
          hasTargetStatus = event.availabilityStatus === 'AVAILABLE' && event.isAvailable === true;
        } else {
          hasTargetStatus = (
            ['UNAVAILABLE', 'HOLIDAY', 'MEETING', 'LEAVE', 'INTERVIEW'].includes(event.availabilityStatus) ||
            event.isAvailable === false
          );
        }
        const matchesRecurrence = isDateInRecurrenceRule(date, event.recurrenceRule);

        return isActive && hasTargetStatus && matchesRecurrence;
      })
      .map(event => {
        const slotEventStartTime = hhmmToTimestamp(event.startTime, date);
        const slotEventEndTime = hhmmToTimestamp(event.endTime, date);

        if (slotEventStartTime === null || slotEventEndTime === null) {
          return null;
        }

        if (slotEventStartTime >= slotEventEndTime) {
          return null;
        }

        return {
          startTime: slotEventStartTime,
          endTime: slotEventEndTime,
          consultantId: ''
        };
      }).filter(Boolean) as TimeSlot[];
  };

  const fetchAvailableSlots = async () => {
    if (!centerId || !date) return;

    console.log('\n' + '='.repeat(80));
    console.log(`🏥 SLOT ANALYSIS FOR ${date.toDateString().toUpperCase()}`);
    console.log('='.repeat(80));
    console.log(`📍 Center ID: ${centerId}`);
    console.log(`⏰ Service Duration: ${serviceDurationInMinutes} minutes`);
    console.log(`👤 User Type: ${isReturningUser ? 'Returning' : 'New'} User`);
    if (consultantId) console.log(`🎯 Target Consultant: ${consultantId}`);

    // Create cache key
    const cacheKey = `${centerId}-${date.toDateString()}-${serviceDurationInMinutes}-${consultantId}-${isReturningUser}`;
    
    // Check if data is already cached
    if (cache.has(cacheKey)) {
      console.log('📦 Using cached data');
      setAvailableSlots(cache.get(cacheKey) || []);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch center appointments using safe query
      const centerAppointmentsPromise = client.query({
        query: GET_APPOINTMENTS_SAFE,
        variables: {
          filter: {
            startDate: startOfDayTime.getTime(),
            endDate: endOfDayTime.getTime(),
            eventType: 'APPOINTMENT',
            host: centerId,
            hostType: 'CENTER'
          },
          pagination: { limit: 1000, direction: 'FORWARD' }
        }
      });

      // Fetch center availability
      const centerAvailabilityPromise = client.query({
        query: GET_AVAILABILITY_EVENTS,
        variables: {
          filter: {
            eventType: 'AVAILABILITY',
            host: centerId,
            hostType: 'CENTER'
          },
          pagination: { limit: 1000, direction: 'FORWARD' }
        }
      });

      // Use pre-filtered consultants if provided, otherwise fetch all
      let centerConsultants: any[] = [];
      let centerAppointmentsData: any;
      let centerAvailabilityData: any;

      if (preFilteredConsultants && preFilteredConsultants.length > 0) {
        // Use pre-filtered consultants - skip GET_CONSULTANTS query
        centerConsultants = preFilteredConsultants;
        
        const [appointmentsData, availabilityData] = await Promise.all([
          centerAppointmentsPromise,
          centerAvailabilityPromise
        ]);
        
        centerAppointmentsData = appointmentsData;
        centerAvailabilityData = availabilityData;
      } else {
        // Fetch consultants from API
        const consultantsPromise = client.query({
          query: GET_CONSULTANTS,
          variables: {
            userType: 'CONSULTANT',
            centerId: [centerId],
            pagination: { limit: 100, direction: 'FORWARD' }
          }
        });

        const [appointmentsData, availabilityData, consultantsData] = await Promise.all([
          centerAppointmentsPromise,
          centerAvailabilityPromise,
          consultantsPromise
        ]);

        centerAppointmentsData = appointmentsData;
        centerAvailabilityData = availabilityData;

        const allConsultants = consultantsData.data?.users?.data || [];
        
        // Filter consultants based on provided IDs or default criteria
        centerConsultants = consultantIds && consultantIds.length > 0
          ? allConsultants.filter((c: any) => consultantIds.includes(c._id) && c.isActive === true)
          : allConsultants.filter((c: any) => 
              c.isActive === true && c.profileData?.designation === 'Physiotherapist'
            );
      }
      
      console.log('\n' + '🏥 CENTER CONSULTANTS ANALYSIS'.padEnd(50, '-'));
      console.log(`📊 Total Consultants Fetched: ${preFilteredConsultants.length > 0 ? 'Pre-filtered' : 'From API'}`);
      console.log(`🩺 Active Consultants: ${centerConsultants.length}`);
      
      console.log('\n👥 CONSULTANT DETAILS:');
      centerConsultants.forEach((consultant:any , idx:any) => {
        console.log(`${idx + 1}. ${consultant.profileData?.firstName} ${consultant.profileData?.lastName}`);
        console.log(`   ID: ${consultant._id}`);
        console.log(`   Active: ${consultant.isActive}`);
        console.log(`   Phone: ${consultant.phone}`);
        console.log(`   Email: ${consultant.email}`);
      });
      
      // Process booked slots
      const bookedSlots: TimeSlot[] = [];
      const rawBookedEvents = centerAppointmentsData.data?.events?.data || [];
      
      // Process appointments based on user type
      if (!isReturningUser) {
        // For new users, we'll handle booked slots per consultant in the individual loop
      } else {
        // For returning users, only get appointments for the specific consultant
        const consultantSpecificAppointments = rawBookedEvents.filter((event:any) => {
          // Check if consultant is in attendees array
          const isAttendee = event.attendees?.some((attendee: any) => attendee._id === consultantId);
          // Check if consultant is the host
          const isHost = event.host === consultantId;
          return isAttendee || isHost;
        });
        
        console.log(`\n📅 RETURNING USER APPOINTMENTS FOR CONSULTANT ${consultantId}:`);
        console.log(`📊 Total Appointments: ${consultantSpecificAppointments.length}`);
        if (consultantSpecificAppointments.length > 0) {
          consultantSpecificAppointments.forEach((apt:any, idx:any) => {
            const start = new Date(apt.startTime);
            const end = new Date(apt.endTime);
            console.log(`${idx + 1}. 📅 ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
            console.log(`   👤 Patient: ${apt.title?.split(' with ')[1]?.split(' at ')[0] || 'Unknown'}`);
            console.log(`   🏷️ Status: ${apt.isWaitlisted ? 'WAITLISTED' : 'CONFIRMED'}`);
          });
        }
        
        const uniqueBookedSlotsMap = new Map();
        for (const event of consultantSpecificAppointments) {
          if (event && typeof event.startTime === 'number' && typeof event.endTime === 'number') {
            const key = `${event.startTime}-${event.endTime}`;
            if (!uniqueBookedSlotsMap.has(key)) {
              const slot = {
                startTime: event.startTime,
                endTime: event.endTime
              };
              uniqueBookedSlotsMap.set(key, slot);
            }
          }
        }
        bookedSlots.push(...Array.from(uniqueBookedSlotsMap.values()));
      }

      // Process center availability
      const centerEvents = centerAvailabilityData.data?.events?.data || [];
      
      console.log('\n' + '🏢 CENTER AVAILABILITY ANALYSIS'.padEnd(50, '-'));
      console.log(`📊 Total Center Events: ${centerEvents.length}`);
      
      if (centerEvents.length > 0) {
        console.log('\n📋 CENTER AVAILABILITY EVENTS:');
        centerEvents.forEach((event:any, idx:any) => {
          const start = event.startTime ? new Date(hhmmToTimestamp(event.startTime, startOfDayTime) || 0) : null;
          const end = event.endTime ? new Date(hhmmToTimestamp(event.endTime, startOfDayTime) || 0) : null;
          const matchesDate = isDateInRecurrenceRule(startOfDayTime, event.recurrenceRule);
          
          console.log(`${idx + 1}. ${event.title || 'Untitled Event'}`);
          console.log(`   📅 Status: ${event.availabilityStatus} | Available: ${event.isAvailable}`);
          console.log(`   ⏰ Time: ${start?.toLocaleTimeString()} - ${end?.toLocaleTimeString()}`);
          console.log(`   🎯 Matches Date: ${matchesDate} | Active: ${event.isActive}`);
          if (event.recurrenceRule?.rrule) {
            console.log(`   🔄 Recurrence: ${event.recurrenceRule.rrule.split('\n')[1]}`);
          }
        });
      }
      
      const positiveCenterSlots = processAvailabilityEvents(
        centerEvents, 
        startOfDayTime, 
        'POSITIVE'
      );
      const negativeCenterSlots = processAvailabilityEvents(
        centerEvents, 
        startOfDayTime, 
        'NEGATIVE'
      );
      
      console.log('\n🟢 CENTER AVAILABLE TIMES:');
      if (positiveCenterSlots.length > 0) {
        positiveCenterSlots.forEach((slot, idx) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          console.log(`${idx + 1}. ✅ ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
        });
      } else {
        console.log('❌ NO AVAILABLE TIMES - Center is closed!');
      }
      
      console.log('\n🔴 CENTER BLOCKED TIMES:');
      if (negativeCenterSlots.length > 0) {
        negativeCenterSlots.forEach((slot, idx) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          console.log(`${idx + 1}. ❌ ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
        });
      } else {
        console.log('✅ No blocked times');
      }

      // Process consultant availability
      let finalPositiveConsultantSlots: TimeSlot[] = [];
      let finalNegativeConsultantSlots: TimeSlot[] = [];

      if (!isReturningUser) {
        // For new users, we'll generate slots per consultant individually (no union logic)
        finalPositiveConsultantSlots = [];
        finalNegativeConsultantSlots = [];
      } else {
        // Returning User
        if (consultantId) {
          const specificConsultantAvailabilityData = await client.query({
            query: GET_AVAILABILITY_EVENTS,
            variables: {
              filter: {
                eventType: 'AVAILABILITY',
                host: consultantId,
                hostType: 'USER'
              },
              pagination: { limit: 1000, direction: 'FORWARD' }
            }
          });

          const consultantEvents = specificConsultantAvailabilityData.data?.events?.data || [];

          // Filter by center - only include events from the selected center
          const filteredConsultantEvents = consultantEvents.filter((event: any) => {
            return event.center && event.center._id === centerId;
          });

          finalPositiveConsultantSlots = processAvailabilityEvents(
            filteredConsultantEvents,
            startOfDayTime,
            'POSITIVE'
          );
          finalNegativeConsultantSlots = processAvailabilityEvents(
            filteredConsultantEvents,
            startOfDayTime,
            'NEGATIVE'
          );
        } else {
          // RU without specific consultant - assume available all day
          finalPositiveConsultantSlots = [{ 
            startTime: startOfDayTime.getTime(), 
            endTime: endOfDayTime.getTime(),
            consultantId: consultantId || ''
          }];
          finalNegativeConsultantSlots = [];
        }
      }

      // Generate available time slots for each consultant
      const slots: TimeSlot[] = [];
      const slotDurationMinutes = serviceDurationInMinutes;

      // Create 7 AM to 8 PM window
      const dayStart = new Date(startOfDayTime);
      dayStart.setHours(7, 0, 0, 0);
      const dayEnd = new Date(startOfDayTime);
      dayEnd.setHours(20, 0, 0, 0);

      const workingHoursSlot = {
        startTime: dayStart.getTime(),
        endTime: dayEnd.getTime(),
        consultantId: ''
      };

      if (!isReturningUser) {
        console.log('\n' + '👨⚕️ INDIVIDUAL CONSULTANT ANALYSIS'.padEnd(60, '-'));
        
        // For first-time users, generate slots for each Physiotherapist consultant individually
        // Only show slots when the specific consultant is actually available
        for (const consultant of centerConsultants) {
          const consultantName = `${consultant.profileData?.firstName} ${consultant.profileData?.lastName}`;
          
          console.log('\n' + '─'.repeat(50));
          console.log(`👨⚕️ ANALYZING: ${consultantName.toUpperCase()}`);
          console.log(`🆔 ID: ${consultant._id}`);
          
          // Get consultant-specific appointments only
          // Check if consultant is in attendees array (appointments) or if they are the host
          const consultantAppointments = rawBookedEvents.filter((event:any) => {
            // Check if consultant is in attendees array
            const isAttendee = event.attendees?.some((attendee: any) => attendee._id === consultant._id);
            // Check if consultant is the host (for direct bookings)
            const isHost = event.host === consultant._id;
            return isAttendee || isHost;
          });
          
          console.log(`\n📅 APPOINTMENTS FOR ${consultantName}:`);
          console.log(`📊 Total Appointments: ${consultantAppointments.length}`);
          
          if (consultantAppointments.length > 0) {
            consultantAppointments.forEach((apt:any, idx:any) => {
              const start = new Date(apt.startTime);
              const end = new Date(apt.endTime);
              const patientName = apt.title?.split(' with ')[1]?.split(' at ')[0] || 'Unknown';
              
              console.log(`${idx + 1}. 📅 ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
              console.log(`   👤 Patient: ${patientName}`);
              console.log(`   🏷️ Status: ${apt.isWaitlisted ? 'WAITLISTED' : 'CONFIRMED'}`);
              console.log(`   🆔 Event ID: ${apt._id}`);
              console.log(`   👥 Attendees: ${apt.attendees?.length || 0} people`);
              if (apt.attendees?.length > 0) {
                apt.attendees.forEach((attendee: any, aIdx: number) => {
                  console.log(`      ${aIdx + 1}. ${attendee._id}`);
                });
              }
              console.log(`   🏢 Host: ${apt.host}`);
              console.log(`   📝 Description: ${apt.description || 'None'}`);
            });
          } else {
            console.log('✅ No appointments booked');
          }
          
          const consultantBookedSlots: TimeSlot[] = [];
          const uniqueConsultantSlotsMap = new Map();
          for (const event of consultantAppointments) {
            if (event && typeof event.startTime === 'number' && typeof event.endTime === 'number') {
              const key = `${event.startTime}-${event.endTime}`;
              if (!uniqueConsultantSlotsMap.has(key)) {
                const slot = {
                  startTime: event.startTime,
                  endTime: event.endTime
                };
                uniqueConsultantSlotsMap.set(key, slot);
              }
            }
          }
          consultantBookedSlots.push(...Array.from(uniqueConsultantSlotsMap.values()));

          // Get consultant's individual availability
          const consultantAvailabilityData = await client.query({
            query: GET_AVAILABILITY_EVENTS,
            variables: {
              filter: {
                eventType: 'AVAILABILITY',
                host: consultant._id,
                hostType: 'USER'
              },
              pagination: { limit: 1000, direction: 'FORWARD' }
            }
          });

          const consultantEvents = consultantAvailabilityData.data?.events?.data || [];

          // Filter by center - only include events from the selected center
          const filteredConsultantEvents = consultantEvents.filter((event: any) => {
            return event.center && event.center._id === centerId;
          });

          console.log(`\n🕐 AVAILABILITY EVENTS FOR ${consultantName}:`);
          console.log(`📊 Total Events: ${consultantEvents.length}`);
          console.log(`📊 Events for Selected Center: ${filteredConsultantEvents.length}`);

          if (filteredConsultantEvents.length > 0) {
            filteredConsultantEvents.forEach((event:any, idx:any) => {
              const start = event.startTime ? new Date(hhmmToTimestamp(event.startTime, startOfDayTime) || 0) : null;
              const end = event.endTime ? new Date(hhmmToTimestamp(event.endTime, startOfDayTime) || 0) : null;
              const matchesDate = isDateInRecurrenceRule(startOfDayTime, event.recurrenceRule);

              console.log(`${idx + 1}. ${event.title || 'Untitled'}`);
              console.log(`   📅 Status: ${event.availabilityStatus} | Available: ${event.isAvailable}`);
              console.log(`   ⏰ Time: ${start?.toLocaleTimeString()} - ${end?.toLocaleTimeString()}`);
              console.log(`   🎯 Matches Date: ${matchesDate} | Active: ${event.isActive}`);
            });
          } else {
            console.log('❌ No availability events found for this center');
          }

          const consultantPositiveSlots = processAvailabilityEvents(filteredConsultantEvents, startOfDayTime, 'POSITIVE');
          const consultantNegativeSlots = processAvailabilityEvents(filteredConsultantEvents, startOfDayTime, 'NEGATIVE');

          console.log(`\n🟢 AVAILABLE TIMES FOR ${consultantName}:`);
          if (consultantPositiveSlots.length > 0) {
            consultantPositiveSlots.forEach((slot, idx) => {
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              console.log(`${idx + 1}. ✅ ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
            });
          } else {
            console.log('❌ No available times');
          }
          
          console.log(`\n🔴 BLOCKED TIMES FOR ${consultantName}:`);
          if (consultantNegativeSlots.length > 0) {
            consultantNegativeSlots.forEach((slot, idx) => {
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              console.log(`${idx + 1}. ❌ ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
            });
          } else {
            console.log('✅ No blocked times');
          }

          // CRITICAL FIX: Only generate slots if consultant has positive availability
          if (consultantPositiveSlots.length === 0) {
            console.log(`\n❌ SKIPPING ${consultantName} - No positive availability`);
            continue;
          }
          
          console.log(`\n✅ GENERATING SLOTS FOR ${consultantName}`);
          console.log(`🔄 Checking overlaps with ${positiveCenterSlots.length} center available slots`);

          // Find overlapping availability windows between center and this consultant
          for (const centerSlot of positiveCenterSlots) {
            for (const consultantSlot of consultantPositiveSlots) {
              const windowStart = Math.max(
                centerSlot.startTime, 
                consultantSlot.startTime,
                workingHoursSlot.startTime
              );
              const windowEnd = Math.min(
                centerSlot.endTime, 
                consultantSlot.endTime,
                workingHoursSlot.endTime
              );

              if (windowStart < windowEnd) {
                let currentSlotStart = new Date(windowStart);
                const availabilityWindowEnd = new Date(windowEnd);

                while (currentSlotStart.getTime() < availabilityWindowEnd.getTime()) {
                  const slotCandidateStart = new Date(currentSlotStart);
                  const slotCandidateEnd = new Date(slotCandidateStart.getTime() + (slotDurationMinutes * 60 * 1000));

                  if (slotCandidateEnd.getTime() > availabilityWindowEnd.getTime()) {
                    break;
                  }

                  let isSkipped = false;
                  let maxOverlappingBlockEndTime = 0;

                  // Check overlaps with consultant-specific booked slots
                  for (const bookedSlot of consultantBookedSlots) {
                    if (slotCandidateStart.getTime() < bookedSlot.endTime && slotCandidateEnd.getTime() > bookedSlot.startTime) {
                      isSkipped = true;
                      maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, bookedSlot.endTime);
                    }
                  }

                  // Check overlaps with negative center slots
                  for (const blockedSlot of negativeCenterSlots) {
                    if (slotCandidateStart.getTime() < blockedSlot.endTime && slotCandidateEnd.getTime() > blockedSlot.startTime) {
                      isSkipped = true;
                      maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, blockedSlot.endTime);
                    }
                  }

                  // Check overlaps with consultant's negative slots
                  for (const blockedSlot of consultantNegativeSlots) {
                    if (slotCandidateStart.getTime() < blockedSlot.endTime && slotCandidateEnd.getTime() > blockedSlot.startTime) {
                      isSkipped = true;
                      maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, blockedSlot.endTime);
                    }
                  }

                  // Check if slot is in the past
                  const currentTime = new Date();
                  const isPastSlot = currentTime.toDateString() === date.toDateString() && 
                                   currentTime.getTime() > slotCandidateStart.getTime();
                  
                  if (!isSkipped && !isPastSlot) {
                    const newSlot = {
                      startTime: slotCandidateStart.getTime(),
                      endTime: slotCandidateEnd.getTime(),
                      consultantId: consultant._id
                    };
                    slots.push(newSlot);
                    currentSlotStart = new Date(slotCandidateEnd.getTime());
                  } else {
                    if (maxOverlappingBlockEndTime > currentSlotStart.getTime()) {
                      currentSlotStart = new Date(maxOverlappingBlockEndTime);
                    } else {
                      currentSlotStart = new Date(slotCandidateEnd.getTime());
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        // For returning users, use existing logic
        for (const centerSlot of positiveCenterSlots) {
          for (const consultantSlot of finalPositiveConsultantSlots) {
            const windowStart = Math.max(
              centerSlot.startTime, 
              consultantSlot.startTime,
              workingHoursSlot.startTime
            );
            const windowEnd = Math.min(
              centerSlot.endTime, 
              consultantSlot.endTime,
              workingHoursSlot.endTime
            );

            if (windowStart < windowEnd) {
              let currentSlotStart = new Date(windowStart);
              const availabilityWindowEnd = new Date(windowEnd);

              while (currentSlotStart.getTime() < availabilityWindowEnd.getTime()) {
                const slotCandidateStart = new Date(currentSlotStart);
                const slotCandidateEnd = new Date(slotCandidateStart.getTime() + (slotDurationMinutes * 60 * 1000));

                if (slotCandidateEnd.getTime() > availabilityWindowEnd.getTime()) {
                  break;
                }

                let isSkipped = false;
                let maxOverlappingBlockEndTime = 0;

                // Check overlaps with booked slots
                for (const bookedSlot of bookedSlots) {
                  if (slotCandidateStart.getTime() < bookedSlot.endTime && slotCandidateEnd.getTime() > bookedSlot.startTime) {
                    isSkipped = true;
                    maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, bookedSlot.endTime);
                  }
                }

                // Check overlaps with negative center slots
                for (const blockedSlot of negativeCenterSlots) {
                  if (slotCandidateStart.getTime() < blockedSlot.endTime && slotCandidateEnd.getTime() > blockedSlot.startTime) {
                    isSkipped = true;
                    maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, blockedSlot.endTime);
                  }
                }

                // Check overlaps with negative consultant slots
                for (const blockedSlot of finalNegativeConsultantSlots) {
                  if (slotCandidateStart.getTime() < blockedSlot.endTime && slotCandidateEnd.getTime() > blockedSlot.startTime) {
                    isSkipped = true;
                    maxOverlappingBlockEndTime = Math.max(maxOverlappingBlockEndTime, blockedSlot.endTime);
                  }
                }

                // Check if slot is in the past
                const currentTime = new Date();
                const isPastSlot = currentTime.toDateString() === date.toDateString() && 
                                 currentTime.getTime() > slotCandidateStart.getTime();
                
                if (!isSkipped && !isPastSlot) {
                  const newSlot = {
                    startTime: slotCandidateStart.getTime(),
                    endTime: slotCandidateEnd.getTime(),
                    consultantId: consultantId || ''
                  };
                  slots.push(newSlot);
                  currentSlotStart = new Date(slotCandidateEnd.getTime());
                } else {
                  if (maxOverlappingBlockEndTime > currentSlotStart.getTime()) {
                    currentSlotStart = new Date(maxOverlappingBlockEndTime);
                  } else {
                    currentSlotStart = new Date(slotCandidateEnd.getTime());
                  }
                }
              }
            }
          }
        }
      }

      // Round slots to 15-minute intervals and remove duplicates
      const roundedSlots = roundTimeSlots(slots);
      const uniqueSlots = roundedSlots.filter((slot, index, arr) => 
        arr.findIndex(s => s.startTime === slot.startTime && s.endTime === slot.endTime && s.consultantId === slot.consultantId) === index
      );
      
      console.log('\n' + '🎯 FINAL SLOT RESULTS'.padEnd(50, '-'));
      console.log(`📊 Raw Slots Generated: ${slots.length}`);
      console.log(`📊 After Rounding: ${roundedSlots.length}`);
      console.log(`📊 Final Unique Slots: ${uniqueSlots.length}`);
      
      if (uniqueSlots.length > 0) {
        console.log('\n✅ AVAILABLE BOOKING SLOTS:');
        const slotsByConsultant = new Map();
        uniqueSlots.forEach(slot => {
          const consultant = centerConsultants.find((c:any) => c._id === slot.consultantId);
          const consultantName = consultant ? `${consultant.profileData?.firstName} ${consultant.profileData?.lastName}` : 'Unknown';
          
          if (!slotsByConsultant.has(consultantName)) {
            slotsByConsultant.set(consultantName, []);
          }
          slotsByConsultant.get(consultantName).push(slot);
        });
        
        slotsByConsultant.forEach((consultantSlots, consultantName) => {
          console.log(`\n👨⚕️ ${consultantName} (${consultantSlots.length} slots):`);
          consultantSlots.forEach((slot:any, idx:any) => {
            const start = new Date(slot.startTime);
            const end = new Date(slot.endTime);
            console.log(`   ${idx + 1}. ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`);
          });
        });
      } else {
        console.log('\n❌ NO AVAILABLE SLOTS FOUND');
        console.log('\n🔍 POSSIBLE REASONS:');
        console.log('   • No consultants have availability events for this date');
        console.log('   • All consultants are booked with appointments');
        console.log('   • Center is closed (no positive availability)');
        console.log('   • All available times are in the past');
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('END OF SLOT ANALYSIS');
      console.log('='.repeat(80) + '\n');
      
      // Cache the results
      setCache(prev => new Map(prev).set(cacheKey, uniqueSlots));
      setAvailableSlots(uniqueSlots);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      
      // Handle specific GraphQL errors
      if (err instanceof Error && err.message.includes('Cannot return null for non-nullable field')) {
        console.error('GraphQL schema error - some appointment data has null visitType');
        setError('Unable to load appointment data. Please contact support.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch available slots');
      }
    } finally {
      setLoading(false);
    }
  };

  const preFilteredCount = useMemo(() => preFilteredConsultants?.length || 0, [preFilteredConsultants?.length]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [centerId, date, serviceDurationInMinutes, consultantId, isReturningUser, consultantIds?.join(','), preFilteredCount]);

  return {
    availableSlots,
    loading,
    error,
    refetch: () => {
      // Clear cache for current key and refetch
      const cacheKey = `${centerId}-${date.toDateString()}-${serviceDurationInMinutes}-${consultantId}-${isReturningUser}`;
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      fetchAvailableSlots();
    }
  };
};