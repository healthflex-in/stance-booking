import React from 'react';
import { cn } from '@/utils/standard-utils';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  label?: string;
  value: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  options: RadioOption[];
  
  onChange: (value: string) => void;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  required,
  className,
  error,
  disabled
}: RadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={cn(
        "inline-flex rounded-md overflow-hidden border border-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "py-2 px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
                isSelected 
                  ? "bg-active text-primary" 
                  : "bg-inactive text-secondary hover:bg-gray-50",
                isSelected ? "font-semibold" : "font-medium",
                index !== 0 && "border-l border-gray-300",
                "min-w-[80px]",
                disabled && "cursor-not-allowed"
              )}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default RadioGroup;
