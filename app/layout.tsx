import './globals.css';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Stance Health - Book Appointment',
  description: 'Book your physiotherapy appointment online',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            {children}
            <Toaster position="bottom-right" />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
