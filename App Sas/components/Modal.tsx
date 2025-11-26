import React from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-pop-up border-4 border-secondary">
        <div className="bg-secondary p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-teal-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-teal-800 hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 text-gray-700 text-lg leading-relaxed">
          {children}
        </div>
        <div className="p-4 bg-gray-50 flex justify-end">
          <Button onClick={onClose} variant="primary" size="sm">Tutup</Button>
        </div>
      </div>
    </div>
  );
};