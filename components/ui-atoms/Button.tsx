import React from 'react';
import { cn } from '@/utils/standard-utils';

type ButtonVariant =
  | 'glow'
  | 'ghost'
  | 'default'
  | 'outline'
  | 'secondary'
  | 'destructive';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'xs' | 'xxs' | 'xxxs';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  isLoading?: boolean;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  ghost: 'border border-secondary hover:bg-inactive',
  default: 'bg-accent border-primary border-1 text-white',
  secondary: 'bg-gray-100 text-primary hover:bg-gray-200',
  outline: 'border border-primary bg-white hover:bg-gray-50',
  destructive: '!bg-red-500 !text-white border border-red-500 hover:!bg-red-400 hover:!text-white',
  glow: 'bg-accent border-accent border-1 text-white shadow-[4px_12px_24px_0px_var(--accent-shadow)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-3 py-2',
  sm: 'h-8 px-3 py-1',
  lg: 'h-12 px-6 py-3',
  icon: 'h-10 w-10',
  xs: 'h-4 px-2 py-3',
  xxs: 'h-3 px-1 py-2',
  xxxs: 'h-2 px-1 py-1.5 text-[10px]',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-[14px] font-medium text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className,
          (isLoading || props.disabled) && 'cursor-not-allowed opacity-50' // Ensure cursor is disabled and opacity is reduced
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
