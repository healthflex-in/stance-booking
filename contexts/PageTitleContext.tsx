'use client';
import React, { createContext, useContext, useState } from 'react';

type PageTitleContextType = {
  title: string;
  subtitle?: string;
  setPageTitle: (title: string, subtitle?: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState<string>();

  const setPageTitle = (newTitle: string, newSubtitle?: string) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return (
    <PageTitleContext.Provider value={{ title, subtitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return context;
} 