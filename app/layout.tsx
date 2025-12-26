import './globals.css';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Providers } from './providers';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

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
      <head>
        {GTM_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');`
            }}
          />
        )}
        {META_PIXEL_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');`
            }}
          />
        )}
      </head>
      <body suppressHydrationWarning>
        {GTM_ID && (
          <noscript>
            <iframe 
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0" 
              width="0" 
              style={{display: 'none', visibility: 'hidden'}}
            />
          </noscript>
        )}
        {META_PIXEL_ID && (
          <noscript>
            <img 
              height="1" 
              width="1" 
              style={{display: 'none'}}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
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
