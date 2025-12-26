'use client';

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

declare global {
  interface Window {
    fbq: {
      (...args: any[]): void;
      queue?: any[];
    };
    _fbq: any;
  }
}

export const trackMetaPixelEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (!META_PIXEL_ID) return;
  
  try {
    window.fbq('track', eventName, parameters);
  } catch (error) {
    console.error('Meta Pixel error:', error);
  }
};

export const trackMetaPixelCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  if (!META_PIXEL_ID) return;
  
  try {
    window.fbq('trackCustom', eventName, parameters);
  } catch (error) {
    console.error('Meta Pixel error:', error);
  }
};

export const metaPixelEvents = {
  trackCompleteRegistration: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('CompleteRegistration', {
      content_name: 'Patient Registration',
      ...parameters
    });
  },

  trackLead: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Lead', {
      content_name: 'Patient Lead',
      content_category: 'healthcare',
      ...parameters
    });
  },

  trackViewContent: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('ViewContent', {
      content_type: 'appointment_details',
      ...parameters
    });
  },

  trackFindLocation: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('FindLocation', {
      content_name: 'Healthcare Center',
      ...parameters
    });
  },

  trackSchedule: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Schedule', {
      content_name: 'Physiotherapy Appointment',
      content_category: 'healthcare',
      ...parameters
    });
  },

  trackInitiateCheckout: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('InitiateCheckout', {
      content_type: 'appointment',
      content_category: 'healthcare',
      currency: 'INR',
      num_items: 1,
      ...parameters
    });
  },

  trackAddPaymentInfo: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('AddPaymentInfo', {
      content_category: 'healthcare_payment',
      currency: 'INR',
      ...parameters
    });
  },

  trackPurchase: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Purchase', {
      content_type: 'appointment',
      content_category: 'healthcare',
      currency: 'INR',
      num_items: 1,
      ...parameters
    });
  },

  trackContact: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Contact', {
      content_name: 'Payment Processing',
      ...parameters
    });
  },
};
