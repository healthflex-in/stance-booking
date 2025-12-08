import { useState, useEffect } from 'react';

export const useContainerDetection = () => {
  const [isInDesktopContainer, setIsInDesktopContainer] = useState(false);

  useEffect(() => {
    // Check if we're in the desktop container by looking at viewport width and container constraints
    const checkContainer = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // If viewport is large but height is constrained (like in desktop container), we're in desktop view
      const isDesktop = viewportWidth > 768 && viewportHeight < window.screen.height * 0.95;
      setIsInDesktopContainer(isDesktop);
    };

    checkContainer();
    window.addEventListener('resize', checkContainer);
    
    return () => window.removeEventListener('resize', checkContainer);
  }, []);

  return { isInDesktopContainer };
};