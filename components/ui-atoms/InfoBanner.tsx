import React from 'react';

interface InfoBannerProps {
  message: string;
  icon?: React.ReactNode;
}

export default function InfoBanner({ message, icon }: InfoBannerProps) {
  return (
    <div className="w-full h-[48px] bg-[#EFF8FB] border border-[rgba(28,26,75,0.1)] rounded-[20px] px-4 flex items-center space-x-3">
      {icon && (
        <div className="w-6 h-6 bg-[#07F4A5] rounded-full flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <p className="text-[11px] font-medium text-[#1C1A4B] leading-4">
        {message}
      </p>
    </div>
  );
}

