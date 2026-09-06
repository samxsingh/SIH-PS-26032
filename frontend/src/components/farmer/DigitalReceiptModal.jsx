import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Printer, CheckCircle2, ShieldCheck, Sprout, FileText, Building2 } from 'lucide-react';
import { getLocalizedStage, getLocalizedCrop } from '../../utils/formatters';

export const DigitalReceiptModal = ({ isOpen, onClose, receipt: propReceipt, booking, procurement, paymentStatus }) => {
  const { t } = useTranslation();

  const receipt = propReceipt || (procurement ? {
    receiptSerialNumber: procurement.receiptNumber || `REC-LKO01-20260906-${String(booking?.tokenNumber || '101').replace(/\D/g, '') || '819'}`,
    farmerName: booking?.farmerName || booking?.farmerId?.fullName || 'Ramesh Patel',
    farmerPhone: booking?.farmerPhone || booking?.farmerId?.phone || '9876543210',
    centreName: procurement.centreName || booking?.centre?.name || booking?.centreId?.name || 'Krishi Seva Procurement Centre — Gomti Nagar',
    centreAddress: procurement.centreAddress || booking?.centre?.address || booking?.centreId?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow',
    tokenNumber: booking?.tokenNumber || procurement.tokenNumber || 'GOM01-109',
    cropType: procurement.cropType || booking?.cropType || 'Wheat',
    qualityGrade: procurement.qualityGrade || 'Grade A',
    moisturePercentage: procurement.moisturePercentage || 12.3,
    impurityPercentage: procurement.impurityPercentage || 0.4,
    grossWeightQuintals: procurement.grossWeightQuintals || (procurement.netWeightQuintals ? Number((procurement.netWeightQuintals + 1.5).toFixed(1)) : 45.5),
    tareWeightQuintals: procurement.tareWeightQuintals || 1.5,
    netWeightQuintals: procurement.netWeightQuintals || booking?.quantityQuintals || 44.0,
    procurementRatePerQuintal: procurement.procurementRatePerQuintal || 2275,
    grossAmount: procurement.grossAmount || 100100,
    deductions: procurement.deductions || 0,
    netPayableAmount: procurement.netPayableAmount || 100100,
    paymentStatus: paymentStatus?.status || procurement.paymentStatus || 'PAID',
    paymentReference: paymentStatus?.dbtReference || paymentStatus?.demoReferenceNumber || procurement.paymentReference || 'DBT-LKO-2026-0906-819',
    completedAt: procurement.updatedAt || Date.now()
  } : null);

  if (!receipt) return null;

  const grossWeight = receipt.grossWeightQuintals || (receipt.netWeightQuintals ? Number((receipt.netWeightQuintals + 1.5).toFixed(1)) : 45.5);
  const tareWeight = receipt.tareWeightQuintals || 1.5;
  const netWeight = receipt.netWeightQuintals || 44.0;
  const paymentRef = receipt.paymentReference || paymentStatus?.dbtReference || paymentStatus?.demoReferenceNumber || 'DBT-LKO-2026-0906-819';
  const payStatus = receipt.paymentStatus || paymentStatus?.status || 'PAID';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('farmer.receipt_title')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            <span>{t('farmer.print_receipt')}</span>
          </Button>
        </>
      }
    >
      {/* Printable Receipt Container */}
      <div id="printable-receipt" className="p-6 bg-white border-3 border-dark-neutral rounded-md shadow-brutal-lg space-y-6 text-dark-neutral font-sans">
        {/* Government Header */}
        <div className="text-center pb-4 border-b-2 border-dark-neutral">
          <div className="w-12 h-12 rounded-sm bg-forest-green border-2 border-dark-neutral text-wheat-accent mx-auto flex items-center justify-center mb-2 shadow-[2px_2px_0px_#22252A]">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-black text-forest-green uppercase tracking-widest block">
            {t('farmer.receipt_gov_header')}
          </span>
          <h2 className="text-xl font-black font-heading text-dark-neutral mt-0.5">
            {t('farmer.receipt_doc_title')}
          </h2>
          <p className="text-xs text-dark-neutral-muted font-bold">{t('farmer.receipt_platform_sub')}</p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <div className="px-3 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-mono font-black shadow-[2px_2px_0px_#22252A]">
              {t('farmer.receipt_serial_prefix')} <span className="text-forest-green">{receipt.receiptSerialNumber || 'REC-LKO01-20260906-819'}</span>
            </div>
            <div className="px-3 py-1 bg-emerald-100 border-2 border-dark-neutral rounded-xs text-xs font-mono font-black text-emerald-900 shadow-[2px_2px_0px_#22252A]">
              {t('common.status', 'STATUS')}: <span className="text-emerald-800">{getLocalizedStage(payStatus, t)}</span>
            </div>
          </div>
        </div>

        {/* Farmer & Centre Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-warm-ivory p-4 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
          <div>
            <span className="text-dark-neutral-muted block font-black uppercase text-[10px] tracking-wider">{t('farmer.farmer_info_box')}</span>
            <h4 className="font-heading font-black text-sm text-dark-neutral">{receipt.farmerName}</h4>
            <p className="text-dark-neutral-muted font-bold">📱 +91 {receipt.farmerPhone}</p>
          </div>

          <div>
            <span className="text-dark-neutral-muted block font-black uppercase text-[10px] tracking-wider">{t('farmer.procurement_centre_label')}</span>
            <h4 className="font-heading font-black text-sm text-dark-neutral">{receipt.centreName}</h4>
            <p className="text-dark-neutral-muted font-medium">{receipt.centreAddress}</p>
          </div>
        </div>

        {/* Token & Slot Info */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-2.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.your_ticket')}</span>
            <span className="font-mono font-black text-forest-green text-lg tracking-wide block mt-0.5">{receipt.tokenNumber}</span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.produce_label')}</span>
            <span className="font-black text-dark-neutral text-sm">{getLocalizedCrop(receipt.cropType, t)}</span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.quality_grade_label')}</span>
            <span className="font-black text-emerald-800 text-sm">{receipt.qualityGrade} ({receipt.moisturePercentage}% {t('common.moisture', 'Moisture')})</span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border-2 border-dark-neutral rounded-xs overflow-hidden text-xs shadow-[2px_2px_0px_#22252A]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-ivory border-b-2 border-dark-neutral font-black text-dark-neutral uppercase text-[10px] tracking-wider">
                <th className="p-3">{t('farmer.desc_col')}</th>
                <th className="p-3 text-right">{t('farmer.qty_rate_col')}</th>
                <th className="p-3 text-right">{t('farmer.amount_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dark-neutral/10 font-medium">
              <tr>
                <td className="p-3">
                  <span className="font-black text-dark-neutral">{t('farmer.gross_weight_desc', 'Gross Weight (Loaded)')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.gross_weight_sub', 'Initial gross weight recorded at weighbridge')}</p>
                </td>
                <td className="p-3 text-right font-black text-dark-neutral">
                  {grossWeight} {t('common.quintals', 'Qtl')}
                </td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
              </tr>
              <tr>
                <td className="p-3">
                  <span className="font-black text-dark-neutral">{t('farmer.tare_weight_desc', 'Tare Weight (Empty)')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.tare_weight_sub', 'Unladen vehicle/packaging tare weight')}</p>
                </td>
                <td className="p-3 text-right font-black text-dark-neutral">
                  {tareWeight} {t('common.quintals', 'Qtl')}
                </td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
              </tr>
              <tr className="bg-warm-ivory/30">
                <td className="p-3">
                  <span className="font-black text-forest-green">{t('farmer.net_weight_procured_desc')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.net_weight_procured_sub')}</p>
                </td>
                <td className="p-3 text-right font-black text-forest-green font-mono text-sm">
                  {netWeight} {t('common.quintals', 'Qtl')}
                </td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
              </tr>
              <tr>
                <td className="p-3">
                  <span className="font-black text-dark-neutral">{t('farmer.gov_msp_rate_desc')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.gov_msp_rate_sub', { crop: getLocalizedCrop(receipt.cropType, t) })}</p>
                </td>
                <td className="p-3 text-right font-black text-dark-neutral">
                  ₹{receipt.procurementRatePerQuintal?.toLocaleString('en-IN')} / {t('common.quintals', 'Qtl')}
                </td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
              </tr>
              <tr className="bg-warm-ivory/50 font-bold">
                <td className="p-3 text-dark-neutral font-black">{t('farmer.gross_amount_desc')}</td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
                <td className="p-3 text-right text-dark-neutral font-black text-sm">
                  ₹{receipt.grossAmount?.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td className="p-3 text-dark-neutral-muted font-bold">{t('farmer.deductions_desc')}</td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
                <td className="p-3 text-right text-emerald-700 font-black">
                  ₹{(receipt.deductions || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-forest-green-light border-t-3 border-dark-neutral font-black text-sm">
                <td className="p-3.5 text-forest-green">{t('farmer.net_payable_amount_label')}</td>
                <td className="p-3.5 text-right text-forest-green text-xs font-bold">{t('farmer.net_payable_sub')}</td>
                <td className="p-3.5 text-right text-forest-green text-base font-mono font-black">
                  ₹{receipt.netPayableAmount?.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DBT Payment Status & Reference Banner */}
        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xs text-xs text-emerald-950 font-bold flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_#22252A]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('farmer.dbt_status_banner', 'Direct Benefit Transfer (DBT) Status:')} <strong className="text-emerald-700">{payStatus}</strong></span>
          </div>
          <div className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-emerald-400">
            {t('farmer.txn_ref_banner', 'Txn Ref:')} <span className="text-dark-neutral font-black">{paymentRef}</span>
          </div>
        </div>

        {/* Footer Verification Notice */}
        <div className="pt-2 text-center text-[10px] font-bold text-dark-neutral-muted border-t-2 border-dark-neutral/20 flex items-center justify-between">
          <span>{t('farmer.receipt_verification_code', { code: receipt.receiptSerialNumber || 'REC-LKO01-20260906-819' })}</span>
          <span>{t('farmer.date_label')}: {new Date(receipt.completedAt || Date.now()).toLocaleDateString('en-IN')}</span>
          <span className="font-black text-forest-green">{t('farmer.digitally_signed_validated')}</span>
        </div>
      </div>
    </Modal>
  );
};

export default DigitalReceiptModal;
