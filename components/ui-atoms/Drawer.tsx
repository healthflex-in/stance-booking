import React from 'react';
import { Button } from './Button';

interface DrawerProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	titleIcon?: React.ReactNode;
	children: React.ReactNode;
	width?: string;
	footer?: React.ReactNode;
	footerAction?: React.ReactNode;
	headerActions?: React.ReactNode;
	closeButtonText?: string;
}

export function Drawer({
    isOpen,
    onClose,
    title,
    titleIcon,
    children,
    width = 'w-96',
    footer,
    footerAction,
    headerActions,
    closeButtonText,
}: DrawerProps) {
  return (
    <>
      {/* Dark overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 bottom-0 left-0 ${width} bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          <div className="py-4 px-4 border-b bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {titleIcon}
                <h2 className="text-xl font-medium">{title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {headerActions}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ✕
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>


          <div className="py-3 px-4 bg-primary">
            <div className="flex justify-end gap-3">
              <div className="w-1/6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  className='w-full'>
                  {closeButtonText || 'Close'}
                </Button>
              </div>
              {footerAction && <div className="w-5/6">{footerAction}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}