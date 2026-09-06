import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketQueue } from '../../hooks/useSocketQueue';
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
import AgriculturalVisualBackground from '../../components/public/AgriculturalVisualBackground';
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
  Ticket,
  Bell
} from 'lucide-react';

// Canonical 10-Stage Procurement Lifecycle
const CANONICAL_STAGES = [
  { key: 'BOOKED', num: 1, translationKey: 'canonical_stage_1', defaultLabel: '1. Booked', short: 'Booked', meaningKey: 'canonical_meaning_1', defaultMeaning: 'Your slot is confirmed.', phase: 'PRE_ARRIVAL' },
  { key: 'WAITING', num: 2, translationKey: 'canonical_stage_2', defaultLabel: '2. Waiting', short: 'Waiting', meaningKey: 'canonical_meaning_2', defaultMeaning: 'You are in the centre queue.', phase: 'PRE_ARRIVAL' },
  { key: 'CALLED', num: 3, translationKey: 'canonical_stage_3', defaultLabel: '3. Called', short: 'Called', meaningKey: 'canonical_meaning_3', defaultMeaning: 'Proceed to the assigned counter.', phase: 'INTAKE' },
  { key: 'ARRIVED', num: 4, translationKey: 'canonical_stage_4', defaultLabel: '4. Arrived', short: 'Arrived', meaningKey: 'canonical_meaning_4', defaultMeaning: 'Your arrival has been recorded.', phase: 'INTAKE' },
  { key: 'VERIFICATION', num: 5, translationKey: 'canonical_stage_5', defaultLabel: '5. Verification', short: 'Verify', meaningKey: 'canonical_meaning_5', defaultMeaning: 'Documents and farmer details are being checked.', phase: 'INTAKE' },
  { key: 'QUALITY_CHECK', num: 6, translationKey: 'canonical_stage_6', defaultLabel: '6. Quality Check', short: 'Quality', meaningKey: 'canonical_meaning_6', defaultMeaning: 'Your crop quality is being assessed.', phase: 'INTAKE' },
  { key: 'WEIGHING', num: 7, translationKey: 'canonical_stage_7', defaultLabel: '7. Weighing', short: 'Weigh', meaningKey: 'canonical_meaning_7', defaultMeaning: 'Your produce is being weighed.', phase: 'INTAKE' },
  { key: 'PROCUREMENT_CONFIRMED', num: 8, translationKey: 'canonical_stage_8', defaultLabel: '8. Procurement Confirmed', short: 'Procured', meaningKey: 'canonical_meaning_8', defaultMeaning: 'Your procurement has been confirmed.', phase: 'COMPLETED' },
  { key: 'PAYMENT_PROCESSING', num: 9, translationKey: 'canonical_stage_9', defaultLabel: '9. Payment Processing', short: 'DBT Processing', meaningKey: 'canonical_meaning_9', defaultMeaning: 'Payment is being prepared.', phase: 'PAYMENT' },
  { key: 'PAYMENT_COMPLETED', num: 10, translationKey: 'canonical_stage_10', defaultLabel: '10. Payment Completed', short: 'DBT Settled', meaningKey: 'canonical_meaning_10', defaultMeaning: 'Payment has been marked as completed.', phase: 'PAYMENT' }
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
  const [liveNotification, setLiveNotification] = useState(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (!bookingId) {
      setErrorType('NOT_FOUND');
      setErrorMsg(t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.'));
      setIsLoading(false);
      return;
    }

    if (isInitial) {
      setIsLoading(true);
      setErrorType(null);
      setErrorMsg(null);
    }

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

      if (!isBookingFound && (!procRes.value || !procRes.value.success)) {
        setErrorType('NOT_FOUND');
        setErrorMsg(t('farmer.booking_not_found_desc', 'The requested procurement booking could not be found or you do not have permission to view it.'));
      }
    } catch (err) {
      if (isInitial) {
        setErrorType('ERROR');
        setErrorMsg(err.message || t('farmer.journey_error_desc', 'We encountered a temporary network issue while fetching your procurement journey details. Please try again.'));
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, [bookingId, t]);

  useEffect(() => {
    fetchData(true);
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(false);
      }
    }, 3500);
    return () => clearInterval(pollTimer);
  }, [fetchData]);

  // Socket.IO real-time hook
  const centreId = booking?.centreId?._id || booking?.centreId || booking?.centre?._id || booking?.centre?.id;
  const farmerId = user?._id || user?.id;

  useSocketQueue({
    centreId,
    farmerId,
    onQueueUpdate: (eventData) => {
      console.log('[Farmer Procurement Socket] Real-time event received:', eventData);
      if (eventData?.stage || eventData?.status) {
        setLiveNotification(`Real-time update: Your token status is now ${eventData.stage || eventData.status}`);
        setTimeout(() => setLiveNotification(null), 6000);
      }
      fetchData();
    }
  });

  // Compute canonical operational stage index (0 to 9)
  const getStageFromStatus = () => {
    // 1. Direct payment completion or payment status check
    if (paymentStatus?.currentStage === 'PAID' || paymentStatus?.status === 'SUCCESS' || procurement?.paymentStatus === 'PAID') {
      return 9; // PAYMENT_COMPLETED
    }
    if (paymentStatus?.currentStage === 'PAYMENT_PROCESSING' || procurement?.paymentStatus === 'PROCESSING') {
      return 8; // PAYMENT_PROCESSING
    }
    if (procurement?.procurementStatus === 'COMPLETED' || booking?.operationalStatus === 'PROCUREMENT_CONFIRMED' || booking?.operationalStatus === 'PROCUREMENT COMPLETE') {
      return 7; // PROCUREMENT_CONFIRMED
    }

    // 2. Canonical operational status on booking or queue
    const opStatus = (booking?.operationalStatus || '').toUpperCase().replace(/\s+/g, '_');
    switch (opStatus) {
      case 'BOOKED':
        return 0;
      case 'WAITING':
      case 'IN_QUEUE':
      case 'QUEUED':
        return 1;
      case 'CALLED':
        return 2;
      case 'ARRIVED':
        return 3;
      case 'VERIFICATION':
        return 4;
      case 'QUALITY_CHECK':
      case 'QUALITY':
        return 5;
      case 'WEIGHING':
      case 'WEIGHED':
        return 6;
      case 'PROCUREMENT_CONFIRMED':
      case 'PROCUREMENT_COMPLETE':
        return 7;
      case 'PAYMENT_PROCESSING':
      case 'PAYMENT_INITIATED':
        return 8;
      case 'PAYMENT_COMPLETED':
      case 'COMPLETED':
      case 'PAID':
        return 9;
      default:
        return 0;
    }
  };

  const currentStageIndex = getStageFromStatus();

  const getStageLabel = (stage) => {
    return t(`farmer.${stage.translationKey}`, stage.defaultLabel);
  };

  // Safe normalized centre details
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
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans relative overflow-x-hidden">
      {/* Contextual Visual Background - JOURNEY mode */}
      <AgriculturalVisualBackground variant="journey" intensity="soft" showBotanicalFrame={true} />

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter relative z-10">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-forest-green-light text-forest-green border border-forest-green rounded-xs text-[11px] font-black uppercase shadow-[1px_1px_0px_#22252A]">
              <span className="w-2 h-2 rounded-full bg-forest-green animate-pulse" />
              <span>DEMO ENVIRONMENT • Lucknow District</span>
            </span>
          }
        />

        {/* Subtle Demo Environment Simulation Indicators */}
        <div className="mb-4 px-3.5 py-2 bg-amber-50 border-2 border-amber-400 rounded-xs flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-amber-950 shadow-[2px_2px_0px_#22252A]">
          <span className="flex items-center gap-1.5">
            <span>🛡️ Demonstration Mode • Authorized Lucknow District Sandbox</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span className="px-2 py-0.5 bg-white border border-amber-400 rounded-xs font-mono">PFMS Simulation: Active</span>
            <span className="px-2 py-0.5 bg-white border border-amber-400 rounded-xs font-mono">SMS Gateway: Simulated</span>
            <span className="px-2 py-0.5 bg-white border border-amber-400 rounded-xs font-mono">Digital Weighbridge: Synchronized</span>
          </div>
        </div>

        {liveNotification && (
          <div className="mb-4 p-3 bg-emerald-100 border-2 border-forest-green text-emerald-900 rounded-xs text-xs font-bold flex items-center gap-2 shadow-brutal-sm animate-fade-in">
            <Bell className="w-4 h-4 text-forest-green shrink-0 animate-bounce" />
            <span>{liveNotification}</span>
          </div>
        )}

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
                <div className="px-3.5 py-2 rounded-xs bg-forest-green-light border-2 border-dark-neutral flex flex-col items-center justify-center text-forest-green shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[9px] font-black uppercase tracking-widest text-dark-neutral-muted">TOKEN</span>
                  <span className="font-mono font-black text-xl sm:text-2xl text-forest-green leading-none mt-0.5">
                    {booking?.tokenNumber || procurement?.tokenNumber || 'GOM01-109'}
                  </span>
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

            {/* Canonical 10-Stage Visual Timeline Tracker Card */}
            <Card title={t('farmer.timeline_title', '10-Stage Procurement & Settlement Progression')} accentBorder shadow="normal">
              <div className="py-2 space-y-4">
                {/* Compact Progress Summary Ribbon */}
                <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-warm-ivory border border-dark-neutral/30 rounded-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-forest-green tracking-wider">
                      {currentStageIndex + 1} of 10 stages completed
                    </span>
                    <span className="text-xs text-dark-neutral-muted">•</span>
                    <span className="text-xs font-bold text-dark-neutral">
                      {CANONICAL_STAGES[currentStageIndex]?.defaultLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-forest-green">
                      {Math.round(((currentStageIndex + 1) / 10) * 100)}%
                    </span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden border border-dark-neutral/20">
                      <div
                        className="h-full bg-forest-green transition-all duration-500"
                        style={{ width: `${Math.round(((currentStageIndex + 1) / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Visual Ladder */}
                <ProgressLadder
                  stages={CANONICAL_STAGES.map((s) => ({
                    key: s.key,
                    short: s.short,
                    label: getStageLabel(s),
                    meaning: t(s.meaningKey, s.defaultMeaning),
                    timestamp: s.num <= currentStageIndex + 1 ? 'Logged' : null
                  }))}
                  currentIndex={currentStageIndex}
                />

                {/* What Happens Now? & What to Expect Next? Operational Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t-2 border-dark-neutral/10">
                  <div className="p-3.5 bg-emerald-50 border-2 border-forest-green rounded-xs shadow-brutal-sm">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-forest-green mb-1.5">
                      <Clock className="w-4 h-4 text-forest-green shrink-0" />
                      <span>{t('farmer.what_happens_now', 'What Happens Now? (Current Step)')}</span>
                    </div>
                    <p className="text-xs text-dark-neutral font-medium leading-relaxed">
                      {(() => {
                        switch (currentStageIndex) {
                          case 0:
                            return 'Your delivery slot is confirmed in the Lucknow district operational pilot. Keep your Registration ID and land revenue documents ready before visiting the facility.';
                          case 1:
                            return 'You are currently in the live intake yard queue. Token announcements are delivered through audio speakers and mobile screen updates. Please remain within the waiting pavilion.';
                          case 2:
                            return '📢 YOUR TOKEN HAS BEEN CALLED! Please proceed directly to Counter 1 / Intake Bay with your vehicle and official farmer photo identity proof.';
                          case 3:
                            return 'Your vehicle arrival has been officially recorded by the gate operator. Proceed forward into the verification inspection lane.';
                          case 4:
                            return 'Procurement officials are matching your Aadhaar credentials, land record verification, and crop declaration against Mandi quotas.';
                          case 5:
                            return 'Quality assayers are drawing representative grain samples to measure moisture content (threshold ≤ 14.0%) and grain cleanliness.';
                          case 6:
                            return 'Your produce is on the certified weighbridge. Gross weight of the loaded vehicle and subsequent tare weight of the empty vehicle are certified digitally.';
                          case 7:
                            return 'Procurement transaction is formally confirmed by the Centre Manager! Your official digital procurement receipt with serial number is generated.';
                          case 8:
                            return 'Payment settlement voucher has been submitted to the DBT payment gateway. Fund transfer routing to your Aadhaar-linked bank account is underway.';
                          case 9:
                            return '✓ MSP funds successfully disbursed via Direct Benefit Transfer! The full net amount has been credited to your verified bank account.';
                          default:
                            return 'Your procurement journey is actively monitored by the Lucknow District Procurement Command.';
                        }
                      })()}
                    </p>
                  </div>

                  <div className="p-3.5 bg-warm-ivory border-2 border-dark-neutral/40 rounded-xs shadow-brutal-sm">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-dark-neutral mb-1.5">
                      <ArrowRight className="w-4 h-4 text-forest-green shrink-0" />
                      <span>{t('farmer.what_to_expect_next', 'What Should I Expect Next?')}</span>
                    </div>
                    <p className="text-xs text-dark-neutral-muted font-medium leading-relaxed">
                      {(() => {
                        switch (currentStageIndex) {
                          case 0:
                            return 'Once you arrive at the centre, gate operators will register your intake ticket and position you in the digital queue.';
                          case 1:
                            return 'When counter operators press CALL NEXT, your token number will alert with assigned bay instructions.';
                          case 2:
                            return 'Operator will verify farmer identity and generate physical check-in approval.';
                          case 3:
                            return 'Document verification will cross-check land ownership and biometric match.';
                          case 4:
                            return 'Grain assaying will evaluate moisture percentage and assign standard Grade A quality.';
                          case 5:
                            return 'Electronic weighbridge gross minus tare certified weight will compute your final quintals.';
                          case 6:
                            return 'Statutory Centre Manager will sign off and issue the official digital receipt.';
                          case 7:
                            return 'PFMS/DBT financial batch will queue for direct electronic credit to your bank.';
                          case 8:
                            return 'Bank SMS confirmation and final DBT settlement receipt will be available in your portal.';
                          case 9:
                            return 'Your seasonal procurement quota is updated in the district civil supplies registry.';
                          default:
                            return 'Next operational stage will update automatically in real-time.';
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Clear Stage Grouping Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-dark-neutral/10 text-xs">
                  <div className={`p-3 rounded-xs border-2 ${currentStageIndex < 2 ? 'bg-emerald-50 border-emerald-700' : 'bg-warm-ivory border-dark-neutral/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                        Phase 1: Booking & Wait
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${currentStageIndex >= 2 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-forest-green text-white border-dark-neutral'}`}>
                        {currentStageIndex >= 2 ? 'Passed' : 'Active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Slot confirmed. Farmer is queued and awaits turn notification.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xs border-2 ${currentStageIndex >= 2 && currentStageIndex <= 6 ? 'bg-emerald-50 border-emerald-700' : 'bg-warm-ivory border-dark-neutral/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                        Phase 2: Gate to Weighment
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${currentStageIndex > 6 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : currentStageIndex >= 2 ? 'bg-forest-green text-white border-dark-neutral' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                        {currentStageIndex > 6 ? 'Passed' : currentStageIndex >= 2 ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Check-in, documentary verification, grain moisture inspection, and gross/tare weighbridge records.
                    </p>
                  </div>

                  <div className={`p-3 rounded-xs border-2 ${currentStageIndex >= 7 ? 'bg-amber-50 border-amber-700' : 'bg-warm-ivory border-dark-neutral/30'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                        Phase 3: DBT Settlement
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs border ${currentStageIndex === 9 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : currentStageIndex >= 7 ? 'bg-amber-500 text-white border-dark-neutral' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                        {currentStageIndex === 9 ? 'Paid (Disbursed)' : currentStageIndex >= 7 ? 'Processing' : 'Awaiting Procurement'}
                      </span>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Procurement receipt confirmation and Direct Benefit Transfer directly to farmer Aadhaar-linked account.
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
          booking={booking}
          procurement={procurement}
          paymentStatus={paymentStatus}
        />
      </main>
    </div>
  );
};

export default FarmerProcurementPage;
