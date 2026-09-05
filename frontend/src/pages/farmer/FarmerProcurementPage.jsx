import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import ProgressLadder from '../../components/common/ProgressLadder';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import DigitalReceiptModal from '../../components/farmer/DigitalReceiptModal';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  FileText,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  SearchX,
  Ticket
} from 'lucide-react';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [procurement, setProcurement] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // null | 'NOT_FOUND' | 'ERROR'
  const [errorMsg, setErrorMsg] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!bookingId) {
      setErrorType('NOT_FOUND');
      setErrorMsg(t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorType(null);
    setErrorMsg(null);

    let isBookingFound = false;
    let foundBooking = null;

    try {
      // Step 1: Attempt to fetch core booking record from backend
      try {
        const bookingRes = await apiClient.get(`/bookings/${bookingId}`);
        if (bookingRes?.success && bookingRes?.data) {
          foundBooking = bookingRes.data;
          isBookingFound = true;
        }
      } catch (err) {
        // If 403, user is forbidden from accessing another farmer's booking
        if (err?.status === 403) {
          setErrorType('NOT_FOUND');
          setErrorMsg(t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.'));
          setIsLoading(false);
          return;
        }

        // Fallback: Check authenticated user's own bookings list
        try {
          const myBookingsRes = await apiClient.get('/bookings/my');
          if (myBookingsRes?.success && Array.isArray(myBookingsRes?.data)) {
            const match = myBookingsRes.data.find(
              (b) => String(b.id) === String(bookingId) || String(b._id) === String(bookingId) || String(b.bookingReference) === String(bookingId)
            );
            if (match) {
              foundBooking = match;
              isBookingFound = true;
            }
          }
        } catch {
          // Ignore fallback error
        }
      }

      // Step 2: Concurrently attempt to fetch completed procurement & payment statuses
      const [procRes, payRes] = await Promise.allSettled([
        apiClient.get(`/procurements/${bookingId}`),
        apiClient.get(`/payments/${bookingId}`)
      ]);

      if (foundBooking) {
        setBooking(foundBooking);
      }

      if (procRes.status === 'fulfilled' && procRes.value?.success) {
        setProcurement(procRes.value.data);
      } else {
        setProcurement(null);
      }

      if (payRes.status === 'fulfilled' && payRes.value?.success) {
        setPaymentStatus(payRes.value.data);
      } else {
        setPaymentStatus(null);
      }

      // If neither booking nor procurement is found, trigger NOT_FOUND state
      if (!isBookingFound && (!procRes.value || !procRes.value.success)) {
        setErrorType('NOT_FOUND');
        setErrorMsg(t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.'));
      }
    } catch (err) {
      setErrorType('ERROR');
      setErrorMsg(err.message || t('farmer.journey_error_desc', 'We encountered a temporary network issue while fetching your procurement journey details. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute operational stage index safely from either payment status, procurement, or booking
  const getStageFromStatus = () => {
    if (paymentStatus?.currentStage) {
      const idx = STAGES.findIndex((s) => s.key === paymentStatus.currentStage);
      if (idx !== -1) return idx;
    }

    if (procurement?.procurementStatus === 'COMPLETED') {
      return 7; // Paid (Disbursed)
    }

    const opStatus = booking?.operationalStatus || '';
    switch (opStatus) {
      case 'BOOKED':
        return 0;
      case 'ARRIVED':
        return 1;
      case 'IN QUEUE':
        return 2;
      case 'QUALITY CHECK':
        return 3;
      case 'WEIGHING':
        return 4;
      case 'PROCUREMENT COMPLETE':
        return 5;
      case 'PAYMENT PROCESSING':
        return 6;
      case 'COMPLETED':
        return 7;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageFromStatus();

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

  // Safe normalized centre details (defaults to standard Lucknow hub if not loaded)
  const centreInfo = procurement?.centreId || booking?.centre || {};
  const centreName = centreInfo.name || 'Krishi Seva Procurement Centre — Gomti Nagar';
  const centreAddress = centreInfo.address || 'Vibhuti Khand, Gomti Nagar, Lucknow';
  const centreLocation = centreInfo.location?.coordinates || [80.9462, 26.8467];
  const lat = centreLocation[1] || 26.8467;
  const lon = centreLocation[0] || 80.9462;

  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  };

  // Safe produce & pricing numbers
  const cropType = procurement?.cropType || booking?.cropType || 'Wheat';
  const quantity = Number(
    procurement?.netWeightQuintals ||
    procurement?.verifiedQuantityQuintals ||
    booking?.quantityQuintals ||
    booking?.estimatedQuantityQuintals ||
    50
  );
  const mspRate = Number(
    procurement?.procurementRatePerQuintal || (cropType === 'Wheat' ? 2275 : 2183)
  );
  const grossAmount = Number(procurement?.grossAmount || (quantity * mspRate));
  const deductions = Number(procurement?.deductions || 0);
  const netPayable = Number(procurement?.netPayableAmount || (grossAmount - deductions));

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        {/* Top Back Navigation Bar */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/farmer/bookings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-forest-green-light border-2 border-dark-neutral rounded-xs text-xs font-black uppercase text-dark-neutral transition-all shadow-[2px_2px_0px_#22252A] hover:shadow-[3px_3px_0px_#22252A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-forest-green" />
            <span>{t('farmer.back_to_bookings', 'Back to Bookings')}</span>
          </button>
        </div>

        <PageHeader
          title={t('farmer.procurement_journey_title', 'Procurement Journey & Payment Status')}
          subtitle={t('farmer.procurement_journey_subtitle', 'Track your crop verification, net weight settlement, and payment status progression')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-forest-green-light text-forest-green border border-forest-green rounded-xs text-[11px] font-black uppercase shadow-[1px_1px_0px_#22252A]">
              <span className="w-2 h-2 rounded-full bg-forest-green animate-pulse" />
              <span>{t('farmer.live_procurement_journey', 'Live Procurement Journey')}</span>
            </span>
          }
        />

        {isLoading ? (
          <LoadingState message={t('farmer.fetching_procurement_details', 'Fetching procurement transaction details...')} />
        ) : errorType === 'NOT_FOUND' ? (
          <EmptyState
            icon={SearchX}
            title={t('farmer.booking_not_found_title', 'Booking Not Found')}
            description={errorMsg || t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.')}
            actionLabel={t('farmer.back_to_bookings', 'Back to Bookings')}
            onAction={() => navigate('/farmer/bookings')}
          />
        ) : errorType === 'ERROR' ? (
          <ErrorState
            title={t('farmer.journey_error_title', 'Unable to Load Procurement Journey')}
            message={errorMsg || t('farmer.journey_error_desc', 'We encountered a temporary network issue while fetching your procurement journey details. Please try again.')}
            onRetry={fetchData}
          />
        ) : (
          <div className="space-y-6">
            {/* Booking Reference & Assigned Staff Overview Strip */}
            <div className="bg-white border-2 border-dark-neutral p-4 rounded-xs shadow-brutal flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-white font-mono font-black text-base shadow-[2px_2px_0px_#22252A]">
                  #{booking?.tokenNumber || procurement?.tokenNumber || 'TOK-01'}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted tracking-wider block">
                    {t('farmer.ref_label', 'Ref:')} {booking?.bookingReference || procurement?.bookingId || bookingId}
                  </span>
                  <h3 className="text-sm sm:text-base font-black font-heading text-dark-neutral">
                    {cropType} • {quantity} Quintals
                  </h3>
                </div>
              </div>

              {/* Assigned Staff Operator Info */}
              <div className="flex items-center gap-3 bg-warm-ivory px-3 py-2 border border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A]">
                <User className="w-4 h-4 text-forest-green shrink-0" />
                <div className="text-xs">
                  <span className="text-[10px] font-bold text-dark-neutral-muted block">
                    {t('farmer.assigned_operator_label', 'Assigned Operating Officer:')}
                  </span>
                  {booking?.assignedStaffName ? (
                    <span className="font-black text-dark-neutral">
                      {booking.assignedStaffName}
                      {booking.assignedStaffDesignation && (
                        <span className="text-[10px] font-medium text-dark-neutral-muted ml-1">
                          ({booking.assignedStaffDesignation})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="font-bold text-amber-700 italic">
                      {t('farmer.staff_assignment_pending', 'Staff assignment pending')}
                    </span>
                  )}
                </div>
              </div>

              {/* Date and Time Slot */}
              <div className="flex items-center gap-2 text-xs font-bold text-dark-neutral">
                <Clock className="w-4 h-4 text-forest-green" />
                <span>
                  {booking?.bookingDate || booking?.slotDate || new Date().toISOString().split('T')[0]} ({booking?.timeWindow || '09:00 - 10:00 AM'})
                </span>
              </div>
            </div>

            {/* Demo Payment Notice Alert */}
            <Alert type="info" title={t('farmer.demo_payment_tracker', 'Demo Payment Tracker')}>
              {paymentStatus?.demoNotice || t('farmer.demo_payment_notice', 'Demo Payment Status — Visual Tracker Only for Hackathon MVP')}
              <br />
              <span className="text-[11px] font-bold opacity-90">
                {t('farmer.demo_reference_prefix', 'Demo Reference #:')}{' '}
                <strong>{paymentStatus?.demoReferenceNumber || 'PAY-DEMO-20260901-4921'}</strong>
              </span>
            </Alert>

            {/* 8-Stage Visual Timeline Tracker Card */}
            <Card title={t('farmer.timeline_title', 'Procurement & DBT Progression Timeline')} accentBorder shadow="normal">
              <div className="py-2 space-y-4">
                {/* Visual Ladder */}
                <ProgressLadder
                  stages={STAGES.map((s, idx) => ({
                    key: s.key,
                    short: getStageLabel(s.key, s.label),
                    label: getStageLabel(s.key, s.label),
                    desc: idx < 5 ? 'Mandate Stage: Verification & Net Physical Intake' : 'Financial Stage: Direct Benefit Transfer (DBT)'
                  }))}
                  currentIndex={currentStageIndex}
                />

                {/* Clear Stage Grouping Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t-2 border-dark-neutral/10">
                  <div className={`p-3 rounded-xs border-2 ${currentStageIndex < 5 ? 'bg-emerald-50 border-emerald-700' : 'bg-warm-ivory border-dark-neutral/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                        Phase 1: Physical Procurement
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${currentStageIndex >= 5 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-forest-green text-white border-dark-neutral'}`}>
                        {currentStageIndex >= 5 ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Slot reservation, moisture assaying, grain quality grade certification, and weighbridge intake slip.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xs border-2 ${currentStageIndex >= 5 ? 'bg-amber-50 border-amber-700' : 'bg-warm-ivory border-dark-neutral/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                        Phase 2: DBT Payment Settlement
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${currentStageIndex === 7 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : currentStageIndex >= 5 ? 'bg-amber-500 text-white border-dark-neutral' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                        {currentStageIndex === 7 ? 'Paid (Disbursed)' : currentStageIndex >= 5 ? 'Processing' : 'Awaiting Procurement'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Public Financial Management System (PFMS) verification and direct bank transfer disbursement.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Settlement & Produce Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Settlement Card */}
              <Card title={t('farmer.settlement_summary_title', 'Financial Settlement Summary')} shadow="normal">
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] text-center">
                    <span className="text-xs font-black text-forest-green uppercase tracking-wider block">
                      {t('farmer.net_payable_amount_label', 'NET PAYABLE AMOUNT')}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-forest-green my-1 font-mono">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </h1>
                    <span className="text-xs font-bold text-dark-neutral-muted">
                      {t('farmer.msp_rate_label', { rate: mspRate })}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-dark-neutral/10 text-xs font-medium">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">
                        {t('farmer.procured_net_weight', 'Procured Net Weight:')}
                      </span>
                      <span className="font-black text-dark-neutral">{quantity} Qtl</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">
                        {t('farmer.quality_grade_label', 'Quality Grade:')}
                      </span>
                      <span className="font-black text-emerald-800">
                        {procurement?.qualityGrade || 'Grade A'} (
                        {t('farmer.moisture_label', {
                          moisture: procurement?.moisturePercentage || 12.0
                        })}
                        )
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">
                        {t('farmer.gross_amount_label', 'Gross Amount:')}
                      </span>
                      <span className="font-black text-dark-neutral">
                        ₹{grossAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px]">
                        {t('farmer.deductions_label', 'Deductions:')}
                      </span>
                      <span className="font-black text-red-600">
                        - ₹{deductions.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => setShowReceiptModal(true)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-forest-green" />
                    <span>{t('farmer.view_digital_receipt', 'View Official Digital Receipt')}</span>
                  </Button>
                </div>
              </Card>

              {/* Centre & Navigation Card */}
              <Card title={t('farmer.directions_title', 'Procurement Centre Directions')} shadow="normal">
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-heading font-black text-base text-dark-neutral">
                      {centreName}
                    </h4>
                    <p className="text-dark-neutral-muted font-medium mt-0.5 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-green flex-shrink-0 mt-0.5" />
                      <span>{centreAddress}</span>
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
                      <span>{t('farmer.get_directions', 'Get Directions on Map')}</span>
                    </Button>
                  </a>

                  <Alert type="info">
                    {t('farmer.directions_notice', 'Location directions open directly in your mobile mapping app.')}
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
            receiptSerialNumber:
              procurement?.receiptSerialNumber ||
              `REC-${booking?.bookingReference || bookingId || 'LKO01'}-819`,
            tokenNumber: booking?.tokenNumber || procurement?.tokenNumber || 'TOK-01',
            farmerName:
              procurement?.farmerId?.fullName ||
              booking?.farmerName ||
              user?.fullName ||
              'Farmer Ramesh',
            farmerPhone:
              procurement?.farmerId?.phone || booking?.farmerPhone || user?.phone || '9876543210',
            centreName: centreName,
            centreAddress: centreAddress,
            cropType: cropType,
            verifiedQuantityQuintals: quantity,
            netWeightQuintals: quantity,
            moisturePercentage: procurement?.moisturePercentage || 12.0,
            qualityGrade: procurement?.qualityGrade || 'Grade A',
            procurementRatePerQuintal: mspRate,
            grossAmount: grossAmount,
            deductions: deductions,
            netPayableAmount: netPayable,
            completedAt: procurement?.completedAt || booking?.updatedAt || new Date()
          }}
        />
      </main>
    </div>
  );
};

export default FarmerProcurementPage;
