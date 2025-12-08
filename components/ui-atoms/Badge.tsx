import React from 'react';
import { cn } from '@/utils/standard-utils';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info' | 'break';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-gray-100 text-primary",
  success: "bg-green-200 text-green-800",
  destructive: "bg-red-200 text-red-800",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-800",
  break: "bg-yellow-200 text-yellow-800",
};

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
