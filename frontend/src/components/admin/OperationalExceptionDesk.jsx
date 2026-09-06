import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert, ArrowRight, Filter } from 'lucide-react';
import Badge from '../common/Badge';

export const OperationalExceptionDesk = ({ exceptions = [] }) => {
  const { t } = useTranslation();
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredExceptions = exceptions.filter((exc) => {
    if (filterSeverity === 'ALL') return true;
    return exc.severity === filterSeverity;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-red-100 text-red-900 border border-red-400 rounded-xs">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-400 rounded-xs">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-400 rounded-xs">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="danger" className="text-[10px] font-bold">OPEN</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="warning" className="text-[10px] font-bold">IN REVIEW</Badge>;
      case 'RESOLVED':
        return <Badge variant="success" className="text-[10px] font-bold">RESOLVED</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="info" className="text-[10px] font-bold">PENDING</Badge>;
    }
  };

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.exception_desk_title', 'Operational Exception Desk')}
            </h3>
            <span className="text-[10px] font-bold text-dark-neutral-muted bg-warm-ivory px-2 py-0.5 border border-dark-neutral/30 rounded-xs">
              {exceptions.length} {t('admin.exceptions_reported', 'Reported Cases')}
            </span>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.exception_desk_sub', 'Live tracking of quality variances, verification anomalies, weighbridge recalibrations, and payment holds across Lucknow centres.')}
          </p>
        </div>

        {/* Severity Filter Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-dark-neutral-muted" />
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`text-xs font-bold px-2.5 py-1 rounded-xs border-2 transition-all cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-warm-ivory text-dark-neutral border-dark-neutral/30 hover:border-dark-neutral'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Exception Records Table */}
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full text-left border-collapse border-2 border-dark-neutral">
          <thead>
            <tr className="border-b-2 border-dark-neutral text-xs font-black text-dark-neutral uppercase bg-warm-ivory tracking-wider">
              <th className="p-2.5">Severity</th>
              <th className="p-2.5">Token / Farmer</th>
              <th className="p-2.5">Procurement Centre</th>
              <th className="p-2.5">Stage</th>
              <th className="p-2.5">Identified Problem</th>
              <th className="p-2.5">Required Action</th>
              <th className="p-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dark-neutral/10 text-xs font-medium">
            {filteredExceptions.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-dark-neutral-muted font-bold">
                  No exceptions reported matching current filter.
                </td>
              </tr>
            ) : (
              filteredExceptions.map((exc) => (
                <tr key={exc.id} className="hover:bg-warm-ivory/60 transition-colors">
                  <td className="p-2.5">
                    {getSeverityBadge(exc.severity)}
                  </td>
                  <td className="p-2.5">
                    <span className="font-mono font-black text-forest-green block text-xs">{exc.tokenNumber}</span>
                    <strong className="text-dark-neutral block">{exc.farmerName}</strong>
                  </td>
                  <td className="p-2.5">
                    <strong className="text-dark-neutral block text-xs">{exc.centreName}</strong>
                    <span className="text-[10px] font-mono text-dark-neutral-muted">{exc.centreCode}</span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-bold text-dark-neutral">{exc.stage}</span>
                    <span className="text-[10px] text-dark-neutral-muted block">Logged: {exc.reportedAt}</span>
                  </td>
                  <td className="p-2.5 max-w-xs">
                    <p className="text-xs font-semibold text-red-950">{exc.problem}</p>
                  </td>
                  <td className="p-2.5 max-w-xs">
                    <p className="text-xs font-medium text-forest-green">{exc.requiredAction}</p>
                  </td>
                  <td className="p-2.5 text-center">
                    {getStatusBadge(exc.status)}
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

export default OperationalExceptionDesk;
