/**
 * Booking Analytics Service
 * Tracks booking flow events with proper prefixes
 * 
 * Prefixes:
 * - N-ON: New User Online
 * - N-OF: New User Offline
 * - R-ON: Repeat User Online
 * - R-OF: Repeat User Offline
 * - P-NEW: Prepaid New
 * - P-REP: Prepaid Repeat
 */

import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';
import { trackEvent as trackGtagEvent } from '@/lib/gtag';
import { metaPixelEvents, trackMetaPixelCustomEvent } from '@/lib/meta-pixel';

export type BookingFlowType = 'new-online' | 'new-offline' | 'repeat-online' | 'repeat-offline' | 'prepaid-new' | 'prepaid-repeat';
export type BookingStep = 'session-details' | 'slot-selection' | 'payment-confirmation' | 'booking-confirmed' | 'confirmation';

const FLOW_PREFIXES: Record<BookingFlowType, string> = {
  'new-online': 'N-ON',
  'new-offline': 'N-OF',
  'repeat-online': 'R-ON',
  'repeat-offline': 'R-OF',
  'prepaid-new': 'P-NEW',
  'prepaid-repeat': 'P-REP',
};

export class BookingAnalytics {
  private flowType: BookingFlowType;
  private prefix: string;
  private sessionStartTime: number;
  private stepStartTime: number;

  constructor(flowType: BookingFlowType) {
    this.flowType = flowType;
    this.prefix = FLOW_PREFIXES[flowType];
    this.sessionStartTime = Date.now();
    this.stepStartTime = Date.now();
  }

  public trackEvent(eventName: string, params: Record<string, any> = {}) {
    const prefixedEventName = `${this.prefix}_${eventName}`;
    const eventData = {
      ...params,
      flow_type: this.flowType,
      timestamp: new Date().toISOString(),
    };
    
    console.log('📊 Analytics Event:', prefixedEventName, eventData);

    // 1. Firebase Analytics (GA4)
    if (!analytics) {
      console.log('⚠️ Firebase Analytics not initialized');
    } else {
      logEvent(analytics, prefixedEventName, eventData);
      console.log('✅ Sent to Firebase Analytics (GA4)');
    }

    // 2. GTM dataLayer + GA4 gtag
    if (typeof window !== 'undefined') {
      trackGtagEvent(prefixedEventName, eventData);
      console.log('✅ Sent to GTM dataLayer + GA4');
    } else {
      console.log('⚠️ GTM/GA4 not available (server-side)');
    }

    // 3. Meta Pixel - Custom events
    if (typeof window !== 'undefined' && (window as any).fbq) {
      trackMetaPixelCustomEvent(prefixedEventName, eventData);
      console.log('✅ Sent to Meta Pixel (Custom)');
      
      // Map to standard Meta Pixel events
      this.trackMetaPixelStandardEvent(eventName, params);
    } else {
      console.log('⚠️ Meta Pixel (fbq) not found');
    }
  }

  private trackMetaPixelStandardEvent(eventName: string, params: Record<string, any>) {
    const eventMapping: Record<string, () => void> = {
      'flow_start': () => metaPixelEvents.trackLead(params),
      'slot_selected': () => metaPixelEvents.trackSchedule(params),
      'proceed_to_payment_clicked': () => metaPixelEvents.trackInitiateCheckout({ value: params.amount, ...params }),
      'payment_initiated': () => metaPixelEvents.trackAddPaymentInfo({ value: params.amount, ...params }),
      'payment_success': () => metaPixelEvents.trackPurchase({ value: params.amount, transaction_id: params.payment_id, ...params }),
    };

    if (eventMapping[eventName]) {
      eventMapping[eventName]();
    }
  }

  // Flow Start
  trackFlowStart(organizationId: string, centerId?: string) {
    this.sessionStartTime = Date.now();
    this.trackEvent('flow_start', {
      organization_id: organizationId,
      center_id: centerId,
    });
  }

  // Step Navigation
  trackStepView(step: BookingStep, metadata?: Record<string, any>) {
    const timeOnPreviousStep = Date.now() - this.stepStartTime;
    this.stepStartTime = Date.now();

    this.trackEvent('step_view', {
      step,
      time_on_previous_step: timeOnPreviousStep,
      ...metadata,
    });
  }

  trackStepComplete(step: BookingStep, metadata?: Record<string, any>) {
    const timeOnStep = Date.now() - this.stepStartTime;
    
    this.trackEvent('step_complete', {
      step,
      time_on_step: timeOnStep,
      ...metadata,
    });
  }

  // Session Details - Specific Events
  trackServiceSelected(serviceId: string, serviceName: string, price: number, duration: number) {
    this.trackEvent('service_selected', {
      service_id: serviceId,
      service_name: serviceName,
      price,
      duration,
    });
  }

  trackDesignationSelected(designation: string) {
    this.trackEvent('designation_selected', {
      designation,
    });
  }

  trackDesignationToggled(designation: string) {
    this.trackEvent('designation_toggled', {
      designation,
    });
  }

  trackServiceModalOpened() {
    this.trackEvent('service_modal_opened');
  }

  trackServiceModalClosed() {
    this.trackEvent('service_modal_closed');
  }

  trackSessionDetailsContinueClicked(serviceId: string, designation: string) {
    this.trackEvent('session_details_continue_clicked', {
      service_id: serviceId,
      designation,
    });
  }

