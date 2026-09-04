import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Printer, CheckCircle2, ShieldCheck, Sprout, FileText, Building2 } from 'lucide-react';

export const DigitalReceiptModal = ({ isOpen, onClose, receipt }) => {
  const { t } = useTranslation();
  if (!receipt) return null;

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

          <div className="mt-3 inline-block px-3 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-mono font-black shadow-[2px_2px_0px_#22252A]">
            {t('farmer.receipt_serial_prefix')} <span className="text-forest-green">{receipt.receiptSerialNumber || 'REC-SEH01-20260901-819'}</span>
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
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.your_ticket')}</span>
            <span className="font-mono font-black text-forest-green text-base">{receipt.tokenNumber}</span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.produce_label')}</span>
            <span className="font-black text-dark-neutral text-sm">{receipt.cropType}</span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">{t('farmer.quality_grade_label')}</span>
            <span className="font-black text-emerald-800 text-sm">{receipt.qualityGrade} ({t('farmer.moisture_label', { moisture: receipt.moisturePercentage })})</span>
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
                  <span className="font-black text-dark-neutral">{t('farmer.net_weight_procured_desc')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.net_weight_procured_sub')}</p>
                </td>
                <td className="p-3 text-right font-black text-dark-neutral">
                  {receipt.netWeightQuintals} Qtl
                </td>
                <td className="p-3 text-right text-dark-neutral-muted">—</td>
              </tr>
              <tr>
                <td className="p-3">
                  <span className="font-black text-dark-neutral">{t('farmer.gov_msp_rate_desc')}</span>
                  <p className="text-[11px] text-dark-neutral-muted">{t('farmer.gov_msp_rate_sub', { crop: receipt.cropType })}</p>
                </td>
                <td className="p-3 text-right font-black text-dark-neutral">
                  ₹{receipt.procurementRatePerQuintal?.toLocaleString('en-IN')} / Qtl
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
                <td className="p-3 text-right text-red-600 font-black">
                  - ₹{(receipt.deductions || 0).toLocaleString('en-IN')}
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

        {/* Footer Verification Notice */}
        <div className="pt-2 text-center text-[10px] font-bold text-dark-neutral-muted border-t-2 border-dark-neutral/20 flex items-center justify-between">
          <span>{t('farmer.receipt_verification_code', { code: receipt.receiptSerialNumber })}</span>
          <span>{t('farmer.date_label')}: {new Date(receipt.completedAt || Date.now()).toLocaleDateString('en-IN')}</span>
          <span className="font-black text-forest-green">{t('farmer.digitally_signed_validated')}</span>
        </div>
      </div>
    </Modal>
  );
};

export default DigitalReceiptModal;
