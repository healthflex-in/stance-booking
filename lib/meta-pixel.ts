'use client';

// Meta Pixel configuration
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

console.log('META_PIXEL_ID loaded:', META_PIXEL_ID);

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: {
      (...args: any[]): void;
      queue?: any[];
    };
    _fbq: any;
  }
}

// Track Meta Pixel standard events
export const trackMetaPixelEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !window.fbq) {
    console.log('❌ Meta Pixel: trackEvent skipped - window or fbq not available');
    return;
  }

  if (!META_PIXEL_ID) {
    console.warn('❌ Meta Pixel: META_PIXEL_ID not found in environment variables');
    return;
  }
  
  console.log('🔵 Meta Pixel: Tracking standard event:', eventName, parameters);
  
  try {
    window.fbq('track', eventName, parameters);
    console.log('✅ Meta Pixel: Standard event sent successfully:', eventName);
    
    // Check if event was queued
    if (window.fbq && window.fbq.queue) {
      console.log('📊 Meta Pixel Queue Length:', window.fbq.queue.length);
    }
  } catch (error) {
    console.error('❌ Meta Pixel: Error sending standard event:', error);
  }
};

// Track Meta Pixel custom events
export const trackMetaPixelCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !window.fbq) {
    console.log('❌ Meta Pixel: trackCustom skipped - window or fbq not available');
    return;
  }

  if (!META_PIXEL_ID) {
    console.warn('❌ Meta Pixel: META_PIXEL_ID not found in environment variables');
    return;
  }
  
  console.log('🔶 Meta Pixel: Tracking custom event:', eventName, parameters);
  
  try {
    window.fbq('trackCustom', eventName, parameters);
    console.log('✅ Meta Pixel: Custom event sent successfully:', eventName);
  } catch (error) {
    console.error('❌ Meta Pixel: Error sending custom event:', error);
  }
};

// Standard Meta Pixel events for mobile booking flow
// Standard Meta Pixel events for mobile booking flow
export const metaPixelEvents = {
  // Patient registration completion - CompleteRegistration
  trackCompleteRegistration: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('CompleteRegistration', {
      content_name: 'Patient Registration',
      ...parameters
    });
  },

  // Lead generation when patient provides contact info - Lead
  trackLead: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Lead', {
      content_name: 'Patient Lead',
      content_category: 'healthcare',
      ...parameters
    });
  },

  // Contact when patient interacts with center - Contact
  trackContact: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Contact', {
      content_name: 'Center Contact',
      ...parameters
    });
  },

  // Find location when selecting center - FindLocation
  trackFindLocation: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('FindLocation', {
      content_name: 'Healthcare Center',
      ...parameters
    });
  },

  // Schedule appointment booking - Schedule
  trackSchedule: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Schedule', {
      content_name: 'Physiotherapy Appointment',
      content_category: 'healthcare',
      ...parameters
    });
  },

  // View content for session details - ViewContent
  trackViewContent: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('ViewContent', {
      content_type: 'appointment_details',
      ...parameters
    });
  },

  // Initiate checkout for booking confirmation - InitiateCheckout
  trackInitiateCheckout: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('InitiateCheckout', {
      content_type: 'appointment',
      content_category: 'healthcare',
      currency: 'INR',
      ...parameters
    });
  },

  // Add payment info when selecting payment method - AddPaymentInfo
  trackAddPaymentInfo: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('AddPaymentInfo', {
      content_category: 'healthcare_payment',
      currency: 'INR',
      ...parameters
    });
  },

  // Purchase completion - Purchase
  trackPurchase: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Purchase', {
      content_type: 'appointment',
      content_category: 'healthcare',
      currency: 'INR',
      ...parameters
    });
  }
};

// Custom Meta Pixel events for mobile booking flow
export const metaPixelCustomEvents = {
  // Patient onboarding events
  trackPatientDetailsStart: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PatientDetailsStart', {
      form_type: 'patient_registration',
      ...parameters
    });
  },

  trackPhoneVerification: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PhoneVerification', {
      verification_type: 'mobile_number',
      ...parameters
    });
  },

  trackPatientProfileComplete: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PatientProfileComplete', {
      profile_type: 'new_patient',
      ...parameters
    });
  },

  trackCenterSearch: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('CenterSearch', {
      search_type: 'location_selection',
      ...parameters
    });
  },

  trackSlotSearch: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('SlotSearch', {
      search_type: 'appointment_scheduling',
      ...parameters
    });
  },

  trackAppointmentScheduled: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('AppointmentScheduled', {
      booking_type: 'physiotherapy_session',
      ...parameters
    });
  },

  // Booking flow events
  trackCheckoutStart: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('CheckoutStart', {
      checkout_type: 'appointment_booking',
      ...parameters
    });
  },

  trackPaymentMethodSelected: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PaymentMethodSelected', {
      payment_category: 'online_payment',
      ...parameters
    });
  },

  trackRazorpayLoaded: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('RazorpayLoaded', {
      payment_gateway: 'razorpay',
      ...parameters
    });
  },

  trackPaymentProcessing: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PaymentProcessing', {
      processing_stage: 'payment_gateway',
      ...parameters
    });
  },

  trackEmailDetailsRequest: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('EmailDetailsRequest', {
      request_type: 'appointment_confirmation',
      ...parameters
    });
  },

  // User engagement events
  trackFormAbandonment: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('FormAbandonment', {
      abandonment_stage: parameters.form_step || 'unknown',
      completion_percentage: parameters.completion_percentage || 0,
      ...parameters
    });
  },

  trackSupportRequest: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('SupportRequest', {
      support_type: 'customer_service',
      ...parameters
    });
  },

  // Conversion funnel custom events
  trackBookingIntent: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('BookingIntent', {
      intent_strength: 'high',
      ...parameters
    });
  },

  trackPaymentHesitation: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('PaymentHesitation', {
      hesitation_reason: parameters.reason || 'unknown',
      time_spent: parameters.time_spent || 0,
      ...parameters
    });
  },

  trackReferralSource: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('ReferralSource', {
      referral_type: parameters.source || 'direct',
      ...parameters
    });
  },

  // Mobile experience events
  trackMobileOptimization: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('MobileOptimization', {
      device_type: 'mobile',
      optimization_score: parameters.score || 0,
      ...parameters
    });
  },

  trackStepProgression: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('StepProgression', {
      flow_type: 'mobile_booking',
      ...parameters
    });
  },

  // Retention events
  trackReturnVisit: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('ReturnVisit', {
      visit_frequency: parameters.frequency || 'returning',
      days_since_last_visit: parameters.days_since || 0,
      ...parameters
    });
  },

  trackBookingSuccess: (parameters: Record<string, any> = {}) => {
    trackMetaPixelCustomEvent('BookingSuccess', {
      success_type: 'appointment_confirmed',
      ...parameters
    });
  }
};