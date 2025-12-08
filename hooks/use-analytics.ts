// import { useEffect } from 'react';
// import { 
//   logEvent, 
//   setUserProperties, 
//   setUserId
// } from 'firebase/analytics';
// import { analytics } from '../lib/firebase';
// import {
//   VideoData,
//   SearchData,
//   PurchaseItem,
//   DownloadData,
//   PageViewData,
//   UserProperties,
//   FormSubmissionData,
//   UserInteractionData
// } from '../types/analytics';

// export const useAnalytics = () => {
//   useEffect(() => {
//     // Analytics is only available on client side
//     if (!analytics) return;

//     // Set default user properties
//     const defaultProperties: UserProperties = {
//       app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
//       platform: 'web'
//     };
    
//     setUserProperties(analytics, defaultProperties);
//   }, []);

//   // Track page views (replaces deprecated setCurrentScreen)
//   const trackPageView = (pageName: string, pageTitle: string): void => {
//     if (!analytics) return;
    
//     const pageViewData: PageViewData = {
//       pageName,
//       pageTitle,
//       pageLocation: window.location.href
//     };
    
//     // Use page_view event instead of deprecated setCurrentScreen
//     logEvent(analytics, 'page_view', {
//       page_title: pageViewData.pageTitle,
//       page_location: pageViewData.pageLocation
//     });

//     // Use screen_view for screen tracking (replaces setCurrentScreen)
//     logEvent(analytics, 'screen_view', {
//       firebase_screen: pageViewData.pageName,
//       firebase_screen_class: pageViewData.pageName
//     });
//   };

//   // Track custom events
//   const trackEvent = (eventName: string, parameters: Record<string, any> = {}): void => {
//     if (!analytics) return;
    
//     logEvent(analytics, eventName, {
//       timestamp: new Date().toISOString(),
//       ...parameters
//     });
//   };

//   // Track user interactions
//   const trackUserInteraction = (action: string, element: string, category: string = 'engagement'): void => {
//     if (!analytics) return;
    
//     const interactionData: UserInteractionData = {
//       action,
//       element,
//       category
//     };
    
//     logEvent(analytics, 'user_interaction', {
//       ...interactionData,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track conversion events
//   const trackConversion = (eventName: string, value: number, currency: string = 'USD'): void => {
//     if (!analytics) return;
    
//     logEvent(analytics, eventName, {
//       value,
//       currency,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track user login
//   const trackLogin = (method: string): void => {
//     if (!analytics) return;
    
//     logEvent(analytics, 'login', {
//       method,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track user signup
//   const trackSignup = (method: string): void => {
//     if (!analytics) return;
    
//     logEvent(analytics, 'sign_up', {
//       method,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track search
//   const trackSearch = (searchTerm: string, category?: string): void => {
//     if (!analytics) return;
    
//     const searchData: SearchData = {
//       searchTerm,
//       category
//     };
    
//     logEvent(analytics, 'search', {
//       search_term: searchData.searchTerm,
//       category: searchData.category,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track purchase
//   const trackPurchase = (
//     transactionId: string, 
//     items: PurchaseItem[], 
//     value: number, 
//     currency: string = 'USD'
//   ): void => {
//     if (!analytics) return;
    
//     logEvent(analytics, 'purchase', {
//       transaction_id: transactionId,
//       value,
//       currency,
//       items,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Set user ID
//   const setAnalyticsUserId = (userId: string): void => {
//     if (!analytics) return;
    
//     setUserId(analytics, userId);
//   };

//   // Set user properties (using setUserProperties instead of setUserProperty)
//   const setAnalyticsUserProperties = (properties: UserProperties): void => {
//     if (!analytics) return;
    
//     // setUserProperties expects all properties at once, not individually
//     setUserProperties(analytics, properties);
//   };

//   // Track form submission
//   const trackFormSubmission = (formName: string, success: boolean = true, errorMessage?: string): void => {
//     if (!analytics) return;
    
//     const formData: FormSubmissionData = {
//       formName,
//       success,
//       errorMessage
//     };
    
//     logEvent(analytics, 'form_submit', {
//       form_name: formData.formName,
//       success: formData.success,
//       error_message: formData.errorMessage,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track video play
//   const trackVideoPlay = (videoTitle: string, videoDuration: number): void => {
//     if (!analytics) return;
    
//     const videoData: VideoData = {
//       videoTitle,
//       videoDuration
//     };
    
//     logEvent(analytics, 'video_play', {
//       video_title: videoData.videoTitle,
//       video_duration: videoData.videoDuration,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track download
//   const trackDownload = (fileName: string, fileType: string): void => {
//     if (!analytics) return;
    
//     const downloadData: DownloadData = {
//       fileName,
//       fileType
//     };
    
//     logEvent(analytics, 'file_download', {
//       file_name: downloadData.fileName,
//       file_type: downloadData.fileType,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track GraphQL operation manually (for specific tracking needs)
//   const trackGraphQLOperation = (
//     operationName: string,
//     operationType: 'query' | 'mutation' | 'subscription',
//     duration: number,
//     success: boolean,
//     errorMessage?: string
//   ): void => {
//     if (!analytics) return;

//     logEvent(analytics, 'manual_graphql_operation', {
//       operation_name: operationName,
//       operation_type: operationType,
//       duration: Math.round(duration),
//       success,
//       error_message: errorMessage,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track data loading states
//   const trackDataLoading = (operationName: string, loadingState: 'start' | 'complete' | 'error'): void => {
//     if (!analytics) return;

//     logEvent(analytics, 'data_loading_state', {
//       operation_name: operationName,
//       loading_state: loadingState,
//       timestamp: new Date().toISOString()
//     });
//   };

//   // Track user actions in hospital context
//   const trackHospitalAction = (action: string, patientId?: string, department?: string, metadata?: Record<string, any>): void => {
//     if (!analytics) return;

//     logEvent(analytics, 'hospital_action', {
//       action,
//       patient_id: patientId,
//       department,
//       ...metadata,
//       timestamp: new Date().toISOString()
//     });
//   };

//   return {
//     trackPageView,
//     trackEvent,
//     trackUserInteraction,
//     trackConversion,
//     trackLogin,
//     trackSignup,
//     trackSearch,
//     trackPurchase,
//     setAnalyticsUserId,
//     setAnalyticsUserProperties,
//     trackFormSubmission,
//     trackVideoPlay,
//     trackDownload,
//     trackGraphQLOperation,
//     trackDataLoading,
//     trackHospitalAction
//   };
// };
