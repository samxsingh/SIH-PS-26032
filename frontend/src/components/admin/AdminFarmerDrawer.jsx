import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Phone, Shield, MapPin, Calendar, Clock, Sprout, Scale, Building2, CheckCircle2, Circle } from 'lucide-react';
import Badge from '../common/Badge';

export const AdminFarmerDrawer = ({ farmer, onClose }) => {
  const { t } = useTranslation();
  if (!farmer) return null;

  const STAGES = [
    { key: 'BOOKED', label: '1. Booking Reserved' },
    { key: 'WAITING', label: '2. In Waiting Yard' },
    { key: 'CALLED', label: '3. Called to Counter' },
    { key: 'ARRIVED', label: '4. Physical Gate Arrival' },
    { key: 'VERIFICATION', label: '5. Land & ID Verification' },
    { key: 'QUALITY_CHECK', label: '6. Moisture & Assaying' },
    { key: 'WEIGHING', label: '7. Certified Weighbridge' },
    { key: 'PROCUREMENT_CONFIRMED', label: '8. Procurement Confirmed' },
    { key: 'PAYMENT_PROCESSING', label: '9. Direct DBT Processing' },
    { key: 'PAYMENT_COMPLETED', label: '10. Payment Settled (DBT)' }
  ];

  const currentStageKey = farmer.state || 'WAITING';
  const currentIndex = STAGES.findIndex((s) => s.key === currentStageKey);
  const activeIdx = currentIndex !== -1 ? currentIndex : 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l-3 border-dark-neutral flex flex-col justify-between animate-slide-left overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-dark-neutral bg-warm-ivory flex items-start justify-between sticky top-0 z-10">
          <div>
            {/* Canonical Hierarchy Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider mb-1.5 flex-wrap">
              <span className="text-forest-green font-black">Lucknow District (UP_LUK)</span>
              <span>→</span>
              <span>{farmer.mandiName || 'APMC Mandi'}</span>
              <span>→</span>
              <span>{farmer.centreName || 'Procurement Centre'}</span>
              <span>→</span>
              <span className="font-mono text-dark-neutral font-black">Token #{farmer.tokenNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black text-forest-green bg-white px-2 py-0.5 border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                Token #{farmer.tokenNumber}
              </span>
              <h3 className="font-heading font-black text-lg text-dark-neutral">
                Farmer Procurement Journey
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Drawer"
            className="p-1.5 hover:bg-gray-200 border-2 border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A] transition-all text-dark-neutral shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Farmer Profile Card */}
          <div className="p-3.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-forest-green" /> Farmer Identity Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Full Name:</span>
                <strong className="text-dark-neutral font-black text-sm">{farmer.farmerName}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Mobile:</span>
                <strong className="text-dark-neutral font-mono">{farmer.phoneMasked || '******3210'}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Aadhaar / ID:</span>
                <strong className="text-dark-neutral font-mono">XXXX-XXXX-{farmer.aadhaarLast4 || '4821'}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Village / Tehsil:</span>
                <strong className="text-dark-neutral">{farmer.village || 'Chinhat'}, {farmer.district || 'Lucknow'}</strong>
              </div>
            </div>
          </div>

          {/* Booking Specifics */}
          <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-forest-green" /> Booking & Slot Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Procurement Facility:</span>
                <strong className="text-dark-neutral block">{farmer.centreName}</strong>
                <span className="text-[10px] font-mono text-dark-neutral-muted">{farmer.centreCode}</span>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Declared Commodity:</span>
                <strong className="text-forest-green font-black">Wheat (FAQ Grade)</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Slot Window:</span>
                <strong className="text-dark-neutral font-mono">09:00 AM - 10:00 AM</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Current Station:</span>
                <strong className="text-indigo-800 font-bold">{farmer.counterId || 'Counter 1'}</strong>
              </div>
            </div>
          </div>

          {/* 10-Stage Canonical Procurement Journey Ladder */}
          <div className="pt-2">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-3 flex items-center justify-between">
              <span>Canonical 10-Stage Procurement Ladder</span>
              <Badge variant="success">Synchronized Real-Time</Badge>
            </h4>

            <div className="relative pl-6 space-y-4 border-l-2 border-dark-neutral/25 ml-3">
              {STAGES.map((s, idx) => {
                const isPassed = idx < activeIdx;
                const isCurrent = idx === activeIdx;
                const isUpcoming = idx > activeIdx;

                return (
                  <div key={s.key} className="relative flex items-start gap-3 group">
                    {/* Bullet marker */}
                    <div
                      className={`absolute -left-[31px] w-6 h-6 rounded-full border-2 border-dark-neutral flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-forest-green text-white shadow-[2px_2px_0px_#22252A] scale-110 ring-2 ring-forest-green-light'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-warm-ivory text-dark-neutral-muted'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      ) : (
                        <span className="text-[9px] font-mono font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className={`text-xs block ${
                        isCurrent ? 'font-black text-forest-green text-sm' : isPassed ? 'font-bold text-dark-neutral line-through opacity-75' : 'text-dark-neutral-muted font-medium'
                      }`}>
                        {s.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-forest-green bg-forest-green-light px-2 py-0.5 rounded-xs border border-dark-neutral inline-block mt-0.5">
                          ● Current Stage
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-dark-neutral bg-warm-ivory flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 border-2 border-dark-neutral rounded-xs text-xs font-bold text-dark-neutral shadow-[2px_2px_0px_#22252A]"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFarmerDrawer;
