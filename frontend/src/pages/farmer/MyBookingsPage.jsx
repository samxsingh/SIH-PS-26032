import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useSocketQueue } from '../../hooks/useSocketQueue';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import StatusIndicator from '../../components/common/StatusIndicator';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import ProgressLadder from '../../components/common/ProgressLadder';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Sprout,
  Users,
  Radio,
  FileText,
  XCircle,
  PlusCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const getOperationalStages = (t) => [
  { key: 'BOOKED', short: t('farmer.stage_booked_short', 'Booked'), desc: t('farmer.stage_booked_desc', 'Slot confirmed. Your delivery appointment is reserved.') },
  { key: 'ARRIVED', short: t('farmer.stage_arrived_short', 'Arrived'), desc: t('farmer.stage_arrived_desc', 'Checked in at the procurement centre security gate.') },
  { key: 'IN QUEUE', short: t('farmer.stage_in_queue_short', 'In Queue'), desc: t('farmer.stage_in_queue_desc', 'Token active in intake line waiting for inspection counter.') },
  { key: 'QUALITY CHECK', short: t('farmer.stage_quality_check_short', 'Quality'), desc: t('farmer.stage_quality_check_desc', 'Moisture and FAQ grain standards under verification.') },
  { key: 'WEIGHING', short: t('farmer.stage_weighing_short', 'Weighing'), desc: t('farmer.stage_weighing_desc', 'Vehicle gross weight recorded on certified weighbridge.') },
  { key: 'PROCUREMENT COMPLETE', short: t('farmer.stage_procurement_short', 'Procured'), desc: t('farmer.stage_procurement_desc', 'Produce accepted and procurement receipt generated.') },
  { key: 'PAYMENT PROCESSING', short: t('farmer.stage_payment_short', 'Payment'), desc: t('farmer.stage_payment_desc', 'Direct Benefit Transfer (DBT) settlement initiated.') },
  { key: 'COMPLETED', short: t('farmer.stage_completed_short', 'Completed'), desc: t('farmer.stage_completed_desc', 'Procurement complete and funds credited to bank account.') }
];

const getBookingStageIndex = (operationalStatus, bookingStatus) => {
  if (bookingStatus === 'COMPLETED' || operationalStatus === 'COMPLETED') return 7;
  switch (operationalStatus) {
    case 'BOOKED': return 0;
    case 'ARRIVED': return 1;
    case 'IN QUEUE': return 2;
    case 'QUALITY CHECK': return 3;
    case 'WEIGHING': return 4;
    case 'PROCUREMENT COMPLETE': return 5;
    case 'PAYMENT PROCESSING': return 6;
    case 'COMPLETED': return 7;
    default: return 0;
  }
};

