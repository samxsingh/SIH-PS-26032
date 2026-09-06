import React from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { MapPin, Clock, Users, Calendar, ShieldCheck, AlertTriangle, Eye, Wheat } from 'lucide-react';

export const CentreCard = ({
  centre,
  onSelectCentre,
  onBookSlot,
  onViewDetails,
  isSelected = false
}) => {
  const { t } = useTranslation();
  const distanceKm = centre.distanceKm !== undefined ? centre.distanceKm : 3.4;
  const estimatedWaitMinutes = centre.estimatedWaitMinutes || 25;
  const loadPct = centre.currentLoadPercentage || 40;
  const isVerified = centre.verificationStatus === 'VERIFIED';
  const availableSlots = centre.availableSlotsToday || 12;
  const cropsList = centre.crops && centre.crops.length > 0 ? centre.crops : ['Wheat', 'Paddy', 'Mustard'];

  return (
    <div
      onClick={() => {
        if (onSelectCentre) {
          onSelectCentre(centre);
        }
      }}
      className={`bg-white rounded-xs border-2 border-dark-neutral p-5 transition-all duration-normal ease-tactile shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0 active:shadow-brutal cursor-pointer ${
        isSelected ? 'bg-forest-green-light/40 border-forest-green ring-2 ring-forest-green' : ''
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green-light border border-dark-neutral px-2 py-0.5 rounded-xs shadow-[1px_1px_0px_#22252A]">
              ID: {centre.centreCode || 'LKO-GOM-001'}
            </span>
            {centre.isActive === false ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 bg-gray-200 border border-gray-600 px-2 py-0.5 rounded-xs flex items-center gap-1">
                <span>⛔</span>
                <span>CLOSED</span>
              </span>
            ) : loadPct >= 80 ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-red-950 bg-red-100 border border-red-600 px-2 py-0.5 rounded-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-700" />
                <span>HIGH LOAD</span>
              </span>
            ) : loadPct >= 50 ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-100 border border-amber-600 px-2 py-0.5 rounded-xs flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>BUSY</span>
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-100 border border-emerald-700 px-2 py-0.5 rounded-xs flex items-center gap-1">
                <span>●</span>
                <span>OPEN NOW</span>
              </span>
            )}
            {isVerified ? (
              <span className="text-[10px] font-black uppercase tracking-wider text-green-900 bg-green-100 border border-green-800 px-2.5 py-0.5 rounded-xs inline-flex items-center gap-1 font-mono font-bold">
                <ShieldCheck className="w-3 h-3 text-green-800" />
                <span>{t('farmer.registered_verified_badge', 'REGISTERED / VERIFIED')}</span>
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider text-green-900 bg-green-100 border border-green-800 px-2.5 py-0.5 rounded-xs inline-flex items-center gap-1 font-mono font-bold">
                <ShieldCheck className="w-3 h-3 text-green-800" />
                <span>GOVT AUTHORIZED</span>
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black font-heading tracking-tight text-dark-neutral">
            {centre.name}
          </h3>
          {(centre.mandiName || centre.mandiId?.name) && (
            <div className="flex items-center gap-1 text-xs font-bold text-forest-green mt-0.5">
              <span>🏛️ Mandi:</span>
              <span className="text-dark-neutral underline decoration-forest-green/40 underline-offset-2">
                {centre.mandiName || centre.mandiId?.name}
              </span>
            </div>
          )}
        </div>
        <Badge variant="neutral">{t('farmer.km_away', { distance: distanceKm })}</Badge>
      </div>

      <p className="text-xs text-dark-neutral-muted font-medium flex items-start gap-1 mb-3">
        <MapPin className="w-3.5 h-3.5 text-forest-green flex-shrink-0 mt-0.5" />
        <span>{centre.address}</span>
      </p>

      {/* Metrics Row: Wait Time & Queue Load */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[1px_1px_0px_#22252A] flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <div>
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">{t('farmer.wait_time')}</span>
            <span className="font-black text-dark-neutral">{t('farmer.estimated_wait_time_val', { minutes: estimatedWaitMinutes })}</span>
          </div>
        </div>

        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[1px_1px_0px_#22252A] flex items-center gap-2">
          <Users className="w-4 h-4 text-info-blue flex-shrink-0" />
          <div>
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">{t('farmer.queue_load_label')}</span>
            <span className={`font-black ${loadPct > 80 ? 'text-red-700' : 'text-forest-green'}`}>
              {loadPct < 50 ? t('farmer.low_congestion', 'Low congestion') : t('farmer.capacity_load', { pct: loadPct })}
            </span>
          </div>
        </div>
      </div>

      {/* Crops Accepted & Available Slots Tags */}
      <div className="p-2.5 bg-warm-ivory/60 border border-dark-neutral/30 rounded-xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[10px] font-black uppercase text-dark-neutral-muted block mb-0.5">{t('farmer.crops_label', 'Crops')}:</span>
          <span className="font-bold text-dark-neutral">{cropsList.join(' • ')}</span>
        </div>
        <div className="sm:text-right">
          <span className="text-[10px] font-black uppercase text-dark-neutral-muted block mb-0.5">{t('farmer.available_today_label', 'Available today')}:</span>
          <span className="font-black text-forest-green">{availableSlots} {t('farmer.delivery_slots_val', 'delivery slots')}</span>
        </div>
      </div>

      {/* Action Buttons: [ View Centre ] and [ Book Slot ] */}
      <div className="flex items-center gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(centre);
            }}
            className="flex-1"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            <span>{t('farmer.view_centre_btn', 'View Centre')}</span>
          </Button>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (onBookSlot) {
              onBookSlot(centre);
            } else if (onSelectCentre) {
              onSelectCentre(centre);
            }
          }}
          className={onViewDetails ? 'flex-1' : 'w-full'}
        >
          <Calendar className="w-4 h-4 mr-1.5" />
          <span>{t('farmer.book_slot')}</span>
        </Button>
      </div>
    </div>
  );
};

export default CentreCard;
