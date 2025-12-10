import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  variant?: 'default' | 'primary';
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = true,
  type = 'button',
  variant = 'default',
}: PrimaryButtonProps) {
  const isPrimaryVariant = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${
        fullWidth ? 'w-full' : ''
      } py-4 rounded-2xl font-semibold text-black transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{
        backgroundColor: disabled 
          ? '#D1D5DB' 
          : isPrimaryVariant 
            ? '#DDFE71' 
            : '#132644',
        color: isPrimaryVariant ? 'black' : 'white'
      }}
    >
      {children}
    </button>
  );
}

