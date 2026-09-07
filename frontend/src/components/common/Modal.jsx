import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  position = 'center', // 'center' | 'top'
  bodyRef = null,
  contentClassName = '',
  dialogClassName = '',
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
  const isTopPositioned = position === 'top';

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex ${
        isTopPositioned ? 'items-start justify-center pt-3 sm:pt-6 pb-4 sm:pb-8 px-2 sm:px-4' : 'items-center justify-center p-4'
      } bg-dark-neutral/60 backdrop-blur-xs animate-modal-backdrop print:static print:inset-auto print:p-0 print:bg-transparent print:backdrop-blur-none print:block print:w-full print:h-auto print:overflow-visible`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${resolvedMaxWidth} bg-white rounded-md border-3 border-dark-neutral shadow-brutal-xl overflow-hidden transform transition-all ${
          isTopPositioned ? 'max-h-[92vh] flex flex-col' : ''
        } ${dialogClassName} animate-modal-dialog print:transform-none print:shadow-none print:border-none print:max-w-none print:p-0 print:m-0 print:overflow-visible print:w-full`}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-dark-neutral bg-warm-ivory flex items-center justify-between shrink-0 print:hidden">
          <h3 id="modal-title" className="text-base sm:text-lg font-black font-heading tracking-tight text-dark-neutral">
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
        <div
          ref={bodyRef}
          className={`${
            isTopPositioned ? 'p-3 sm:p-5 overflow-y-auto flex-1 min-h-0 overscroll-contain' : 'p-6 max-h-[75vh] overflow-y-auto'
          } ${contentClassName} print:p-0 print:max-h-none print:overflow-visible`}
        >
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-warm-ivory/80 border-t-2 border-dark-neutral flex justify-end gap-3 shrink-0 print:hidden">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default Modal;
