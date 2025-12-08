import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/standard-utils';

export type SelectProps = {
  name?: string;
  value?: string;
  error?: string;
  label?: string;
  loading?: boolean;
  hasMore?: boolean;
  className?: string;
  disabled?: boolean;
  searchValue?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  containerClassName?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;

  /**
   * Action's
   */
  onScroll?: () => void;
  onSearch?: (query: string) => void;
  onChange?: (value: string | React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({
    label,
    name,
    error,
    style,
    value,
    options,
    loading,
    onChange,
    disabled,
    className,
    onSearch,
    onScroll,
    searchValue,
    hasMore = false,
    containerClassName,
    placeholder = "Select an option",
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || "");
    const [internalSearchQuery, setInternalSearchQuery] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState({
      top: 0,
      left: 0,
      width: 0,
      placement: 'bottom'
    });

    const triggerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Use external search if provided, otherwise use internal
    const searchQuery = onSearch ? (searchValue || "") : internalSearchQuery;

    const filteredOptions = onSearch
      ? options // External search handles filtering
      : options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const selectedOption = options.find(opt => opt.value === selectedValue);

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    // Also add this effect to handle the case where value is set after options are loaded
    React.useEffect(() => {
      if (value && options.length > 0) {
        const optionExists = options.find(opt => opt.value === value);
        if (optionExists) {
          setSelectedValue(value);
        }
      }
    }, [value, options]);

    // Clear internal search when external search value changes to empty
    React.useEffect(() => {
      if (onSearch && searchValue === "") {
        setInternalSearchQuery("");
      }
    }, [onSearch, searchValue]);

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

    // Initial positioning when dropdown is opened
    React.useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = 320; // Approximate max height of dropdown
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;

        // Check if enough space below
        const placement = spaceBelow < dropdownHeight ? 'top' : 'bottom';

        // Initial positioning using estimated height
        setDropdownPosition({
          top: placement === 'top'
            ? rect.top + window.scrollY - dropdownHeight
            : rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          placement
        });
      }
    }, [isOpen]);

    // Scroll handler for infinite scroll
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
      if (!onScroll || !hasMore || loading) {
        return;
      }

      const threshold = 10;
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + threshold;

      if (isNearBottom) {
        onScroll();
      }
    }, [onScroll, hasMore, loading]);

    // Update position when dropdown is first rendered or changes size
    const updateDropdownPosition = React.useCallback(() => {
      if (isOpen && dropdownRef.current && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current.offsetHeight;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;

        // Check if enough space below
        const placement = spaceBelow < dropdownHeight ? 'top' : 'bottom';

        setDropdownPosition({
          top: placement === 'top'
            ? rect.top + window.scrollY - dropdownHeight
            : rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          placement
        });
      }
    }, [isOpen]);

    // Update position when dropdown is rendered and dimensions are available
    React.useEffect(() => {
      // Single frame delay to ensure the dropdown has rendered with its content
      if (isOpen && dropdownRef.current) {
        const timeoutId = setTimeout(updateDropdownPosition, 0);
        return () => clearTimeout(timeoutId);
      }
    }, [isOpen, updateDropdownPosition]);

    // Scroll and resize event listeners to update dropdown position
    React.useEffect(() => {
      const handlePositionUpdate = () => {
        if (isOpen && triggerRef.current && dropdownRef.current) {
          // Request animation frame to avoid frequent updates
          requestAnimationFrame(updateDropdownPosition);
        }
      };

      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);
      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }, [isOpen, updateDropdownPosition]);

    // Search input handler
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;

      if (onSearch) {
        onSearch(query); // External search
      } else {
        setInternalSearchQuery(query); // Internal search
      }
    };

    const handleSelect = (value: string) => {
      setSelectedValue(value);
      if (onChange) {
        // Synthetic event for backward compatibility
        const event = {
          target: {
            value,
            name: name || '',
          }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
      setIsOpen(false);
    };

    return (
      <div className={cn("relative", containerClassName)} ref={ref}>
        {label && (
          <label
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none z-10",
              (isOpen || selectedValue || placeholder) ? "-top-2.5 text-xs bg-white px-1" : "top-1/2 -translate-y-1/2 text-sm text-gray-500",
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
              "flex items-center h-10 w-full rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-500" : "",
              className
            )}
            onClick={(e) => {
              if (!disabled) {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(prev => !prev);
              }
            }}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
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
                  className="text-gray-500"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
            </div>
          </div>

          {isOpen && createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: '300px'
              }}
            >
              <div className="p-2 border-b border-gray-200 flex-shrink-0">
                <input
                  type="text"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div
                ref={scrollContainerRef}
                className="py-1 overflow-auto flex-1"
                onScroll={handleScroll}
              >
                {filteredOptions.length === 0 && !loading ? (
                  <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
                ) : (
                  <>
                    {filteredOptions.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                          option.value === selectedValue ? "bg-primary/10 text-primary" : "",
                          option.disabled ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                    {/* Loading indicator for infinite scroll */}
                    {loading && hasMore && (
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center justify-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading more...
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Observer element to detect changes in filtered options */}
              <div ref={node => {
                if (node && isOpen) {
                  // Use ResizeObserver to detect size changes
                  const resizeObserver = new ResizeObserver(() => {
                    requestAnimationFrame(updateDropdownPosition);
                  });
                  resizeObserver.observe(node.parentElement as Element);
                  return () => resizeObserver.disconnect();
                }
              }} />
            </div>,
            document.body
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
