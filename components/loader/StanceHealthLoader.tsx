import React from 'react';
import Image from 'next/image';

type LoaderProps = {
  data?: string;
  showTitle?: boolean;
};

export const StanceHealthLoader: React.FC<LoaderProps> = ({ data, showTitle = true }) => {
  return (
    <div
      style={{ backgroundColor: '#ffffff' }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-6"
    >
      {/* Spinner with logo */}
      <div className="relative w-full h-full max-w-[100px] max-h-[100px]">
        {/* Spinning ring */}
        <div
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
        />
        {/* Logo container */}
        <div
          style={{ backgroundColor: 'var(--text-secondary)' }}
          className="absolute inset-2 flex items-center justify-center rounded-full overflow-hidden"
        >
          <Image
            priority
            width={40}
            height={40}
            alt="Stance Health Logo"
            src="/stance-square-logo.png"
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-1">
        {showTitle && (
          <h1
            style={{ color: 'var(--primary)' }}
            className="text-2xl font-semibold tracking-tight"
          >
            stance.health
          </h1>
        )}
        <div className="flex items-center justify-center space-x-1 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>
            Loading {data ?? 'dashboard'}
          </span>
        </div>
      </div>

      {/* Bounce animation */}
      <style jsx>{`
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
};

export default StanceHealthLoader;
