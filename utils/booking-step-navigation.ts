/**
 * Utility to determine initial booking step based on URL parameters
 */

export type BookingStep = 'session-details' | 'slot-selection' | 'payment-confirmation' | 'confirmation' | 'booking-confirmed';

export interface URLBookingParams {
  patientId?: string | null;
  centerId?: string | null;
  serviceId?: string | null;
  consultantId?: string | null;
  consultantType?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
}

export interface DeterminedStep {
  initialStep: BookingStep;
  bookingDataUpdates: any;
}

/**
 * Determines which step to start at based on available URL parameters
 * @param params URL parameters from searchParams
 * @returns Initial step and booking data updates
 */
export function determineInitialStep(params: URLBookingParams): DeterminedStep {
  const { patientId, centerId, serviceId, consultantId, consultantType, slotStart, slotEnd } = params;

  // If we have slot times, skip to confirmation/payment
  if (slotStart && slotEnd && serviceId && centerId) {
    const slotStartDate = new Date(parseInt(slotStart) * 1000);
    const slotEndDate = new Date(parseInt(slotEnd) * 1000);
    
    return {
      initialStep: 'payment-confirmation',
      bookingDataUpdates: {
        ...(patientId && { patientId }),
        ...(centerId && { centerId }),
        ...(serviceId && { treatmentId: serviceId }),
        ...(consultantId && { consultantId }),
        ...(consultantType && { 
          designation: consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist' 
        }),
        selectedTimeSlot: {
          startTime: slotStartDate.toISOString(),
          endTime: slotEndDate.toISOString(),
          displayTime: slotStartDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          })
        },
        selectedDate: slotStartDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        selectedFullDate: slotStartDate,
      }
    };
  }
  
  // If we have service but no slot, skip to slot selection
  if (serviceId && consultantType && centerId) {
    return {
      initialStep: 'slot-selection',
      bookingDataUpdates: {
        ...(patientId && { patientId }),
        ...(centerId && { centerId }),
        ...(serviceId && { treatmentId: serviceId }),
        ...(consultantId && { consultantId }),
        ...(consultantType && { 
          designation: consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist' 
        }),
      }
    };
  }
  
  // Otherwise start at session details
  return {
    initialStep: 'session-details',
    bookingDataUpdates: {
      ...(patientId && { patientId }),
      ...(centerId && { centerId }),
      ...(serviceId && { treatmentId: serviceId }),
      ...(consultantId && { consultantId }),
    }
  };
}

/**
 * Stores URL parameters in sessionStorage for persistence
 */
export function storeBookingParamsInSession(params: URLBookingParams): void {
  if (typeof window === 'undefined') return;
  
  const { patientId, centerId, serviceId, consultantId, consultantType, slotStart, slotEnd } = params;
  
  if (patientId) sessionStorage.setItem('patientId', patientId);
  if (centerId) sessionStorage.setItem('centerId', centerId);
  if (serviceId) sessionStorage.setItem('serviceId', serviceId);
  if (consultantId) sessionStorage.setItem('consultantId', consultantId);
  if (consultantType) sessionStorage.setItem('consultantType', consultantType);
  if (slotStart) sessionStorage.setItem('slotStart', slotStart);
  if (slotEnd) sessionStorage.setItem('slotEnd', slotEnd);
}
