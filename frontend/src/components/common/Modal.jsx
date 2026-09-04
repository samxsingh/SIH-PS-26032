import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
  size, // for compatibility: sm, md, lg, xl
}) => {
  const { t } = useTranslation();
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const resolvedMaxWidth = (size && sizeClasses[size]) || maxWidth;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-neutral/60 backdrop-blur-xs animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${resolvedMaxWidth} bg-white rounded-md border-3 border-dark-neutral shadow-brutal-xl overflow-hidden transform transition-all animate-modal-dialog`}
      >
        <div className="px-6 py-4 border-b-2 border-dark-neutral bg-warm-ivory flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-black font-heading tracking-tight text-dark-neutral">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-dark-neutral bg-white hover:bg-gray-100 rounded-sm text-dark-neutral transition-all shadow-[2px_2px_0px_#22252A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus:outline-none focus:ring-2 focus:ring-dark-neutral"
            aria-label={t('common.close_dialog', 'Close dialog')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 bg-warm-ivory/80 border-t-2 border-dark-neutral flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
