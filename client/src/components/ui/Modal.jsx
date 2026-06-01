import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Card from './Card';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  // Bind Escape key to close the modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blur overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Glassmorphic Modal Box Container */}
      <Card
        className={`
          w-full max-w-lg bg-slate-900/90 border border-slate-800 shadow-glass z-10 p-6 md:p-8 animate-fade-in relative
          ${className}
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 text-left">
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default Modal;
