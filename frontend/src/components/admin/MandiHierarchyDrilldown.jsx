import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Store, Building2, MapPin, Users, TrendingUp, IndianRupee, ArrowDown } from 'lucide-react';
import Badge from '../common/Badge';

export const MandiHierarchyDrilldown = ({
  mandis = [],
  selectedMandi,
  onSelectMandi,
  selectedCentre,
  onSelectCentre
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header & Breadcrumb Hierarchy */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-dark-neutral/10 flex-wrap text-xs">
        <span className="font-black text-forest-green uppercase tracking-wider bg-forest-green-light px-2 py-0.5 border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
          Lucknow District (UP_LUK)
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-dark-neutral-muted" />
        <span className={`font-bold px-2 py-0.5 rounded-xs border ${
          selectedMandi
            ? 'bg-purple-100 text-purple-900 border-purple-400 font-black'
            : 'text-dark-neutral-muted border-transparent'
        }`}>
          {selectedMandi ? selectedMandi.name : t('admin.all_mandis', 'Select Mandi')}
        </span>
        {selectedCentre && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-dark-neutral-muted" />
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 font-black px-2 py-0.5 rounded-xs">
              {selectedCentre.name} ({selectedCentre.centreCode})
            </span>
          </>
        )}
      </div>

      <div className="mb-3">
        <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted">
          {t('admin.regulated_mandis_network', 'APMC Mandis & Mandi Hierarchy Network (Select to Inspect Connected Centres)')}
        </h4>
      </div>

      {/* 3 Mandi Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {mandis.map((m) => {
          const isSelected = selectedMandi?._id === m._id || selectedMandi?.id === m.id;
          return (
            <div
              key={m.id || m._id}
              onClick={() => onSelectMandi(isSelected ? null : m)}
              className={`cursor-pointer p-3.5 rounded-xs border-2 border-dark-neutral transition-all ${
                isSelected
                  ? 'bg-purple-50 border-purple-800 shadow-brutal -translate-y-0.5'
                  : 'bg-warm-ivory hover:bg-white shadow-[2px_2px_0px_#22252A]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xs bg-purple-700 text-white flex items-center justify-center border border-dark-neutral">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-purple-800 block">
                      {m.mandiCode}
                    </span>
                    <h5 className="font-heading font-black text-xs text-dark-neutral line-clamp-1" title={m.name}>
                      {m.name}
                    </h5>
                  </div>
                </div>
                <Badge variant="neutral" className="text-[10px] font-bold">
                  {m.category?.replace(/_/g, ' ') || 'APMC MANDI'}
                </Badge>
              </div>

              <p className="text-[11px] text-dark-neutral-muted flex items-center gap-1 mb-2.5 truncate">
                <MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />
                {m.address}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-neutral/15 text-[10px] font-bold">
                <div>
                  <span className="text-dark-neutral-muted uppercase block">Centres</span>
                  <strong className="text-dark-neutral font-mono text-xs">{m.associatedCentresCount || 0}</strong>
                </div>
                <div>
                  <span className="text-dark-neutral-muted uppercase block">Produce</span>
                  <strong className="text-forest-green font-mono text-xs">{m.todayProcureQuintals || 0} Qtl</strong>
                </div>
                <div>
                  <span className="text-dark-neutral-muted uppercase block">Payable</span>
                  <strong className="text-purple-700 font-mono text-xs">₹{(m.todayPayableRs || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* When Mandi is selected: Show associated centres */}
      {selectedMandi && (
        <div className="mt-4 pt-3 border-t-2 border-purple-200 bg-purple-50/50 p-3 rounded-xs animate-fade-slide">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-purple-900 flex items-center gap-1.5 uppercase">
              <ArrowDown className="w-3.5 h-3.5 text-purple-700" />
              Affiliated Centres under {selectedMandi.name} ({selectedMandi.associatedCentres?.length || 0})
            </span>
            <button
              onClick={() => onSelectMandi(null)}
              className="text-[11px] font-bold text-purple-700 hover:underline"
            >
              Clear Filter
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {selectedMandi.associatedCentres?.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCentre(c)}
                className="p-2.5 bg-white rounded-xs border-2 border-dark-neutral hover:border-forest-green cursor-pointer shadow-[2px_2px_0px_#22252A] transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[9px] font-mono font-black text-forest-green block">{c.centreCode}</span>
                  <h6 className="font-bold text-xs text-dark-neutral truncate max-w-[160px]">{c.name}</h6>
                </div>
                <Badge variant={c.health === 'CRITICAL' ? 'danger' : c.health === 'WATCH' ? 'warning' : 'success'}>
                  {c.health}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MandiHierarchyDrilldown;
