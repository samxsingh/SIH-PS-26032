import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, CheckCircle2, Clock, ArrowRight, AlertCircle, IndianRupee, ShieldCheck } from 'lucide-react';
import Alert from '../common/Alert';
import Badge from '../common/Badge';

export const PaymentCommandView = ({ paymentPipeline = {} }) => {
  const { t } = useTranslation();

  const confirmed = paymentPipeline.confirmed || { count: 14, amount: 1452975 };
  const processing = paymentPipeline.processing || { count: 4, amount: 349600 };
  const completed = paymentPipeline.completed || { count: 7, amount: 796250 };

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-4 mb-6 animate-fade-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.payment_command_title', 'District Payment Progression Pipeline')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.payment_command_subtitle', 'End-to-end direct DBT farmer disbursement reconciliation')}
          </p>
        </div>

        <Badge variant="warning" icon={AlertCircle} className="text-[11px] font-bold">
          Demo Payment Status — Visual Tracking Only
        </Badge>
      </div>

      <div className="bg-blue-50 border-2 border-blue-300 rounded-xs p-3 mb-4 text-xs text-blue-950 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-black">Notice: </strong>
          <span>{paymentPipeline.demoNotice || 'Demo Payment Status — Visual Tracking Only. No live banking DBT/PFMS connection is executed in this pilot demo.'}</span>
        </div>
      </div>

      {/* 3-Step Payment Funnel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Procurement Confirmed */}
        <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">Stage #1</span>
            <Badge variant="neutral">Verified Produce</Badge>
          </div>
          <h4 className="font-heading font-black text-xs uppercase text-dark-neutral">
            Procurement Confirmed
          </h4>
          <div className="mt-2">
            <h5 className="text-xl font-black text-dark-neutral font-mono">
              ₹{(confirmed.amount || 0).toLocaleString('en-IN')}
            </h5>
            <span className="text-xs font-bold text-dark-neutral-muted block mt-0.5">
              {confirmed.count || 0} Batches Confirmed
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-dark-neutral/15 text-[11px] text-dark-neutral-muted flex items-center justify-between">
            <span>Stage SLA:</span>
            <strong className="text-dark-neutral">&lt;2 Hours</strong>
          </div>
        </div>

        {/* Step 2: Payment Processing */}
        <div className="p-4 bg-teal-50 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-teal-900 block">Stage #2</span>
            <span className="text-[10px] font-black text-teal-800 bg-teal-200 px-2 py-0.5 rounded-xs border border-teal-500">
              PFMS In Progress
            </span>
          </div>
          <h4 className="font-heading font-black text-xs uppercase text-teal-950">
            Payment Processing
          </h4>
          <div className="mt-2">
            <h5 className="text-xl font-black text-teal-900 font-mono">
              ₹{(processing.amount || 0).toLocaleString('en-IN')}
            </h5>
            <span className="text-xs font-bold text-teal-800 block mt-0.5">
              {processing.count || 0} Transfers Queued
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-teal-300 text-[11px] text-teal-800 flex items-center justify-between">
            <span>Pending Value:</span>
            <strong className="text-teal-950 font-black">₹{(processing.amount || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Step 3: Payment Completed */}
        <div className="p-4 bg-emerald-50 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase text-emerald-900 block">Stage #3</span>
            <span className="text-[10px] font-black text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-xs border border-emerald-600">
              Disbursed
            </span>
          </div>
          <h4 className="font-heading font-black text-xs uppercase text-emerald-950">
            Payment Completed (DBT)
          </h4>
          <div className="mt-2">
            <h5 className="text-xl font-black text-forest-green font-mono">
              ₹{(completed.amount || 0).toLocaleString('en-IN')}
            </h5>
            <span className="text-xs font-bold text-emerald-800 block mt-0.5">
              {completed.count || 0} Farmers Paid
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-300 text-[11px] text-emerald-900 flex items-center justify-between">
            <span>Settled Value:</span>
            <strong className="text-forest-green font-black">₹{(completed.amount || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCommandView;
