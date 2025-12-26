'use client';

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initGTM = () => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  
  window.gtag = window.gtag || function(...args: any[]) {
    window.dataLayer.push(args);
  };
  
  if (GA4_MEASUREMENT_ID && !document.querySelector(`script[src*="${GA4_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href
    });
  }
};

export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;
  
  const eventData = {
    ...parameters,
    timestamp: new Date().toISOString(),
  };
  
  // Send to GA4 via gtag
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
  }
  
  // Push to GTM dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData
    });
  }
};
