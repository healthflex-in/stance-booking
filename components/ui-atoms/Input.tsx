import React from 'react';
import { cn } from '@/utils/standard-utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  multiline?: boolean;
  icon?: React.ReactNode;
  containerClassName?: string;
}

const FLOATING_LABEL_TYPES = ['date', 'datetime-local', 'time', 'month', 'week', 'tel', 'number', 'url'];

export const Input = React.forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
  ({ className, error, icon, label, containerClassName, type = 'text', multiline = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    React.useEffect(() => {
      setHasValue(!!props.value);
    }, [props.value]);

    // Always show floating label for date inputs and similar
    const shouldFloatByDefault = FLOATING_LABEL_TYPES.includes(type);
    const showFloatingLabel = isFocused || hasValue || shouldFloatByDefault;

    return (
      <div className={cn("relative", containerClassName)}>
        <label
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            showFloatingLabel
              ? "-top-2.5 text-xs bg-white px-1 text-primary"
              : "top-2.5 text-sm text-gray-500"
          )}
          htmlFor={props.id}
        >
          {label}
        </label>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {multiline ? (
          <textarea
            className={cn(
              "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto",
              icon ? "pl-10" : "",
              error ? "border-red-500" : "",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e as unknown as React.FocusEvent<HTMLInputElement>);
            }}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            className={cn(
              "h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm leading-10 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
              icon ? "pl-10" : "",
              error ? "border-red-500" : "",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            type={type}
            ref={ref as React.Ref<HTMLInputElement>}
            {...props}
          />
        )}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
