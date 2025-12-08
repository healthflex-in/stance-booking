import React from 'react';
import { cn } from '@/utils/standard-utils';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  error?: string;
  label?: string;
  containerClassName?: string;
  options: Array<MultiSelectOption>;
  loading?: boolean;
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  style?: React.CSSProperties;
  maxDisplayedValues?: number;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({
    className,
    error,
    label,
    containerClassName,
    options,
    loading,
    value = [],
    onChange,
    placeholder = "Select options",
    disabled,
    name,
    style,
    maxDisplayedValues = 2,
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });

    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4, 
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    const handleSelect = (selectedValue: string) => {
      let newValue: string[];
      if (value.includes(selectedValue)) {
        newValue = value.filter(v => v !== selectedValue);
      } else {
        newValue = [...value, selectedValue];
      }
      onChange?.(newValue);
      setSearchQuery(""); 
    };

    const handleRemove = (removedValue: string, e: React.MouseEvent) => {
      e.stopPropagation(); 
      const newValue = value.filter(v => v !== removedValue);
      onChange?.(newValue);
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        onChange?.([]);
        setIsOpen(false); 
    }

    const getDisplayText = () => {
      if (value.length === 0) {
        return <span className="text-gray-500">{placeholder}</span>; // Style placeholder
      }
      if (value.length <= maxDisplayedValues) {
        return selectedOptions.map(option => (
          <span key={option.value} className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
            {option.label}
            <button
              type="button"
              onClick={(e) => handleRemove(option.value, e)}
              className="ml-1 text-gray-400 hover:text-gray-600"
              aria-label={`Remove ${option.label}`}
              disabled={disabled}
            >
              <X size={12} />
            </button>
          </span>
        ));
      }
      return <span className="text-sm">{`${value.length} selected`}</span>; // Ensure count text size matches
    };

    // Generate stable base ID at the top level
    const baseId = React.useId(); 
    const labelId = `${baseId}-label`;
    const dropdownId = `${baseId}-dropdown`;
    const triggerId = `${baseId}-trigger`;

    return (
      <div className={cn("relative", containerClassName)} ref={ref}>
        {label && (
          <label
            id={labelId}
            htmlFor={name} // Associate label with a potential underlying input if needed, or the trigger
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none z-10",
              (isOpen || value.length > 0 || placeholder) ? "-top-2.5 text-xs bg-white px-1" : "top-1/2 -translate-y-1/2 text-sm text-gray-500",
              error ? "text-red-500" : "text-primary"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative" ref={triggerRef}>
          <div
            style={style}
            className={cn(
              "flex items-center justify-between min-h-10 w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              error ? "border-red-500" : "",
              className
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            tabIndex={disabled ? -1 : 0}
            role="combobox" // Keep ARIA roles
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={labelId} // Associate trigger with label
            aria-controls={isOpen ? dropdownId : undefined}
          >
            <div className="flex flex-wrap gap-1 items-center flex-grow mr-2 overflow-hidden">
              {getDisplayText()}
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center">
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                 <>
                    {value.length > 0 && !disabled && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="mr-1 text-gray-400 hover:text-gray-600 pointer-events-auto p-0.5 rounded-full hover:bg-gray-100"
                            aria-label="Clear selection"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn("text-gray-500 transition-transform", isOpen && "transform rotate-180")}
                      aria-hidden="true" // Decorative arrow
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                 </>
              )}
            </div>
          </div>

          {isOpen && !disabled && createPortal(
            <div
              id={dropdownId}
              ref={dropdownRef}
              className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto flex flex-col"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}
              role="listbox" // Keep ARIA roles
              aria-labelledby={labelId} // Associate dropdown with label
              aria-multiselectable="true"
            >
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                <input
                  type="text"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()} 
                  aria-label="Search options"
                  // Consider managing focus programmatically if needed instead of autoFocus
                />
              </div>
              <div className="py-1 flex-grow overflow-y-auto">
                {loading ? (
                   <div className="px-4 py-2 text-sm text-gray-500 text-center">Loading...</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    // Generate stable option ID using baseId and option value
                    const optionId = `${baseId}-option-${option.value}`;
                    const optionLabelId = `${optionId}-label`; // ID for the label span
                    return (
                      <div
                        key={option.value}
                        id={optionId}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                          option.disabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        role="option" 
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                      >
                         <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly 
                            tabIndex={-1} 
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer pointer-events-none"
                            disabled={option.disabled}
                            aria-labelledby={optionLabelId} // Associate checkbox with the label span
                          />
                        <span id={optionLabelId}>{option.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500" role="alert">{error}</p> // Add role alert for errors
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
