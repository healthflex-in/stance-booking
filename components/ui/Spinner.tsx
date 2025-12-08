import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function Spinner({ 
  size = 'lg', 
  color = '#DDFE71', 
  className = '' 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-12 h-12',
  };

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]} ${className}`}
      style={{
        borderTopColor: color,
        borderRightColor: color,
      }}
    />
  );
}