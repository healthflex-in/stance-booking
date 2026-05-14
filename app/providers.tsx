'use client';

import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '../utils/apollo-client';
import { initGTM } from '@/lib/gtag';
import { AuthProvider } from '@/contexts/AuthContext';
import { setupUTMPreservation } from '@/utils/url-utm-preserver';
import { captureUTMParams } from '@/utils/utm-persistence';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGTM();
    
    // PROPER SOLUTION: Preserve UTM parameters in URL during navigation
    setupUTMPreservation();
    
    // FALLBACK: Also capture in sessionStorage as backup
    captureUTMParams();
  }, []);

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloProvider>
  );
}
