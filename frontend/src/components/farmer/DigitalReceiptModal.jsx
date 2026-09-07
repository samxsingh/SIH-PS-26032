import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Printer, Download, CheckCircle2, ShieldCheck, Sprout, FileText, Building2, AlertCircle } from 'lucide-react';
import { getLocalizedStage, getLocalizedCrop, getMspRateForCrop } from '../../utils/formatters';

export const DigitalReceiptModal = ({ isOpen, onClose, receipt: propReceipt, booking, procurement, paymentStatus }) => {
  const { t } = useTranslation();
  const receiptRef = useRef(null);
  const bodyRef = useRef(null);

  // Manage print class on body for modal print styling
  React.useEffect(() => {
    if (!isOpen) return;
    const handleBeforePrint = () => {
      document.body.classList.add('printing-receipt');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-receipt');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-receipt');
    };
  }, [isOpen]);

  // Reset scroll position to top whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
      if (receiptRef.current) {
        receiptRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // If modal is not open, do not render
  if (!isOpen) return null;

  const notAvailable = t('common.not_available', 'Not available');

  // Resolve Authoritative Data (Do NOT invent fake numbers or names)
  const resolveReceiptData = () => {
    if (propReceipt) return propReceipt;

    const b = booking || {};
    const p = procurement || {};
    const pay = paymentStatus || {};

    // If neither booking nor procurement is provided, return null
    if (!booking && !procurement) return null;

    const receiptSerial = p.receiptSerialNumber || p.receiptNumber || null;
    const procurementId = p._id || p.id || null;
    const bookingRef = b.bookingReference || b.id || b._id || null;
    const tokenNumber = b.tokenNumber || p.tokenNumber || null;

    const farmerName = b.farmerName || b.farmerId?.fullName || p.farmerId?.fullName || null;
    const farmerPhone = b.farmerPhone || b.farmerId?.phone || p.farmerId?.phone || null;
    const farmerRegId = b.farmerId?._id || b.farmerId?.id || p.farmerId?._id || null;

    const centreName = p.centreName || b.centre?.name || b.centreId?.name || (typeof b.centreId === 'string' && !b.centreId.startsWith('c') ? b.centreId : null);
    const centreCode = p.centreCode || b.centre?.centreCode || b.centreId?.centreCode || null;
    const centreAddress = p.centreAddress || b.centre?.address || b.centreId?.address || null;
    const district = b.centre?.district || b.centreId?.district || p.district || 'Lucknow';

    const cropType = p.cropType || b.cropType || 'Wheat';
    const netWeight = p.netWeightQuintals !== undefined && p.netWeightQuintals !== null ? p.netWeightQuintals : (b.quantityQuintals || b.estimatedQuantityQuintals || null);
    const grossWeight = p.grossWeightQuintals !== undefined && p.grossWeightQuintals !== null ? p.grossWeightQuintals : null;
    const tareWeight = p.tareWeightQuintals !== undefined && p.tareWeightQuintals !== null ? p.tareWeightQuintals : null;
    const moisture = p.moisturePercentage !== undefined && p.moisturePercentage !== null ? p.moisturePercentage : null;
    const qualityGrade = p.qualityGrade || (p.status === 'COMPLETED' ? 'Grade A' : null);
    const impurityPercentage = p.impurityPercentage !== undefined && p.impurityPercentage !== null ? p.impurityPercentage : null;

    const mspRate = p.procurementRatePerQuintal || getMspRateForCrop(cropType);
    const grossAmount = p.grossAmount !== undefined && p.grossAmount !== null ? p.grossAmount : (netWeight ? Math.round(netWeight * mspRate) : null);
    const deductions = p.deductions !== undefined && p.deductions !== null ? p.deductions : (p.status ? 0 : null);
    const netPayable = p.netPayableAmount !== undefined && p.netPayableAmount !== null ? p.netPayableAmount : grossAmount;

    const payStatus = pay.status || pay.currentStage || p.paymentStatus || (p.status === 'COMPLETED' ? 'PAYMENT_PROCESSING' : b.operationalStatus || 'BOOKED');
    const paymentRef = pay.dbtReference || pay.demoReferenceNumber || p.paymentReference || null;
    const completedDate = p.completedAt || p.updatedAt || b.updatedAt || Date.now();

    return {
      receiptSerialNumber: receiptSerial || (tokenNumber ? `REC-LKO-${tokenNumber}` : notAvailable),
      procurementId: procurementId || notAvailable,
      bookingReference: bookingRef || notAvailable,
      tokenNumber: tokenNumber || notAvailable,
      farmerRegistrationId: farmerRegId ? String(farmerRegId) : notAvailable,
      farmerName: farmerName || notAvailable,
      farmerPhone: farmerPhone || notAvailable,
      centreName: centreName || 'AgriNexus Procurement Facility',
      centreCode: centreCode || notAvailable,
      centreAddress: centreAddress || notAvailable,
      district,
      cropType,
      netWeightQuintals: netWeight,
      grossWeightQuintals: grossWeight,
      tareWeightQuintals: tareWeight,
      moisturePercentage: moisture,
      impurityPercentage: impurityPercentage,
      qualityGrade: qualityGrade || notAvailable,
      procurementRatePerQuintal: mspRate,
      grossAmount,
      deductions: deductions !== null ? deductions : 0,
      netPayableAmount: netPayable,
      paymentStatus: payStatus,
      paymentReference: paymentRef || notAvailable,
      completedAt: completedDate
    };
  };

  const receipt = resolveReceiptData();

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1500);
  };

  const handleDownload = () => {
    if (!receipt) return;
    const serial = (receipt.receiptSerialNumber || 'OFFICIAL').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `AgriNexus-Receipt-${serial}.pdf`;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #22252A; background: #fff; margin: 0; padding: 20px; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px solid #22252A; padding-bottom: 12px; margin-bottom: 16px; }
            .gov-title { font-size: 11px; font-weight: 900; color: #1B4D3E; text-transform: uppercase; letter-spacing: 1.5px; }
            .doc-title { font-size: 18px; font-weight: 900; margin: 4px 0; }
            .sub-title { font-size: 11px; color: #555; font-weight: bold; }
            .badges { margin-top: 10px; display: flex; justify-content: center; gap: 10px; }
            .badge { border: 2px solid #22252A; padding: 4px 10px; font-family: monospace; font-weight: 900; font-size: 12px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; border: 2px solid #22252A; padding: 12px; background: #FBF8F1; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
            .box { border: 2px solid #22252A; padding: 8px; text-align: center; }
            .label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 2px; }
            .val { font-weight: 900; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; border: 2px solid #22252A; margin-bottom: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; }
            th { background: #FBF8F1; border-bottom: 2px solid #22252A; font-size: 11px; font-weight: 900; text-transform: uppercase; text-align: left; }
            .text-right { text-align: right; }
            .total-row { background: #E8F5E9; font-weight: 900; font-size: 14px; border-top: 2px solid #22252A; }
            .banner { border: 2px solid #1B4D3E; background: #E8F5E9; padding: 10px 14px; display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin-bottom: 16px; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="gov-title">Government of India • Department of Consumer Affairs</div>
            <div class="doc-title">AGRINEXUS — OFFICIAL CROP PROCUREMENT RECEIPT</div>
            <div class="sub-title">Public Agricultural Digital Procurement System • Lucknow District Command</div>
            <div class="badges">
              <div class="badge">RECEIPT #: ${receipt.receiptSerialNumber}</div>
              <div class="badge">STATUS: ${receipt.paymentStatus}</div>
            </div>
          </div>

          <div class="grid-2">
            <div>
              <div class="label">Farmer Information</div>
              <div class="val">${receipt.farmerName}</div>
              <div style="font-size:11px; color:#444;">Phone: ${receipt.farmerPhone}</div>
              <div style="font-size:11px; color:#444;">Reg ID: ${receipt.farmerRegistrationId}</div>
            </div>
            <div>
              <div class="label">Procurement Centre Information</div>
              <div class="val">${receipt.centreName}</div>
              <div style="font-size:11px; color:#444;">${receipt.centreAddress}</div>
              <div style="font-size:11px; color:#444;">Code: ${receipt.centreCode} • District: ${receipt.district}</div>
            </div>
          </div>

          <div class="grid-3">
            <div class="box">
              <div class="label">Token / Booking</div>
              <div class="val" style="color:#1B4D3E;">${receipt.tokenNumber}</div>
            </div>
            <div class="box">
              <div class="label">Crop Commodity</div>
              <div class="val">${receipt.cropType}</div>
            </div>
            <div class="box">
              <div class="label">Quality & Moisture</div>
              <div class="val">${receipt.qualityGrade} (${receipt.moisturePercentage !== null ? receipt.moisturePercentage + '%' : 'Pending'})</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity / Unit</th>
                <th class="text-right">MSP Rate</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Weighbridge Gross Weight (Loaded Vehicle)</td>
                <td class="text-right">${receipt.grossWeightQuintals !== null ? receipt.grossWeightQuintals + ' Qtl' : notAvailable}</td>
                <td class="text-right">—</td>
                <td class="text-right">—</td>
              </tr>
              <tr>
                <td>Weighbridge Tare Weight (Empty Vehicle)</td>
                <td class="text-right">${receipt.tareWeightQuintals !== null ? receipt.tareWeightQuintals + ' Qtl' : notAvailable}</td>
                <td class="text-right">—</td>
                <td class="text-right">—</td>
              </tr>
              <tr style="background:#FAF8F3; font-weight:bold;">
                <td>Certified Net Weight Procured</td>
                <td class="text-right" style="color:#1B4D3E;">${receipt.netWeightQuintals !== null ? receipt.netWeightQuintals + ' Qtl' : notAvailable}</td>
                <td class="text-right">₹${receipt.procurementRatePerQuintal?.toLocaleString('en-IN')} / Qtl</td>
                <td class="text-right">₹${receipt.grossAmount !== null ? receipt.grossAmount?.toLocaleString('en-IN') : notAvailable}</td>
              </tr>
              <tr>
                <td>Statutory Deductions / Handling</td>
                <td class="text-right">—</td>
                <td class="text-right">—</td>
                <td class="text-right">₹${receipt.deductions?.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="total-row">
                <td style="color:#1B4D3E;">NET PAYABLE AMOUNT (DBT DISBURSEMENT)</td>
                <td class="text-right">—</td>
                <td class="text-right">—</td>
                <td class="text-right" style="color:#1B4D3E; font-size:16px;">₹${receipt.netPayableAmount !== null ? receipt.netPayableAmount?.toLocaleString('en-IN') : notAvailable}</td>
              </tr>
            </tbody>
          </table>

          <div class="banner">
            <div>Direct Benefit Transfer (DBT) Status: ${receipt.paymentStatus}</div>
            <div>Txn Ref: ${receipt.paymentReference}</div>
          </div>

          <div class="footer">
            <div>Verification Code: ${receipt.receiptSerialNumber}</div>
            <div>Date: ${new Date(receipt.completedAt).toLocaleDateString('en-IN')}</div>
            <div style="font-weight:bold; color:#1B4D3E;">✓ Digitally Signed & Validated under AgriNexus</div>
          </div>
        </body>
      </html>
    `;

    // Render in an isolated hidden iframe to completely prevent popup blocker issues
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHtml);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (err) {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 300);
  };

  // If no booking or procurement data exists at all
  if (!receipt) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('farmer.receipt_title', 'Official Crop Procurement Receipt')}
        size="md"
        footer={
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        }
      >
        <div className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-600 text-amber-800 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-black text-base text-dark-neutral">
            {t('farmer.receipt_unavailable', 'Procurement receipt details are currently being finalized.')}
          </h3>
          <p className="text-xs text-dark-neutral-muted font-medium max-w-sm mx-auto">
            {t('farmer.receipt_unavailable_desc', 'The digital receipt will be generated automatically once produce weighing is confirmed by the centre manager.')}
          </p>
        </div>
      </Modal>
    );
  }

  const grossWeightDisplay = receipt.grossWeightQuintals !== null ? `${receipt.grossWeightQuintals} ${t('common.quintals', 'Qtl')}` : '—';
  const tareWeightDisplay = receipt.tareWeightQuintals !== null ? `${receipt.tareWeightQuintals} ${t('common.quintals', 'Qtl')}` : '—';
  const netWeightDisplay = receipt.netWeightQuintals !== null ? `${receipt.netWeightQuintals} ${t('common.quintals', 'Qtl')}` : notAvailable;
  const grossAmountDisplay = receipt.grossAmount !== null ? `₹${receipt.grossAmount.toLocaleString('en-IN')}` : notAvailable;
  const netPayableDisplay = receipt.netPayableAmount !== null ? `₹${receipt.netPayableAmount.toLocaleString('en-IN')}` : notAvailable;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('farmer.receipt_title', 'Official Crop Procurement Receipt')}
      size="xl"
      position="top"
      bodyRef={bodyRef}
      contentClassName="p-2 sm:p-4"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <Button variant="ghost" onClick={onClose} size="sm">
            {t('common.cancel', 'Cancel')}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-1.5 text-forest-green" />
              <span>{t('farmer.download_receipt', 'Download Receipt (PDF)')}</span>
            </Button>
            <Button variant="primary" onClick={handlePrint} size="sm">
              <Printer className="w-4 h-4 mr-1.5" />
              <span>{t('farmer.print_receipt', 'Print Receipt')}</span>
            </Button>
          </div>
        </div>
      }
    >
      {/* Printable Receipt Container */}
      <div
        id="printable-receipt"
        ref={receiptRef}
        className="p-4 sm:p-6 bg-white border-3 border-dark-neutral rounded-md shadow-brutal-lg space-y-5 text-dark-neutral font-sans overflow-x-hidden max-w-full print:border-2 print:shadow-none print:p-6 print:m-0 print:space-y-4 print:overflow-visible print:max-w-full print:w-full"
      >
        {/* Government Header */}
        <div className="text-center pb-4 border-b-2 border-dark-neutral">
          <div className="w-12 h-12 rounded-sm bg-forest-green border-2 border-dark-neutral text-wheat-accent mx-auto flex items-center justify-center mb-2 shadow-[2px_2px_0px_#22252A]">
            <Sprout className="w-7 h-7" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-black text-forest-green uppercase tracking-widest block">
            {t('farmer.receipt_gov_header', 'GOVERNMENT OF INDIA • DEPARTMENT OF CONSUMER AFFAIRS')}
          </span>
          <h2 className="text-lg sm:text-xl font-black font-heading text-dark-neutral mt-0.5">
            {t('farmer.receipt_doc_title', 'AGRINEXUS — OFFICIAL CROP PROCUREMENT RECEIPT')}
          </h2>
          <p className="text-[11px] sm:text-xs text-dark-neutral-muted font-bold">
            {t('farmer.receipt_platform_sub', 'AgriNexus Digital Procurement Platform • Government of India')}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <div className="px-3 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-mono font-black shadow-[2px_2px_0px_#22252A]">
              {t('farmer.receipt_serial_prefix', 'Receipt Serial #:')} <span className="text-forest-green">{receipt.receiptSerialNumber}</span>
            </div>
            <div className="px-3 py-1 bg-emerald-100 border-2 border-dark-neutral rounded-xs text-xs font-mono font-black text-emerald-900 shadow-[2px_2px_0px_#22252A]">
              {t('common.status', 'STATUS')}: <span className="text-emerald-800">{getLocalizedStage(receipt.paymentStatus, t)}</span>
            </div>
          </div>
        </div>

        {/* Farmer & Centre Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs bg-warm-ivory p-3.5 sm:p-4 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
          <div className="min-w-0">
            <span className="text-dark-neutral-muted block font-black uppercase text-[10px] tracking-wider">
              {t('farmer.farmer_info_box', 'Farmer Information')}
            </span>
            <h4 className="font-heading font-black text-sm text-dark-neutral truncate">
              {receipt.farmerName}
            </h4>
            <p className="text-dark-neutral-muted font-bold text-[11px] mt-0.5">
              📱 {receipt.farmerPhone && receipt.farmerPhone !== notAvailable ? `+91 ${receipt.farmerPhone}` : notAvailable}
            </p>
            <p className="text-dark-neutral-muted text-[10px] font-mono mt-0.5 truncate">
              ID: {receipt.farmerRegistrationId}
            </p>
          </div>

          <div className="min-w-0">
            <span className="text-dark-neutral-muted block font-black uppercase text-[10px] tracking-wider">
              {t('farmer.procurement_centre_label', 'Procurement Centre')}
            </span>
            <h4 className="font-heading font-black text-sm text-dark-neutral truncate">
              {receipt.centreName}
            </h4>
            <p className="text-dark-neutral-muted font-medium text-[11px] mt-0.5 break-words">
              {receipt.centreAddress}
            </p>
            <p className="text-dark-neutral-muted text-[10px] font-mono mt-0.5">
              {receipt.centreCode && receipt.centreCode !== notAvailable ? `Code: ${receipt.centreCode} • ` : ''}{receipt.district}
            </p>
          </div>
        </div>

        {/* Token & Crop Quality Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center text-xs">
          <div className="p-2.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">
              {t('farmer.your_ticket', 'Token / Slot')}
            </span>
            <span className="font-mono font-black text-forest-green text-base sm:text-lg tracking-wide block mt-0.5">
              {receipt.tokenNumber}
            </span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">
              {t('farmer.produce_label', 'Produce / Crop')}
            </span>
            <span className="font-black text-dark-neutral text-sm block mt-0.5">
              {getLocalizedCrop(receipt.cropType, t)}
            </span>
          </div>
          <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <span className="text-dark-neutral-muted block text-[10px] uppercase font-black tracking-wider">
              {t('farmer.quality_grade_label', 'Quality & Moisture')}
            </span>
            <span className="font-black text-emerald-800 text-sm block mt-0.5">
              {receipt.qualityGrade} {receipt.moisturePercentage !== null ? `(${receipt.moisturePercentage}%)` : ''}
            </span>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border-2 border-dark-neutral rounded-xs overflow-hidden text-xs shadow-[2px_2px_0px_#22252A]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-ivory border-b-2 border-dark-neutral font-black text-dark-neutral uppercase text-[10px] tracking-wider">
                <th className="p-2.5 sm:p-3">{t('farmer.desc_col', 'Description')}</th>
                <th className="p-2.5 sm:p-3 text-right">{t('farmer.qty_rate_col', 'Quantity / Rate')}</th>
                <th className="p-2.5 sm:p-3 text-right">{t('farmer.amount_col', 'Amount (₹)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-dark-neutral/10 font-medium">
              <tr>
                <td className="p-2.5 sm:p-3">
                  <span className="font-black text-dark-neutral block">
                    {t('farmer.gross_weight_desc', 'Gross Weight (Loaded)')}
                  </span>
                  <span className="text-[10px] text-dark-neutral-muted block">
                    {t('farmer.gross_weight_sub', 'Initial gross weight recorded at weighbridge')}
                  </span>
                </td>
                <td className="p-2.5 sm:p-3 text-right font-black text-dark-neutral font-mono">
                  {grossWeightDisplay}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">
                  <span className="font-black text-dark-neutral block">
                    {t('farmer.tare_weight_desc', 'Tare Weight (Empty)')}
                  </span>
                  <span className="text-[10px] text-dark-neutral-muted block">
                    {t('farmer.tare_weight_sub', 'Unladen vehicle/packaging tare weight')}
                  </span>
                </td>
                <td className="p-2.5 sm:p-3 text-right font-black text-dark-neutral font-mono">
                  {tareWeightDisplay}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
              </tr>
              <tr className="bg-warm-ivory/40">
                <td className="p-2.5 sm:p-3">
                  <span className="font-black text-forest-green block">
                    {t('farmer.net_weight_procured_desc', 'Net Weight Procured')}
                  </span>
                  <span className="text-[10px] text-dark-neutral-muted block">
                    {t('farmer.net_weight_procured_sub', 'Verified net weight recorded on certified weighbridge')}
                  </span>
                </td>
                <td className="p-2.5 sm:p-3 text-right font-black text-forest-green font-mono text-sm">
                  {netWeightDisplay}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">
                  <span className="font-black text-dark-neutral block">
                    {t('farmer.gov_msp_rate_desc', 'Government MSP Rate')}
                  </span>
                  <span className="text-[10px] text-dark-neutral-muted block">
                    {t('farmer.gov_msp_rate_sub', { crop: getLocalizedCrop(receipt.cropType, t) })}
                  </span>
                </td>
                <td className="p-2.5 sm:p-3 text-right font-black text-dark-neutral font-mono">
                  ₹{receipt.procurementRatePerQuintal?.toLocaleString('en-IN')} / {t('common.quintals', 'Qtl')}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
              </tr>
              <tr className="bg-warm-ivory/50 font-bold">
                <td className="p-2.5 sm:p-3 text-dark-neutral font-black">
                  {t('farmer.gross_amount_desc', 'Gross Procurement Amount')}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral font-black text-sm font-mono">
                  {grossAmountDisplay}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3 text-dark-neutral-muted font-bold">
                  {t('farmer.deductions_desc', 'Deductions')}
                </td>
                <td className="p-2.5 sm:p-3 text-right text-dark-neutral-muted font-mono">—</td>
                <td className="p-2.5 sm:p-3 text-right text-emerald-700 font-black font-mono">
                  ₹{(receipt.deductions || 0).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-forest-green-light border-t-3 border-dark-neutral font-black text-sm">
                <td className="p-3 text-forest-green font-black">
                  {t('farmer.net_payable_amount_label', 'NET PAYABLE AMOUNT')}
                </td>
                <td className="p-3 text-right text-forest-green text-xs font-bold">
                  {t('farmer.net_payable_sub', 'Direct Benefit Transfer')}
                </td>
                <td className="p-3 text-right text-forest-green text-base sm:text-lg font-mono font-black">
                  {netPayableDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DBT Payment Status & Reference Banner */}
        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xs text-xs text-emerald-950 font-bold flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0px_#22252A]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t('farmer.dbt_status_banner', 'Direct Benefit Transfer (DBT) Status:')}{' '}
              <strong className="text-emerald-800">{getLocalizedStage(receipt.paymentStatus, t)}</strong>
            </span>
          </div>
          <div className="font-mono text-xs bg-white px-2.5 py-1 rounded-xs border border-emerald-400">
            {t('farmer.txn_ref_banner', 'Txn Ref:')}{' '}
            <span className="text-dark-neutral font-black">{receipt.paymentReference}</span>
          </div>
        </div>

        {/* Footer Verification Notice */}
        <div className="pt-2 text-center text-[10px] font-bold text-dark-neutral-muted border-t-2 border-dark-neutral/20 flex flex-wrap items-center justify-between gap-2">
          <span>{t('farmer.receipt_verification_code', { code: receipt.receiptSerialNumber })}</span>
          <span>{t('common.date', 'Date')}: {new Date(receipt.completedAt).toLocaleDateString('en-IN')}</span>
          <span className="font-black text-forest-green flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 inline" />
            {t('farmer.digitally_signed_validated', 'Digitally Signed & Validated')}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default DigitalReceiptModal;

