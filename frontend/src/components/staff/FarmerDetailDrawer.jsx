import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Scale
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getLocalizedCrop } from '../../utils/formatters';

export const FarmerDetailDrawer = ({
  farmerEntry,
  isOpen,
  onClose,
  onOpenInWorkspace
}) => {
  const { t } = useTranslation();

  if (!isOpen || !farmerEntry) return null;

  const STAGES = [
    { key: 'BOOKED', label: t('lifecycle.booked', 'Slot Booked'), desc: t('staff.journey_booked_desc', 'Scheduled online via Farmer Portal') },
    { key: 'WAITING', label: t('lifecycle.waiting', 'Waiting in Queue'), desc: t('staff.journey_waiting_desc', 'Farmer physically in queue line') },
    { key: 'CALLED', label: t('lifecycle.called', 'Called to Counter'), desc: t('staff.journey_called_desc', 'Token called to operational counter station') },
    { key: 'ARRIVED', label: t('lifecycle.arrived', 'Arrived at Station'), desc: t('staff.journey_arrived_desc', 'Farmer present at counter') },
    { key: 'VERIFICATION', label: t('lifecycle.verification', 'Identity & Crop Verified'), desc: t('staff.journey_verify_desc', 'Farmer ID & token matched against roster') },
    { key: 'QUALITY_CHECK', label: t('lifecycle.quality_check', 'Quality Check (Moisture & Grade)'), desc: t('staff.journey_qc_desc', 'Assaying completed within tolerance limit') },
    { key: 'WEIGHING', label: t('lifecycle.weighing', 'Certified Weighing'), desc: t('staff.journey_weigh_desc', 'Gross, tare, and net weights confirmed') },
    { key: 'PROCUREMENT_CONFIRMED', label: t('lifecycle.confirmed', 'Procurement Confirmed'), desc: t('staff.journey_confirmed_desc', 'MSP rate verified & receipt issued') },
    { key: 'PAYMENT_PROCESSING', label: t('lifecycle.payment_processing', 'Payment Processing'), desc: t('staff.journey_payment_desc', 'Direct bank settlement in process') },
    { key: 'PAYMENT_COMPLETED', label: t('lifecycle.payment_completed', 'Payment Completed'), desc: t('staff.journey_settled_desc', 'Payment disbursed to farmer account') }
  ];

  const currentState = farmerEntry.state || farmerEntry.operationalStatus || 'WAITING';
  const currentIndex = STAGES.findIndex((s) => s.key === currentState);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  const isCanon = farmerEntry.tokenNumber === 'GOM01-109';
  const farmerName = farmerEntry.farmer?.fullName || farmerEntry.farmerName || (isCanon ? 'Ramesh Patel' : 'Farmer');
  const phone = farmerEntry.farmer?.phone || farmerEntry.phone || (isCanon ? '9876543210' : '+91 98765 43210');
  const village = farmerEntry.farmer?.villageName || farmerEntry.village || farmerEntry.villageName || (isCanon ? 'Chinhat' : 'Lucknow');
  const crop = farmerEntry.cropType || farmerEntry.commodity || 'Wheat';
  const qty = Number(farmerEntry.netWeightQuintals || farmerEntry.quantityQuintals || farmerEntry.estimatedQuantityQuintals || (isCanon ? 44.0 : 40));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-dark-neutral/50 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl border-l-3 border-dark-neutral flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b-2 border-dark-neutral/10 bg-warm-ivory flex items-start justify-between">
          <div>
            {/* Canonical Hierarchy Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider mb-1.5 flex-wrap">
              <span className="text-forest-green font-black">Lucknow District (UP_LUK)</span>
              <span>→</span>
              <span>{farmerEntry.centreName || 'Procurement Centre'}</span>
              <span>→</span>
              <span className="font-mono text-dark-neutral font-black">Token #{farmerEntry.tokenNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green-light px-2 py-0.5 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
                {t('staff.farmer_details', 'FARMER DOSSIER')}
              </span>
              <span className="text-xs font-mono font-bold text-forest-green">
                {farmerEntry.tokenNumber}
              </span>
            </div>
            <h3 className="text-xl font-black font-heading text-dark-neutral mt-1">
              {farmerName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xs border-2 border-dark-neutral bg-white hover:bg-sand text-dark-neutral shadow-[2px_2px_0px_#22252A]"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-6 flex-1">
          {/* Key Farmer Data Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-sand/30 rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Village / Locality</span>
              <span className="font-bold text-dark-neutral flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-forest-green" />
                {village}, Lucknow
              </span>
            </div>

            <div className="p-2.5 bg-sand/30 rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Contact Number</span>
              <span className="font-bold font-mono text-dark-neutral flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-forest-green" />
                {phone}
              </span>
            </div>

            <div className="p-2.5 bg-sand/30 rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">{t('farmer.produce_label', 'Commodity')}</span>
              <span className="font-bold text-dark-neutral mt-0.5 block">
                {getLocalizedCrop(crop, t)} • {qty} {t('common.quintals', 'Qtl')}
              </span>
            </div>

            <div className="p-2.5 bg-sand/30 rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Scheduled Slot</span>
              <span className="font-bold text-dark-neutral mt-0.5 block truncate">
                {farmerEntry.timeWindow || '09:00 - 10:00 AM'}
              </span>
            </div>

            <div className="p-2.5 bg-sand/30 rounded-xs border border-dark-neutral/30 col-span-2">
              <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Aadhaar Card (Identity Verification)</span>
              <span className="font-bold font-mono text-dark-neutral mt-0.5 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-green" />
                <span>XXXX-XXXX-{farmerEntry.aadhaarLast4 || '4821'}</span>
                <span className="text-[9px] font-sans font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">UIDAI Verified</span>
              </span>
            </div>
          </div>

          {/* Canonical 10-Stage Procurement Journey Vertical Ladder */}
          <div>
            <h4 className="text-xs font-black uppercase text-dark-neutral tracking-wider mb-3">
              {t('staff.procurement_journey', 'Canonical Procurement Journey')}
            </h4>

            <div className="space-y-3 relative pl-2 border-l-2 border-dark-neutral/20 ml-3">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < safeIndex;
                const isCurrent = idx === safeIndex;

                return (
                  <div key={stage.key} className="relative pl-6">
                    {/* Step Indicator Node */}
                    <div
                      className={`absolute -left-[17px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                        isCompleted
                          ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                          : isCurrent
                          ? 'bg-forest-green text-white border-dark-neutral ring-4 ring-forest-green/20 animate-pulse'
                          : 'bg-white text-dark-neutral-muted border-dark-neutral/30'
                      }`}
                    >
                      {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isCurrent ? 'text-forest-green font-black text-sm' : isCompleted ? 'text-dark-neutral' : 'text-dark-neutral-muted'
                          }`}
                        >
                          {stage.label}
                        </span>
                        {isCurrent && (
                          <Badge variant="primary" size="sm">
                            {t('staff.active_now', 'ACTIVE')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-dark-neutral-muted mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t-2 border-dark-neutral/10 bg-warm-ivory flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold"
          >
            {t('common.close', 'Close')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onOpenInWorkspace && onOpenInWorkspace(farmerEntry);
            }}
            className="text-xs font-black bg-forest-green hover:bg-forest-green-dark"
          >
            <span>{t('staff.serve_in_workspace', 'Serve in Workspace')}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FarmerDetailDrawer;
