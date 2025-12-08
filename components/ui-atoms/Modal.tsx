import React from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  /**
   * State's
   */
  isOpen: boolean;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;

  /**
   * Action's
   */
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  header,
  footer,
  className = '',
  maxWidth = 'max-w-4xl',
  maxHeight = 'max-h-[90vh]',
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full flex flex-col ${maxWidth} ${maxHeight} ${className}`}
        style={{ maxHeight: '90vh' }}
      >
        {header && (
          <div className="sticky top-0 z-10 bg-white border-b rounded-t-lg">
            {header}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="sticky bottom-0 z-10 bg-white border-t rounded-b-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => e.preventDefault()}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
