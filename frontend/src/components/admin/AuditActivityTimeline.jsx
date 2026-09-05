import React from 'react';
import { useTranslation } from 'react-i18next';
import { History, Clock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';

export const AuditActivityTimeline = ({ auditLogs = [] }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.audit_timeline_title', 'Operational Activity & Mutation Timeline')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.audit_timeline_subtitle', 'Immutable ledger of state transitions, station assignments, and certified weighbridge logs')}
          </p>
        </div>

        <Badge variant="neutral" icon={ShieldCheck} className="text-[10px] font-bold">
          Immutable Audit Trail
        </Badge>
      </div>

      {/* Timeline List */}
      {auditLogs.length === 0 ? (
        <div className="p-6 text-center text-xs text-dark-neutral-muted font-medium bg-warm-ivory border-2 border-dark-neutral rounded-xs">
          No audit entries logged for today.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 border-l-2 border-dark-neutral/25 ml-3 my-2">
          {auditLogs.map((log) => {
            const timeStr = log.createdAt
              ? new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '10:42 AM';

            return (
              <div key={log.id || log._id} className="relative flex items-start gap-3 group">
                {/* Node circle */}
                <div className="absolute -left-[31px] w-5 h-5 rounded-full bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-white shadow-[1px_1px_0px_#22252A]" />

                <div className="p-3 bg-warm-ivory/80 hover:bg-warm-ivory border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] w-full transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-black text-xs text-forest-green flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-forest-green" />
                      {timeStr}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-dark-neutral-muted">
                      <span>Facility:</span>
                      <strong className="text-dark-neutral">{log.centreName || 'Gomti Nagar Centre'}</strong>
                      <span>•</span>
                      <span>Actor:</span>
                      <strong className="text-dark-neutral uppercase">{log.actor || 'STAFF'}</strong>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-dark-neutral flex items-center gap-1.5 flex-wrap">
                    <span className="uppercase text-forest-green font-black">{log.action?.replace(/_/g, ' ')}</span>
                    {log.previousState && log.newState && (
                      <span className="text-[11px] text-dark-neutral-muted font-mono inline-flex items-center gap-1">
                        ({log.previousState} <ArrowRight className="w-3 h-3 inline text-dark-neutral" /> <strong>{log.newState}</strong>)
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-[11px] text-dark-neutral-muted flex items-center gap-3">
                    <span>Token: <strong className="text-dark-neutral font-mono">{log.tokenNumber || 'LKO-101'}</strong></span>
                    <span>Station: <strong className="text-dark-neutral">{log.counterId || 'Counter 1'}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditActivityTimeline;
