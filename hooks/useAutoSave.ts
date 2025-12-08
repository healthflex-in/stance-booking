import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave({ key, data, delay = 2000, enabled = true }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const prevDataRef = useRef<string | undefined>(undefined);
  const isFirstRun = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled) {
      // Reset first run flag when disabled
      isFirstRun.current = true;
      return;
    }

    const currentDataString = JSON.stringify(data);

    // Skip the first run to avoid saving initial/loaded data
    if (isFirstRun.current) {
      prevDataRef.current = currentDataString;
      isFirstRun.current = false;
      return;
    }

    if (prevDataRef.current === currentDataString) {
      return;
    }

    prevDataRef.current = currentDataString;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('saving');

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, currentDataString);
        setStatus('saved');

        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setStatus('error');

        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay, enabled]);

  const clearSavedData = () => {
    try {
      localStorage.removeItem(key);
      setStatus('idle');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  };

  const getSavedData = () => {
    try {
      const savedData = localStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error('Failed to retrieve saved data:', error);
      return null;
    }
  };

  return { status, clearSavedData, getSavedData };
}
