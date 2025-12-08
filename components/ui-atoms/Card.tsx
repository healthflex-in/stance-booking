import React from 'react';
import { cn } from '@/utils/standard-utils';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}

type CollapsibleCardProps = CardProps & {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-gray-200 bg-white shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardHeader = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  ({ className, children, isCollapsed, onToggle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-2 border-b border-gray-200 flex justify-between items-center cursor-pointer",
          className
        )}
        onClick={onToggle}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onToggle && (
          <div className="flex items-center">
            {isCollapsed ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronUpIcon className="h-5 w-5" />
            )}
          </div>
        )}
      </div>
    );
  }
);

export const CardContent = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  ({ className, children, isCollapsed, ...props }, ref) => {
    if (isCollapsed) return null;
    return (
      <div
        ref={ref}
        className={cn("p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardContent.displayName = "CardContent";
