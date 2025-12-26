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
  trackLead: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Lead', { content_name: 'Booking Lead', ...parameters });
  },

  trackSchedule: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Schedule', { content_name: 'Appointment', ...parameters });
  },

  trackInitiateCheckout: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('InitiateCheckout', { currency: 'INR', ...parameters });
  },

  trackAddPaymentInfo: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('AddPaymentInfo', { currency: 'INR', ...parameters });
  },

  trackPurchase: (parameters: Record<string, any> = {}) => {
    trackMetaPixelEvent('Purchase', { currency: 'INR', ...parameters });
  },
};
