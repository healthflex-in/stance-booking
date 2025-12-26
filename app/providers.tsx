'use client';

import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '../utils/apollo-client';
import { initGTM } from '@/lib/gtag';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGTM();
  }, []);

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
