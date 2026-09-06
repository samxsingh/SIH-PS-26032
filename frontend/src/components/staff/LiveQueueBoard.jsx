import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightCircle,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  Scale,
  FileCheck,
  Filter,
  Eye,
  Sparkles
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { getLocalizedStage, getLocalizedCrop } from '../../utils/formatters';

export const LiveQueueBoard = ({
  queue = [],
  activeServingEntry,
  counterId,
  setCounterId,
  onCallNext,
  isCallingNext,
  onAdvanceState,
  onOpenWorkspace,
  onSelectFarmer
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('ALL');

  // Filtered Queue List
  const filteredQueue = queue.filter((entry) => {
    if (filter === 'WAITING') return entry.state === 'WAITING';
    if (filter === 'CALLED') return entry.state === 'CALLED';
    if (filter === 'SERVING') {
      return ['ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'].includes(entry.state);
    }
    if (filter === 'COMPLETED') {
      return ['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(entry.state);
    }
    return true;
  });

  const getStageBadgeVariant = (state) => {
    switch (state) {
      case 'WAITING': return 'warning';
      case 'CALLED': return 'info';
      case 'ARRIVED': return 'primary';
      case 'VERIFICATION': return 'indigo';
      case 'QUALITY_CHECK': return 'warning';
      case 'WEIGHING': return 'purple';
      case 'PROCUREMENT_CONFIRMED':
      case 'COMPLETED':
      case 'PAYMENT_COMPLETED':
        return 'success';
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return 'danger';
      default: return 'neutral';
    }
  };

  const getNextActionForState = (state) => {
    switch (state) {
      case 'CALLED':
        return { label: t('staff.mark_arrived', 'Mark Arrived'), nextState: 'ARRIVED' };
      case 'ARRIVED':
        return { label: t('staff.start_verification', 'Start Verification'), nextState: 'VERIFICATION' };
      case 'VERIFICATION':
        return { label: t('staff.proceed_quality', 'Quality Check'), nextState: 'QUALITY_CHECK' };
      case 'QUALITY_CHECK':
        return { label: t('staff.proceed_weighing', 'Proceed Weighing'), nextState: 'WEIGHING' };
      case 'WEIGHING':
        return { label: t('staff.confirm_procurement', 'Confirm Procurement'), nextState: 'PROCUREMENT_CONFIRMED' };
      default:
        return null;
    }
  };

  // Stage counts for operational metrics bar
  const waitingCount = queue.filter((q) => q.state === 'WAITING').length;
  const calledCount = queue.filter((q) => q.state === 'CALLED').length;
  const verificationCount = queue.filter((q) => q.state === 'VERIFICATION').length;
  const qualityCount = queue.filter((q) => q.state === 'QUALITY_CHECK').length;
  const weighingCount = queue.filter((q) => q.state === 'WEIGHING').length;
  const settlementCount = queue.filter((q) => ['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING'].includes(q.state)).length;
  const completedCount = queue.filter((q) => ['PAYMENT_COMPLETED', 'COMPLETED'].includes(q.state)).length;

  const nextWaitingEntry = queue.find((q) => q.state === 'WAITING');

  return (
    <div className="space-y-6">
      {/* 7-Stage Clean Operational Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-white border-2 border-dark-neutral p-3 rounded-xs shadow-[2px_2px_0px_#22252A]">
        <div className="p-2 bg-amber-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-amber-900 block">{t('staff.metric_waiting', 'Waiting')}</span>
          <span className="text-lg font-black font-mono text-amber-800">{waitingCount}</span>
        </div>
        <div className="p-2 bg-blue-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-blue-900 block">{t('staff.metric_called', 'Called')}</span>
          <span className="text-lg font-black font-mono text-blue-800">{calledCount}</span>
        </div>
        <div className="p-2 bg-indigo-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-indigo-900 block">{t('staff.metric_verification', 'Verification')}</span>
          <span className="text-lg font-black font-mono text-indigo-800">{verificationCount}</span>
        </div>
        <div className="p-2 bg-amber-100/60 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-amber-950 block">{t('staff.metric_quality', 'Quality Check')}</span>
          <span className="text-lg font-black font-mono text-amber-900">{qualityCount}</span>
        </div>
        <div className="p-2 bg-purple-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-purple-900 block">{t('staff.metric_weighing', 'Weighing')}</span>
          <span className="text-lg font-black font-mono text-purple-800">{weighingCount}</span>
        </div>
        <div className="p-2 bg-teal-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-teal-900 block">{t('staff.metric_settlement', 'Settlement')}</span>
          <span className="text-lg font-black font-mono text-teal-800">{settlementCount}</span>
        </div>
        <div className="p-2 bg-emerald-50 border border-dark-neutral/30 text-center rounded-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-900 block">{t('staff.metric_completed', 'Completed Today')}</span>
          <span className="text-lg font-black font-mono text-emerald-800">{completedCount}</span>
        </div>
      </div>

      {/* Top Bar: Call Next Control & Active Serving Banner */}
      <div className="bg-white border-3 border-dark-neutral p-5 rounded-md shadow-brutal-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-dark-neutral/10">
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight text-dark-neutral flex items-center gap-2">
              <Radio className="w-5 h-5 text-forest-green animate-pulse" />
              {t('staff.live_queue_station', 'Live Counter Operations')}
            </h2>
            <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
              {t('staff.live_queue_desc', 'Call next eligible farmer atomically and process workflow.')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Counter Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="counter-select" className="text-xs font-black text-dark-neutral uppercase">
                {t('staff.counter', 'Counter')}:
              </label>
              <select
                id="counter-select"
                value={counterId}
                onChange={(e) => setCounterId(e.target.value)}
                className="text-xs font-bold font-mono bg-warm-ivory border-2 border-dark-neutral px-3 py-1.5 rounded-xs shadow-[2px_2px_0px_#22252A] focus:outline-none focus:ring-2 focus:ring-forest-green"
              >
                <option value="Counter 1">Counter 01</option>
                <option value="Counter 2">Counter 02</option>
                <option value="Counter 3">Counter 03</option>
                <option value="Counter 4">Counter 04</option>
              </select>
            </div>

            {/* Prominent CALL NEXT Button */}
            {(() => {
              const isCallDisabled = isCallingNext || waitingCount === 0;

              return (
                <Button
                  variant="primary"
                  size="md"
                  onClick={onCallNext}
                  disabled={isCallDisabled}
                  className="font-black text-sm px-5 py-2 shadow-brutal bg-forest-green hover:bg-forest-green-dark active:translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-forest-green disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('staff.call_next_farmer', 'Call Next Farmer')}
                  title={waitingCount === 0 ? 'No farmers currently waiting in queue' : `Call next waiting farmer (${waitingCount} waiting)`}
                >
                  <ArrowRightCircle className={`w-4 h-4 mr-2 ${isCallingNext ? 'animate-spin' : ''}`} />
                  <span>
                    {isCallingNext
                      ? t('staff.calling', 'Calling...')
                      : `${t('staff.call_next', 'CALL NEXT')} (${waitingCount})`}
                  </span>
                </Button>
              );
            })()}
          </div>
        </div>

        {/* Visual Hierarchy: NOW SERVING & NEXT Up */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* NOW SERVING */}
          <div className="lg:col-span-2">
            {activeServingEntry ? (
              <div className="p-4 bg-forest-green-light/40 border-2 border-forest-green rounded-xs shadow-brutal-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-forest-green text-white px-2 py-0.5 rounded-xs">
                      {t('staff.now_serving', 'NOW SERVING')}
                    </span>
                    <span className="text-xs font-bold text-dark-neutral-muted">•</span>
                    <span className="text-xs font-black text-forest-green">{activeServingEntry.counterId || counterId}</span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black font-mono text-dark-neutral">
                      {activeServingEntry.tokenNumber}
                    </span>
                    <span className="text-lg font-bold text-dark-neutral">
                      {activeServingEntry.farmer?.fullName || activeServingEntry.farmerName || 'Farmer'}
                    </span>
                  </div>

                  <div className="text-xs text-dark-neutral-muted flex items-center gap-3">
                    <span>{activeServingEntry.cropType || activeServingEntry.commodity || 'Wheat'} • <strong>{activeServingEntry.quantityQuintals || activeServingEntry.declaredQuantity || 42} Qtl</strong></span>
                    <span>•</span>
                    <span>{t('staff.stage', 'Current Stage')}: <strong className="text-forest-green uppercase">{getLocalizedStage(activeServingEntry.state, t)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getNextActionForState(activeServingEntry.state) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAdvanceState && onAdvanceState(activeServingEntry._id || activeServingEntry.id, getNextActionForState(activeServingEntry.state).nextState)}
                      className="text-xs font-black bg-forest-green hover:bg-forest-green-dark"
                    >
                      {getNextActionForState(activeServingEntry.state).label}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenWorkspace && onOpenWorkspace(activeServingEntry)}
                    className="text-xs font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    {t('staff.open_workspace', 'Procurement Workspace')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-sand/30 border border-dark-neutral/20 rounded-xs flex items-center justify-between text-xs text-dark-neutral-muted h-full">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-forest-green" />
                  {t('staff.station_idle', 'No active farmer currently at this counter station. Press CALL NEXT to claim the next waiting token.')}
                </span>
              </div>
            )}
          </div>

          {/* NEXT IN LINE PREVIEW */}
          <div className="p-3.5 bg-amber-50/70 border-2 border-amber-400 rounded-xs shadow-[2px_2px_0px_#22252A] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-200 px-2 py-0.5 border border-amber-500 rounded-xs">
                  {t('staff.next_in_line', 'NEXT')}
                </span>
                <span className="text-[10px] font-bold text-amber-900 font-mono">
                  {waitingCount} {t('staff.waiting_count_label', 'waiting')}
                </span>
              </div>
              {nextWaitingEntry ? (
                <div>
                  <span className="text-xl font-black font-mono text-amber-950 block">
                    {nextWaitingEntry.tokenNumber}
                  </span>
                  <strong className="text-xs text-dark-neutral block">
                    {nextWaitingEntry.farmer?.fullName || nextWaitingEntry.farmerName || 'Next Farmer'}
                  </strong>
                  <span className="text-[11px] text-dark-neutral-muted">
                    {nextWaitingEntry.cropType || 'Wheat'} • {nextWaitingEntry.quantityQuintals || 40} Qtl
                  </span>
                </div>
              ) : (
                <p className="text-xs text-amber-900 font-medium mt-1">
                  Queue cleared. No further tokens currently waiting.
                </p>
              )}
            </div>
            <span className="text-[10px] text-dark-neutral-muted block pt-2 border-t border-amber-200">
              Auto-promotes when current token is processed.
            </span>
          </div>
        </div>
      </div>

      {/* Live Queue Filter Tabs & List Table */}
      <div className="bg-white border-3 border-dark-neutral rounded-md shadow-brutal-md overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 border-b-2 border-dark-neutral/10 bg-warm-ivory flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'WAITING', 'CALLED', 'SERVING', 'COMPLETED'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xs border-2 transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-forest-green text-white border-dark-neutral shadow-[2px_2px_0px_#22252A]'
                    : 'bg-white text-dark-neutral border-dark-neutral/40 hover:border-dark-neutral'
                }`}
              >
                {t(`staff.filter_${f.toLowerCase()}`, f)}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono font-bold text-dark-neutral-muted">
            {t('staff.showing_entries', { count: filteredQueue.length, total: queue.length })}
          </span>
        </div>

        {/* Queue Rows */}
        {filteredQueue.length > 0 ? (
          <div className="divide-y-2 divide-dark-neutral/10">
            {filteredQueue.map((entry) => {
              const isServing = ['CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING'].includes(entry.state);
              const rowKey = entry._id || entry.id || entry.tokenNumber;
              return (
                <div
                  key={rowKey}
                  onClick={() => onSelectFarmer && onSelectFarmer(entry)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-green-light/20 transition-colors cursor-pointer ${
                    isServing ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xs bg-forest-green text-white font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-[1px_1px_0px_#22252A]">
                      #{entry.sequenceNumber || 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black font-mono text-dark-neutral">
                          {entry.tokenNumber}
                        </span>
                        <span className="text-xs font-bold text-dark-neutral">
                          {entry.farmer?.fullName || entry.farmerName || 'Farmer'}
                        </span>
                      </div>

                      <div className="text-xs text-dark-neutral-muted flex items-center gap-2 flex-wrap mt-0.5">
                        <span>{entry.timeWindow || '09:00 - 10:00 AM'}</span>
                        <span>•</span>
                        <span>{getLocalizedCrop(entry.cropType || 'Wheat', t)} ({entry.quantityQuintals || 42} {t('common.quintals', 'Qtl')})</span>
                        <span>•</span>
                        <span>{t('staff.counter', 'Station')}: <strong className="text-dark-neutral font-bold">{entry.counterId || 'Bay 01'}</strong></span>
                        {entry.farmer?.villageName && (
                          <>
                            <span>•</span>
                            <span>{entry.farmer.villageName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
                    {/* Urgency State Indicator: not color alone */}
                    {(() => {
                      const waitMin = entry.waitingMinutes || (entry.state === 'WAITING' ? 22 : 8);
                      if (waitMin > 30) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs bg-red-100 text-red-900 border border-red-500 shadow-[1px_1px_0px_#22252A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                            <span>SLA Risk ({waitMin}m)</span>
                          </span>
                        );
                      }
                      if (waitMin > 15) {
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs bg-amber-100 text-amber-900 border border-amber-500 shadow-[1px_1px_0px_#22252A]">
                            <span>Long Wait ({waitMin}m)</span>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-gray-100 text-dark-neutral border border-gray-300">
                          <span>Normal ({waitMin}m)</span>
                        </span>
                      );
                    })()}

                    <Badge variant={getStageBadgeVariant(entry.state)} size="sm">
                      {getLocalizedStage(entry.state, t)}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFarmer && onSelectFarmer(entry);
                      }}
                      className="text-xs font-bold"
                    >
                      <span>{t('staff.details', 'Details')}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-forest-green mx-auto" />
            <h3 className="text-base font-black text-dark-neutral">
              {t('staff.queue_clear_title', 'QUEUE CLEAR')}
            </h3>
            <p className="text-xs text-dark-neutral-muted max-w-sm mx-auto">
              {t('staff.queue_clear_desc', 'No farmers are currently waiting in this filter. Check today’s scheduled delivery slots or call the next batch.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveQueueBoard;
