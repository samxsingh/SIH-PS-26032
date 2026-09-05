import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, ArrowUpDown, Building2, Eye, TrendingUp, IndianRupee } from 'lucide-react';
import Badge from '../common/Badge';

export const CentrePerformanceTable = ({ centres = [], onSelectCentre }) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('centreCode');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedCentres = [...centres].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'mandi') {
      valA = a.mandi?.name || '';
      valB = b.mandi?.name || '';
    }

    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
  });

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-3.5 sm:p-4 mb-6 animate-fade-slide min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.performance_table_title', 'Procurement Centres Reporting & Performance Table')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.performance_table_subtitle', 'Comprehensive cross-facility comparison table with multi-column sorting')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full text-left border-collapse border-2 border-dark-neutral">
          <thead>
            <tr className="border-b-2 border-dark-neutral text-xs font-black text-dark-neutral uppercase bg-warm-ivory tracking-wider">
              <th className="p-2.5 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Centre Facility <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('mandi')}>
                <div className="flex items-center gap-1">
                  Parent Mandi <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('waitingCount')}>
                <div className="flex items-center justify-center gap-1">
                  Waiting <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('estimatedWaitMinutes')}>
                <div className="flex items-center justify-center gap-1">
                  Avg Turnaround <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('completedCount')}>
                <div className="flex items-center justify-center gap-1">
                  Completed <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('produceTodayQuintals')}>
                <div className="flex items-center justify-end gap-1">
                  Produce (Qtl) <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('payableTodayRs')}>
                <div className="flex items-center justify-end gap-1">
                  Payable (₹) <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center">Operational Status</th>
              <th className="p-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dark-neutral/10 text-xs font-medium">
            {sortedCentres.map((c) => (
              <tr key={c.id || c._id} className="hover:bg-warm-ivory/60 transition-colors">
                <td className="p-2.5">
                  <span className="font-mono font-black text-forest-green text-[10px] block">{c.centreCode}</span>
                  <strong className="text-dark-neutral block font-bold">{c.name}</strong>
                </td>
                <td className="p-2.5 text-dark-neutral-muted">
                  {c.mandi?.name || 'Dubagga Mandi'}
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-amber-900">
                  {c.waitingCount || 0}
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-dark-neutral">
                  ~{c.estimatedWaitMinutes || 18} min
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-emerald-800">
                  {c.completedCount || 0}
                </td>
                <td className="p-2.5 text-right font-mono font-black text-forest-green">
                  {c.produceTodayQuintals || 0}
                </td>
                <td className="p-2.5 text-right font-mono font-black text-dark-neutral">
                  ₹{(c.payableTodayRs || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-2.5 text-center">
                  <Badge variant={c.health === 'CRITICAL' ? 'danger' : c.health === 'WATCH' ? 'warning' : 'success'} className="text-[10px] font-bold">
                    {c.statusText || c.health}
                  </Badge>
                </td>
                <td className="p-2.5 text-right">
                  <button
                    onClick={() => onSelectCentre(c)}
                    className="px-2.5 py-1 text-[11px] font-bold text-forest-green bg-forest-green-light border border-dark-neutral rounded-xs hover:bg-forest-green hover:text-white transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CentrePerformanceTable;
