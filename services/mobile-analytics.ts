'use client';

import { useState } from 'react';
import { trackEvent, initGTM } from '@/lib/gtag';
import { metaPixelEvents, metaPixelCustomEvents } from '@/lib/meta-pixel';

export class MobileFlowAnalytics {
  private initialized = false;
  private metaPixelInitialized = false;
  
  private ensureGtagInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      initGTM();
      this.initialized = true;
    }
  }
  
  private ensureMetaPixelInitialized() {
    if (!this.metaPixelInitialized && typeof window !== 'undefined') {
      // Meta Pixel should already be initialized in layout.tsx
      // This is just a safety check
      if (typeof (window as any).fbq !== 'undefined') {
        console.log('✅ Meta Pixel: Already initialized');
        this.metaPixelInitialized = true;
      } else {
        console.warn('⚠️ Meta Pixel: Not found - check META_PIXEL_ID in environment');
      }
    }
  }
  
  // Send event to both GA4 and Meta Pixel
  private trackUnifiedEvent(baseEventName: string, parameters: Record<string, any> = {}) {
    this.ensureGtagInitialized();
    this.ensureMetaPixelInitialized();
    
    // Send to GA4 with ga4_ prefix
    trackEvent(`ga4_${baseEventName}`, {
      ...parameters,
      platform: 'ga4'
    });
    
    // Send to Meta Pixel with pixel_ prefix (for GTM)
    trackEvent(`pixel_${baseEventName}`, {
      ...parameters,
      platform: 'meta_pixel'
    });
    
    // Also send directly to Meta Pixel (bypass GTM)
    this.trackDirectMetaPixelEvent(baseEventName, parameters);
  }
  
  // Direct Meta Pixel event tracking
  private trackDirectMetaPixelEvent(eventName: string, parameters: Record<string, any> = {}) {
    // Map common events to Meta Pixel standard events
    const metaPixelMapping: Record<string, string> = {
      'patient_created': 'CompleteRegistration',
      'generate_lead': 'Lead',
      'center_selected': 'FindLocation',
      'time_slot_selected': 'Schedule',
      'begin_checkout': 'InitiateCheckout',
      'add_payment_info': 'AddPaymentInfo',
      'purchase': 'Purchase',
      'payment_initiated': 'Contact'
    };
    
    const mappedEvent = metaPixelMapping[eventName];
    
    if (mappedEvent && metaPixelEvents[`track${mappedEvent}` as keyof typeof metaPixelEvents]) {
      // Use standard Meta Pixel events
      (metaPixelEvents[`track${mappedEvent}` as keyof typeof metaPixelEvents] as (params: Record<string, any>) => void)(parameters);
    } else {
      // Use custom Meta Pixel events for unmapped events
      const customEventMapping: Record<string, string> = {
        'mobile_flow_start': 'MobileFlowStart',
        'patient_onboarding_start': 'PatientDetailsStart',
        'phone_verification_clicked': 'PhoneVerification',
        'patient_profile_completed': 'PatientProfileComplete',
        'center_search_start': 'CenterSearch',
        'slot_search_start': 'SlotSearch',
        'appointment_scheduling_complete': 'AppointmentScheduled',
        'checkout_started': 'CheckoutStart',
        'payment_method_selection': 'PaymentMethodSelected',
        'razorpay_gateway_loaded': 'RazorpayLoaded',
        'payment_processing_start': 'PaymentProcessing',
        'email_details_requested': 'EmailDetailsRequest',
        'booking_success_complete': 'BookingSuccess',
        'form_abandonment': 'FormAbandonment',
        'support_request': 'SupportRequest'
      };
      
      const customEvent = customEventMapping[eventName];
      if (customEvent && metaPixelCustomEvents[`track${customEvent}` as keyof typeof metaPixelCustomEvents]) {
        (metaPixelCustomEvents[`track${customEvent}` as keyof typeof metaPixelCustomEvents] as (params: Record<string, any>) => void)(parameters);
      }
    }
  }
  
  public trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    this.trackUnifiedEvent(eventName, parameters);
  }

  // Mobile Flow Entry Points
  trackMobileFlowStart(source: 'direct' | 'qr_code' | 'link' | 'referral', centerId?: string) {
    this.trackEvent('mobile_flow_start', {
      source,
      center_id: centerId,
      flow_type: 'appointment_booking'
    });
    

  }

  // Patient Onboarding Events
  trackPatientOnboardingStart(centerId: string) {
    this.trackEvent('patient_onboarding_start', {
      center_id: centerId,
      step: 'patient_details_form'
    });
  }

  trackPatientFormFieldInteraction(fieldName: string, action: 'focus' | 'blur' | 'change', centerId: string) {
    this.trackEvent('patient_form_interaction', {
      field_name: fieldName,
      action,
      center_id: centerId
    });
  }

  trackPatientFormValidationError(fieldName: string, errorType: string, centerId: string) {
    this.trackEvent('patient_form_validation_error', {
      field_name: fieldName,
      error_type: errorType,
      center_id: centerId
    });
  }

  trackPatientCreated(patientId: string, centerId: string, isReturning: boolean) {
    console.log('Tracking patient created:', { patientId, centerId, isReturning });
    
    this.trackEvent('patient_created', {
      patient_id: patientId,
      center_id: centerId,
      is_returning_user: isReturning,
      // GA4 standard parameters
      user_id: patientId,
      custom_parameter_1: centerId,
      custom_parameter_2: isReturning ? 'returning' : 'new'
    });

    // Track conversion
    this.trackEvent('generate_lead', {
      currency: 'INR',
      value: 0,
      patient_id: patientId,
      center_id: centerId,
      user_id: patientId
    });
    

  }

  // Center Selection Events
  trackCenterSelectionStart(patientId: string) {
    this.trackEvent('center_selection_start', {
      patient_id: patientId
    });
  }

  trackCenterViewed(centerId: string, centerName: string, patientId: string) {
    this.trackEvent('center_viewed', {
      center_id: centerId,
      center_name: centerName,
      patient_id: patientId
    });
  }

  trackCenterSelected(centerId: string, centerName: string, patientId: string) {
    this.trackEvent('center_selected', {
      center_id: centerId,
      center_name: centerName,
      patient_id: patientId
    });
    

  }

  // Session Details Events
  trackSessionDetailsStart(centerId: string, patientId: string) {
    this.trackEvent('session_details_start', {
      center_id: centerId,
      patient_id: patientId
    });
    

  }

  trackDatePickerInteraction(action: 'open' | 'date_select' | 'close', selectedDate?: string, centerId?: string, patientId?: string) {
    this.trackEvent('date_picker_interaction', {
      action,
      selected_date: selectedDate,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackTimeSlotSelected(timeSlot: string, date: string, centerId: string, patientId: string, consultantId?: string) {
    this.trackEvent('time_slot_selected', {
      time_slot: timeSlot,
      selected_date: date,
      center_id: centerId,
      patient_id: patientId,
      consultant_id: consultantId
    });
    

  }

  // Booking Confirmation Events
  trackBookingConfirmationStart(bookingData: any) {
    this.trackEvent('booking_confirmation_start', {
      center_id: bookingData.centerId,
      patient_id: bookingData.patientId,
      consultant_id: bookingData.consultantId,
      treatment_id: bookingData.treatmentId,
      session_type: bookingData.sessionType,
      selected_date: bookingData.selectedDate,
      selected_time: bookingData.selectedTimeSlot,
      treatment_price: bookingData.treatmentPrice
    });

    // Track begin checkout
    this.trackEvent('begin_checkout', {
      currency: 'INR',
      value: bookingData.treatmentPrice,
      items: [{
        item_id: bookingData.treatmentId,
        item_name: 'Physiotherapy Session',
        category: 'physiotherapy_treatment',
        quantity: 1,
        price: bookingData.treatmentPrice
      }]
    });
    

  }

  trackBookingDetailsReviewed(bookingData: any) {
    this.trackEvent('booking_details_reviewed', {
      center_id: bookingData.centerId,
      patient_id: bookingData.patientId,
      consultant_id: bookingData.consultantId,
      treatment_id: bookingData.treatmentId,
      treatment_price: bookingData.treatmentPrice
    });
  }

  trackPaymentMethodSelected(paymentMethod: 'razorpay' | 'cash' | 'card', bookingData: any) {
    this.trackEvent('payment_method_selected', {
      payment_method: paymentMethod,
      center_id: bookingData.centerId,
      patient_id: bookingData.patientId,
      treatment_price: bookingData.treatmentPrice
    });

    // Track add payment info
    this.trackEvent('add_payment_info', {
      currency: 'INR',
      value: bookingData.treatmentPrice,
      payment_type: paymentMethod
    });
    

  }

  // Payment Events
  trackPaymentInitiated(paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    patientId: string;
    centerId: string;
    appointmentId?: string;
  }) {
    this.trackEvent('payment_initiated', {
      order_id: paymentData.orderId,
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      currency: 'INR',
      patient_id: paymentData.patientId,
      center_id: paymentData.centerId,
      appointment_id: paymentData.appointmentId
    });
    

  }

  trackPaymentSuccess(paymentData: {
    orderId: string;
    paymentId: string;
    amount: number;
    paymentMethod: string;
    patientId: string;
    centerId: string;
    appointmentId: string;
  }) {
    this.trackEvent('payment_success', {
      order_id: paymentData.orderId,
      payment_id: paymentData.paymentId,
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      currency: 'INR',
      patient_id: paymentData.patientId,
      center_id: paymentData.centerId,
      appointment_id: paymentData.appointmentId
    });

    // Track purchase conversion
    this.trackEvent('purchase', {
      transaction_id: paymentData.paymentId,
      value: paymentData.amount,
      currency: 'INR',
      items: [{
        item_id: paymentData.appointmentId,
        item_name: 'Physiotherapy Appointment',
        category: 'healthcare_service',
        quantity: 1,
        price: paymentData.amount
      }]
    });
    

  }

  trackPaymentFailure(paymentData: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    errorCode?: string;
    errorMessage?: string;
    patientId: string;
    centerId: string;
  }) {
    this.trackEvent('payment_failure', {
      order_id: paymentData.orderId,
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      error_code: paymentData.errorCode,
      error_message: paymentData.errorMessage,
      currency: 'INR',
      patient_id: paymentData.patientId,
      center_id: paymentData.centerId
    });
  }

  // Booking Completion Events
  trackBookingCompleted(appointmentData: {
    appointmentId: string;
    patientId: string;
    centerId: string;
    consultantId: string;
    treatmentId: string;
    amount: number;
    sessionType: string;
    appointmentDate: string;
    appointmentTime: string;
  }) {
    this.trackEvent('booking_completed', {
      appointment_id: appointmentData.appointmentId,
      patient_id: appointmentData.patientId,
      center_id: appointmentData.centerId,
      consultant_id: appointmentData.consultantId,
      treatment_id: appointmentData.treatmentId,
      amount: appointmentData.amount,
      session_type: appointmentData.sessionType,
      appointment_date: appointmentData.appointmentDate,
      appointment_time: appointmentData.appointmentTime
    });
  }

  trackBookingConfirmationViewed(appointmentId: string, patientId: string, centerId: string) {
    this.trackEvent('booking_confirmation_viewed', {
      appointment_id: appointmentId,
      patient_id: patientId,
      center_id: centerId
    });
  }

  // Specific Input Field Events
  trackPhoneNumberEntered(centerId: string) {
    this.trackEvent('phone_number_entered', {
      center_id: centerId,
      step: 'patient_onboarding'
    });
  }

  trackPhoneVerificationClicked(phone: string, centerId: string) {
    this.trackEvent('phone_verification_clicked', {
      phone_length: phone.length,
      center_id: centerId
    });
  }

  trackFirstNameEntered(centerId: string) {
    this.trackEvent('first_name_entered', {
      center_id: centerId,
      step: 'patient_details'
    });
  }

  trackLastNameEntered(centerId: string) {
    this.trackEvent('last_name_entered', {
      center_id: centerId,
      step: 'patient_details'
    });
  }

  trackEmailEntered(centerId: string) {
    this.trackEvent('email_entered', {
      center_id: centerId,
      step: 'patient_details'
    });
  }

  trackGenderSelected(gender: string, centerId: string) {
    this.trackEvent('gender_selected', {
      selected_gender: gender,
      center_id: centerId
    });
  }

  trackDateOfBirthEntered(centerId: string) {
    this.trackEvent('date_of_birth_entered', {
      center_id: centerId,
      step: 'patient_details'
    });
  }

  trackNotesEntered(centerId: string) {
    this.trackEvent('notes_entered', {
      center_id: centerId,
      step: 'patient_details'
    });
  }

  trackCallNowClicked(centerId: string, context: string) {
    this.trackEvent('call_now_clicked', {
      center_id: centerId,
      context,
      phone_number: '+919019410049'
    });
  }

  trackWhatsAppClicked(centerId: string, context: string, patientId?: string) {
    this.trackEvent('whatsapp_clicked', {
      center_id: centerId,
      context,
      phone_number: '+919019410049',
      patient_id: patientId
    });
    
    // Track as support request custom event
    this.trackSupportRequest('whatsapp', context, patientId, centerId);
  }

  trackContinueButtonClicked(step: string, centerId: string, patientId?: string) {
    this.trackEvent('continue_button_clicked', {
      current_step: step,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackBackButtonClicked(step: string, centerId: string, patientId?: string) {
    this.trackEvent('back_button_clicked', {
      current_step: step,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackDateSelected(selectedDate: string, centerId: string, patientId: string) {
    this.trackEvent('date_selected', {
      selected_date: selectedDate,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackTimeSlotClicked(timeSlot: string, centerId: string, patientId: string) {
    this.trackEvent('time_slot_clicked', {
      time_slot: timeSlot,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackProceedToPayClicked(amount: number, centerId: string, patientId: string) {
    this.trackEvent('proceed_to_pay_clicked', {
      amount,
      currency: 'INR',
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackReturnHomeClicked(centerId: string, patientId: string) {
    this.trackEvent('return_home_clicked', {
      center_id: centerId,
      patient_id: patientId,
      booking_completed: true
    });
  }

  trackAppointmentEmailEntered(centerId: string, patientId: string) {
    this.trackEvent('appointment_email_entered', {
      center_id: centerId,
      patient_id: patientId,
      step: 'booking_confirmed'
    });
  }

  trackSendEmailClicked(email: string, centerId: string, patientId: string) {
    this.trackEvent('send_appointment_email_clicked', {
      email_provided: !!email,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackEmailSentSuccess(email: string, centerId: string, patientId: string) {
    this.trackEvent('appointment_email_sent_success', {
      email_address: email,
      center_id: centerId,
      patient_id: patientId
    });
  }

  trackEmailSentFailure(email: string, centerId: string, patientId: string, error?: string) {
    this.trackEvent('appointment_email_sent_failure', {
      email_address: email,
      center_id: centerId,
      patient_id: patientId,
      error_message: error
    });
  }

  // User Interaction Events
  trackButtonClick(buttonName: string, context: string, additionalData?: Record<string, any>) {
    this.trackEvent('button_click', {
      button_name: buttonName,
      context,
      ...additionalData
    });
  }

  trackFormFieldFocus(fieldName: string, formName: string) {
    this.trackEvent('form_field_focus', {
      field_name: fieldName,
      form_name: formName
    });
  }

  trackFormFieldBlur(fieldName: string, formName: string, hasValue: boolean) {
    this.trackEvent('form_field_blur', {
      field_name: fieldName,
      form_name: formName,
      has_value: hasValue
    });
  }

  // Error Tracking
  trackError(errorType: string, errorMessage: string, context: string, additionalData?: Record<string, any>) {
    this.trackEvent('mobile_flow_error', {
      error_type: errorType,
      error_message: errorMessage,
      context,
      ...additionalData
    });
  }

  // Performance Tracking
  trackLoadTime(componentName: string, loadTime: number) {
    this.trackEvent('component_load_time', {
      component_name: componentName,
      load_time: loadTime
    });
  }

  // Exit Intent Tracking
  trackExitIntent(currentStep: string, timeSpent: number, completionPercentage: number) {
    this.trackEvent('exit_intent', {
      current_step: currentStep,
      time_spent: timeSpent,
      completion_percentage: completionPercentage
    });
  }

  // Session Tracking
  trackSessionStart() {
    this.trackEvent('session_start', {
      session_id: Date.now().toString()
    });
  }

  trackSessionEnd(duration: number, pagesViewed: number, actionsCompleted: number) {
    this.trackEvent('session_end', {
      session_duration: duration,
      pages_viewed: pagesViewed,
      actions_completed: actionsCompleted
    });
  }

  // Mobile Booking Flow Custom Events
  trackPatientDetailsStart(patientId: string, centerId: string) {
    this.trackEvent('patient_details_start', {
      patient_id: patientId,
      center_id: centerId,
      form_type: 'patient_registration'
    });
    

  }

  trackPhoneVerificationAttempt(phoneNumber: string, centerId: string) {
    this.trackEvent('phone_verification_attempt', {
      phone_length: phoneNumber.length,
      center_id: centerId,
      verification_type: 'mobile_number'
    });
    

  }

  trackPatientProfileCompleted(patientId: string, centerId: string, isReturning: boolean) {
    this.trackEvent('patient_profile_completed', {
      patient_id: patientId,
      center_id: centerId,
      is_returning: isReturning,
      profile_type: isReturning ? 'returning_patient' : 'new_patient'
    });
    

  }

  trackCenterSearchStart(patientId: string) {
    this.trackEvent('center_search_start', {
      patient_id: patientId,
      search_type: 'location_selection'
    });
    

  }

  trackSlotSearchStart(centerId: string, patientId: string, selectedDate?: string) {
    this.trackEvent('slot_search_start', {
      center_id: centerId,
      patient_id: patientId,
      selected_date: selectedDate,
      search_type: 'appointment_scheduling'
    });
    

  }

  trackAppointmentSchedulingComplete(appointmentData: {
    appointmentId: string;
    patientId: string;
    centerId: string;
    selectedDate: string;
    selectedTime: string;
  }) {
    this.trackEvent('appointment_scheduling_complete', {
      appointment_id: appointmentData.appointmentId,
      patient_id: appointmentData.patientId,
      center_id: appointmentData.centerId,
      selected_date: appointmentData.selectedDate,
      selected_time: appointmentData.selectedTime
    });
    

  }

  // Booking and Payment Flow Events
  trackCheckoutStarted(bookingData: any) {
    this.trackEvent('checkout_started', {
      center_id: bookingData.centerId,
      patient_id: bookingData.patientId,
      treatment_price: bookingData.treatmentPrice,
      checkout_type: 'appointment_booking'
    });
    

  }

  trackPaymentMethodSelection(paymentMethod: string, amount: number, patientId: string, centerId: string) {
    this.trackEvent('payment_method_selection', {
      payment_method: paymentMethod,
      amount,
      currency: 'INR',
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackRazorpayGatewayLoaded(amount: number, patientId: string, centerId: string) {
    this.trackEvent('razorpay_gateway_loaded', {
      amount,
      currency: 'INR',
      patient_id: patientId,
      center_id: centerId,
      payment_gateway: 'razorpay'
    });
    

  }

  trackPaymentProcessingStart(orderId: string, amount: number, patientId: string, centerId: string) {
    this.trackEvent('payment_processing_start', {
      order_id: orderId,
      amount,
      currency: 'INR',
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackEmailDetailsRequested(email: string, patientId: string, centerId: string) {
    this.trackEvent('email_details_requested', {
      email_provided: !!email,
      patient_id: patientId,
      center_id: centerId,
      request_type: 'appointment_confirmation'
    });
    

  }

  // User Engagement Events
  trackFormAbandonment(formStep: string, completionPercentage: number, timeSpent: number, patientId?: string, centerId?: string) {
    this.trackEvent('form_abandonment', {
      form_step: formStep,
      completion_percentage: completionPercentage,
      time_spent: timeSpent,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackSupportRequest(supportType: 'chat' | 'call' | 'whatsapp' | 'email', context: string, patientId?: string, centerId?: string) {
    this.trackEvent('support_request', {
      support_type: supportType,
      context,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  // Conversion Funnel Custom Events
  trackBookingIntent(intentStrength: 'low' | 'medium' | 'high', triggerAction: string, patientId: string, centerId: string) {
    this.trackEvent('booking_intent', {
      intent_strength: intentStrength,
      trigger_action: triggerAction,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackPaymentHesitation(hesitationReason: string, timeSpent: number, amount: number, patientId: string, centerId: string) {
    this.trackEvent('payment_hesitation', {
      hesitation_reason: hesitationReason,
      time_spent: timeSpent,
      amount,
      currency: 'INR',
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackReferralSource(source: string, campaign?: string, medium?: string, patientId?: string, centerId?: string) {
    this.trackEvent('referral_source', {
      source,
      campaign,
      medium,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  // Mobile Experience Events
  trackMobileOptimization(optimizationScore: number, deviceType: string, screenSize: string, patientId?: string) {
    this.trackEvent('mobile_optimization', {
      optimization_score: optimizationScore,
      device_type: deviceType,
      screen_size: screenSize,
      patient_id: patientId
    });
    

  }

  trackStepProgression(currentStep: string, previousStep: string, timeSpent: number, patientId: string, centerId: string) {
    this.trackEvent('step_progression', {
      current_step: currentStep,
      previous_step: previousStep,
      time_spent: timeSpent,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  // Success and Retention Events
  trackReturnVisit(visitFrequency: 'first_time' | 'returning' | 'frequent', daysSinceLastVisit: number, patientId: string, centerId?: string) {
    this.trackEvent('return_visit', {
      visit_frequency: visitFrequency,
      days_since_last_visit: daysSinceLastVisit,
      patient_id: patientId,
      center_id: centerId
    });
    

  }

  trackBookingSuccessComplete(appointmentData: {
    appointmentId: string;
    patientId: string;
    centerId: string;
    amount: number;
    paymentId?: string;
  }) {
    this.trackEvent('booking_success_complete', {
      appointment_id: appointmentData.appointmentId,
      patient_id: appointmentData.patientId,
      center_id: appointmentData.centerId,
      amount: appointmentData.amount,
      payment_id: appointmentData.paymentId,
      success_type: 'appointment_confirmed'
    });
    

  }
}

// Enhanced hook to use Mobile Flow Analytics with custom events
export const useMobileFlowAnalytics = () => {
  const [analytics] = useState(() => new MobileFlowAnalytics());
  return analytics;
};

// Utility function to track user journey milestones
export const trackUserJourneyMilestone = (milestone: string, data: Record<string, any>) => {
  const analytics = new MobileFlowAnalytics();
  analytics.trackEvent('user_journey_milestone', {
    milestone,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Utility function to track conversion funnel progression
export const trackFunnelProgression = (stage: string, previousStage: string, timeSpent: number, data: Record<string, any>) => {
  const analytics = new MobileFlowAnalytics();
  analytics.trackEvent('funnel_progression', {
    current_stage: stage,
    previous_stage: previousStage,
    time_spent: timeSpent,
    progression_rate: data.progressionRate || 0,
    ...data
  });
};