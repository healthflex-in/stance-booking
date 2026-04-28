/**
 * Booking Analytics Service
 * Tracks booking flow events matching stance-dashboard-frontend mobile-analytics
 * 
 * Event names match mobile-analytics.ts from stance-dashboard-frontend
 * No prefixes - clean event names for GTM/GA4/Meta Pixel
 */

import { trackEvent as trackGtagEvent } from '@/lib/gtag';
import { metaPixelEvents, trackMetaPixelCustomEvent } from '@/lib/meta-pixel';

export type BookingFlowType = 'new-online' | 'new-offline' | 'repeat-online' | 'repeat-offline' | 'prepaid-new' | 'prepaid-repeat';
export type BookingStep = 'session-details' | 'slot-selection' | 'payment-confirmation' | 'booking-confirmed' | 'confirmation';

export class BookingAnalytics {
  private flowType: BookingFlowType;
  private sessionStartTime: number;
  private stepStartTime: number;

  constructor(flowType: BookingFlowType) {
    this.flowType = flowType;
    this.sessionStartTime = Date.now();
    this.stepStartTime = Date.now();
  }

  public trackEvent(eventName: string, params: Record<string, any> = {}) {
    const eventData = {
      ...params,
      flow_type: this.flowType,
      timestamp: new Date().toISOString(),
    };
    
    console.log('📊 Analytics Event:', eventName, eventData);

    // 1. Send to GA4 via gtag with ga4_ prefix
    if (typeof window !== 'undefined') {
      trackGtagEvent(`ga4_${eventName}`, {
        ...eventData,
        platform: 'ga4',
      });
      console.log('✅ Sent to GA4:', `ga4_${eventName}`);
    }

    // 2. Send to Meta Pixel via GTM with pixel_ prefix
    if (typeof window !== 'undefined') {
      trackGtagEvent(`pixel_${eventName}`, {
        ...eventData,
        platform: 'meta_pixel',
      });
      console.log('✅ Sent to GTM dataLayer:', `pixel_${eventName}`);
    }

    // 3. Send directly to Meta Pixel (bypass GTM)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      trackMetaPixelCustomEvent(eventName, eventData);
      console.log('✅ Sent to Meta Pixel (Custom)');
      
      // Map to standard Meta Pixel events
      this.trackMetaPixelStandardEvent(eventName, params);
    } else {
      console.log('⚠️ Meta Pixel (fbq) not found');
    }
  }

  private trackMetaPixelStandardEvent(eventName: string, params: Record<string, any>) {
    const eventMapping: Record<string, () => void> = {
      'mobile_flow_start': () => metaPixelEvents.trackLead(params),
      'patient_created': () => metaPixelEvents.trackCompleteRegistration(params),
      'center_selected': () => metaPixelEvents.trackFindLocation(params),
      'time_slot_selected': () => metaPixelEvents.trackSchedule(params),
      'begin_checkout': () => metaPixelEvents.trackInitiateCheckout({ value: params.value || params.amount, ...params }),
      'add_payment_info': () => metaPixelEvents.trackAddPaymentInfo({ value: params.value || params.amount, ...params }),
      'purchase': () => metaPixelEvents.trackPurchase({ value: params.value, transaction_id: params.transaction_id, ...params }),
    };

    if (eventMapping[eventName]) {
      eventMapping[eventName]();
    }
  }

  // Flow Start - matches mobile_flow_start
  trackFlowStart(organizationId: string, centerId?: string) {
    this.sessionStartTime = Date.now();
    this.trackEvent('mobile_flow_start', {
      organization_id: organizationId,
      center_id: centerId,
      source: 'direct',
    });
  }

  // Step Navigation
  trackStepView(step: BookingStep, metadata?: Record<string, any>) {
    const timeOnPreviousStep = Date.now() - this.stepStartTime;
    this.stepStartTime = Date.now();

    const stepEventNames: Record<string, string> = {
      'session-details': 'session_details_start',
      'slot-selection': 'slot_search_start',
      'payment-confirmation': 'booking_confirmation_start',
      'booking-confirmed': 'booking_confirmation_viewed',
      'confirmation': 'booking_details_reviewed',
    };

    const eventName = stepEventNames[step] || `${step}_step`;
    this.trackEvent(eventName, {
      time_on_previous_step: timeOnPreviousStep,
      ...metadata,
    });
  }

  trackStepComplete(step: BookingStep, metadata?: Record<string, any>) {
    const timeOnStep = Date.now() - this.stepStartTime;
    
    this.trackEvent('step_progression', {
      current_step: step,
      time_on_step: timeOnStep,
      ...metadata,
    });
  }

  // Session Details - matches session_details_start
  trackServiceSelected(serviceId: string, serviceName: string, price: number, duration: number) {
    this.trackEvent('service_selected', {
      service_id: serviceId,
      service_name: serviceName,
      price,
      duration,
    });
  }

  trackDesignationSelected(designation: string) {
    this.trackEvent('button_click', {
      button_name: 'designation_selected',
      context: 'session_details',
      designation,
    });
  }

  trackDesignationToggled(designation: string) {
    this.trackEvent('button_click', {
      button_name: 'designation_toggled',
      context: 'session_details',
      designation,
    });
  }

  trackServiceModalOpened() {
    this.trackEvent('button_click', { button_name: 'service_modal_open', context: 'session_details' });
  }

  trackServiceModalClosed() {
    this.trackEvent('button_click', { button_name: 'service_modal_close', context: 'session_details' });
  }

  trackSessionDetailsContinueClicked(serviceId: string, designation: string) {
    this.trackEvent('continue_button_clicked', {
      current_step: 'session_details',
      service_id: serviceId,
      designation,
    });
  }

  // Slot Selection - matches time_slot_selected
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
    this.trackEvent('time_slot_selected', {
      consultant_id: consultantId,
      time_slot: slotTime,
      center_id: centerId,
    });
  }

  trackConsultantModalOpened() {
    this.trackEvent('button_click', { button_name: 'consultant_modal_open', context: 'slot_selection' });
  }

  trackConsultantModalClosed() {
    this.trackEvent('button_click', { button_name: 'consultant_modal_close', context: 'slot_selection' });
  }

  trackConsultantFilterApplied(consultantId: string, consultantName: string) {
    this.trackEvent('button_click', {
      button_name: 'consultant_filter_applied',
      context: 'slot_selection',
      consultant_id: consultantId,
      consultant_name: consultantName,
    });
  }

  trackConsultantFilterCleared() {
    this.trackEvent('button_click', {
      button_name: 'consultant_filter_cleared',
      context: 'slot_selection',
    });
  }

  trackSlotSelectionContinueClicked(consultantId: string, slotTime: string, centerId: string) {
    this.trackEvent('continue_button_clicked', {
      current_step: 'slot_selection',
      consultant_id: consultantId,
      slot_time: slotTime,
      center_id: centerId,
    });
  }

  trackNoSlotsAvailable(date: string, designation?: string) {
    this.trackEvent('mobile_flow_error', {
      error_type: 'no_slots_available',
      error_message: 'No slots available for selected date',
      context: 'slot_selection',
      date,
      designation,
    });
  }

  // Payment - matches begin_checkout, payment_initiated, purchase
  trackProceedToPaymentClicked(amount: number, serviceId: string, consultantId: string) {
    this.trackEvent('proceed_to_pay_clicked', {
      amount,
      currency: 'INR',
      service_id: serviceId,
      consultant_id: consultantId,
    });

    this.trackEvent('begin_checkout', {
      currency: 'INR',
      value: amount,
      items: [{
        item_id: serviceId,
        item_name: 'Physiotherapy Session',
        category: 'physiotherapy_treatment',
        quantity: 1,
        price: amount
      }],
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

    // Standard purchase event
    this.trackEvent('purchase', {
      transaction_id: paymentId,
      value: amount,
      currency: 'INR',
      items: [{
        item_id: appointmentId,
        item_name: 'Physiotherapy Appointment',
        category: 'healthcare_service',
        quantity: 1,
        price: amount,
      }],
    });
  }

  trackPaymentFailure(error: string, appointmentId?: string) {
    this.trackEvent('payment_failure', {
      error_message: error,
      appointment_id: appointmentId,
    });
  }

  trackPaymentSkipped(reason: string = 'razorpay_issue') {
    this.trackEvent('payment_failure', {
      error_message: reason,
      error_type: 'payment_skipped',
    });
  }

  // Booking Completion - matches booking_completed
  trackBookingComplete(appointmentId: string, patientId: string, consultantId: string, centerId: string) {
    const totalTime = Date.now() - this.sessionStartTime;
    
    this.trackEvent('booking_completed', {
      appointment_id: appointmentId,
      patient_id: patientId,
      consultant_id: consultantId,
      center_id: centerId,
      total_time: totalTime,
    });
  }

  trackReturnHomeClicked(appointmentId: string) {
    this.trackEvent('return_home_clicked', {
      appointment_id: appointmentId,
    });
  }

  trackWhatsAppShareClicked(appointmentId: string) {
    this.trackEvent('whatsapp_clicked', {
      appointment_id: appointmentId,
      context: 'booking_confirmed',
    });
  }

  trackSmsShareClicked(appointmentId: string) {
    this.trackEvent('button_click', {
      button_name: 'sms_share',
      context: 'booking_confirmed',
      appointment_id: appointmentId,
    });
  }

  // Profile Completion - matches patient_created
  trackProfileCompletionClicked(patientId: string, centerId: string, isNewUser: boolean) {
    if (!patientId || !centerId) {
      console.error('Missing required parameters for profile completion tracking');
      return;
    }
    
    this.trackEvent('patient_created', {
      patient_id: patientId,
      center_id: centerId,
      is_returning_user: !isNewUser,
      user_id: patientId,
    });

    // Track lead generation
    this.trackEvent('generate_lead', {
      currency: 'INR',
      value: 0,
      patient_id: patientId,
      center_id: centerId,
      user_id: patientId,
    });
  }

  trackPaymentSuccessAcknowledged(appointmentId: string, patientId: string, consultantId: string, centerId: string) {
    if (!appointmentId || !patientId || !consultantId || !centerId) {
      console.error('Missing required parameters for payment success acknowledgment tracking');
      return;
    }
    
    this.trackEvent('booking_success_complete', {
      appointment_id: appointmentId,
      patient_id: patientId,
      consultant_id: consultantId,
      center_id: centerId,
      success_type: 'appointment_confirmed',
    });
  }

  // Confirmation - Specific Events
  trackConfirmBookingClicked(appointmentId: string, amount: number, serviceId: string, consultantId: string) {
    this.trackEvent('proceed_to_pay_clicked', {
      appointment_id: appointmentId,
      amount,
      currency: 'INR',
      service_id: serviceId,
      consultant_id: consultantId,
    });
  }

  // Navigation - Specific Events
  trackBackNavigation(fromStep: BookingStep) {
    this.trackEvent('back_button_clicked', {
      current_step: fromStep,
    });
  }

  // Errors
  trackError(errorType: string, errorMessage: string, context?: string) {
    this.trackEvent('mobile_flow_error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
    });
  }

  trackAPIError(operationName: string, errorMessage: string) {
    this.trackEvent('mobile_flow_error', {
      error_type: 'api_error',
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