  // Slot Selection - Specific Events
  trackDateSelected(date: string) {
    this.trackEvent('date_selected', {
      selected_date: date,
    });
  }

  trackTimeSlotClicked(slotTime: string, consultantCount: number) {
    this.trackEvent('time_slot_clicked', {
      slot_time: slotTime,
      consultant_count: consultantCount,
    });
  }

  trackSlotSelected(consultantId: string, slotTime: string, centerId: string) {
    this.trackEvent('slot_selected', {
      consultant_id: consultantId,
      slot_time: slotTime,
      center_id: centerId,
    });
  }

  trackConsultantModalOpened() {
    this.trackEvent('consultant_modal_opened');
  }

  trackConsultantModalClosed() {
    this.trackEvent('consultant_modal_closed');
  }

  trackConsultantFilterApplied(consultantId: string, consultantName: string) {
    this.trackEvent('consultant_filter_applied', {
      consultant_id: consultantId,
      consultant_name: consultantName,
    });
  }

  trackConsultantFilterCleared() {
    this.trackEvent('consultant_filter_cleared');
  }

  trackSlotSelectionContinueClicked(consultantId: string, slotTime: string, centerId: string) {
    this.trackEvent('slot_selection_continue_clicked', {
      consultant_id: consultantId,
      slot_time: slotTime,
      center_id: centerId,
    });
  }

  trackNoSlotsAvailable(date: string, designation?: string) {
    this.trackEvent('no_slots_available', {
      date,
      designation,
    });
  }

  // Payment - Specific Events
  trackProceedToPaymentClicked(amount: number, serviceId: string, consultantId: string) {
    this.trackEvent('proceed_to_payment_clicked', {
      amount,
      currency: 'INR',
      service_id: serviceId,
      consultant_id: consultantId,
    });
  }

  trackPaymentInitiated(amount: number, appointmentId: string) {
    this.trackEvent('payment_initiated', {
      amount,
      appointment_id: appointmentId,
      currency: 'INR',
    });
  }

  trackPaymentSuccess(paymentId: string, amount: number, appointmentId: string) {
    this.trackEvent('payment_success', {
      payment_id: paymentId,
      amount,
      appointment_id: appointmentId,
      currency: 'INR',
    });

    // Standard e-commerce event
    if (analytics) {
      logEvent(analytics, 'purchase', {
        transaction_id: paymentId,
        value: amount,
        currency: 'INR',
        items: [{
          item_id: appointmentId,
          item_name: 'Appointment Booking',
          price: amount,
          quantity: 1,
        }],
      });
    }
  }

  trackPaymentFailure(error: string, appointmentId?: string) {
    this.trackEvent('payment_failure', {
      error_message: error,
      appointment_id: appointmentId,
    });
  }

  trackPaymentSkipped(reason: string = 'razorpay_issue') {
    this.trackEvent('payment_skipped', {
      reason,
    });
  }

  // Booking Completion - Specific Events
  trackBookingComplete(appointmentId: string, patientId: string, consultantId: string, centerId: string) {
    const totalTime = Date.now() - this.sessionStartTime;
    
    this.trackEvent('booking_complete', {
      appointment_id: appointmentId,
      patient_id: patientId,
      consultant_id: consultantId,
      center_id: centerId,
      total_time: totalTime,
    });

    // Track conversion
    if (analytics) {
      logEvent(analytics, 'conversion', {
        conversion_type: 'booking_complete',
        value: 1,
      });
    }
  }

  trackReturnHomeClicked(appointmentId: string) {
    this.trackEvent('return_home_clicked', {
      appointment_id: appointmentId,
    });
  }

  trackWhatsAppShareClicked(appointmentId: string) {
    this.trackEvent('whatsapp_share_clicked', {
      appointment_id: appointmentId,
    });
  }

  trackSmsShareClicked(appointmentId: string) {
    this.trackEvent('sms_share_clicked', {
      appointment_id: appointmentId,
    });
  }



  // Navigation - Specific Events
  trackBackNavigation(fromStep: BookingStep) {
    this.trackEvent('back_button_clicked', {
      from_step: fromStep,
    });
  }

  // Errors
  trackError(errorType: string, errorMessage: string, context?: string) {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
    });
  }

  trackAPIError(operationName: string, errorMessage: string) {
    this.trackEvent('api_error', {
      operation_name: operationName,
      error_message: errorMessage,
    });
  }

  // Exit Intent
  trackExitIntent(currentStep: BookingStep, completionPercentage: number) {
    const timeSpent = Date.now() - this.sessionStartTime;
    
    this.trackEvent('exit_intent', {
      current_step: currentStep,
      time_spent: timeSpent,
      completion_percentage: completionPercentage,
    });
  }

  // Session End
  trackSessionEnd(completionStatus: 'completed' | 'abandoned', finalStep: BookingStep) {
    const totalTime = Date.now() - this.sessionStartTime;
    
    this.trackEvent('session_end', {
      completion_status: completionStatus,
      final_step: finalStep,
      total_time: totalTime,
    });
  }
}

// Factory function to create analytics instance
export function createBookingAnalytics(flowType: BookingFlowType): BookingAnalytics {
  return new BookingAnalytics(flowType);
}
