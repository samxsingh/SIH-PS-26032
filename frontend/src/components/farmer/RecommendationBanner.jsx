import React from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Sparkles, MapPin, Clock, CheckCircle2, ArrowRight, ShieldCheck, Compass } from 'lucide-react';

export const RecommendationBanner = ({
  recommendationData,
  onBookRecommended,
  onChooseAnother,
  locationMode = 'REGISTERED'
}) => {
  const { t } = useTranslation();
  if (!recommendationData || !recommendationData.recommended) return null;

  const { centre, distanceKm, estimatedWaitMinutes, reasons } = recommendationData.recommended;
  const isVerified = centre.verificationStatus === 'VERIFIED';

  const getLocalizedReason = (reason) => {
    if (typeof reason !== 'string') return reason;

    if (/nearby location|accessible distance/i.test(reason)) {
      const match = reason.match(/([\d.]+)\s*km/i);
      const dist = match ? match[1] : (distanceKm || 0);
      return t('recommendation.reasons.nearbyLocation', { distance: dist });
    }

    if (/wait time|wait/i.test(reason)) {
      const match = reason.match(/(\d+)\s*min/i);
      const mins = match ? match[1] : (estimatedWaitMinutes || 30);
      return t('recommendation.reasons.estimatedWait', { minutes: mins });
    }

    if (/queue congestion|capacity load/i.test(reason)) {
      const match = reason.match(/(\d+)%/);
      const load = match ? match[1] : 45;
      return t('recommendation.reasons.lowQueueCongestion', { load });
    }

    if (/open delivery slots|slots available/i.test(reason)) {
      return t('recommendation.reasons.openSlots');
    }

    if (/registered location/i.test(reason)) {
      return t('recommendation.reasons.registeredLocation');
    }

    if (/capacity/i.test(reason)) {
      return t('recommendation.reasons.capacityLoad');
    }

    return reason;
  };

  return (
    <div className="bg-forest-green-light border-3 border-dark-neutral shadow-brutal-lg rounded-xs p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="success" icon={Sparkles} size="lg">
            {t('farmer.recommended_badge')}
          </Badge>
          <span className="text-xs text-forest-green font-bold hidden sm:inline">
            {t('farmer.recommendation_engine')}
          </span>
        </div>
        <div className="text-[11px] font-bold text-dark-neutral flex items-center gap-1 bg-white px-2.5 py-1 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
          {locationMode === 'GPS' ? <Compass className="w-3.5 h-3.5 text-blue-600" /> : <MapPin className="w-3.5 h-3.5 text-forest-green" />}
          <span>{locationMode === 'GPS' ? t('farmer.based_on_gps') : t('farmer.based_on_registered')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-white border border-dark-neutral px-2 py-0.5 rounded-xs">
              {centre.centreCode || 'SEH01'}
            </span>
            {isVerified ? (
              <span className="text-[10px] font-black uppercase text-green-800 bg-green-100 border border-green-700 px-2 py-0.5 rounded-xs inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-700" />
                <span>{t('farmer.verified_centre')}</span>
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-700 px-2 py-0.5 rounded-xs">
                {t('farmer.unverified_centre')}
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-dark-neutral">
            {centre.name}
          </h3>
          <p className="text-xs sm:text-sm text-dark-neutral font-medium mt-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-forest-green flex-shrink-0" />
            <span>{centre.address}</span>
          </p>

          {/* Metrics summary */}
          <div className="flex items-center gap-3 mt-3 flex-wrap text-xs font-bold">
            <div className="bg-white px-3 py-1.5 rounded-xs border-2 border-dark-neutral text-forest-green flex items-center gap-1.5 shadow-[2px_2px_0px_#22252A]">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('farmer.km_away', { distance: distanceKm })}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xs border-2 border-dark-neutral text-amber-900 flex items-center gap-1.5 shadow-[2px_2px_0px_#22252A]">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('farmer.min_wait', { minutes: estimatedWaitMinutes })}</span>
            </div>
          </div>

          {/* Transparent Reasons List */}
          <div className="mt-4 pt-3 border-t-2 border-dark-neutral/20">
            <p className="text-xs font-black uppercase tracking-wider text-dark-neutral mb-2">
              {t('farmer.why_recommended')}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-dark-neutral font-semibold">
              {reasons && reasons.length > 0 ? (
                reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-green flex-shrink-0" />
                    <span>{getLocalizedReason(reason)}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-green flex-shrink-0" />
                    <span>{t('recommendation.reasons.nearbyLocation', { distance: distanceKm })}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest-green flex-shrink-0" />
                    <span>{t('recommendation.reasons.estimatedWait', { minutes: estimatedWaitMinutes })}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onBookRecommended(centre)}
            className="w-full shadow-brutal-sm min-h-[48px]"
          >
            <span>{t('farmer.book_recommended_slot')}</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {onChooseAnother && (
            <Button
              variant="outline"
              size="md"
              onClick={onChooseAnother}
              className="w-full text-xs"
            >
              {t('farmer.choose_another_centre')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationBanner;
