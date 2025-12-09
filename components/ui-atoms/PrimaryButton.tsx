import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = true,
  type = 'button',
}: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${
        fullWidth ? 'w-full' : ''
      } h-[40px] bg-[#132644] text-white rounded-[10px] text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

