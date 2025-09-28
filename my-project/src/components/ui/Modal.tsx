// Reusable Modal component
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-fade-in-up">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {title && (
              <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </h3>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
