import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('common.error_title');
  const displayMessage = message || t('common.error_message');

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-red-50 rounded-md border-2 border-dark-neutral shadow-brutal my-4">
      <div className="w-14 h-14 rounded-md bg-white border-2 border-dark-neutral flex items-center justify-center text-red-600 mb-4 shadow-[2px_2px_0px_#22252A]">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-black font-heading tracking-tight text-dark-neutral mb-1">{displayTitle}</h3>
      <p className="text-dark-neutral-muted text-sm max-w-md mb-6 leading-relaxed font-medium">{displayMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          <span>{t('common.try_again')}</span>
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
