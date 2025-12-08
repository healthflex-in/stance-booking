// components/Popup.tsx
'use client';

import React from 'react';

interface PopupProps {
  title: string;
  message: string;
  onClose: () => void;
}

export default function Popup({ title, message, onClose }: PopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md relative">
        {/* Close Button */}
        <button
          className="absolute top-2 right-3 text-gray-500 text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-lg font-bold mb-2">{title}</h2>

        {/* Message */}
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
}
