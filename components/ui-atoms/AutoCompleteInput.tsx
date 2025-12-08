import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils/standard-utils';

export interface AutoCompleteInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  label?: string;
  containerClassName?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  debounceMs?: number;
}

// Custom debounce hook
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
}

const AutoCompleteInput = React.forwardRef<HTMLInputElement, AutoCompleteInputProps>(
  ({ 
    className, 
    error, 
    icon, 
    label, 
    containerClassName, 
    suggestions = [], 
    onSuggestionSelect,
    onChange,
    debounceMs = 500,
    value,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>(value as string || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Debounced onChange handler
    const debouncedOnChange = useDebounce((value: string) => {
      if (onChange) {
        const event = {
          target: { value },
          currentTarget: { value }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    }, debounceMs);

    // Handle immediate input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      debouncedOnChange(value);
    };

    useEffect(() => {
      setHasValue(!!inputValue);
    }, [inputValue]);

    useEffect(() => {
      // Filter suggestions based on input value
      if (inputValue) {
        const filtered = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions([]);
      }
    }, [inputValue, suggestions]);

    useEffect(() => {
      // Close suggestions when clicking outside
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current && 
          !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleSuggestionClick = (suggestion: string) => {
      setInputValue(suggestion);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      setShowSuggestions(false);
    };

    const showFloatingLabel = isFocused || hasValue;

    return (
      <div className={cn("relative", containerClassName)}>
        <label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none z-20 bg-white font-normal text-[14px]",
            showFloatingLabel 
              ? "-top-2.5 text-xs px-1 text-primary" 
              : "top-1/2 -translate-y-1/2 text-gray-500 left-10"
          )}
          htmlFor={props.id}
        >
          {label}
        </label>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm leading-10 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-[#636365B2] placeholder:font-normal placeholder:text-[14px] placeholder:leading-[24px] placeholder:tracking-[-0.01em] placeholder:align-middle",
            icon ? "pl-10" : "",
            error ? "border-red-500" : "",
            className
          )}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={(e) => {
            setIsFocused(true);
            setShowSuggestions(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            inputRef.current = node;
          }}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

AutoCompleteInput.displayName = "AutoCompleteInput";

export { AutoCompleteInput }; 