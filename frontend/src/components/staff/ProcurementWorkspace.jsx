import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Scale,
  FileCheck,
  AlertCircle,
  FileText,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getLocalizedStage } from '../../utils/formatters';

export const ProcurementWorkspace = ({
  activeEntry,
  onAdvanceState,
  isProcessing,
  onViewReceipt
}) => {
  const { t } = useTranslation();

  const entryId = activeEntry?._id || activeEntry?.id;
  const declaredQty = Number(activeEntry?.quantityQuintals || activeEntry?.bookingId?.estimatedQuantityQuintals || activeEntry?.declaredQuantity || 40);
  const isDemoCanonical = activeEntry?.tokenNumber === 'GOM01-109' || declaredQty === 44;

  // Verification & Quality Assaying local state
  const [verifiedQty, setVerifiedQty] = useState(declaredQty);
  const [moisture, setMoisture] = useState(isDemoCanonical ? 12.3 : 12.5);
  const [impurity, setImpurity] = useState(isDemoCanonical ? 0.4 : 1.2);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [checklist, setChecklist] = useState({
    identityVerified: true,
    cropMatched: true,
    quotaVerified: true,
    gateSlipIssued: true
  });

  // Weighing local state
  const [grossWeight, setGrossWeight] = useState(isDemoCanonical ? 45.5 : Number((declaredQty + 1.5).toFixed(1)));
  const [tareWeight, setTareWeight] = useState(1.5);
  const netWeight = Number((grossWeight - tareWeight).toFixed(2));

  // Sync state whenever activeEntry changes
  useEffect(() => {
    if (activeEntry) {
      const q = Number(activeEntry.quantityQuintals || activeEntry.bookingId?.estimatedQuantityQuintals || activeEntry.declaredQuantity || 40);
      const isCanon = activeEntry.tokenNumber === 'GOM01-109' || q === 44;
      setVerifiedQty(q);
      setMoisture(isCanon ? 12.3 : 12.5);
      setImpurity(isCanon ? 0.4 : 1.2);
      setGrossWeight(isCanon ? 45.5 : Number((q + 1.5).toFixed(1)));
      setTareWeight(1.5);
    }
  }, [activeEntry?._id, activeEntry?.id]);

  // Policy & MSP Calculation (Authoritative server baseline)
  const cropType = activeEntry?.cropType || activeEntry?.bookingId?.cropType || activeEntry?.commodity || 'Wheat';
  const mspRate = cropType === 'Wheat' ? 2275 : cropType === 'Paddy' ? 2300 : cropType === 'Mustard' ? 5650 : cropType === 'Pulses' ? 6600 : 2275;
  const grossAmount = Math.round(netWeight * mspRate);
  const deductions = 0;
  const netPayable = grossAmount - deductions;

  // Moisture & Quality Assay Decision
  const isMoistureAcceptable = moisture >= 8.0 && moisture <= 14.0;
  const isImpurityAcceptable = impurity >= 0 && impurity <= 2.0;
  const isQcPass = isMoistureAcceptable && isImpurityAcceptable;
  const isQcConditional = !isQcPass && moisture <= 16.0 && impurity <= 4.0;
  const assayDecision = isQcPass ? 'PASS' : isQcConditional ? 'CONDITIONAL' : 'REJECT';

  // Canonical 10-stage lifecycle sequence
  const STAGES = [
    { key: 'BOOKED', label: t('lifecycle.booked', 'Booked') },
    { key: 'WAITING', label: t('lifecycle.waiting', 'Waiting') },
    { key: 'CALLED', label: t('lifecycle.called', 'Called') },
    { key: 'ARRIVED', label: t('lifecycle.arrived', 'Arrived') },
    { key: 'VERIFICATION', label: t('lifecycle.verification', 'Verification') },
    { key: 'QUALITY_CHECK', label: t('lifecycle.quality_check', 'Quality Check') },
    { key: 'WEIGHING', label: t('lifecycle.weighing', 'Weighing') },
    { key: 'PROCUREMENT_CONFIRMED', label: t('lifecycle.confirmed', 'Confirmed') },
    { key: 'PAYMENT_PROCESSING', label: t('lifecycle.payment_processing', 'Payment') },
    { key: 'PAYMENT_COMPLETED', label: t('lifecycle.payment_completed', 'Settled') }
  ];

  const currentState = activeEntry?.state || 'WAITING';
  const currentIndex = STAGES.findIndex((s) => s.key === currentState);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  // Active Entry Guard
  if (!activeEntry) {
    return (
      <div className="bg-white border-3 border-dark-neutral p-12 rounded-md shadow-brutal-md text-center space-y-3">
        <Clock className="w-12 h-12 text-dark-neutral-muted mx-auto" />
        <h3 className="text-xl font-black text-dark-neutral">
          {t('staff.no_active_farmer', 'No Active Farmer in Service')}
        </h3>
        <p className="text-xs text-dark-neutral-muted max-w-md mx-auto">
          {t('staff.no_active_farmer_desc', 'Please select a farmer from Today’s Queue or press CALL NEXT to begin an in-place procurement journey.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-3 border-dark-neutral p-6 rounded-md shadow-brutal-lg space-y-6">
      {/* 1. Header & Active Ticket Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-forest-green text-white px-2 py-0.5 rounded-xs">
              {t('staff.procurement_workspace', 'OPERATIONAL WORKSPACE')}
            </span>
            <span className="text-xs font-mono font-bold text-dark-neutral-muted">
              {activeEntry.counterId || 'Counter 1'}
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-dark-neutral mt-1">
            {activeEntry.farmer?.fullName || activeEntry.farmerName || 'Farmer'}
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-green-light border border-dark-neutral rounded-xs text-xs font-mono font-black text-forest-green shadow-[1px_1px_0px_#22252A]">
              TOKEN #{activeEntry.tokenNumber}
            </span>
            <span className="text-xs text-dark-neutral-muted">
              • Crop: <strong>{cropType}</strong> ({activeEntry.quantityQuintals || 42} Qtl declared)
            </span>
          </div>
        </div>

        <Badge variant="primary" size="lg" className="font-black tracking-wide self-start sm:self-center">
          {currentState}
        </Badge>
      </div>

      {/* 2. Canonical 10-Stage Visual Stepper */}
      <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral overflow-x-auto">
        <div className="flex items-center min-w-[720px] justify-between">
          {STAGES.map((st, idx) => {
            const isCompleted = idx < safeIndex;
            const isCurrent = idx === safeIndex;
            return (
              <div key={st.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      isCompleted
                        ? 'bg-forest-green text-white border-dark-neutral'
                        : isCurrent
                        ? 'bg-forest-green text-white border-dark-neutral ring-4 ring-forest-green/30 animate-pulse'
                        : 'bg-white text-dark-neutral-muted border-dark-neutral/30'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[9px] uppercase font-black tracking-tight mt-1 truncate max-w-[70px] text-center ${
                      isCurrent ? 'text-forest-green' : 'text-dark-neutral-muted'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>

                {idx < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1.5 transition-colors ${
                      idx < safeIndex ? 'bg-forest-green' : 'bg-dark-neutral/20'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2b. Focused 4-Step Intake Operational Progression Bar */}
      <div className="bg-sand/60 border-2 border-dark-neutral p-3.5 rounded-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-forest-green" />
            <span>Operational Intake Sequence (4 Core Stations)</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-dark-neutral-muted">
            Step {(() => {
              if (['CALLED', 'ARRIVED', 'VERIFICATION'].includes(currentState)) return '1 of 4: Verification';
              if (['QUALITY_CHECK'].includes(currentState)) return '2 of 4: Quality Assay';
              if (['WEIGHING'].includes(currentState)) return '3 of 4: Weighbridge';
              return '4 of 4: Procurement Confirmation';
            })()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { step: 1, label: '1. Verification', icon: ShieldCheck, active: ['CALLED', 'ARRIVED', 'VERIFICATION'].includes(currentState), done: safeIndex > 4 },
            { step: 2, label: '2. Quality Assay', icon: FileCheck, active: currentState === 'QUALITY_CHECK', done: safeIndex > 5 },
            { step: 3, label: '3. Weighbridge', icon: Scale, active: currentState === 'WEIGHING', done: safeIndex > 6 },
            { step: 4, label: '4. Confirmation & Pay', icon: CheckCircle2, active: ['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(currentState), done: safeIndex >= 9 }
          ].map((s) => {
            return (
              <div
                key={s.step}
                className={`flex items-center gap-2 p-2 rounded-xs border-2 text-xs font-heading font-black transition-all ${
                  s.active
                    ? 'bg-forest-green text-white border-dark-neutral shadow-[2px_2px_0px_#22252A] -translate-y-0.5'
                    : s.done
                    ? 'bg-emerald-100 text-emerald-900 border-dark-neutral/60 shadow-[1px_1px_0px_#22252A]'
                    : 'bg-white/80 text-dark-neutral-muted border-dark-neutral/20 opacity-75'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  s.active ? 'bg-wheat-accent text-dark-neutral' : s.done ? 'bg-emerald-700 text-white' : 'bg-sand text-dark-neutral-muted'
                }`}>
                  {s.done ? '✓' : s.step}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Stage Action Panel: In-Place Interactive Steps */}
      <div className="border-2 border-dark-neutral p-5 rounded-xs bg-white shadow-brutal-sm">
        {/* STAGE: BOOKED */}
        {currentState === 'BOOKED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-400 rounded-xs text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>{t('staff.farmer_booked_title', 'Farmer Booking Confirmed')}</strong>
                <p className="mt-0.5">
                  {t('staff.farmer_booked_desc', 'Farmer has an active booking. Check in farmer when they arrive at the centre premises to place them into the active yard queue.')}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onAdvanceState(entryId, 'WAITING')}
              disabled={isProcessing}
              className="font-black text-sm bg-forest-green hover:bg-forest-green-dark"
            >
              {t('staff.checkin_farmer', 'CHECK IN FARMER TO QUEUE (WAITING)')}
            </Button>
          </div>
        )}

        {/* STAGE: WAITING */}
        {currentState === 'WAITING' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-400 rounded-xs text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>{t('staff.farmer_waiting_title', 'Farmer Waiting in Yard')}</strong>
                <p className="mt-0.5">
                  {t('staff.farmer_waiting_desc', 'Farmer token is active in the yard queue. Call farmer to Station 1 for identity & document verification.')}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onAdvanceState(entryId, 'CALLED')}
              disabled={isProcessing}
              className="font-black text-sm bg-forest-green hover:bg-forest-green-dark"
            >
              {t('staff.call_farmer', 'CALL FARMER TO STATION (CALLED)')}
            </Button>
          </div>
        )}

        {/* STAGE: CALLED */}
        {currentState === 'CALLED' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-400 rounded-xs text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong>{t('staff.farmer_called_title', 'Farmer Called to Station')}</strong>
                <p className="mt-0.5">
                  {t('staff.farmer_called_desc', 'Token has been broadcasted via audio and mobile push. Confirm farmer physical arrival at your station counter.')}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onAdvanceState(entryId, 'ARRIVED')}
              disabled={isProcessing}
              className="font-black text-sm bg-forest-green hover:bg-forest-green-dark"
            >
              {t('staff.mark_arrived', 'CONFIRM FARMER ARRIVAL (ARRIVED)')}
            </Button>
          </div>
        )}

        {/* STAGE: ARRIVED / VERIFICATION */}
        {(currentState === 'ARRIVED' || currentState === 'VERIFICATION') && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-dark-neutral flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-forest-green" />
              {t('staff.verification_title', 'Farmer & Token Verification')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
                <span className="text-dark-neutral-muted block font-bold">Farmer Name:</span>
                <span className="font-black text-sm text-dark-neutral">{activeEntry.farmer?.fullName || 'Ramesh Patel'}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
                <span className="text-dark-neutral-muted block font-bold">Token Number:</span>
                <span className="font-mono font-black text-sm text-forest-green">{activeEntry.tokenNumber}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
                <span className="text-dark-neutral-muted block font-bold">Declared Commodity:</span>
                <span className="font-black text-dark-neutral">{cropType}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
                <span className="text-dark-neutral-muted block font-bold">Estimated Quantity:</span>
                <span className="font-black text-dark-neutral">{activeEntry.quantityQuintals || 42} Quintals</span>
              </div>
            </div>

            {/* Operational Verification Checklist */}
            <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-dark-neutral block">
                Verification Checklist (Mandatory Inspection)
              </span>
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.identityVerified}
                    onChange={(e) => setChecklist({ ...checklist, identityVerified: e.target.checked })}
                    className="w-4 h-4 text-forest-green rounded border-dark-neutral focus:ring-forest-green"
                  />
                  <span>Farmer photo ID matched against Kisan Credit Card / Aadhaar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.cropMatched}
                    onChange={(e) => setChecklist({ ...checklist, cropMatched: e.target.checked })}
                    className="w-4 h-4 text-forest-green rounded border-dark-neutral focus:ring-forest-green"
                  />
                  <span>Produce lot inspection matches registered commodity ({cropType})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.quotaVerified}
                    onChange={(e) => setChecklist({ ...checklist, quotaVerified: e.target.checked })}
                    className="w-4 h-4 text-forest-green rounded border-dark-neutral focus:ring-forest-green"
                  />
                  <span>Land revenue record quota verified within Mandi ceiling limits</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.gateSlipIssued}
                    onChange={(e) => setChecklist({ ...checklist, gateSlipIssued: e.target.checked })}
                    className="w-4 h-4 text-forest-green rounded border-dark-neutral focus:ring-forest-green"
                  />
                  <span>Physical gate entry slip validated and initial vehicle tare scheduled</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onAdvanceState(entryId, 'QUALITY_CHECK', { verifiedQuantityQuintals: verifiedQty })}
                disabled={isProcessing || !checklist.identityVerified || !checklist.cropMatched || !checklist.quotaVerified || !checklist.gateSlipIssued}
                className="font-black text-sm bg-forest-green hover:bg-forest-green-dark disabled:opacity-50"
              >
                {t('staff.verify_and_proceed_qc', 'VERIFY DETAILS & PROCEED TO QUALITY CHECK')}
              </Button>
            </div>
          </div>
        )}

        {/* STAGE: QUALITY CHECK */}
        {currentState === 'QUALITY_CHECK' && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-dark-neutral flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-forest-green" />
              {t('staff.quality_check_title', 'Produce Quality Assaying (Moisture & Grade)')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-dark-neutral uppercase mb-1">
                  {t('staff.moisture_percentage', 'Moisture Percentage (%)')}:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={moisture}
                    onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                    className="w-full text-base font-mono font-black p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                  />
                  <span className="font-black text-dark-neutral">%</span>
                </div>
                <p className={`text-[10px] font-bold mt-1 ${isMoistureAcceptable ? 'text-forest-green' : 'text-danger-red'}`}>
                  {isMoistureAcceptable ? '✓ Tolerance ≤ 14.0%' : '⚠ Exceeds standard (≤ 14.0%)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-dark-neutral uppercase mb-1">
                  Foreign Impurities (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={impurity}
                    onChange={(e) => setImpurity(parseFloat(e.target.value) || 0)}
                    className="w-full text-base font-mono font-black p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                  />
                  <span className="font-black text-dark-neutral">%</span>
                </div>
                <p className={`text-[10px] font-bold mt-1 ${isImpurityAcceptable ? 'text-forest-green' : 'text-danger-red'}`}>
                  {isImpurityAcceptable ? '✓ Refraction ≤ 2.0%' : '⚠ Exceeds limit (≤ 2.0%)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-black text-dark-neutral uppercase mb-1">
                  {t('staff.quality_grade', 'Quality Grade')}:
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full text-sm font-black p-2.5 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                >
                  <option value="Grade A">Grade A (Standard Food Grain)</option>
                  <option value="Grade B">Grade B (Fair Average Quality)</option>
                  <option value="Rejected">Rejected (Sub-Standard / Out of Spec)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Assay Decision Banner */}
            <div className={`p-3 rounded-xs border-2 flex items-center justify-between gap-3 ${
              assayDecision === 'PASS'
                ? 'bg-emerald-50 border-forest-green text-forest-green'
                : assayDecision === 'CONDITIONAL'
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-red-50 border-red-500 text-red-950'
            }`}>
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider block">
                  Assay Result: {assayDecision === 'PASS' ? 'ACCEPTED (PASS)' : assayDecision === 'CONDITIONAL' ? 'ACCEPTED WITH CONDITIONS' : 'REJECTED (REQUIRES DRYING)'}
                </span>
                <span className="text-[11px] font-medium text-dark-neutral-muted">
                  {assayDecision === 'PASS'
                    ? 'Produce conforms fully to Food Corporation of India (FCI) Fair Average Quality standards.'
                    : assayDecision === 'CONDITIONAL'
                    ? 'Permissible moisture/foreign matter requires fan drying or standard rate refraction.'
                    : 'Moisture exceeds statutory threshold. Grains must undergo yard aeration prior to intake.'}
                </span>
              </div>
              <Badge variant={assayDecision === 'PASS' ? 'success' : assayDecision === 'CONDITIONAL' ? 'warning' : 'danger'} size="md">
                {assayDecision}
              </Badge>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onAdvanceState(entryId, 'WEIGHING', { moisturePercentage: moisture, qualityGrade, impurityPercentage: impurity })}
                disabled={isProcessing || assayDecision === 'REJECT'}
                className="font-black text-sm bg-forest-green hover:bg-forest-green-dark disabled:opacity-50"
              >
                {t('staff.record_quality_proceed_weigh', 'RECORD QUALITY ASSAY & PROCEED TO WEIGHING')}
              </Button>
            </div>
          </div>
        )}

        {/* STAGE: WEIGHING */}
        {currentState === 'WEIGHING' && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-dark-neutral flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-700" />
              {t('staff.certified_weighing_title', 'Certified Electronic Weighbridge')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral">
                <label className="block text-[10px] font-black uppercase text-dark-neutral-muted">Gross Weight (Qtl):</label>
                <input
                  type="number"
                  step="0.1"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-black font-mono mt-1 bg-white border border-dark-neutral p-1 rounded-xs"
                />
              </div>

              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral">
                <label className="block text-[10px] font-black uppercase text-dark-neutral-muted">Tare Weight (Qtl):</label>
                <input
                  type="number"
                  step="0.1"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-black font-mono mt-1 bg-white border border-dark-neutral p-1 rounded-xs"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xs border-2 border-purple-600 flex flex-col justify-between">
                <div>
                  <label className="block text-[10px] font-black uppercase text-purple-800">Net Weight (Authoritative):</label>
                  <div className="text-2xl font-black font-mono text-purple-900 mt-1">
                    {netWeight} Qtl
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-purple-300 text-[10px] font-mono text-purple-900 space-y-0.5">
                  <div>MSP Rate: <strong>₹{mspRate} / Qtl</strong></div>
                  <div>Est. Total: <strong className="text-forest-green font-black">₹{grossAmount.toLocaleString('en-IN')}</strong></div>
                </div>
              </div>
            </div>

            {/* Certified Formula & Mathematical Verification */}
            <div className="p-3 bg-purple-50/70 border border-purple-300 rounded-xs text-xs space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-purple-900 block">
                  ⚖️ Statutory Formula: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-300">Net Weight = Gross - Tare</code>
                </span>
                <span className="font-mono text-[11px] font-black bg-purple-200/80 text-purple-950 px-2 py-0.5 rounded">
                  Rate: ₹{mspRate}/Qtl • Total: ₹{grossAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-purple-800 text-[11px]">
                Gross: <strong className="font-mono">{grossWeight || 0} Qtl</strong> ({(Number(grossWeight || 0) * 100).toFixed(0)} kg) — Tare: <strong className="font-mono">{tareWeight || 0} Qtl</strong> ({(Number(tareWeight || 0) * 100).toFixed(0)} kg) = Net: <strong className="font-mono text-forest-green">{netWeight > 0 ? netWeight : 0} Qtl</strong>
              </p>
            </div>

            {/* Validation warning if tare >= gross */}
            {tareWeight >= grossWeight && (
              <div className="p-2.5 bg-red-100 border-2 border-red-600 rounded-xs text-xs text-red-900 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Invalid weighbridge reading: Tare weight ({tareWeight} Qtl) cannot equal or exceed gross weight ({grossWeight} Qtl).</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onAdvanceState(entryId, 'PROCUREMENT_CONFIRMED', {
                  grossWeightQuintals: grossWeight,
                  tareWeightQuintals: tareWeight,
                  netWeightQuintals: netWeight
                })}
                disabled={isProcessing || tareWeight >= grossWeight || netWeight <= 0}
                className="font-black text-sm bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-50"
              >
                {t('staff.confirm_certified_weighing', 'CONFIRM CERTIFIED WEIGHT & PROCEED TO SETTLEMENT')}
              </Button>
            </div>
          </div>
        )}

        {/* STAGE: PROCUREMENT_CONFIRMED */}
        {currentState === 'PROCUREMENT_CONFIRMED' && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-dark-neutral flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-forest-green" />
              {t('staff.procurement_confirmation_title', 'Procurement Confirmation & Settlement')}
            </h3>

            {/* Server-verified MSP rate banner */}
            <div className="p-3 bg-forest-green-light/40 border border-forest-green rounded-xs flex items-center justify-between text-xs">
              <span className="font-bold text-dark-neutral">
                {t('staff.server_verified_rate', 'SERVER-VERIFIED PROCUREMENT RATE')}:
              </span>
              <span className="font-mono font-black text-forest-green text-sm">
                ₹{mspRate.toLocaleString('en-IN')} / Quintal
              </span>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-dark-neutral/20 rounded-xs overflow-hidden text-xs divide-y divide-dark-neutral/10">
              <div className="p-2.5 flex justify-between bg-warm-ivory font-medium">
                <span>Certified Net Weight:</span>
                <span className="font-mono font-bold">{netWeight} Qtl</span>
              </div>
              <div className="p-2.5 flex justify-between font-medium">
                <span>Applicable MSP Rate:</span>
                <span className="font-mono font-bold">₹{mspRate} / Qtl</span>
              </div>
              <div className="p-2.5 flex justify-between bg-warm-ivory font-medium">
                <span>Gross Produce Value:</span>
                <span className="font-mono font-bold">₹{grossAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 flex justify-between font-medium text-dark-neutral-muted">
                <span>Authorized Deductions:</span>
                <span className="font-mono font-bold">₹{deductions}</span>
              </div>
              <div className="p-3 flex justify-between bg-forest-green-light font-black text-forest-green text-sm">
                <span>Net Payable to Farmer:</span>
                <span className="font-mono">₹{netPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onAdvanceState(entryId, 'PAYMENT_PROCESSING', {
                  netWeightQuintals: netWeight,
                  deductions
                })}
                disabled={isProcessing}
                className="font-black text-sm bg-forest-green hover:bg-forest-green-dark"
              >
                {t('staff.issue_digital_receipt', 'ISSUE DIGITAL RECEIPT & SUBMIT FOR PAYMENT')}
              </Button>
            </div>
          </div>
        )}

        {/* STAGE: PAYMENT_PROCESSING / PAYMENT_COMPLETED / COMPLETED */}
        {['PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(currentState) && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                  ✓ {t('staff.transaction_completed', 'PROCUREMENT TRANSACTION RECORDED')}
                </span>
                <Badge variant="warning" size="sm">
                  {t('staff.demo_payment_tracking', 'Demo Payment Status — Visual Tracking Only')}
                </Badge>
              </div>

              <p className="text-xs text-emerald-800">
                {t('staff.receipt_serial_prefix', 'Receipt Serial Number:')} <strong className="font-mono text-dark-neutral">
                  {activeEntry?.procurementId?.receiptNumber || activeEntry?.receiptNumber || (activeEntry?.tokenNumber === 'GOM01-109' ? 'REC-LKO01-20260906-819' : `REC-LKO-GOM01-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(activeEntry?.tokenNumber || '101').replace(/\D/g, '') || '842'}`)}
                </strong>
              </p>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewReceipt && onViewReceipt(activeEntry)}
                  className="text-xs font-bold bg-white"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  {t('staff.view_receipt', 'View Digital Receipt')}
                </Button>

                {currentState === 'PAYMENT_PROCESSING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onAdvanceState(entryId, 'PAYMENT_COMPLETED')}
                    disabled={isProcessing}
                    className="text-xs font-black bg-forest-green hover:bg-forest-green-dark"
                  >
                    {t('staff.mark_payment_completed', 'MARK PAYMENT SETTLED')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementWorkspace;
