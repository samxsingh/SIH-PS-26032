import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Sprout, TrendingUp, IndianRupee, Scale } from 'lucide-react';
import Badge from '../common/Badge';

export const ProcurementAnalyticsSection = ({ commodityBreakdown = [] }) => {
  const { t } = useTranslation();

  const totalVolume = commodityBreakdown.reduce((sum, c) => sum + (c.quantityQuintals || 0), 0) || 637;
  const totalValue = commodityBreakdown.reduce((sum, c) => sum + (c.payableRs || 0), 0) || 1452975;

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.procurement_analytics_title', 'District Procurement Analytics & Commodity Volume')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.procurement_analytics_subtitle', 'Certified volume aggregates, MSP rate coverage, and financial distribution')}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-dark-neutral-muted">
          <span>Total: <strong className="text-forest-green font-mono">{totalVolume} Qtl</strong></span>
          <span>•</span>
          <span>Valuation: <strong className="text-forest-green font-mono">₹{totalValue.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 4 Commodity Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {commodityBreakdown.map((crop) => {
          const volumePct = totalVolume > 0 ? Math.round(((crop.quantityQuintals || 0) / totalVolume) * 100) : 0;

          return (
            <div
              key={crop.crop}
              className="p-3.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-forest-green" />
                  <h4 className="font-heading font-black text-sm text-dark-neutral">{crop.crop}</h4>
                </div>
                <Badge variant="neutral" className="text-[10px] font-bold">
                  MSP: ₹{crop.mspRate}/Qtl
                </Badge>
              </div>

              {/* Volume Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] font-bold text-dark-neutral-muted mb-1">
                  <span>District Share</span>
                  <span>{volumePct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full border border-dark-neutral/20 overflow-hidden">
                  <div
                    className="h-full bg-forest-green transition-all duration-500"
                    style={{ width: `${volumePct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-dark-neutral-muted text-[10px] uppercase font-bold">Quantity:</span>
                  <strong className="text-dark-neutral font-mono">{crop.quantityQuintals || 0} Qtl</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-neutral-muted text-[10px] uppercase font-bold">Transactions:</span>
                  <strong className="text-dark-neutral font-mono">{crop.count || 0}</strong>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-dark-neutral/15">
                  <span className="text-dark-neutral-muted text-[10px] uppercase font-bold">Estimated Payable:</span>
                  <strong className="text-forest-green font-mono font-black">₹{(crop.payableRs || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcurementAnalyticsSection;
