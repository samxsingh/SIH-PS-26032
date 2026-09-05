import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ArrowUpDown, Clock, Users, CheckCircle2, TrendingUp, IndianRupee, AlertTriangle, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export const CentreHealthSection = ({ centres = [], onSelectCentre, selectedCentre }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'QUEUE_DESC' | 'WAIT_DESC' | 'PRODUCE_DESC' | 'ATTENTION_FIRST' | 'NAME_ASC'

  const sortedCentres = [...centres].sort((a, b) => {
    switch (sortBy) {
      case 'QUEUE_DESC':
        return (b.waitingCount || 0) - (a.waitingCount || 0);
      case 'WAIT_DESC':
        return (b.estimatedWaitMinutes || 0) - (a.estimatedWaitMinutes || 0);
      case 'PRODUCE_DESC':
        return (b.produceTodayQuintals || 0) - (a.produceTodayQuintals || 0);
      case 'ATTENTION_FIRST': {
        const scoreA = a.health === 'CRITICAL' ? 3 : a.health === 'WATCH' ? 2 : 1;
        const scoreB = b.health === 'CRITICAL' ? 3 : b.health === 'WATCH' ? 2 : 1;
        return scoreB - scoreA;
      }
      case 'NAME_ASC':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header & Sorting Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.centre_health_title', 'Procurement Centre Health & Capacity Monitor')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.centre_health_subtitle', 'Live queue density, throughput SLA, and facility capacity across all 8 facilities')}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-dark-neutral-muted" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-bold bg-warm-ivory border-2 border-dark-neutral rounded-xs px-2.5 py-1.5 shadow-[1px_1px_0px_#22252A] focus:outline-none focus:ring-1 focus:ring-forest-green"
          >
            <option value="DEFAULT">Sort By: Canonical Order</option>
            <option value="ATTENTION_FIRST">Sort By: Attention Required First</option>
            <option value="QUEUE_DESC">Sort By: Highest Waiting Queue</option>
            <option value="WAIT_DESC">Sort By: Highest Wait Time</option>
            <option value="PRODUCE_DESC">Sort By: Most Produce Today</option>
            <option value="NAME_ASC">Sort By: Centre Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Facilities Requiring Operational Attention Strip */}
      {(() => {
        const attentionCentres = centres.filter((c) => c.health === 'CRITICAL' || c.health === 'WATCH');
        if (attentionCentres.length === 0) return null;

        return (
          <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-500 rounded-xs shadow-[2px_2px_0px_#22252A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                  {attentionCentres.length} Facility / Facilities Under Elevated Intake Load
                </span>
                <p className="text-xs text-dark-neutral font-medium">
                  {attentionCentres.map((c) => `${c.name} (${c.waitingCount || 0} waiting, ${c.queueLoadPercentage}% load)`).join(' • ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {attentionCentres.map((c) => (
                <button
                  key={c.id || c._id}
                  onClick={() => onSelectCentre(c)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-dark-neutral rounded-xs shadow-brutal-xs hover:bg-forest-green hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Focus {c.centreCode}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 8 Centre Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sortedCentres.map((c) => {
          const isSelected = selectedCentre?.id === c.id || selectedCentre?._id === c._id;
          const isCritical = c.health === 'CRITICAL';
          const isWatch = c.health === 'WATCH';

          return (
            <div
              key={c.id || c._id}
              onClick={() => onSelectCentre(c)}
              className={`p-3.5 rounded-xs border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-forest-green bg-forest-green-light shadow-brutal -translate-y-1'
                  : isCritical
                  ? 'border-red-600 bg-red-50/40 hover:bg-red-50 shadow-[2px_2px_0px_#22252A]'
                  : isWatch
                  ? 'border-amber-600 bg-amber-50/40 hover:bg-amber-50 shadow-[2px_2px_0px_#22252A]'
                  : 'border-dark-neutral bg-white hover:bg-warm-ivory shadow-[2px_2px_0px_#22252A]'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-1 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-black text-forest-green bg-white border border-dark-neutral px-1.5 py-0.5 rounded-xs shadow-[1px_1px_0px_#22252A]">
                      {c.centreCode}
                    </span>
                    <h5 className="font-heading font-black text-xs text-dark-neutral mt-1 line-clamp-1" title={c.name}>
                      {c.name}
                    </h5>
                  </div>
                  <Badge variant={isCritical ? 'danger' : isWatch ? 'warning' : 'success'} className="text-[10px] font-bold">
                    {c.statusText || c.health}
                  </Badge>
                </div>

                <div className="text-[11px] text-dark-neutral-muted mb-2">
                  <span className="font-bold">Parent:</span> {c.mandi?.name || 'Dubagga Naveen Mandi'}
                </div>

                {/* Capacity Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-dark-neutral-muted uppercase">Operational Load</span>
                    <span className={isCritical ? 'text-red-700 font-black' : isWatch ? 'text-amber-800 font-black' : 'text-forest-green font-black'}>
                      {c.queueLoadPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full border border-dark-neutral/30 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCritical ? 'bg-red-600' : isWatch ? 'bg-amber-500' : 'bg-forest-green'
                      }`}
                      style={{ width: `${Math.min(100, c.queueLoadPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* 4 Micro Metrics */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-2 border-t border-dark-neutral/10">
                  <div className="p-1 bg-warm-ivory rounded-xs border border-dark-neutral/20">
                    <span className="text-dark-neutral-muted block text-[9px] uppercase">Waiting</span>
                    <strong className="text-amber-900 font-mono text-xs">{c.waitingCount || 0}</strong>
                  </div>
                  <div className="p-1 bg-warm-ivory rounded-xs border border-dark-neutral/20">
                    <span className="text-dark-neutral-muted block text-[9px] uppercase">Serving</span>
                    <strong className="text-blue-800 font-mono text-xs">{c.servingCount || 0}</strong>
                  </div>
                  <div className="p-1 bg-warm-ivory rounded-xs border border-dark-neutral/20">
                    <span className="text-dark-neutral-muted block text-[9px] uppercase">Completed</span>
                    <strong className="text-emerald-800 font-mono text-xs">{c.completedCount || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-dark-neutral/15 space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-dark-neutral-muted">
                  <span>Centre Manager:</span>
                  <strong className="text-dark-neutral font-bold">{c.currentHead?.fullName || 'Station Head Assigned'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-dark-neutral-muted">
                    <span>Avg Time: </span>
                    <strong className="text-dark-neutral font-black">~{c.estimatedWaitMinutes || 18}m</strong>
                  </div>
                  <button
                    data-testid="health-inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCentre(c);
                    }}
                    className="text-forest-green font-bold flex items-center gap-0.5 hover:underline"
                  >
                    Inspect Facility <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CentreHealthSection;
