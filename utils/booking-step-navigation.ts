/**
 * Utility to determine initial booking step based on URL parameters
 */

import { BookingParams } from './booking-params';

export type BookingStep = 'session-details' | 'slot-selection' | 'payment-confirmation' | 'confirmation' | 'booking-confirmed';

export interface URLBookingParams {
  patientId?: string | null;
  centerId?: string | null;
  serviceId?: string | null;
  consultantId?: string | null;
  consultantType?: string | null;
  paymentType?: string | null;
  partialAmount?: string | null;
  packageId?: string | null;
  slotDate?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  treatmentPrice?: string | null;
  treatmentDuration?: string | null;
  linkToken?: string | null;
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
  const { patientId, centerId, serviceId, consultantId, consultantType, paymentType, partialAmount, packageId, slotStart, slotEnd, treatmentPrice, treatmentDuration } = params;

  // If no patientId, ALWAYS start at session-details (patient creation)
  if (!patientId) {
    return {
      initialStep: 'session-details',
      bookingDataUpdates: {
        ...(centerId && { centerId }),
        ...(serviceId && { treatmentId: serviceId }),
        ...(consultantId && { consultantId }),
        ...(consultantType && { 
          designation: consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist' 
        }),
      }
    };
  }

  // If we have ALL data including price, go directly to payment
  if (slotStart && slotEnd && serviceId && centerId && treatmentPrice && treatmentDuration) {
    const slotStartDate = new Date(parseInt(slotStart) * 1000);
    const slotEndDate = new Date(parseInt(slotEnd) * 1000);
    
    return {
      initialStep: 'payment-confirmation',
      bookingDataUpdates: {
        patientId,
        centerId,
        treatmentId: serviceId,
        treatmentPrice: parseInt(treatmentPrice),
        treatmentDuration: parseInt(treatmentDuration),
        ...(consultantId && { consultantId }),
        ...(consultantType && { 
          designation: consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist' 
        }),
        ...(paymentType && { paymentType }),
        ...(partialAmount && { partialAmount }),
        ...(packageId && { packageId }),
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
  
  // If we have patientId and service but no slot, skip to slot selection
  if (serviceId && centerId) {
    return {
      initialStep: 'slot-selection',
      bookingDataUpdates: {
        patientId,
        centerId,
        treatmentId: serviceId,
        ...(consultantId && { consultantId }),
        ...(consultantType && { 
          designation: consultantType === 'S&C Coach' ? 'SNC_Coach' : 'Physiotherapist' 
        }),
      }
    };
  }
  
  // If we have patientId and center, start at session details
  if (centerId) {
    return {
      initialStep: 'session-details',
      bookingDataUpdates: {
        patientId,
        centerId,
        ...(serviceId && { treatmentId: serviceId }),
        ...(consultantId && { consultantId }),
      }
    };
  }
  
  // Otherwise start at session details with just patientId
  return {
    initialStep: 'session-details',
    bookingDataUpdates: {
      patientId,
    }
  };
}

/**
 * Stores URL parameters in sessionStorage for persistence
 */
export function storeBookingParamsInSession(params: URLBookingParams): void {
  if (typeof window === 'undefined') return;
  
  const { patientId, centerId, serviceId, consultantId, consultantType, paymentType, partialAmount, packageId, slotDate, slotStart, slotEnd, treatmentPrice, treatmentDuration, linkToken } = params;
  
  if (patientId) sessionStorage.setItem('patientId', patientId);
  if (centerId) sessionStorage.setItem('centerId', centerId);
  if (serviceId) sessionStorage.setItem('serviceId', serviceId);
  if (consultantId) sessionStorage.setItem('consultantId', consultantId);
  if (consultantType) sessionStorage.setItem('consultantType', consultantType);
  if (paymentType) sessionStorage.setItem('paymentType', paymentType);
  if (partialAmount) sessionStorage.setItem('partialAmount', partialAmount);
  if (packageId) sessionStorage.setItem('packageId', packageId);
  if (slotDate) sessionStorage.setItem('slotDate', slotDate);
  if (slotStart) sessionStorage.setItem('slotStart', slotStart);
  if (slotEnd) sessionStorage.setItem('slotEnd', slotEnd);
  if (treatmentPrice) sessionStorage.setItem('treatmentPrice', treatmentPrice);
  if (treatmentDuration) sessionStorage.setItem('treatmentDuration', treatmentDuration);
  if (linkToken) sessionStorage.setItem('linkToken', linkToken);

  // Persist UTM params and original landing URL before they get stripped from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content'];
  const utmParts: string[] = [];
  for (const key of utmKeys) {
    const val = urlParams.get(key);
    if (val) utmParts.push(`${key}=${encodeURIComponent(val)}`);
  }
  if (utmParts.length > 0) {
    // Only overwrite if we have fresh UTM data (don't wipe a previously captured value)
    sessionStorage.setItem('utm_params', utmParts.join('&'));
  }
  // Always capture the original full landing URL once (first write wins)
  if (!sessionStorage.getItem('booking_landing_url')) {
    sessionStorage.setItem('booking_landing_url', window.location.href);
  }
}


// ---------------------------------------------------------------------------
// Dynamic step resolution (URL-param-based flow)
// ---------------------------------------------------------------------------

/**
 * Extended booking step type that includes onboarding and center-selection
 * steps used by the dynamic URL-param-based booking flow.
 */
export type DynamicBookingStep =
  | 'onboarding'
  | 'center-selection'
  | 'session-details'
  | 'slot-selection'
  | 'payment-confirmation'
  | 'booking-confirmed';

/**
 * Inspects the available booking data and returns the first step in the
 * ordered sequence that still requires user input.
 *
 * Resolution order:
 *  1. No patientId        → onboarding
 *  2. No centerId         → center-selection
 *  3. No serviceId        → session-details
 *  4. No slot data        → slot-selection
 *  5. Everything else     → payment-confirmation (never skip — appointment creation happens here)
 */
export function resolveInitialStep(params: BookingParams): DynamicBookingStep {
  if (!params.patientId) return 'onboarding';
  if (!params.centerId) return 'center-selection';
  if (!params.serviceId) return 'session-details';
  if (!params.slotStart || !params.slotEnd) return 'slot-selection';
  // Always land on payment-confirmation as the max step.
  // The appointment is created during this step, so we must never skip it.
  return 'payment-confirmation';
}

/**
 * Determines whether a patient should be routed to the new-user or
 * repeat-user booking flow based on existing center assignments.
 */
export function resolveUserType(hasCenterAssignments: boolean): 'new' | 'repeat' {
  return hasCenterAssignments ? 'repeat' : 'new';
}
