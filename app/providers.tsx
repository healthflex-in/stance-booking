'use client';

import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '../utils/apollo-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
