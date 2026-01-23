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
}
