'use client';

import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width
      const screenWidth = window.innerWidth;
      const isMobileWidth = screenWidth < 768;

      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        );

      // Check for touch support
      const isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Combine checks - prioritize screen width but consider other factors
      const isMobileDevice =
        isMobileWidth || (isMobileUserAgent && isTouchDevice);

      setIsMobile(isMobileDevice);
      setIsLoading(false);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile, isLoading };
}
