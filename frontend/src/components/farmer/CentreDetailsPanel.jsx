import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  MapPin,
  Building2,
  Clock,
  Phone,
  Calendar,
  Sprout,
  Users,
  Gauge,
  Navigation,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  User,
  CheckCircle
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getDirectionsUrl } from '../../services/googleMapsService';
import { getLocalizedCrop } from '../../utils/formatters';

/**
 * CentreDetailsPanel
 * Slide-out drawer panel displayed through a React Portal directly attached to document.body.
 * Ensures the fixed drawer is never trapped inside transformed containers (e.g. animate-page-enter).
 * Explicitly supports both CENTRE and MANDI entity schemas with zero undefined field leaking.
 */
export const CentreDetailsPanel = ({
  entity = null,
  entityType = null, // 'CENTRE' | 'MANDI' | null
  centre = null, // backward compatibility
  isOpen = false,
  onClose = () => {},
  onBookSlot = () => {},
  userLocation = { lat: 26.8467, lon: 80.9462 },
  activeBooking = null,
  centres = [],
  onSelectCentre = null
}) => {
  const { t } = useTranslation();
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Handle focus management and ESC key to dismiss drawer
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      // Focus close button on open for accessibility
      const timer = setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Determine active entity and type
  const activeEntity = entity || centre;
  if (!isOpen || !activeEntity) return null;
  if (typeof document === 'undefined') return null;

  const resolvedType = entityType || (activeEntity.mandiCode && !activeEntity.centreCode ? 'MANDI' : 'CENTRE');

  // =========================================================================
  // MANDI ENTITY RENDERING
  // =========================================================================
  if (resolvedType === 'MANDI') {
    const mandi = activeEntity;
    const lat = mandi.location?.coordinates?.[1] || 26.8500;
    const lon = mandi.location?.coordinates?.[0] || 80.9500;
    const directionsUrl = getDirectionsUrl(lat, lon, userLocation?.lat, userLocation?.lon);
    const categoryLabel = mandi.category ? mandi.category.replace(/_/g, ' ') : 'Principal Market Yard';
    const authority = mandi.operatingAuthority || 'UP State Agricultural Marketing Board (Mandi Parishad)';
    const commodities = mandi.supportedCommodities && mandi.supportedCommodities.length > 0
      ? mandi.supportedCommodities
      : ['Wheat', 'Paddy', 'Mustard', 'Gram', 'Maize', 'Barley'];

    // Find affiliated centres governed by this mandi
    const affiliatedCentres = centres.filter((c) => {
      const cMandiId = c.mandiId?._id || c.mandiId?.id || (typeof c.mandiId === 'string' ? c.mandiId : null);
      const mId = mandi._id || mandi.id;
      const cMandiCode = c.mandiCode || c.mandiId?.mandiCode;
      const cMandiName = c.mandiName || c.mandiId?.name;

      return (cMandiId && mId && cMandiId.toString() === mId.toString()) ||
        (cMandiCode && mandi.mandiCode && cMandiCode.toLowerCase() === mandi.mandiCode.toLowerCase()) ||
        (cMandiName && mandi.name && cMandiName.toLowerCase() === mandi.name.toLowerCase());
    });

    const mandiDrawerContent = (
      <>
        {/* Accessible Backdrop */}
        <div
          className="fixed inset-0 bg-dark-neutral/40 backdrop-blur-xs z-40 transition-opacity animate-modal-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-out Drawer */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={mandi.name || 'APMC Mandi Details'}
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-warm-ivory border-l-3 border-dark-neutral shadow-brutal-xl flex flex-col font-sans transition-transform duration-300 ease-out"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-white border-b-2 border-dark-neutral flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 shadow-[1px_1px_0px_#22252A]">
                  🏛️ APMC Mandi
                </span>
                <span className="font-mono text-[11px] font-black bg-warm-ivory text-dark-neutral px-2 py-0.5 rounded-xs border border-dark-neutral/30">
                  {mandi.mandiCode || 'MND_LKO'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-heading font-black text-dark-neutral leading-tight">
                {mandi.name}
              </h2>
              <span className="text-xs text-dark-neutral-muted font-bold block mt-1">
                {categoryLabel}
              </span>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1.5 rounded-xs bg-warm-ivory border-2 border-dark-neutral hover:bg-forest-green hover:text-white shadow-[2px_2px_0px_#22252A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors"
              aria-label={t('common.close_drawer', 'Close details drawer')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Governing Authority Banner */}
            <div className="bg-blue-50 border-2 border-dark-neutral rounded-xs p-3.5 shadow-brutal-sm">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block tracking-wider">
                    {t('farmer.operating_authority', 'Operating Authority')}
                  </span>
                  <h3 className="font-heading font-black text-sm text-dark-neutral">
                    {authority}
                  </h3>
                  <p className="text-xs text-dark-neutral-muted mt-1 font-medium">
                    {mandi.address || 'Lucknow APMC Hub'}, {mandi.district || 'Lucknow'}, {mandi.state || 'Uttar Pradesh'}
                    {mandi.pincode ? ` - ${mandi.pincode}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-forest-green" />
                <span>{t('farmer.mandi_operations', 'Mandi Operations & Hours')}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/20">
                  <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">{t('farmer.operating_hours', 'Daily Hours')}</span>
                  <span className="font-mono font-bold text-dark-neutral">
                    {mandi.operatingHours?.open || '06:00'} – {mandi.operatingHours?.close || '20:00'}
                  </span>
                </div>
                <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/20">
                  <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">Jurisdiction</span>
                  <span className="font-bold text-forest-green">{mandi.district || 'Lucknow'} Belt</span>
                </div>
              </div>
            </div>

            {/* Supported Commodities */}
            <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-forest-green" />
                <span>{t('farmer.supported_crops', 'Supported Mandi Commodities')}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {commodities.map((crop) => (
                  <span
                    key={crop}
                    className="bg-wheat-accent/40 text-dark-neutral border border-dark-neutral font-bold text-xs px-2.5 py-1 rounded-xs flex items-center gap-1"
                  >
                    <span>🌾</span> {getLocalizedCrop(crop, t)}
                  </span>
                ))}
              </div>
            </div>

            {/* Affiliated Procurement Centres */}
            <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-forest-green" />
                  <span>{t('farmer.affiliated_centres', 'Governed Procurement Centres')}</span>
                </h3>
                <span className="font-mono text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs border border-emerald-300">
                  {affiliatedCentres.length} Centres
                </span>
              </div>

              {affiliatedCentres.length > 0 ? (
                <div className="space-y-2">
                  {affiliatedCentres.map((c) => (
                    <div
                      key={c._id || c.id}
                      className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/30 flex items-center justify-between gap-2 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-dark-neutral truncate">{c.name}</p>
                        <p className="text-[10px] text-dark-neutral-muted truncate">{c.address}</p>
                      </div>
                      {onSelectCentre && (
                        <button
                          type="button"
                          onClick={() => onSelectCentre(c)}
                          className="px-2 py-1 text-[10px] font-black uppercase tracking-wide bg-forest-green text-white rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A] hover:bg-forest-green-dark shrink-0"
                        >
                          View Centre →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dark-neutral-muted font-medium py-1">
                  All district procurement centres operate under Uttar Pradesh State Agricultural Marketing Board guidelines.
                </p>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 bg-white border-t-2 border-dark-neutral space-y-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-forest-green hover:bg-forest-green-dark border-2 border-dark-neutral rounded-xs text-xs font-black uppercase text-white transition-all shadow-[2px_2px_0px_#22252A] hover:shadow-[3px_3px_0px_#22252A]"
            >
              <Navigation className="w-4 h-4 text-white" />
              <span>{t('farmer.directions_to_mandi', 'Get Directions to APMC Mandi')}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-white/80" />
            </a>
            <p className="text-[10px] text-center text-dark-neutral-muted font-medium">
              {t('farmer.external_nav_disclaimer', 'Launches external navigation in your mapping application.')}
            </p>
          </div>
        </aside>
      </>
    );

    return createPortal(mandiDrawerContent, document.body);
  }

  // =========================================================================
  // CENTRE ENTITY RENDERING
  // =========================================================================
  const centreItem = activeEntity;
  const lat = centreItem.location?.coordinates?.[1] || 26.8467;
  const lon = centreItem.location?.coordinates?.[0] || 80.9462;
  const directionsUrl = getDirectionsUrl(lat, lon, userLocation?.lat, userLocation?.lon);
  const mandiName = centreItem.mandiId?.name || centreItem.mandiName || 'Lucknow Principal APMC Mandi';
  const mandiCode = centreItem.mandiId?.mandiCode || centreItem.mandiCode || 'MND_LKO_01';
  const isVerified = centreItem.verificationStatus === 'VERIFIED';
  const openHours = centreItem.operatingHours
    ? `${centreItem.operatingHours.open} - ${centreItem.operatingHours.close}`
    : '08:00 - 18:00';
  const availableSlots = centreItem.availableSlotsToday !== undefined ? centreItem.availableSlotsToday : 12;
  const queueCount = centreItem.activeQueueCount !== undefined ? centreItem.activeQueueCount : 6;
  const waitMinutes = centreItem.estimatedWaitMinutes !== undefined ? centreItem.estimatedWaitMinutes : 15;
  const distanceKm = centreItem.distanceKm != null ? centreItem.distanceKm : 3.4;

  const centreDrawerContent = (
    <>
      {/* Accessible Backdrop */}
      <div
        className="fixed inset-0 bg-dark-neutral/40 backdrop-blur-xs z-40 transition-opacity animate-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={centreItem.name || 'Procurement Centre Details'}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-warm-ivory border-l-3 border-dark-neutral shadow-brutal-xl flex flex-col font-sans transition-transform duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-white border-b-2 border-dark-neutral flex items-start justify-between gap-3">
          <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge
              variant={isVerified ? 'success' : 'warning'}
              size="sm"
              icon={ShieldCheck}
            >
              {isVerified ? t('farmer.map_popup_verified', 'Verified Hub') : t('farmer.map_popup_demo', 'Demonstration')}
            </Badge>
            <span className="font-mono text-[11px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs border border-emerald-300">
              {centreItem.centreCode || 'LKO_CENTRE'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-black text-dark-neutral leading-tight">
            {centreItem.name}
          </h2>
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="p-1.5 rounded-xs bg-warm-ivory border-2 border-dark-neutral hover:bg-forest-green hover:text-white shadow-[2px_2px_0px_#22252A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-colors"
          aria-label={t('common.close_drawer', 'Close details drawer')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Mandi Hierarchy Banner */}
        <div className="bg-emerald-50 border-2 border-dark-neutral rounded-xs p-3.5 shadow-brutal-sm">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-5 h-5 text-forest-green shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-black uppercase text-dark-neutral-muted block tracking-wider">
                {t('farmer.governing_mandi', 'Governing Mandi Affiliation')}
              </span>
              <h3 className="font-heading font-black text-sm text-dark-neutral">
                {mandiName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] bg-white border border-dark-neutral/30 px-1.5 py-0.2 rounded-xs text-dark-neutral font-bold">
                  {mandiCode}
                </span>
                <span className="text-[11px] text-dark-neutral font-medium">
                  {centreItem.district || 'Lucknow'}, {centreItem.state || 'UP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Operational Metrics Card */}
        <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-forest-green" />
            <span>{t('farmer.live_centre_status', 'Real-Time Operational Status')}</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/20">
              <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">{t('farmer.slots_today', 'Slots')}</span>
              <span className="font-heading font-black text-base sm:text-lg text-forest-green">{availableSlots}</span>
              <span className="text-[9px] text-dark-neutral-muted font-semibold block">{t('farmer.available', 'available')}</span>
            </div>
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/20">
              <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">{t('farmer.in_queue', 'In Queue')}</span>
              <span className="font-heading font-black text-base sm:text-lg text-amber-700">{queueCount}</span>
              <span className="text-[9px] text-dark-neutral-muted font-semibold block">{t('farmer.farmers', 'farmers')}</span>
            </div>
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/20">
              <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">{t('farmer.est_wait', 'Est. Wait')}</span>
              <span className="font-heading font-black text-base sm:text-lg text-blue-700">~{waitMinutes}</span>
              <span className="text-[9px] text-dark-neutral-muted font-semibold block">{t('farmer.minutes', 'mins')}</span>
            </div>
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/20">
              <span className="text-[10px] text-dark-neutral-muted font-bold block uppercase">Today Done</span>
              <span className="font-heading font-black text-base sm:text-lg text-emerald-800">{centreItem.completedTodayCount !== undefined ? centreItem.completedTodayCount : 18}</span>
              <span className="text-[9px] text-dark-neutral-muted font-semibold block">procured</span>
            </div>
          </div>
        </div>

        {/* Location & Operating Hours */}
        <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-forest-green" />
            <span>{t('farmer.facility_details', 'Facility Details & Access')}</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {/* Centre Manager Invariant */}
            <div className="flex items-center gap-2 pb-2 border-b border-dark-neutral/10">
              <User className="w-4 h-4 text-forest-green shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-dark-neutral-muted font-black uppercase block">Appointed Centre Manager</span>
                  <span className="font-black text-dark-neutral text-xs">
                    {centreItem.centreHead?.fullName || centreItem.managerName || 'Satish Kumar (Station Head)'}
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.2 rounded-xs">
                  Statutory Head
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-dark-neutral-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-dark-neutral block">{centreItem.address || 'Lucknow, Uttar Pradesh'}</span>
                <span className="text-[11px] text-dark-neutral-muted">
                  ~{distanceKm} km {t('farmer.from_your_location', 'from your location')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-dark-neutral-muted shrink-0" />
              <span className="text-dark-neutral font-medium">
                {t('farmer.operating_hours', 'Operating Hours')}: <strong className="font-bold">{openHours}</strong>
              </span>
            </div>

            {centreItem.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-dark-neutral-muted shrink-0" />
                <a href={`tel:${centreItem.contactPhone}`} className="font-mono font-bold text-forest-green hover:underline">
                  {centreItem.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Supported Commodities */}
        <div className="bg-white border-2 border-dark-neutral rounded-xs p-4 shadow-brutal-sm space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-forest-green" />
            <span>{t('farmer.supported_crops', 'Accepted Commodities (MSP Verified)')}</span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {(centreItem.crops && centreItem.crops.length > 0
              ? centreItem.crops
              : ['Wheat', 'Paddy', 'Mustard', 'Maize']
            ).map((crop) => (
              <span
                key={crop}
                className="bg-wheat-accent/40 text-dark-neutral border border-dark-neutral font-bold text-xs px-2.5 py-1 rounded-xs flex items-center gap-1"
              >
                <span>🌾</span> {getLocalizedCrop(crop, t)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 sm:p-5 bg-white border-t-2 border-dark-neutral space-y-2.5">
        {activeBooking && (activeBooking.centre?._id === centreItem._id || activeBooking.centre?.id === centreItem.id || activeBooking.centreId === centreItem._id || activeBooking.centreId === centreItem.id) ? (
          <div className="p-3 bg-forest-green-light border-2 border-forest-green rounded-xs shadow-[2px_2px_0px_#22252A] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-forest-green">
              <ShieldCheck className="w-4 h-4 text-forest-green" />
              <span>{t('farmer.active_booking_here', 'Active Booking at this Facility')}</span>
            </div>
            <p className="text-[11px] text-dark-neutral font-medium">
              Token: <strong className="font-mono font-bold text-forest-green">{activeBooking.tokenNumber}</strong> • {getLocalizedCrop(activeBooking.cropType || 'Wheat', t)} ({activeBooking.estimatedQuantityQuintals || activeBooking.quantityQuintals} {t('common.quintals', 'Qtl')})
            </p>
            <a
              href={`/farmer/procurement/${activeBooking._id || activeBooking.id}`}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-forest-green text-white font-black text-xs rounded-xs uppercase tracking-wider shadow-[2px_2px_0px_#22252A] hover:bg-forest-green/90 transition-all"
            >
              <span>{t('farmer.navigate_to_centre', 'Navigate to Centre / Track Journey')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-brutal justify-center font-black"
            onClick={() => onBookSlot(centreItem)}
          >
            <span>🌾 {t('farmer.book_slot', 'Book Delivery Slot')}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}

        <div className="space-y-1">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-warm-ivory hover:bg-forest-green-light border-2 border-dark-neutral rounded-xs text-xs font-black uppercase text-dark-neutral transition-all shadow-[2px_2px_0px_#22252A] hover:shadow-[3px_3px_0px_#22252A]"
          >
            <Navigation className="w-4 h-4 text-forest-green" />
            <span>{t('farmer.open_google_maps_nav', 'Open Google Maps Navigation')}</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-dark-neutral-muted" />
          </a>
          <p className="text-[10px] text-center text-dark-neutral-muted font-medium">
            {t('farmer.external_nav_disclaimer', 'Launches external navigation in your mapping application.')}
          </p>
        </div>
      </div>
    </aside>
    </>
  );

  return createPortal(centreDrawerContent, document.body);
};

export default CentreDetailsPanel;
