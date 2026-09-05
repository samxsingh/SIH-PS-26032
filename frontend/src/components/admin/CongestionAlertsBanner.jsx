import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, X } from 'lucide-react';
import Badge from '../common/Badge';

export const CongestionAlertsBanner = ({ alerts = [], onDismiss, onSelectCentreByCode }) => {
  const { t } = useTranslation();
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6 animate-fade-slide">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          {t('admin.alerts_active', 'Operational Congestion & Facility Alerts')} ({alerts.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {alerts.map((a) => {
          const isCrit = a.severity === 'CRITICAL';
          const isHigh = a.severity === 'HIGH';
          const isAttn = a.severity === 'ATTENTION';

          return (
            <div
              key={a.id}
              className={`p-3 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex flex-col justify-between transition-all ${
                isCrit
                  ? 'bg-red-50 border-red-700 text-red-950'
                  : isHigh
                  ? 'bg-amber-50 border-amber-700 text-amber-950'
                  : isAttn
                  ? 'bg-yellow-50 border-yellow-700 text-yellow-950'
                  : 'bg-blue-50 border-blue-700 text-blue-950'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-1 mb-1">
                  <span className="font-heading font-black text-xs uppercase flex items-center gap-1">
                    {isCrit ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    {a.title}
                  </span>
                  <Badge variant={isCrit ? 'danger' : isHigh ? 'warning' : 'neutral'} className="text-[9px] font-mono">
                    {a.priority || a.severity}
                  </Badge>
                </div>
                <p className="text-xs font-medium opacity-90 mb-2 leading-relaxed">
                  {a.message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dark-neutral/15 text-[10px] font-bold">
                <span className="font-mono bg-white px-1.5 py-0.5 border border-dark-neutral/30 rounded-xs">
                  {a.metric}
                </span>
                {a.centreCode && onSelectCentreByCode && (
                  <button
                    onClick={() => onSelectCentreByCode(a.centreCode)}
                    className="text-forest-green hover:underline font-bold"
                  >
                    View Centre →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CongestionAlertsBanner;
