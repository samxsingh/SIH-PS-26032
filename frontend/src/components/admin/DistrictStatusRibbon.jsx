import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Store, Map, Users, Clock, Loader2, TrendingUp, IndianRupee } from 'lucide-react';

export const DistrictStatusRibbon = ({ districtData = {}, queueFunnel = {} }) => {
  const { t } = useTranslation();

  const totalCentres = districtData.totalCentres ?? 8;
  const totalMandis = districtData.totalMandis ?? 3;
  const adjacentZones = districtData.adjacentZonesCount ?? 4;
  const activeFarmers = districtData.activeFarmers ?? 29;
  const waitingFarmers = districtData.waitingFarmers ?? queueFunnel.WAITING ?? 8;
  const processingFarmers = districtData.processingFarmers ?? (
    (queueFunnel.CALLED || 0) + (queueFunnel.ARRIVED || 0) + (queueFunnel.VERIFICATION || 0) + (queueFunnel.QUALITY_CHECK || 0) + (queueFunnel.WEIGHING || 0)
  ) ?? 7;
  const totalProduce = districtData.totalProduceQuintals ?? 637;
  const totalPayable = districtData.totalPayableRs ?? 1452975;

  const opHealth = districtData.operationalHealth || {
    level: 'BUSY',
    label: 'BUSY (NORMAL PEAK INTAKE)',
    rationale: 'Active procurement operations across all 8 Lucknow facilities within SLA limits.'
  };

  const isHealthCritical = opHealth.level === 'ATTENTION_REQUIRED';
  const isHealthBusy = opHealth.level === 'BUSY';

  return (
    <section className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-3.5 sm:p-4 mb-6 animate-fade-slide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-2 border-b-2 border-dark-neutral/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2.5 h-2.5 rounded-full ${isHealthCritical ? 'bg-red-500 animate-ping' : isHealthBusy ? 'bg-amber-500 animate-pulse' : 'bg-forest-green'}`} />
          <h2 className="font-heading font-black text-sm sm:text-base text-dark-neutral tracking-tight uppercase">
            {t('admin.district_status_title', 'Lucknow District Operational Status')}
          </h2>
          <span className="text-[10px] font-bold text-dark-neutral-muted bg-warm-ivory px-2 py-0.5 border border-dark-neutral/30 rounded-xs">
            Code: {districtData.districtCode || 'UP_LUK'}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
            isHealthCritical
              ? 'bg-red-100 text-red-900 border-red-400'
              : isHealthBusy
              ? 'bg-amber-100 text-amber-900 border-amber-400'
              : 'bg-forest-green/10 text-forest-green border-forest-green/40'
          }`}>
            {opHealth.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-dark-neutral-muted">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-forest-green" />
            <span>{t('admin.produce_today', 'Produce')}: <strong className="text-dark-neutral font-black">{totalProduce} Qtl</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-forest-green" />
            <span>{t('admin.payable_today', 'Payable')}: <strong className="text-dark-neutral font-black">₹{Number(totalPayable).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Operational Rationale Strip */}
      <div className="text-[11px] font-medium text-dark-neutral-muted mb-3 flex items-center gap-2">
        <span className="font-black text-dark-neutral uppercase tracking-wider text-[10px]">District Intelligence:</span>
        <span>{opHealth.rationale}</span>
      </div>

      {/* 6 Key Operational Status Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* 1. Procurement Centres */}
        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-forest-green/10 border border-dark-neutral flex items-center justify-center text-forest-green flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-dark-neutral-muted block truncate">
              {t('admin.centres', 'Centres')}
            </span>
            <span className="text-base sm:text-lg font-black text-dark-neutral font-mono block leading-none mt-0.5">
              {totalCentres}
            </span>
          </div>
        </div>

        {/* 2. Regulated Mandis */}
        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-purple-100 border border-dark-neutral flex items-center justify-center text-purple-700 flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-dark-neutral-muted block truncate">
              {t('admin.mandis', 'Regulated Mandis')}
            </span>
            <span className="text-base sm:text-lg font-black text-dark-neutral font-mono block leading-none mt-0.5">
              {totalMandis}
            </span>
          </div>
        </div>

        {/* 3. Adjacent Operational Areas */}
        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-blue-100 border border-dark-neutral flex items-center justify-center text-blue-700 flex-shrink-0">
            <Map className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-dark-neutral-muted block truncate">
              {t('admin.adjacent_zones', 'Adjacent Zones')}
            </span>
            <span className="text-base sm:text-lg font-black text-dark-neutral font-mono block leading-none mt-0.5">
              {adjacentZones}
            </span>
          </div>
        </div>

        {/* 4. Active Farmers */}
        <div className="bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-emerald-100 border border-dark-neutral flex items-center justify-center text-emerald-800 flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-dark-neutral-muted block truncate">
              {t('admin.active_farmers', 'Active Farmers')}
            </span>
            <span className="text-base sm:text-lg font-black text-forest-green font-mono block leading-none mt-0.5">
              {activeFarmers}
            </span>
          </div>
        </div>

        {/* 5. Waiting in Queue */}
        <div className="bg-amber-50 p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-amber-200 border border-dark-neutral flex items-center justify-center text-amber-900 flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-amber-900 block truncate">
              {t('admin.waiting', 'Waiting in Line')}
            </span>
            <span className="text-base sm:text-lg font-black text-amber-800 font-mono block leading-none mt-0.5">
              {waitingFarmers}
            </span>
          </div>
        </div>

        {/* 6. Currently Processing */}
        <div className="bg-blue-50 p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xs bg-blue-200 border border-dark-neutral flex items-center justify-center text-blue-900 flex-shrink-0">
            <Loader2 className="w-4 h-4 animate-spin text-blue-800" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-blue-900 block truncate">
              {t('admin.processing', 'In Processing')}
            </span>
            <span className="text-base sm:text-lg font-black text-blue-800 font-mono block leading-none mt-0.5">
              {processingFarmers}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DistrictStatusRibbon;
