import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Store, Building2, AlertTriangle, ShieldCheck, Filter, Layers, Info } from 'lucide-react';
import GoogleMapWrapper from '../common/GoogleMapWrapper';
import Badge from '../common/Badge';

export const DistrictCommandMap = ({
  centres = [],
  mandis = [],
  selectedCentre,
  onSelectCentre,
  selectedMandi,
  onSelectMandi
}) => {
  const { t } = useTranslation();
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'CENTRES' | 'MANDIS'

  const filteredCentres = centres.filter((c) => {
    if (filterMode === 'CRITICAL') return c.health === 'CRITICAL' || c.health === 'WATCH';
    if (filterMode === 'MANDIS') return false;
    return true;
  });

  const filteredMandis = filterMode === 'CENTRES' ? [] : mandis;

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 animate-fade-slide">
      {/* Map Command Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.map_title', 'Lucknow District Geospatial Operations Map')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.map_subtitle', 'Live APMC Mandi network, procurement facilities, and congestion heat')}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xs border-2 border-dark-neutral transition-all ${
              filterMode === 'ALL'
                ? 'bg-forest-green text-white shadow-[1px_1px_0px_#22252A]'
                : 'bg-warm-ivory text-dark-neutral hover:bg-gray-100'
            }`}
          >
            {t('admin.filter_all', 'All Nodes')} ({centres.length + mandis.length})
          </button>
          <button
            onClick={() => setFilterMode('MANDIS')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xs border-2 border-dark-neutral transition-all ${
              filterMode === 'MANDIS'
                ? 'bg-purple-700 text-white shadow-[1px_1px_0px_#22252A]'
                : 'bg-warm-ivory text-dark-neutral hover:bg-gray-100'
            }`}
          >
            {t('admin.filter_mandis', 'Mandis Only')} ({mandis.length})
          </button>
          <button
            onClick={() => setFilterMode('CRITICAL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xs border-2 border-dark-neutral transition-all ${
              filterMode === 'CRITICAL'
                ? 'bg-red-700 text-white shadow-[1px_1px_0px_#22252A]'
                : 'bg-warm-ivory text-dark-neutral hover:bg-gray-100'
            }`}
          >
            {t('admin.filter_attention', 'Attention Needed')}
          </button>
        </div>
      </div>

      {/* Embedded Map */}
      <div className="relative border-2 border-dark-neutral rounded-xs overflow-hidden shadow-inner">
        <GoogleMapWrapper
          centres={filteredCentres}
          mandis={filteredMandis}
          selectedCentre={selectedCentre}
          onSelectCentre={onSelectCentre}
          height="h-[360px] sm:h-[460px] lg:h-[500px]"
          userLocation={{ lat: 26.8467, lon: 80.9462 }}
        />

        {/* Tactical Map Overlay Legend */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-xs border-2 border-dark-neutral rounded-xs p-2.5 shadow-brutal-sm text-xs z-10">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-dark-neutral/20">
            <span className="font-black font-heading uppercase text-[10px] text-dark-neutral">
              {t('admin.map_legend', 'Operational Node Legend')}
            </span>
            <span className="text-[9px] text-dark-neutral-muted">GPS Live</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-700 border border-dark-neutral flex-shrink-0" />
              <span>APMC Mandi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 border border-dark-neutral flex-shrink-0" />
              <span>Normal Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-dark-neutral flex-shrink-0" />
              <span>High Load</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-dark-neutral flex-shrink-0" />
              <span>Attention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictCommandMap;
