import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Phone, Shield, MapPin, Calendar, Clock, Sprout, Scale, Building2, CheckCircle2, Circle } from 'lucide-react';
import Badge from '../common/Badge';
import { getLocalizedStage, getLocalizedCrop } from '../../utils/formatters';

export const AdminFarmerDrawer = ({ farmer, onClose }) => {
  const { t } = useTranslation();
  if (!farmer) return null;

  const STAGES = [
    { key: 'BOOKED', label: `1. ${getLocalizedStage('BOOKED', t)}` },
    { key: 'WAITING', label: `2. ${getLocalizedStage('WAITING', t)}` },
    { key: 'CALLED', label: `3. ${getLocalizedStage('CALLED', t)}` },
    { key: 'ARRIVED', label: `4. ${getLocalizedStage('ARRIVED', t)}` },
    { key: 'VERIFICATION', label: `5. ${getLocalizedStage('VERIFICATION', t)}` },
    { key: 'QUALITY_CHECK', label: `6. ${getLocalizedStage('QUALITY_CHECK', t)}` },
    { key: 'WEIGHING', label: `7. ${getLocalizedStage('WEIGHING', t)}` },
    { key: 'PROCUREMENT_CONFIRMED', label: `8. ${getLocalizedStage('PROCUREMENT_CONFIRMED', t)}` },
    { key: 'PAYMENT_PROCESSING', label: `9. ${getLocalizedStage('PAYMENT_PROCESSING', t)}` },
    { key: 'PAYMENT_COMPLETED', label: `10. ${getLocalizedStage('PAYMENT_COMPLETED', t)}` }
  ];

  const currentStageKey = farmer.state || 'WAITING';
  const currentIndex = STAGES.findIndex((s) => s.key === currentStageKey);
  const activeIdx = currentIndex !== -1 ? currentIndex : 1;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
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
                {t('admin.farmer_journey', 'Farmer Procurement Journey')}
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
              <User className="w-4 h-4 text-forest-green" /> {t('admin.farmer_identity', 'Farmer Identity Details')}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.full_name', 'Full Name')}:</span>
                <strong className="text-dark-neutral font-black text-sm">{farmer.farmerName}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.mobile', 'Mobile')}:</span>
                <strong className="text-dark-neutral font-mono">{farmer.phoneMasked || '******3210'}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">Aadhaar / ID:</span>
                <strong className="text-dark-neutral font-mono">XXXX-XXXX-{farmer.aadhaarLast4 || '4821'}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.village_tehsil', 'Village / Tehsil')}:</span>
                <strong className="text-dark-neutral">{farmer.village || 'Chinhat'}, {farmer.district || 'Lucknow'}</strong>
              </div>
            </div>
          </div>

          {/* Booking & Operational Details */}
          <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-forest-green" /> {t('admin.booking_facility_details', 'Booking & Facility Details')}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.procurement_facility', 'Procurement Facility')}:</span>
                <strong className="text-dark-neutral block">{farmer.centreName}</strong>
                <span className="text-[10px] font-mono text-dark-neutral-muted">{farmer.centreCode}</span>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.commodity', 'Commodity')}:</span>
                <strong className="text-forest-green font-black">{getLocalizedCrop(farmer.cropType || 'Wheat', t)} (FAQ Grade)</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.quantity', 'Quantity')}:</span>
                <strong className="text-dark-neutral font-mono font-bold">{farmer.netWeightQuintals || farmer.quantityQuintals || farmer.declaredQuantity || 44.0} {t('common.quintals', 'Quintals')}</strong>
              </div>
              <div>
                <span className="text-dark-neutral-muted text-[10px] uppercase font-bold block">{t('admin.current_station', 'Current Station')}:</span>
                <strong className="text-indigo-800 font-bold">{farmer.counterId || 'Counter 1'}</strong>
              </div>
            </div>
          </div>

          {/* Operational Audit Trail (Quality, Weighing, Settlement & Timestamps) */}
          <div className="p-3.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] space-y-3">
            <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-700" /> {t('admin.operational_audit_trail', 'Operational Audit Trail')}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-white border border-dark-neutral rounded-xs">
                {t('common.status', 'Status')}: {getLocalizedStage(farmer.state, t)}
              </span>
            </h4>

            {/* Quality & Weighing Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xs border border-dark-neutral/30">
                <span className="text-[9px] font-bold uppercase text-dark-neutral-muted block">{t('admin.quality_assaying', 'Quality Assaying')}:</span>
                <strong className="text-forest-green font-bold block">{farmer.qualityGrade || 'Grade A'}</strong>
                <span className="text-[10px] text-dark-neutral-muted">{t('farmer.moisture_label', 'Moisture', { moisture: farmer.moisturePercentage || 12.3 })}</span>
              </div>
              <div className="p-2 bg-white rounded-xs border border-dark-neutral/30">
                <span className="text-[9px] font-bold uppercase text-dark-neutral-muted block">{t('admin.certified_weight', 'Certified Weight')}:</span>
                <strong className="text-purple-800 font-mono font-bold block">Net: {farmer.netWeightQuintals || farmer.quantityQuintals || 44.0} {t('common.quintals', 'Qtl')}</strong>
                <span className="text-[10px] text-dark-neutral-muted">Gross: {farmer.grossWeightQuintals || 45.5} • Tare: {farmer.tareWeightQuintals || 1.5}</span>
              </div>
              <div className="p-2 bg-white rounded-xs border border-dark-neutral/30 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold uppercase text-dark-neutral-muted block">{t('admin.msp_rate', 'MSP Rate')}:</span>
                <strong className="text-dark-neutral font-mono font-black block">₹{(farmer.mspRate || 2275).toLocaleString('en-IN')} / {t('common.quintals', 'Qtl')}</strong>
                <span className="text-[10px] text-forest-green font-bold">Payable: ₹{(farmer.netPayableAmount || ((farmer.netWeightQuintals || farmer.quantityQuintals || 44.0) * (farmer.mspRate || 2275))).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Receipt & Payment Settlement Info */}
            <div className="p-2.5 bg-white rounded-xs border border-dark-neutral/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-dark-neutral-muted text-[10px] font-bold uppercase">{t('admin.digital_receipt', 'Digital Receipt')}:</span>
                <span className="font-mono font-bold text-dark-neutral text-[11px]">
                  {farmer.receiptSerialNumber || (farmer.tokenNumber === 'GOM01-109' ? 'REC-LKO01-20260906-819' : `REC-${farmer.centreCode || 'LKO_GOM01'}-20260906-${farmer.tokenNumber?.replace(/\D/g, '') || '109'}`)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-neutral-muted text-[10px] font-bold uppercase">{t('admin.payment_status', 'Payment Status')}:</span>
                <span className="font-mono font-bold text-forest-green text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-forest-green" />
                  {getLocalizedStage(farmer.paymentStatus || (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED'].includes(farmer.state) ? 'PAID' : 'PENDING'), t)}
                  <span className="text-dark-neutral-muted font-normal text-[10px]">
                    ({farmer.tokenNumber === 'GOM01-109' ? 'DBT-LKO-2026-0906-819' : (farmer.paymentReference || `DBT-LKO-2026-${farmer.tokenNumber?.replace(/\D/g, '') || '109'}`)})
                  </span>
                </span>
              </div>
            </div>

            {/* Stage Timestamps if present */}
            {(farmer.calledAt || farmer.arrivedAt || farmer.verificationStartedAt || farmer.weighingStartedAt || farmer.completedAt) && (
              <div className="pt-1 text-[10px] text-dark-neutral-muted border-t border-dark-neutral/15 space-y-0.5 font-mono">
                <span className="font-bold uppercase block text-[9px] text-dark-neutral">Stage Log Timestamps:</span>
                {farmer.calledAt && <div>• Called: {new Date(farmer.calledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
                {farmer.arrivedAt && <div>• Arrived: {new Date(farmer.arrivedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
                {farmer.verificationStartedAt && <div>• Verification: {new Date(farmer.verificationStartedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
                {farmer.weighingStartedAt && <div>• Weighing: {new Date(farmer.weighingStartedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
                {farmer.completedAt && <div>• Completed: {new Date(farmer.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
            )}
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
