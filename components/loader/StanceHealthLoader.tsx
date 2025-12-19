import React from 'react';

type LoaderProps = {
  message?: string;
};

export const StanceHealthLoader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-[#DDFE71] border-t-transparent animate-spin" />
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[#203A37] overflow-hidden">
          <img
            src="/stance-square-logo.png"
            alt="Stance Health"
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>
      <p className="mt-6 text-gray-900 font-medium">{message}</p>
    </div>
  );
};

export default StanceHealthLoader;
