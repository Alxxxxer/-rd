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
      {/* Dark semi-transparent overlay */}
      <div
        className="absolute inset-0 bg-zinc-950/45 dark:bg-zinc-950/65 backdrop-blur-[2px] transition-opacity duration-150"
        onClick={onClose}
      />

      {/* Flat Modal Box Container */}
      <Card
        className={`
          w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md z-10 p-6 md:p-7 relative
          ${className}
        `}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3.5 mb-5 text-left">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {children}
        </div>
      </Card>
    </div>
  );
};

export default Modal;
