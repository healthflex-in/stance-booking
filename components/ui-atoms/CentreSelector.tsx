import React from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown } from 'lucide-react';

import { useDebounce } from '@/hooks';
import { GET_CENTERS } from '@/gql/queries';
import { cn } from '@/utils/standard-utils';

type CentreSelectorProps = {
  value: string[];
  className?: string;
  choiceType?: 'single' | 'multiple';
  onChange: (value: string[]) => void;
  restrictToCenters?: string[]; // Only show these centers
}

export function CentreSelector({ value, onChange, className, choiceType = 'multiple', restrictToCenters }: CentreSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempValue, setTempValue] = React.useState<string[]>(value);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(tempValue, 750);
  
  const { data: centersData, loading: centersLoading, error } = useQuery(GET_CENTERS);
  
  /**
   * Store the previous debounced value to avoid unnecessary calls
   */
  const prevDebouncedValueRef = React.useRef<string[]>(debouncedValue);

  const centers = React.useMemo(() => {
    if (!centersData || !centersData.centers) return [];
    let allCenters = centersData.centers.map((center: any) => ({
      _id: center._id,
      name: center.name,
    }));
    
    // Filter to only show restricted centers if specified
    if (restrictToCenters && restrictToCenters.length > 0) {
      allCenters = allCenters.filter((center: any) => restrictToCenters.includes(center._id));
    }
    
    return allCenters;
  }, [centersData, restrictToCenters]);

  /**
   * Apply the debounced value to the parent when it changes
   * Fixed: Use useCallback to memoize onChange and compare array contents
   */
  React.useEffect(() => {
    const arraysEqual = (a: string[], b: string[]) => 
      a.length === b.length && a.every((val, i) => val === b[i]);

    if (!arraysEqual(debouncedValue, prevDebouncedValueRef.current)) {
      prevDebouncedValueRef.current = debouncedValue;
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  /**
   * Reset temp value when the parent value changes
   * Fixed: Use deep comparison to avoid unnecessary updates
   */
  React.useEffect(() => {
    const arraysEqual = (a: string[], b: string[]) => 
      a.length === b.length && a.every((val, i) => val === b[i]);

    if (!arraysEqual(value, tempValue)) {
      setTempValue(value);
    }
  }, [value]); // Removed tempValue from dependencies

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = React.useCallback((centerId: string) => {
    if (choiceType === 'single') {
      setTempValue([centerId]);
    } else {
      setTempValue(prev => {
        const newValue = prev.includes(centerId)
          ? prev.filter(id => id !== centerId)
          : [...prev, centerId];
        
        if (typeof window !== 'undefined') {
          import('@/utils/center-utils').then(({ setCenterIds }) => {
            setCenterIds(newValue);
          });
        }
        return newValue;
      });
    }
  }, [choiceType]);

  const handleSelectAll = React.useCallback(() => {
    if (choiceType === 'single') return;
    const allCenterIds = centers.map((center: any) => center._id);
    setTempValue(allCenterIds);
    if (typeof window !== 'undefined') {
      import('@/utils/center-utils').then(({ setCenterIds }) => {
        setCenterIds(allCenterIds);
      });
    }
  }, [choiceType, centers]);

  const handleClearAll = React.useCallback(() => {
    if (choiceType === 'single') return;
    setTempValue([]);
    if (typeof window !== 'undefined') {
      import('@/utils/center-utils').then(({ clearCenterIds }) => {
        clearCenterIds();
      });
    }
  }, [choiceType]);

const displayText = React.useMemo(() => {
  if (tempValue.length === 0) {
    return choiceType === 'single' ? 'Select centre' : 'Select centres';
  }
  
  if (tempValue.length === 1) {
    const selectedCenter = centers.find((center:any) => center._id === tempValue[0]);
    return selectedCenter ? selectedCenter.name : 'Select centre';
  }
  
  return `${tempValue.length} centres selected`;
}, [choiceType, tempValue, centers]);

  return (
    <div className={cn('relative w-[240px]', className)} ref={dropdownRef}>
      <button
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2',
          'text-sm text-gray-700 shadow-sm transition-all',
          'hover:bg-gray-50',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen && 'ring-2 ring-primary/20'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayText}</span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'transform rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {choiceType === 'multiple' && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Select All
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAll();
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          <div className="max-h-[240px] overflow-y-auto p-1">
            {centersLoading ? (
              <div className="flex justify-center items-center p-3 text-sm text-gray-500 text-center">
                <svg
                  className="animate-spin h-5 w-5 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 1 1 16 0A8 8 0 0 1 4 12z"
                  ></path>
                </svg>
              </div>
            ) : error ? (
              <div className="p-3 text-sm text-red-600 text-center">Error loading centres</div>
            ) : (
              <div className="space-y-1">
                {centers.map((center: any) => (
                  <div
                    key={center._id}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      handleChange(center._id);
                      if (choiceType === 'single') {
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border',
                        tempValue.includes(center._id)
                          ? 'border-secondary bg-primary text-white'
                          : 'border-gray-300 bg-white'
                      )}
                    >
                      {tempValue.includes(center._id) && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{center.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CentreSelector;