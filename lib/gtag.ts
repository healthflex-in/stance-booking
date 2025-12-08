'use client';

// Google Tag Manager configuration
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
// GA4 Measurement ID
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-6XE7C2DE3R';

console.log('GTM_ID loaded:', GTM_ID);
console.log('GA4_MEASUREMENT_ID loaded:', GA4_MEASUREMENT_ID);

// Extend Window interface to include GTM and gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize GTM and GA4
export const initGTM = () => {
  if (typeof window === 'undefined') {
    console.log('GTM: Window undefined, skipping initialization');
    return;
  }

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  
  // Initialize gtag function
  window.gtag = window.gtag || function(...args: any[]) {
    window.dataLayer.push(args);
  };
  
  // Load GA4 script if not already loaded
  if (!document.querySelector(`script[src*="${GA4_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href
    });
    
    console.log('GA4: Initialized with measurement ID:', GA4_MEASUREMENT_ID);
  }
  
  console.log('GTM: Ready for tracking');
};

// Track events via GA4 gtag
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined') {
    console.log('GTM: trackEvent skipped - window not available');
    return;
  }
  
  const eventData = {
    ...parameters,
    timestamp: new Date().toISOString(),
    platform: 'mobile_web',
    user_agent: window.navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight
  };
  
  console.log('🎯 GA4: Tracking event:', eventName, eventData);
  
  // Send to GA4 via gtag
  if (window.gtag) {
    window.gtag('event', eventName, eventData);
    console.log('✅ GA4: Event sent successfully to', GA4_MEASUREMENT_ID);
    
    // Check dataLayer for confirmation
    if (window.dataLayer) {
      console.log('📊 GA4 DataLayer Length:', window.dataLayer.length);
      console.log('📊 Last GA4 Event:', window.dataLayer[window.dataLayer.length - 1]);
    }
  } else {
    console.warn('❌ GA4: gtag not available');
  }
  
  // Also push to dataLayer for GTM (if configured)
  if (window.dataLayer) {
    const gtmData = {
      event: eventName,
      ...eventData
    };
    window.dataLayer.push(gtmData);
    console.log('🏷️ GTM: Event pushed to dataLayer:', gtmData);
  } else {
    console.warn('❌ GTM: dataLayer not available');
  }
};

// Track page views
export const trackPageView = (url: string, title: string) => {
  if (typeof window === 'undefined') {
    console.log('GTM: trackPageView skipped - window not available');
    return;
  }
  
  const pageData = {
    page_location: url,
    page_title: title,
    timestamp: new Date().toISOString(),
    platform: 'mobile_web'
  };
  
  console.log('🎯 GA4: Tracking page view:', pageData);
  
  // Send to GA4 via gtag
  if (window.gtag) {
    window.gtag('event', 'page_view', pageData);
    console.log('✅ GA4: Page view sent successfully to', GA4_MEASUREMENT_ID);
  } else {
    console.warn('❌ GA4: gtag not available');
  }
  
  // Also push to dataLayer for GTM (if configured)
  if (window.dataLayer) {
    const gtmData = {
      event: 'page_view',
      ...pageData
    };
    window.dataLayer.push(gtmData);
    console.log('🏷️ GTM: Page view pushed to dataLayer:', gtmData);
  } else {
    console.warn('❌ GTM: dataLayer not available');
  }
};

// Backward compatibility
export const initGtag = initGTM;