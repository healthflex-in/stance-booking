import React from 'react';
import { usePageTitle } from '@/contexts';

type UsePageSetupOptions = {
  /**
   * Optional page title to set when the hook initializes
   */
  pageTitle?: string;
  
  /**
   * Default center ID to use if none is found in localStorage
   * Defaults to process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID
   */
  defaultCenterId?: string;
}

type UsePageSetupSelectionReturn = {
  selectedCenterId: string;
  selectedCenterIds: string[];

  setSelectedCenterId: (centerId: string) => void;
  updateCenterSelection: (centers: string[] | string) => void;
  setSelectedCenterIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Custom hook for managing center selection from localStorage
 * Handles initialization, persistence, and optional page title setting
 */
export function usePageSetup(options: UsePageSetupOptions = {}): UsePageSetupSelectionReturn {
  const {
    pageTitle,
    defaultCenterId = process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '',
  } = options;

  const { setPageTitle } = usePageTitle();
  
  // Initialize with default center ID to prevent empty array issues
  const [selectedCenterIds, setSelectedCenterIds] = React.useState<string[]>(() => {
    // Try to get from localStorage immediately during initialization
    if (typeof window !== 'undefined') {
      const storedCenterIds = localStorage.getItem('stance-centreID');
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.log('🏥 Center ID Debug - Raw localStorage:', storedCenterIds);
      }
      if (storedCenterIds) {
        try {
          const parsedIds = JSON.parse(storedCenterIds);
          const centerArray = Array.isArray(parsedIds) ? parsedIds : [parsedIds];
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.log('🏥 Center ID Debug - Parsed array:', centerArray);
          }
          // Filter out empty strings, null, undefined and ensure we have valid IDs
          const validCenterIds = centerArray.filter(id => 
            id && 
            typeof id === 'string' && 
            id.trim().length > 0 &&
            id !== 'null' &&
            id !== 'undefined'
          );
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.log('🏥 Center ID Debug - Valid IDs:', validCenterIds);
          }
          if (validCenterIds.length > 0) {
            return validCenterIds;
          }
        } catch (error) {
          console.warn('Error parsing stored center IDs:', error);
        }
      }
    }
    // Fallback to default center ID if available
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
      console.log('🏥 Center ID Debug - Using default:', defaultCenterId);
    }
    if (defaultCenterId && defaultCenterId.trim().length > 0) {
      return [defaultCenterId];
    }
    return [];
  });

  // Set page title effect
  React.useEffect(() => {
    if (pageTitle) {
      setPageTitle(pageTitle);
    }
  }, [pageTitle, setPageTitle]);
  
  // Sync with localStorage when centers change
  React.useEffect(() => {
    if (typeof window !== 'undefined' && selectedCenterIds.length > 0) {
      localStorage.setItem('stance-centreID', JSON.stringify(selectedCenterIds));
    }
  }, [selectedCenterIds]);

  // Helper function to update center selection and persist to localStorage
  const updateCenterSelection = React.useCallback((centers: string[] | string) => {
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
      console.log('🏥 Center ID Debug - Updating with:', centers);
    }
    const centerArray = Array.isArray(centers) ? centers : [centers];
    const validCenterIds = centerArray.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim().length > 0 &&
      id !== 'null' &&
      id !== 'undefined'
    );
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
      console.log('🏥 Center ID Debug - Final valid IDs:', validCenterIds);
    }
    
    setSelectedCenterIds(validCenterIds);
    
    if (typeof window !== 'undefined' && validCenterIds.length > 0) {
      localStorage.setItem('stance-centreID', JSON.stringify(validCenterIds));
    }
  }, []);

  // Helper function to set a single center ID
  const setSelectedCenterId = React.useCallback((centerId: string) => {
    updateCenterSelection([centerId]);
  }, [updateCenterSelection]);

  // Get the first center ID for convenience
  const selectedCenterId = selectedCenterIds[0] || defaultCenterId;

  return {
    selectedCenterId,
    selectedCenterIds,
    setSelectedCenterId,
    setSelectedCenterIds,
    updateCenterSelection,
  };
}

// Alternative hooks for specific use cases
export function useCenterSelectionWithTitle(pageTitle: string, defaultCenterId?: string) {
  return usePageSetup({ pageTitle, defaultCenterId });
}

export function useCenterSelectionOnly(defaultCenterId?: string) {
  return usePageSetup({ defaultCenterId });
}

/*
USAGE EXAMPLES:

// Example 1: With page title (replaces the billing example)
const BillingComponent = () => {
  const { selectedCenterIds, updateCenterSelection } = useCenterSelection({
    pageTitle: 'Billing'
  });

  const handleCenterChange = (centers: string[]) => {
    updateCenterSelection(centers);
  };

  return (
    <CentreSelector
      value={selectedCenterIds}
      onChange={handleCenterChange}
    />
  );
};

// Example 2: Without page title (replaces the staff schedules example)
const StaffSchedulesComponent = () => {
  const { setPageTitle } = usePageTitle();
  const { selectedCenterIds, updateCenterSelection } = useCenterSelection();

  React.useEffect(() => {
    setPageTitle('Staff Schedules');
  }, [setPageTitle]);

  const handleCenterChange = (centers: string[]) => {
    updateCenterSelection(centers);
  };

  return (
    <CentreSelector
      value={selectedCenterIds}
      onChange={handleCenterChange}
    />
  );
};

// Example 3: Using the convenience hooks
const CalendarComponent = () => {
  // This sets both page title and initializes centers
  const { selectedCenterIds, updateCenterSelection } = useCenterSelectionWithTitle('Calendar');

  return (
    <CentreSelector
      value={selectedCenterIds}
      onChange={updateCenterSelection}
    />
  );
};

// Example 4: Just center selection without page title
const SomeOtherComponent = () => {
  const { selectedCenterIds, selectedCenterId } = useCenterSelectionOnly();

  // Use selectedCenterIds for multi-center components
  // Use selectedCenterId for single-center components (first item)
  
  return <div>Selected center: {selectedCenterId}</div>;
};

// Example 5: Programmatic center updates
const AnotherComponent = () => {
  const { selectedCenterIds, setSelectedCenterId, updateCenterSelection } = useCenterSelection();

  const handleSingleCenterSelect = () => {
    setSelectedCenterId('specific-center-id');
  };

  const handleMultipleCenterSelect = () => {
    updateCenterSelection(['center1', 'center2', 'center3']);
  };

  return (
    <div>
      <button onClick={handleSingleCenterSelect}>Select Single Center</button>
      <button onClick={handleMultipleCenterSelect}>Select Multiple Centers</button>
    </div>
  );
};
*/