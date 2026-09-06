import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListOrdered, User, MapPin, Eye, CheckCircle2, Clock } from 'lucide-react';
import Badge from '../common/Badge';
import { getLocalizedStage } from '../../utils/formatters';

export const DistrictLiveQueuePipeline = ({
  queueFunnel = {},
  farmersQueue = [],
  onSelectFarmer
}) => {
  const { t } = useTranslation();
  const [selectedStageFilter, setSelectedStageFilter] = React.useState(null);

  const stages = [
    { key: 'BOOKED', label: `1. ${t('lifecycle.booked', 'Booked')}`, count: queueFunnel.BOOKED || 0, color: 'bg-emerald-50 text-emerald-900 border-emerald-400' },
    { key: 'WAITING', label: `2. ${t('lifecycle.waiting', 'Waiting')}`, count: queueFunnel.WAITING || 0, color: 'bg-amber-100 text-amber-900 border-amber-400' },
    { key: 'CALLED', label: `3. ${t('lifecycle.called', 'Called')}`, count: queueFunnel.CALLED || 0, color: 'bg-blue-100 text-blue-900 border-blue-400' },
    { key: 'ARRIVED', label: `4. ${t('lifecycle.arrived', 'Arrived')}`, count: queueFunnel.ARRIVED || 0, color: 'bg-indigo-100 text-indigo-900 border-indigo-400' },
    { key: 'VERIFICATION', label: `5. ${t('lifecycle.verification', 'Verify')}`, count: queueFunnel.VERIFICATION || 0, color: 'bg-purple-100 text-purple-900 border-purple-400' },
    { key: 'QUALITY_CHECK', label: `6. ${t('lifecycle.quality_check', 'Assaying')}`, count: queueFunnel.QUALITY_CHECK || 0, color: 'bg-yellow-100 text-yellow-950 border-yellow-400' },
    { key: 'WEIGHING', label: `7. ${t('lifecycle.weighing', 'Weighing')}`, count: queueFunnel.WEIGHING || 0, color: 'bg-orange-100 text-orange-950 border-orange-400' },
    { key: 'PROCUREMENT_CONFIRMED', label: `8. ${t('lifecycle.confirmed', 'Confirmed')}`, count: queueFunnel.PROCUREMENT_CONFIRMED || 0, color: 'bg-emerald-100 text-emerald-950 border-emerald-400' },
    { key: 'PAYMENT_PROCESSING', label: `9. ${t('lifecycle.payment_processing', 'Payment Proc')}`, count: queueFunnel.PAYMENT_PROCESSING || 0, color: 'bg-teal-100 text-teal-950 border-teal-400' },
    { key: 'PAYMENT_COMPLETED', label: `10. ${t('lifecycle.payment_completed', 'Settled')}`, count: queueFunnel.PAYMENT_COMPLETED || 0, color: 'bg-forest-green text-white border-forest-green' }
  ];

  const displayedQueue = selectedStageFilter
    ? farmersQueue.filter((f) => (f.state || '').toUpperCase() === selectedStageFilter)
    : farmersQueue;

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-3.5 sm:p-4 mb-6 animate-fade-slide min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dark-neutral/10 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.queue_funnel_title', 'District-Wide Live Queue Pipeline (Canonical 10-Stage Funnel)')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.queue_funnel_subtitle', 'Live cross-portal state synchronization across all 8 Lucknow centres • Click any stage to filter')}
          </p>
        </div>

        {selectedStageFilter && (
          <button
            onClick={() => setSelectedStageFilter(null)}
            className="px-2 py-1 text-xs font-bold text-forest-green bg-warm-ivory border border-dark-neutral rounded-xs hover:bg-forest-green hover:text-white transition-all shadow-[1px_1px_0px_#22252A]"
          >
            Clear Filter ({selectedStageFilter}) ✕
          </button>
        )}
      </div>

      {/* 10-Stage Visual Pipeline Funnel with click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-5">
        {stages.map((s) => {
          const isSelected = selectedStageFilter === s.key;
          return (
            <div
              key={s.key}
              onClick={() => setSelectedStageFilter(isSelected ? null : s.key)}
              className={`p-2.5 rounded-xs border-2 text-center transition-all cursor-pointer shadow-[1px_1px_0px_#22252A] ${s.color} ${
                isSelected ? 'ring-3 ring-forest-green scale-105 shadow-brutal font-black -translate-y-0.5' : 'hover:-translate-y-0.5'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-wider block opacity-75 truncate">
                {s.label}
              </span>
              <strong className="text-base sm:text-lg font-black font-mono block mt-1">
                {s.count}
              </strong>
            </div>
          );
        })}
      </div>

      {/* Active Farmers Queue Table */}
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full text-left border-collapse border-2 border-dark-neutral">
          <thead>
            <tr className="border-b-2 border-dark-neutral text-xs font-black text-dark-neutral uppercase bg-warm-ivory tracking-wider">
              <th className="p-2.5">Token #</th>
              <th className="p-2.5">Farmer Details</th>
              <th className="p-2.5">Location / Village</th>
              <th className="p-2.5">Procurement Centre</th>
              <th className="p-2.5">Lifecycle Stage</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dark-neutral/10 text-xs">
            {displayedQueue.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-dark-neutral-muted font-medium">
                  {selectedStageFilter
                    ? `No farmers currently at stage: ${selectedStageFilter}`
                    : 'No queue tokens currently active in line.'}
                </td>
              </tr>
            ) : (
              displayedQueue.map((f) => (
                <tr key={f.id || f.tokenNumber} className="hover:bg-warm-ivory/60 transition-colors">
                  <td className="p-2.5 font-mono font-black text-forest-green">
                    {f.tokenNumber}
                  </td>
                  <td className="p-2.5">
                    <span className="font-black text-dark-neutral block">{f.farmerName}</span>
                    <span className="text-[10px] text-dark-neutral-muted font-mono">{f.phoneMasked}</span>
                  </td>
                  <td className="p-2.5 text-dark-neutral-muted">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />
                      {f.village}, {f.district}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-bold text-dark-neutral block">{f.centreName}</span>
                    <span className="text-[10px] font-mono text-dark-neutral-muted">{f.centreCode}</span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-black text-[10px] px-2 py-0.5 rounded-xs border border-dark-neutral bg-white uppercase">
                      {getLocalizedStage(f.state, t)}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => onSelectFarmer(f)}
                      className="px-2.5 py-1 text-[11px] font-bold text-forest-green bg-forest-green-light border border-dark-neutral rounded-xs hover:bg-forest-green hover:text-white transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Inspect Journey
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistrictLiveQueuePipeline;
