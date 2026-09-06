import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ShieldCheck,
  Radio,
  RefreshCw,
  Clock,
  MapPin,
  UserCheck
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const OperationalHeader = ({
  centreProfile,
  user,
  isConnected,
  onSyncAll,
  isSyncing
}) => {
  const { t } = useTranslation();

  const centreName = centreProfile?.name || 'Krishi Seva Procurement Centre — Gomti Nagar';
  const centreType = centreProfile?.centreType || 'PROCUREMENT_CENTRE';
  const parentMandi = centreProfile?.mandiName || centreProfile?.mandi?.name || 'Gomti Nagar Regulated APMC Mandi';
  const district = centreProfile?.district || 'Lucknow';
  const state = centreProfile?.state || 'Uttar Pradesh';
  const centreCode = centreProfile?.centreId || centreProfile?.centreCode || 'LKO_GOM01';
  const currentHeadName = centreProfile?.currentHead?.fullName || 'Satish Kumar';

  // Dynamic Operational Status based on load / active status
  const isClosed = centreProfile?.isActive === false;
  const isHighLoad = (centreProfile?.currentLoadPercentage || 0) >= 80;
  const isBusy = (centreProfile?.currentLoadPercentage || 0) >= 50;

  const statusVariant = isClosed ? 'danger' : isHighLoad ? 'warning' : 'success';
  const statusLabel = isClosed
    ? t('staff.centre_closed', 'Centre Closed')
    : isHighLoad
    ? t('staff.centre_high_load', 'Centre High Load')
    : isBusy
    ? t('staff.centre_busy', 'Centre Busy')
    : t('staff.centre_operational', 'Centre Operational');

  // Role identity
  const isHead = user?.isCentreHead || user?.designation === 'Centre Head' || (user?.email && user?.email.includes('centre'));
  const userRoleLabel = isHead
    ? t('staff.role_centre_manager', 'Centre Manager')
    : t('staff.role_centre_staff', 'Centre Staff');

  return (
    <header className="bg-white border-3 border-dark-neutral p-4 sm:p-6 rounded-md shadow-brutal-lg mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Centre Identity & Lucknow Context */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-forest-green bg-forest-green-light px-2.5 py-0.5 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
              {t(`centre_type.${centreType}`, centreType.replace(/_/g, ' '))}
            </span>
            <span className="text-xs font-bold text-dark-neutral-muted">•</span>
            <span className="text-xs font-bold text-dark-neutral flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-forest-green" />
              {parentMandi}
            </span>
            <span className="text-xs font-bold text-dark-neutral-muted">•</span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-dark-neutral bg-sand px-2 py-0.5 rounded-xs border border-dark-neutral/30">
              ID: {centreCode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-dark-neutral">
            {centreName}
          </h1>

          <div className="flex items-center gap-2 text-xs text-dark-neutral-muted font-medium flex-wrap">
            <span className="flex items-center gap-1 text-forest-green font-bold">
              <MapPin className="w-3.5 h-3.5" />
              {district} District, {state}
            </span>
            <span>•</span>
            <span>{t('staff.appointed_manager', 'Manager')}: <strong className="text-dark-neutral">{currentHeadName}</strong></span>
            <span>•</span>
            <span>{t('staff.logged_in_as', 'Logged in as')}: <strong className="text-forest-green">{user?.fullName || userRoleLabel}</strong> ({userRoleLabel})</span>
          </div>
        </div>

        {/* Right: Operational Status Badges & Quick Sync */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
          {/* Live Operational Status */}
          <Badge variant={statusVariant} size="lg" className="shadow-[2px_2px_0px_#22252A] font-black tracking-wide">
            <span className="w-2 h-2 rounded-full mr-1.5 animate-pulse bg-current inline-block" />
            {statusLabel}
          </Badge>

          {/* Socket Connection Badge */}
          <Badge variant={isConnected ? 'success' : 'warning'} size="md" icon={Radio}>
            {isConnected
              ? t('staff.realtime_synchronized', 'Live Synchronized')
              : t('staff.reconnecting', 'Connecting...')}
          </Badge>

          {/* Sync All Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSyncAll}
            disabled={isSyncing}
            className="text-xs font-bold shadow-[2px_2px_0px_#22252A]"
            aria-label={t('common.refresh', 'Sync All')}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{t('common.sync', 'Sync')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default OperationalHeader;
