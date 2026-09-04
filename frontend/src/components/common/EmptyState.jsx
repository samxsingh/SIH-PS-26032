import React from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('common.no_records_found');
  const displayDesc = description || t('common.no_records_desc');

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-md border-2 border-dark-neutral shadow-brutal my-4">
      <div className="w-14 h-14 rounded-md bg-wheat-accent/20 border-2 border-dark-neutral flex items-center justify-center text-dark-neutral mb-4 shadow-[2px_2px_0px_#22252A]">
        <Icon className="w-7 h-7 text-forest-green" />
      </div>
      <h3 className="text-xl font-black font-heading tracking-tight text-dark-neutral mb-1">{displayTitle}</h3>
      <p className="text-dark-neutral-muted text-sm max-w-md mb-6 leading-relaxed font-medium">
        {displayDesc}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