export const MyBookingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const operationalStages = getOperationalStages(t);

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('UPCOMING'); // 'UPCOMING' | 'HISTORY'
  const [queueStatus, setQueueStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch bookings
  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.success) {
        setBookings(res.data || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch active queue status for today
  const fetchQueueStatus = async () => {
    try {
      const res = await apiClient.get('/queue/farmer-status');
      if (res.success && res.data) {
        setQueueStatus(res.data);
      } else {
        setQueueStatus(null);
      }
    } catch (err) {
      // Handled silently
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchQueueStatus();
  }, []);

  const { isConnected } = useSocketQueue({
    farmerId: user?.id,
    onQueueUpdate: () => fetchQueueStatus()
  });

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(t('farmer.confirm_cancel_prompt'))) return;
    try {
      await apiClient.patch(`/bookings/${bookingId}/cancel`);
      fetchBookings();
      fetchQueueStatus();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const upcomingBookings = bookings.filter((b) => b.bookingStatus === 'CONFIRMED');
  const pastBookings = bookings.filter((b) => b.bookingStatus !== 'CONFIRMED');

  const currentList = activeTab === 'UPCOMING' ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        <PageHeader
          title={t('farmer.action_my_booking')}
          subtitle={t('farmer.my_bookings_subtitle')}
          actions={
            <div className="flex items-center gap-3">
              <Badge
                variant={isConnected ? 'success' : 'warning'}
                icon={Radio}
                aria-label={`Live status: ${isConnected ? 'Connected' : 'Reconnecting'}`}
              >
                {isConnected ? t('farmer.live_updates_connected') : t('farmer.live_updates_reconnecting')}
              </Badge>
              <Link to="/farmer/find-centres">
                <Button variant="primary" size="sm">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>{t('farmer.action_book_slot')}</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Live Queue Ticket Card with Accessibility Live Region */}
        {queueStatus && (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="mb-6 animate-fade-slide"
          >
            <div className="bg-forest-green-light border-3 border-dark-neutral rounded-md p-6 shadow-brutal-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-dark-neutral/20">
                <div className="flex items-center gap-2">
                  <Badge variant="success" icon={Ticket} size="lg">
                    {t('farmer.live_ticket_badge')}
                  </Badge>
                  <span className="text-xs font-black text-forest-green">
                    {queueStatus.centre?.name}
                  </span>
                </div>
                <StatusIndicator status={queueStatus.state} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center my-2">
                <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black text-dark-neutral-muted uppercase tracking-wider block">
                    {t('farmer.your_ticket')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-forest-green font-mono my-0.5">
                    {queueStatus.tokenNumber}
                  </h2>
                  <span className="text-[11px] font-bold text-dark-neutral-muted">{t('farmer.slot_prefix')} {queueStatus.booking?.timeWindow}</span>
                </div>

                <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black text-dark-neutral-muted uppercase tracking-wider block">
                    {t('farmer.your_position')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-dark-neutral my-0.5">
                    #{queueStatus.position}
                  </h2>
                  <span className="text-[11px] font-bold text-dark-neutral-muted">{queueStatus.peopleAhead} {t('farmer.people_ahead')}</span>
                </div>

                <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black text-dark-neutral-muted uppercase tracking-wider block">
                    {t('farmer.est_wait')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-amber-700 my-0.5">
                    ~{queueStatus.estimatedWaitMinutes}m
                  </h2>
                  <span className="text-[11px] font-bold text-dark-neutral-muted">{t('farmer.updated_realtime')}</span>
                </div>

                <div className="p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black text-dark-neutral-muted uppercase tracking-wider block">
                    {t('farmer.current_serving')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-info-blue font-mono my-0.5">
                    {queueStatus.currentlyServingToken}
                  </h2>
                  <span className="text-[11px] font-bold text-dark-neutral-muted">{queueStatus.counterId}</span>
                </div>
              </div>

              {queueStatus.state === 'CALLED' && (
                <Alert type="warning" title={t('farmer.token_called_title')} className="mt-4">
                  {t('farmer.token_called_text', { counter: queueStatus.counterId })}
                </Alert>
              )}

              <div className="mt-4 pt-3 border-t-2 border-dark-neutral/20 flex justify-end">
                <Link to={`/farmer/procurement/${queueStatus.booking?._id || queueStatus.booking?.id || queueStatus.booking}`}>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1.5 text-forest-green" />
                    <span>{t('farmer.track_journey')}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-2 mb-6 border-b-2 border-dark-neutral">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'UPCOMING'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{t('farmer.upcoming_bookings_tab', { count: upcomingBookings.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'HISTORY'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('farmer.history_tab', { count: pastBookings.length })}</span>
          </button>
        </div>

        {isLoading ? (
          <LoadingState message={t('common.loading')} />
        ) : errorMsg ? (
          <Alert type="error">{errorMsg}</Alert>
        ) : currentList.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={activeTab === 'UPCOMING' ? t('farmer.no_active_bookings_title') : t('farmer.no_history_title')}
            description={
              activeTab === 'UPCOMING'
                ? t('farmer.no_active_bookings_desc')
                : t('farmer.no_history_desc')
            }
            actionLabel={activeTab === 'UPCOMING' ? t('farmer.action_book_slot') : undefined}
            onAction={activeTab === 'UPCOMING' ? () => (window.location.href = '/farmer/find-centres') : undefined}
          />
        ) : (
          <div className="space-y-4">
            {currentList.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-md border-2 border-dark-neutral shadow-brutal p-5 border-l-6 border-l-forest-green transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b-2 border-dark-neutral/10">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-forest-green-light text-forest-green font-mono font-black text-lg sm:text-xl rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                      {booking.tokenNumber}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-dark-neutral-muted block">{t('farmer.ref_label')} {booking.bookingReference}</span>
                      <h4 className="font-heading font-black text-base text-dark-neutral">{booking.centre?.name}</h4>
                    </div>
                  </div>

                  <StatusIndicator status={booking.bookingStatus === 'CONFIRMED' ? 'WAITING' : booking.bookingStatus} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
                  <div className="flex items-center gap-2 bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    <Calendar className="w-4 h-4 text-forest-green" />
                    <div>
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">{t('farmer.date_label')}</span>
                      <span className="font-black text-dark-neutral">{booking.bookingDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    <Clock className="w-4 h-4 text-forest-green" />
                    <div>
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">{t('farmer.time_label')}</span>
                      <span className="font-black text-dark-neutral">{booking.timeWindow}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-warm-ivory p-2.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    <Sprout className="w-4 h-4 text-forest-green" />
                    <div>
                      <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">{t('farmer.produce_label')}</span>
                      <span className="font-black text-dark-neutral">{booking.cropType} • {booking.estimatedQuantityQuintals} Qtl</span>
                    </div>
                  </div>
                </div>

                {/* Straight-Line / Ladder Progress Tracker */}
                <div className="my-3 p-4 bg-warm-ivory/80 border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A]">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
                      {t('farmer.workflow_tracker_title', '8-Stage Procurement Workflow Tracker')}
                    </span>
                    <span className="text-[10px] font-black text-forest-green bg-forest-green-light px-2 py-0.5 rounded-xs border border-forest-green/40">
                      {t('farmer.stage_of_8', {
                        current: getBookingStageIndex(booking.operationalStatus, booking.bookingStatus) + 1,
                        label: operationalStages[getBookingStageIndex(booking.operationalStatus, booking.bookingStatus)].short
                      })}
                    </span>
                  </div>

                  {/* Responsive Straight-Line / Vertical Ladder Component */}
                  <ProgressLadder
                    stages={operationalStages}
                    currentIndex={getBookingStageIndex(booking.operationalStatus, booking.bookingStatus)}
                  />

                  {/* Non-Technical Stage Explanation Box */}
                  <div className="mt-3 p-2.5 bg-white rounded-xs border border-dark-neutral text-[11px] flex items-center justify-between gap-2">
                    <span className="text-dark-neutral">
                      <strong>{t('farmer.current_step_label', 'Current Step')}:</strong> {operationalStages[getBookingStageIndex(booking.operationalStatus, booking.bookingStatus)].desc}
                    </span>
                    <span className="px-2 py-0.5 bg-forest-green-light border border-forest-green text-forest-green font-black text-[10px] uppercase rounded-xs shrink-0">
                      {t('farmer.live_badge', 'Live')}
                    </span>
                  </div>
                </div>

                {/* Assigned Centre Staff Operator */}
                <div className="bg-forest-green-light/40 border border-dark-neutral/30 rounded-xs p-2.5 text-xs flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-dark-neutral">
                    {t('farmer.assigned_operator_label')}{' '}
                    {booking.assignedStaffName ? (
                      <>
                        <strong className="text-forest-green">{booking.assignedStaffName}</strong>
                        {booking.assignedStaffDesignation && (
                          <span className="text-dark-neutral-muted"> ({booking.assignedStaffDesignation})</span>
                        )}
                      </>
                    ) : (
                      <strong className="text-amber-700 italic font-semibold">
                        {t('farmer.staff_assignment_pending', 'Staff assignment pending')}
                      </strong>
                    )}
                  </span>
                  <Badge variant={booking.assignedStaffName ? 'success' : 'neutral'} size="sm">
                    {booking.assignedStaffName ? t('farmer.status_assigned') : t('farmer.operator_pending_assignment')}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs flex-wrap gap-2">
                  <span className="text-dark-neutral-muted font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-forest-green" /> {booking.centre?.address}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link to={`/farmer/procurement/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        <span>{t('farmer.track_status_btn')}</span>
                      </Button>
                    </Link>

                    {booking.bookingStatus === 'CONFIRMED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-700 hover:bg-red-50 hover:border-red-600"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        <span>{t('farmer.cancel_slot_btn')}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookingsPage;
