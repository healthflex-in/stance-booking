'use client';

import React from 'react';
// import { useAnalytics } from '@/hooks';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsContextType {
  trackPageView: (pageName: string, pageTitle: string) => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackUserInteraction: (
    action: string,
    element: string,
    category?: string
  ) => void;
  trackConversion: (
    eventName: string,
    value: number,
    currency?: string
  ) => void;
  trackLogin: (method: string) => void;
  trackSignup: (method: string) => void;
  trackSearch: (searchTerm: string, category?: string) => void;
  trackPurchase: (
    transactionId: string,
    items: any[],
    value: number,
    currency?: string
  ) => void;
  setAnalyticsUserId: (userId: string) => void;
  setAnalyticsUserProperties: (properties: Record<string, any>) => void;
  trackFormSubmission: (
    formName: string,
    success?: boolean,
    errorMessage?: string
  ) => void;
  trackVideoPlay: (videoTitle: string, videoDuration: number) => void;
  trackDownload: (fileName: string, fileType: string) => void;
  trackGraphQLOperation: (
    operationName: string,
    operationType: 'query' | 'mutation' | 'subscription',
    duration: number,
    success: boolean,
    errorMessage?: string
  ) => void;
  trackDataLoading: (
    operationName: string,
    loadingState: 'start' | 'complete' | 'error'
  ) => void;
  trackHospitalAction: (
    action: string,
    patientId?: string,
    department?: string,
    metadata?: Record<string, any>
  ) => void;
}

const AnalyticsContext = React.createContext<AnalyticsContextType | undefined>(
  undefined
);

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = React.useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      'useAnalyticsContext must be used within AnalyticsProvider'
    );
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
}) => {
  // Create dummy analytics object since useAnalytics is disabled
  const dummyAnalytics: AnalyticsContextType = {
    trackPageView: () => {},
    trackEvent: () => {},
    trackUserInteraction: () => {},
    trackConversion: () => {},
    trackLogin: () => {},
    trackSignup: () => {},
    trackSearch: () => {},
    trackPurchase: () => {},
    setAnalyticsUserId: () => {},
    setAnalyticsUserProperties: () => {},
    trackFormSubmission: () => {},
    trackVideoPlay: () => {},
    trackDownload: () => {},
    trackGraphQLOperation: () => {},
    trackDataLoading: () => {},
    trackHospitalAction: () => {},
  };

  return (
    <AnalyticsContext.Provider value={dummyAnalytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};
