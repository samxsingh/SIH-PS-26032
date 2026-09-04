import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import DigitalReceiptModal from '../../components/farmer/DigitalReceiptModal';
import { CheckCircle2, Clock, MapPin, Navigation, FileText, IndianRupee, ShieldCheck, ArrowRight, Check } from 'lucide-react';

const STAGES = [
  { key: 'SLOT_CONFIRMED', label: '1. Slot Confirmed' },
  { key: 'PRODUCE_RECEIVED', label: '2. Produce Received' },
  { key: 'QUALITY_VERIFIED', label: '3. Quality Verified' },
  { key: 'WEIGHED', label: '4. Produce Weighed' },
  { key: 'PROCUREMENT_COMPLETED', label: '5. Procurement Completed' },
  { key: 'PAYMENT_INITIATED', label: '6. Payment Initiated' },
  { key: 'PAYMENT_PROCESSING', label: '7. Payment Processing' },
  { key: 'PAID', label: '8. Paid (Disbursed)' }
];

export const FarmerProcurementPage = () => {
  const { t } = useTranslation();
  const { bookingId } = useParams();

  const [procurement, setProcurement] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [procRes, payRes] = await Promise.all([
          apiClient.get(`/procurements/${bookingId}`),
          apiClient.get(`/payments/${bookingId}`)
        ]);

        if (procRes.success) setProcurement(procRes.data);
        if (payRes.success) setPaymentStatus(payRes.data);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load procurement transaction details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const currentStageIndex = STAGES.findIndex((s) => s.key === (paymentStatus?.currentStage || 'SLOT_CONFIRMED'));

  const getStageLabel = (key, defaultLabel) => {
    switch (key) {
      case 'SLOT_CONFIRMED': return t('farmer.stage_1');
      case 'PRODUCE_RECEIVED': return t('farmer.stage_2');
      case 'QUALITY_VERIFIED': return t('farmer.stage_3');
      case 'WEIGHED': return t('farmer.stage_4');
      case 'PROCUREMENT_COMPLETED': return t('farmer.stage_5');
      case 'PAYMENT_INITIATED': return t('farmer.stage_6');
      case 'PAYMENT_PROCESSING': return t('farmer.stage_7');
      case 'PAID': return t('farmer.stage_8');
      default: return defaultLabel;
    }
  };

  const getDirectionsUrl = () => {
    const lat = procurement?.centreId?.location?.coordinates?.[1] || 23.2000;
    const lon = procurement?.centreId?.location?.coordinates?.[0] || 77.0800;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  };

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        <PageHeader
          title={t('farmer.procurement_journey_title')}
          subtitle={t('farmer.procurement_journey_subtitle')}
        />

        {isLoading ? (
          <LoadingState message={t('farmer.fetching_procurement_details')} />
        ) : errorMsg ? (
          <Alert type="error">{errorMsg}</Alert>
        ) : (
          <div className="space-y-6">
            {/* Demo Payment Notice Alert */}
            <Alert type="info" title={t('farmer.demo_payment_tracker')}>
              {paymentStatus?.demoNotice || t('farmer.demo_payment_notice')}
              <br />
              <span className="text-[11px] font-bold opacity-90">{t('farmer.demo_reference_prefix')} <strong>{paymentStatus?.demoReferenceNumber || 'PAY-DEMO-20260901-4921'}</strong></span>
            </Alert>

            {/* 8-Stage Visual Timeline Tracker Card */}
            <Card title={t('farmer.timeline_title')} accentBorder shadow="normal">
              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STAGES.map((s, idx) => {
                    const isPassed = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div
                        key={s.key}
                        className={`p-3 rounded-xs border-2 border-dark-neutral transition-all duration-normal ease-tactile text-left flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-forest-green-light text-forest-green ring-2 ring-forest-green shadow-brutal-sm -translate-y-0.5'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-950 shadow-[2px_2px_0px_#22252A]'
                            : 'bg-warm-ivory opacity-60 text-dark-neutral-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-xs border border-dark-neutral ${
                            isCurrent ? 'bg-forest-green text-white' : isPassed ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {t('farmer.stage_num', { num: idx + 1 })}
                          </span>
                          {isPassed && <Check className="w-4 h-4 text-emerald-800 font-black animate-scale-check" />}
                        </div>

                        <span className="text-xs font-black block">{getStageLabel(s.key, s.label)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Financial Settlement & Produce Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settlement Card */}
              <Card title={t('farmer.settlement_summary_title')} shadow="normal">
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] text-center">
                    <span className="text-xs font-black text-forest-green uppercase tracking-wider block">
                      {t('farmer.net_payable_amount_label')}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-forest-green my-1 font-mono">
                      ₹{(procurement?.netPayableAmount || 110337).toLocaleString('en-IN')}
                    </h1>
                    <span className="text-xs font-bold text-dark-neutral-muted">
                      {t('farmer.msp_rate_label', { rate: procurement?.procurementRatePerQuintal || 2275 })}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-dark-neutral/10 text-xs font-medium">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">{t('farmer.procured_net_weight')}</span>
                      <span className="font-black text-dark-neutral">{procurement?.netWeightQuintals || 48.5} Qtl</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">{t('farmer.quality_grade_label')}</span>
                      <span className="font-black text-emerald-800">{procurement?.qualityGrade || 'Grade A'} ({t('farmer.moisture_label', { moisture: procurement?.moisturePercentage || 12.0 })})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">{t('farmer.gross_amount_label')}</span>
                      <span className="font-black text-dark-neutral">₹{(procurement?.grossAmount || 110337).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">{t('farmer.deductions_label')}</span>
                      <span className="font-black text-red-600">- ₹{(procurement?.deductions || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => setShowReceiptModal(true)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-forest-green" />
                    <span>{t('farmer.view_digital_receipt')}</span>
                  </Button>
                </div>
              </Card>

              {/* Centre & Navigation Card */}
              <Card title={t('farmer.directions_title')} shadow="normal">
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-heading font-black text-base text-dark-neutral">{procurement?.centreId?.name || 'Krishi Seva Procurement Centre — Gomti Nagar'}</h4>
                    <p className="text-dark-neutral-muted font-medium mt-0.5 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-green flex-shrink-0 mt-0.5" />
                      <span>{procurement?.centreId?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow'}</span>
                    </p>
                  </div>

                  <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="primary" size="md" fullWidth>
                      <Navigation className="w-4 h-4 mr-2" />
                      <span>{t('farmer.get_directions')}</span>
                    </Button>
                  </a>

                  <Alert type="info">
                    {t('farmer.directions_notice')}
                  </Alert>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Digital Receipt Modal */}
        <DigitalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={{
            receiptSerialNumber: procurement?.receiptSerialNumber || 'REC-LKO01-20260901-819',
            tokenNumber: procurement?.tokenNumber || 'TOK-LKO01-007',
            farmerName: procurement?.farmerId?.fullName || user?.fullName || 'Ramesh Patel',
            farmerPhone: procurement?.farmerId?.phone || user?.phone || '9876543210',
            centreName: procurement?.centreId?.name || 'Krishi Seva Procurement Centre — Gomti Nagar',
            centreAddress: procurement?.centreId?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow',
            cropType: procurement?.cropType || 'Wheat',
            verifiedQuantityQuintals: procurement?.verifiedQuantityQuintals || 48.5,
            netWeightQuintals: procurement?.netWeightQuintals || 48.5,
            moisturePercentage: procurement?.moisturePercentage || 12.0,
            qualityGrade: procurement?.qualityGrade || 'Grade A',
            procurementRatePerQuintal: procurement?.procurementRatePerQuintal || 2275,
            grossAmount: procurement?.grossAmount || 110337,
            deductions: procurement?.deductions || 0,
            netPayableAmount: procurement?.netPayableAmount || 110337,
            completedAt: procurement?.completedAt || new Date()
          }}
        />
      </main>
    </div>
  );
};

export default FarmerProcurementPage;
