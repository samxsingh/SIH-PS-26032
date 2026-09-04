import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, AlertCircle, ArrowRightCircle, XCircle } from 'lucide-react';
import Badge from './Badge';

export const StatusIndicator = ({ status = 'WAITING', label, size = 'md' }) => {
  const { t } = useTranslation();

  const keyLower = (status || 'waiting').toLowerCase();
  const localizedLabel = label || t(`status.${keyLower}`, status);

  const getVariantAndIcon = (st) => {
    switch (st?.toUpperCase()) {
      case 'WAITING':
      case 'SLOT_CONFIRMED':
        return { variant: 'warning', icon: Clock };
      case 'CALLED':
      case 'ARRIVED':
      case 'PRODUCE_RECEIVED':
        return { variant: 'info', icon: ArrowRightCircle };
      case 'VERIFICATION':
      case 'QUALITY_VERIFIED':
      case 'WEIGHING':
      case 'WEIGHED':
      case 'PAYMENT_INITIATED':
      case 'PAYMENT_PROCESSING':
        return { variant: 'wheat', icon: Clock };
      case 'COMPLETED':
      case 'PROCUREMENT_COMPLETED':
      case 'PAID':
        return { variant: 'success', icon: CheckCircle2 };
      case 'CANCELLED':
      case 'NO_SHOW':
      case 'PAYMENT_FAILED':
      case 'REJECTED':
        return { variant: 'danger', icon: XCircle };
      default:
        return { variant: 'neutral', icon: AlertCircle };
    }
  };

  const { variant, icon } = getVariantAndIcon(status);

  return (
    <Badge
      variant={variant}
      size={size}
      icon={icon}
      aria-label={`Status: ${localizedLabel}`}
    >
      {localizedLabel}
    </Badge>
  );
};

export default StatusIndicator;
