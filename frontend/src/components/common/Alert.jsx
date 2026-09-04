import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Alert = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const { t } = useTranslation();
  const styles = {
    info: {
      container: 'bg-blue-50 text-dark-neutral border-dark-neutral',
      icon: Info,
      iconColor: 'text-info-blue',
    },
    success: {
      container: 'bg-forest-green-light text-dark-neutral border-dark-neutral',
      icon: CheckCircle2,
      iconColor: 'text-forest-green',
    },
    warning: {
      container: 'bg-amber-100 text-dark-neutral border-dark-neutral',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
    },
    error: {
      container: 'bg-red-100 text-dark-neutral border-dark-neutral',
      icon: AlertCircle,
      iconColor: 'text-red-700',
    },
  };

  const current = styles[type] || styles.info;
  const IconComponent = current.icon;

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'p-4 rounded-md border-2 border-dark-neutral shadow-brutal-sm flex items-start gap-3 transition-all animate-fade-slide',
          current.container,
          className
        )
      )}
    >
      <div className="p-1 rounded bg-white border border-dark-neutral shrink-0">
        <IconComponent className={twMerge('w-4 h-4', current.iconColor)} />
      </div>
      <div className="flex-1 text-sm font-medium">
        {title && <h4 className="font-heading font-black text-sm uppercase tracking-wider text-dark-neutral mb-0.5">{title}</h4>}
        <div className="leading-relaxed text-dark-neutral">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded border border-dark-neutral bg-white hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-dark-neutral"
          aria-label={t('common.dismiss_alert', 'Dismiss alert')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
