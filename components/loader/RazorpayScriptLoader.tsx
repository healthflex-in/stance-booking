'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayScriptLoaderProps {
  onLoad?: () => void;
}

const RazorpayScriptLoader: React.FC<RazorpayScriptLoaderProps> = ({ onLoad }) => {
  useEffect(() => {
    // If Razorpay is already loaded, call onLoad immediately
    if (typeof window !== 'undefined' && window.Razorpay) {
      onLoad?.();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    
    if (existingScript) {
      // Script exists but might not be loaded yet
      existingScript.addEventListener('load', () => onLoad?.());
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      onLoad?.();
    };
    document.body.appendChild(script);

    return () => {
      if (existingScript) {
        (existingScript as HTMLScriptElement).removeEventListener('load', () => onLoad?.());
      }
    };
  }, [onLoad]);

  return null;
};

export default RazorpayScriptLoader;
