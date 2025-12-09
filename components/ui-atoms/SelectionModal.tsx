import React from 'react';
import { MapPin } from 'lucide-react';

interface SelectionModalProps {
  title: string;
  options: Array<{
    id: string;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
  }>;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectionModal({
  title,
  options,
  onSelect,
  isOpen,
  onClose,
}: SelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-[#ECEDDC] w-full rounded-t-[20px] p-5 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#1C1A4B] mb-6">{title}</h3>
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                onClose();
              }}
              className="w-full bg-white rounded-[16px] border border-[rgba(28,26,75,0.06)] p-4 text-left hover:bg-gray-50 transition-all"
              type="button"
            >
              <div className="flex items-start space-x-3">
                {option.icon && (
                  <div className="flex-shrink-0 mt-1">{option.icon}</div>
                )}
                <div>
                  <div className="text-base font-medium text-[#1C1A4B] mb-1">
                    {option.title}
                  </div>
                  {option.subtitle && (
                    <div className="text-sm text-[rgba(28,26,75,0.6)]">
                      {option.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

