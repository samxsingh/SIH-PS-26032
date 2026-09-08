import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketQueue } from '../../hooks/useSocketQueue';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import FarmerProfileModal from '../../components/farmer/FarmerProfileModal';
import GoogleCentreMap from '../../components/farmer/GoogleCentreMap';
import CentreDetailsPanel from '../../components/farmer/CentreDetailsPanel';
import ProgressLadder from '../../components/common/ProgressLadder';
import AgriculturalVisualBackground from '../../components/public/AgriculturalVisualBackground';
import { getLocalizedStage, getLocalizedCrop } from '../../utils/formatters';
import {
  Calendar,
  MapPin,
  Ticket,
  PackageCheck,
  User,
  CheckCircle2,
  ArrowRight,
  Sprout,
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

const LUCKNOW_COORDS = { lat: 26.8467, lon: 80.9462 };

const CANONICAL_STAGES = [
  { key: 'BOOKED', num: 1, short: 'BOOKED', label: 'Slot Confirmed' },
  { key: 'WAITING', num: 2, short: 'WAITING', label: 'Waiting in Queue' },
  { key: 'CALLED', num: 3, short: 'CALLED', label: 'Called to Counter' },
  { key: 'ARRIVED', num: 4, short: 'ARRIVED', label: 'Arrived at Facility' },
  { key: 'VERIFICATION', num: 5, short: 'VERIFY', label: 'Document Verification' },
  { key: 'QUALITY_CHECK', num: 6, short: 'QUALITY', label: 'Quality Assaying' },
  { key: 'WEIGHING', num: 7, short: 'WEIGH', label: 'Weighbridge Weighing' },
  { key: 'PROCUREMENT_CONFIRMED', num: 8, short: 'CONFIRMED', label: 'Procurement Confirmed' },
  { key: 'PAYMENT_PROCESSING', num: 9, short: 'PAYMENT', label: 'Payment Processing' },
  { key: 'PAYMENT_COMPLETED', num: 10, short: 'SETTLED', label: 'Payment Completed' }
];

export const FarmerDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Map & Centres Discovery State on Dashboard
  const [centres, setCentres] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [detailPanelCentre, setDetailPanelCentre] = useState(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(true);

  const fetchActiveBooking = async () => {
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.success && res.data && res.data.length > 0) {
        // Priority 1: Any booking currently undergoing live centre operations
        const inProgress = res.data.find((b) =>
          ['WAITING', 'CALLED', 'ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING'].includes(
            (b.operationalStatus || '').toUpperCase()
          )
        );

        // Priority 2: Any upcoming booking with confirmed slot
        const upcomingConfirmed = res.data.find(
          (b) => b.bookingStatus === 'CONFIRMED' && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.operationalStatus)
        );

        // Priority 3: Fall back to most recent booking (e.g. newly completed or initial booking)
        const active = inProgress || upcomingConfirmed || res.data[0];
        setActiveBooking(active || null);
      } else {
        setActiveBooking(null);
      }
    } catch (err) {
      // Handled gracefully
      setActiveBooking(null);
    } finally {
      setIsLoadingBooking(false);
    }
  };

  // Real-time synchronization via Socket.IO
  const farmerUserId = user?._id || user?.id;
  useSocketQueue({
    farmerId: farmerUserId,
    onQueueUpdate: () => {
      fetchActiveBooking();
    }
  });

  // Clear booking on user change & maintain fallback periodic sync
  useEffect(() => {
    setActiveBooking(null);
    fetchActiveBooking();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchActiveBooking();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [farmerUserId]);

  useEffect(() => {
    const fetchCentresAndMandis = async () => {
      setIsLoadingCentres(true);
      try {
        const [centresRes, mandisRes] = await Promise.allSettled([
          apiClient.get(`/centres?lat=${LUCKNOW_COORDS.lat}&lon=${LUCKNOW_COORDS.lon}`),
          apiClient.get('/mandis?district=Lucknow')
        ]);

        if (centresRes.status === 'fulfilled' && centresRes.value?.success) {
          const cData = centresRes.value.data || [];
          setCentres(cData);
          if (cData.length > 0) setSelectedCentre(cData[0]);
        }
        if (mandisRes.status === 'fulfilled' && mandisRes.value?.success) {
          setMandis(mandisRes.value.data || []);
        }
      } catch (err) {
        console.warn('[FarmerDashboard] Failed loading centres/mandis map data:', err.message);
      } finally {
        setIsLoadingCentres(false);
      }
    };

    fetchCentresAndMandis();
  }, []);

  const farmerActions = [
    {
      id: 'book-slot',
      title: t('farmer.action_book_slot', 'Book a Delivery Slot'),
      description: t('farmer.action_book_slot_desc', 'Select your crop, quantity and confirmed arrival window.'),
      icon: Calendar,
      bgColor: 'bg-emerald-100 text-emerald-900',
      badgeText: 'Priority Intake',
      link: '/farmer/find-centres',
    },
    {
      id: 'find-centre',
      title: t('farmer.action_find_centre', 'Find Procurement Centres'),
      description: t('farmer.action_find_centre_desc', 'Explore nearby mandis, operating hours and available capacity.'),
      icon: MapPin,
      bgColor: 'bg-blue-100 text-blue-900',
      badgeText: 'Live Distance',
      link: '/farmer/find-centres',
    },
    {
      id: 'my-booking',
      title: t('farmer.action_my_booking', 'My Bookings & Token'),
      description: t('farmer.action_my_booking_desc', 'Check arrival tokens, real-time queue position and tickets.'),
      icon: Ticket,
      bgColor: 'bg-amber-100 text-amber-900',
      badgeText: 'Real-Time Queue',
      link: '/farmer/bookings',
    },
    {
      id: 'track-procurement',
      title: t('farmer.action_track_procurement', 'Track Crop & Payment'),
      description: t('farmer.action_track_procurement_desc', 'Follow quality assaying, certified weighment and DBT transfer.'),
      icon: CreditCard,
      bgColor: 'bg-purple-100 text-purple-900',
      badgeText: 'DBT Settlement',
      link: '/farmer/bookings',
    }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans relative overflow-x-hidden">
      {/* Contextual Agricultural Visual Background - FARM mode */}
      <AgriculturalVisualBackground variant="farm" position="left" intensity="soft" showBotanicalFrame={true} />

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-page-enter relative z-10">
        {/* Top Header with Government Greeting and Role Status */}
        <PageHeader
          title={`${t('farmer.greeting', 'Namaste')}, ${user?.fullName || 'Kisan Bandhu'} 👋`}
          subtitle={t('farmer.welcome_sub', 'Your official agricultural procurement workspace')}
          badge={
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="success" icon={ShieldCheck}>
                {t('auth.role_farmer', 'Farmer')} • Verified
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xs text-[11px] font-black uppercase shadow-[1px_1px_0px_#22252A]">
                <span className="w-2 h-2 rounded-full bg-forest-green animate-pulse" />
                <span>Lucknow District Operations</span>
              </span>
            </div>
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-white hover:bg-forest-green-light cursor-pointer"
            >
              <User className="w-4 h-4 mr-1.5 text-forest-green" />
              <span>{t('farmer.view_profile', 'View Profile')}</span>
            </Button>
          }
        />

        {/* ========================================================================= */}
        {/* 1. PRIMARY OPERATIONAL INFO: ACTIVE PROCUREMENT JOURNEY HERO */}
        {/* ========================================================================= */}
        {activeBooking ? (
          <div className="bg-forest-green text-white border-2 border-dark-neutral rounded-xs shadow-brutal mb-6 p-4 sm:p-5 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            />

            <div className="relative z-10 space-y-3.5">
              {/* 1. TOP ROW: Government Operational Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-dark-neutral bg-wheat-accent px-2.5 py-0.5 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
                    {t('farmer.active_journey', 'ACTIVE PROCUREMENT JOURNEY')}
                  </span>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-dark-neutral border-2 border-dark-neutral rounded-xs shadow-[3px_3px_0px_#22252A]">
                    <span className="text-[11px] font-black uppercase tracking-widest text-dark-neutral-muted bg-sand-muted px-1.5 py-0.5 border border-dark-neutral/20">{t('farmer.token_badge', 'TOKEN')}</span>
                    <span className="text-lg sm:text-xl font-mono font-black text-forest-green tracking-wider">{activeBooking.tokenNumber || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70 font-medium">{t('common.status', 'Current Status')}:</span>
                  <span className="text-xs font-bold uppercase tracking-wide bg-white/15 text-white px-2.5 py-0.5 rounded-xs border border-white/25">
                    {(() => {
                      const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                      return getLocalizedStage(st, t);
                    })()}
                  </span>
                </div>
              </div>

              {/* 2. MAIN CONTENT & CTA GRID: Balanced layout without empty space */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Left: Main Facility & Appointment Details (8 cols on desktop) */}
                <div className="lg:col-span-8 space-y-1.5 min-w-0">
                  <h2 className="text-lg sm:text-xl font-black font-heading text-white leading-tight">
                    {activeBooking.centre?.name || activeBooking.centreName || 'Krishi Seva Procurement Centre — Gomti Nagar'}
                  </h2>
                  <p className="text-xs text-wheat-accent-light flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-wheat-accent shrink-0" />
                    <span>{activeBooking.centre?.address || activeBooking.centreAddress || 'Vibhuti Khand, Gomti Nagar, Lucknow'}</span>
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-white/90 flex-wrap pt-0.5">
                    <span>
                      {(() => {
                        if (!activeBooking.bookingDate) return '06 Sep 2026';
                        try {
                          const d = new Date(activeBooking.bookingDate);
                          if (isNaN(d.getTime())) return activeBooking.bookingDate;
                          return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                        } catch {
                          return activeBooking.bookingDate;
                        }
                      })()}
                    </span>
                    <span className="text-white/40">·</span>
                    <span>{activeBooking.timeWindow || '09:00–10:00 AM'}</span>
                    <span className="text-white/40">·</span>
                    <span>{getLocalizedCrop(activeBooking.cropType || 'Wheat', t)}</span>
                    <span className="text-white/40">·</span>
                    <span>{activeBooking.estimatedQuantityQuintals || activeBooking.quantityQuintals || 50} {t('common.quintals', 'Qtl')}</span>
                  </div>
                </div>

                {/* Right: Primary Action Button & Subordinate Links (4 cols on desktop) */}
                <div className="lg:col-span-4 flex flex-col items-stretch lg:items-end gap-1.5 shrink-0">
                  {(() => {
                    const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                    if (st === 'CALLED') {
                      return (
                        <Link to={`/farmer/procurement/${activeBooking.id || activeBooking._id}`} className="w-full lg:w-auto">
                          <Button
                            variant="primary"
                            size="md"
                            className="w-full lg:min-w-[200px] shadow-brutal min-h-[44px] font-black bg-amber-400 hover:bg-amber-300 text-dark-neutral border-2 border-dark-neutral justify-center text-sm uppercase tracking-wide animate-pulse motion-reduce:animate-none"
                          >
                            <span>Proceed to Counter →</span>
                          </Button>
                        </Link>
                      );
                    }
                    if (['PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING', 'PAYMENT_COMPLETED', 'COMPLETED'].includes(st)) {
                      return (
                        <Link to={`/farmer/procurement/${activeBooking.id || activeBooking._id}`} className="w-full lg:w-auto">
                          <Button
                            variant="secondary"
                            size="md"
                            className="w-full lg:min-w-[200px] shadow-brutal min-h-[44px] font-black bg-wheat-accent hover:bg-wheat-accent/90 text-dark-neutral border-2 border-dark-neutral justify-center text-sm"
                          >
                            <span>View Receipt & Status →</span>
                          </Button>
                        </Link>
                      );
                    }
                    return (
                      <Link to={`/farmer/procurement/${activeBooking.id || activeBooking._id}`} className="w-full lg:w-auto">
                        <Button
                          variant="secondary"
                          size="md"
                          className="w-full lg:min-w-[200px] shadow-brutal min-h-[44px] font-black bg-wheat-accent hover:bg-wheat-accent/90 text-dark-neutral border-2 border-dark-neutral justify-center text-sm"
                        >
                          <span>Track Procurement →</span>
                        </Button>
                      </Link>
                    );
                  })()}

                  {/* Subordinate Secondary Actions: Clean text links */}
                  <div className="flex items-center justify-center lg:justify-end gap-3 text-xs pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const matched = centres.find(
                          (c) => (c._id || c.id) === (activeBooking.centreId || activeBooking.centre?._id)
                        ) || activeBooking.centre;
                        if (matched) setDetailPanelCentre(matched);
                        else navigate('/farmer/find-centres');
                      }}
                      className="text-white/80 hover:text-white underline-offset-2 hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-white rounded-xs px-1"
                    >
                      {t('farmer.btn_view_centre', 'View Centre')}
                    </button>
                    <span className="text-white/30">·</span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${
                        activeBooking.centre?.location?.coordinates?.[1] || 26.8467
                      },${
                        activeBooking.centre?.location?.coordinates?.[0] || 80.9462
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white underline-offset-2 hover:underline font-semibold inline-flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-white rounded-xs px-1"
                      title={t('farmer.external_nav_disclaimer', 'Launches external navigation in your mapping application.')}
                    >
                      <span>{t('farmer.btn_get_directions', 'Get Directions')}</span>
                      <ExternalLink className="w-3 h-3 text-white/60" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 3. OPERATIONAL CONTEXT: Compact Live Queue Strip */}
              <div className="bg-emerald-950/70 border border-emerald-500/25 px-3 py-1.5 rounded-xs text-xs flex items-center gap-2 text-white/90">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 shrink-0">
                  LIVE QUEUE
                </span>
                <span className="text-white/30 shrink-0">·</span>
                <span className="font-medium text-[11px] sm:text-xs">
                  {(() => {
                    const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                    const isBeingServed = ['ARRIVED', 'VERIFICATION', 'QUALITY_CHECK', 'WEIGHING', 'PROCUREMENT_CONFIRMED', 'PAYMENT_PROCESSING'].includes(st);
                    const counter = activeBooking.assignedStation || activeBooking.counterId || 'Counter 01';

                    if (st === 'CALLED') {
                      return `You have been called · Proceed to ${counter} immediately`;
                    }
                    if (st === 'PAYMENT_COMPLETED') {
                      return 'Procurement complete · Direct Benefit Transfer (DBT) settled to bank';
                    }
                    if (isBeingServed) {
                      return `You are currently being served · ${counter}`;
                    }
                    if (st === 'BOOKED') {
                      return `Slot confirmed · Please arrive 15 minutes before your time slot`;
                    }
                    // WAITING state
                    const ahead = activeBooking.farmersAhead !== undefined ? `${activeBooking.farmersAhead} ${activeBooking.farmersAhead === 1 ? 'farmer' : 'farmers'} ahead` : '3 farmers ahead';
                    const wait = activeBooking.estimatedWaitMinutes ? `~${activeBooking.estimatedWaitMinutes} min wait` : '~18 min wait';
                    return `Currently being served · ${counter} · ${ahead} · ${wait}`;
                  })()}
                </span>
              </div>

              {/* 4. NEXT STEP: Concise Operational Instruction */}
              <div className="flex items-center gap-2 text-xs px-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-wheat-accent shrink-0">
                  NEXT STEP:
                </span>
                <span className="font-medium text-white/95 truncate">
                  {(() => {
                    const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                    switch (st) {
                      case 'BOOKED':
                        return t('farmer.next_action_booked', 'Prepare your documents and reach the centre during your slot.');
                      case 'WAITING':
                        return t('farmer.next_action_waiting', 'Please remain near the waiting area until your token is called.');
                      case 'CALLED':
                        return t('farmer.next_action_called', 'Proceed to the assigned counter with your vehicle and ID.');
                      case 'ARRIVED':
                        return t('farmer.next_action_arrived', 'Report to the gate for vehicle and document check.');
                      case 'VERIFICATION':
                        return t('farmer.next_action_verification', 'Your land and farmer identity documents are being verified.');
                      case 'QUALITY_CHECK':
                      case 'QUALITY':
                        return t('farmer.next_action_quality_check', 'Your crop samples are undergoing quality assaying.');
                      case 'WEIGHING':
                      case 'WEIGHED':
                        return t('farmer.next_action_weighing', 'Your produce is being weighed.');
                      case 'PROCUREMENT_CONFIRMED':
                        return t('farmer.next_action_procurement_confirmed', 'Procurement confirmed. Weighment slip and receipt are being generated.');
                      case 'PAYMENT_PROCESSING':
                        return t('farmer.next_action_payment_processing', 'Payment is being processed via PFMS / Direct Benefit Transfer.');
                      case 'PAYMENT_COMPLETED':
                        return t('farmer.next_action_payment_completed', 'Procurement complete. Tap View Receipt to download your official receipt.');
                      default:
                        return t('farmer.next_action_waiting', 'Please remain near the waiting area until your token is called.');
                    }
                  })()}
                </span>
              </div>

              {/* 5. BOTTOM: Lightweight 10-Stage Procurement Progress Stepper */}
              <div className="pt-2.5 border-t border-white/15">
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-wheat-accent mb-1.5">
                  <span>{t('farmer.procurement_progress', 'PROCUREMENT PROGRESS')}</span>
                  <span className="font-mono text-white/80">
                    {t('farmer.stage_counter', {
                      defaultValue: 'STAGE {{current}} OF {{total}}',
                      current: (() => {
                        const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                        const matchIdx = CANONICAL_STAGES.findIndex((s) => s.key === st);
                        return (matchIdx >= 0 ? matchIdx : 1) + 1;
                      })(),
                      total: 10
                    })}
                  </span>
                </div>
                <ProgressLadder
                  stages={CANONICAL_STAGES.map((s) => ({
                    ...s,
                    label: getLocalizedStage(s.key, t),
                    short: getLocalizedStage(s.key, t)
                  }))}
                  currentIndex={(() => {
                    const st = (activeBooking.operationalStatus || activeBooking.state || 'WAITING').toUpperCase();
                    const matchIdx = CANONICAL_STAGES.findIndex((s) => s.key === st);
                    return matchIdx >= 0 ? matchIdx : 1;
                  })()}
                  compact={true}
                  tone="dark"
                  orientation="responsive"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border-3 border-dark-neutral rounded-xs shadow-brutal-lg mb-8 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b-2 border-dark-neutral/10 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="success" icon={Sprout} size="md">
                    {t('farmer.season_active', 'Active Rabi/Kharif Season')}
                  </Badge>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-forest-green text-white px-2.5 py-0.5 rounded-xs border border-dark-neutral">
                    Lucknow District (UP_LUK)
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-dark-neutral">
                  {t('farmer.ready_to_book', 'Ready to deliver your produce?')}
                </h2>
                <p className="text-xs sm:text-sm text-dark-neutral-muted leading-relaxed font-medium">
                  {t('farmer.avoid_queues_desc', 'Book a guaranteed delivery slot in advance to avoid long queue wait times and ensure prompt weighment and direct MSP payment.')}
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <Link to="/farmer/book-slot" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-brutal min-h-[50px] font-black">
                    <span>🌾 {t('farmer.btn_book_slot_cta', 'Book a Delivery Slot')}</span>
                    <ArrowRight className="w-5 h-5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/farmer/find-centres" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[50px] font-bold border-2 border-dark-neutral bg-white text-dark-neutral hover:bg-emerald-50">
                    <span>📍 {t('farmer.btn_find_centre_cta', 'Find Nearby Centre')}</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* 4-Step Procurement Onboarding Guide */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forest-green" />
                  <span>How Government Procurement Works (4 Easy Steps)</span>
                </h3>
                <span className="text-[11px] font-bold text-dark-neutral-muted hidden sm:inline">
                  3 Mandis • 8 Centres • Transparent DBT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-forest-green text-xs font-black flex items-center justify-center border border-forest-green/40">
                        1
                      </span>
                      <MapPin className="w-4 h-4 text-forest-green" />
                    </div>
                    <h4 className="text-xs font-black text-dark-neutral">Find Nearby Centre</h4>
                    <p className="text-[11px] text-dark-neutral-muted leading-snug">
                      Locate the nearest centre across 3 Lucknow mandis with live queue times.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-forest-green text-xs font-black flex items-center justify-center border border-forest-green/40">
                        2
                      </span>
                      <Calendar className="w-4 h-4 text-forest-green" />
                    </div>
                    <h4 className="text-xs font-black text-dark-neutral">Select Delivery Slot</h4>
                    <p className="text-[11px] text-dark-neutral-muted leading-snug">
                      Reserve a guaranteed 1-hour window and receive an instant digital arrival token.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-forest-green text-xs font-black flex items-center justify-center border border-forest-green/40">
                        3
                      </span>
                      <ShieldCheck className="w-4 h-4 text-forest-green" />
                    </div>
                    <h4 className="text-xs font-black text-dark-neutral">Produce & Assaying</h4>
                    <p className="text-[11px] text-dark-neutral-muted leading-snug">
                      Bring produce with Aadhaar/Kisan card for certified moisture assay and grading.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-forest-green text-xs font-black flex items-center justify-center border border-forest-green/40">
                        4
                      </span>
                      <CreditCard className="w-4 h-4 text-forest-green" />
                    </div>
                    <h4 className="text-xs font-black text-dark-neutral">Weighing & Direct DBT</h4>
                    <p className="text-[11px] text-dark-neutral-muted leading-snug">
                      Electronic weighbridge net calculation, instant receipt, and direct bank settlement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MAP-FIRST DISTRICT OPERATIONS HUB (Lucknow 8 Centres + 3 Mandis) */}
        {/* ========================================================================= */}
        <div className="bg-white border-3 border-dark-neutral rounded-xs shadow-brutal-lg p-5 sm:p-6 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dark-neutral/10 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-green animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-forest-green">
                  District Command Operations: Lucknow (UP_LUK)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-dark-neutral">
                Interactive Procurement Network & Mandi Hubs
              </h2>
            </div>
            <Link to="/farmer/find-centres">
              <Button variant="outline" size="sm" className="font-bold bg-warm-ivory">
                <span>View Full Discovery Page</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Interactive Map Canvas on Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8">
              <GoogleCentreMap
                centres={centres}
                mandis={mandis}
                selectedCentre={selectedCentre}
                onSelectCentre={(c) => {
                  setSelectedCentre(c);
                  setDetailPanelCentre(c);
                }}
                userLocation={LUCKNOW_COORDS}
                locationMode="REGISTERED"
                height="h-[400px] sm:h-[460px]"
              />
            </div>

            {/* Side Quick Centre Selector */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-dark-neutral">
                  <span>Available Centres ({centres.length})</span>
                  <span className="text-dark-neutral-muted">Tap to preview</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {centres.slice(0, 6).map((c) => {
                    const isSelected = selectedCentre && (selectedCentre._id === c._id || selectedCentre.id === c.id);
                    return (
                      <div
                        key={c._id || c.id}
                        onClick={() => {
                          setSelectedCentre(c);
                          setDetailPanelCentre(c);
                        }}
                        className={`p-3 rounded-xs border-2 border-dark-neutral transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 shadow-brutal-sm -translate-y-0.5'
                            : 'bg-warm-ivory hover:bg-gray-100 shadow-[1px_1px_0px_#22252A]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-heading font-black text-xs text-dark-neutral truncate">
                            {c.name}
                          </h4>
                          <span className="font-mono text-[10px] font-bold text-forest-green shrink-0">
                            {c.availableSlotsToday || 12} slots
                          </span>
                        </div>
                        <p className="text-[11px] text-dark-neutral-muted truncate mt-0.5">
                          {c.address}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Link to="/farmer/find-centres" className="block pt-2">
                <Button variant="primary" size="md" fullWidth className="font-black">
                  <span>Explore All {centres.length} Lucknow Centres</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FARMER SERVICES & PROFILE GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Quick Profile Summary Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card
              title={t('farmer.profile_summary', 'Farmer Account Summary')}
              accentBorder
              shadow="normal"
              headerAction={
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs font-black text-forest-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('common.view_details', 'Details')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              }
            >
              <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-dark-neutral/10">
                <div className="w-14 h-14 rounded-xs bg-forest-green-light border-2 border-dark-neutral text-forest-green flex items-center justify-center font-bold text-xl shadow-[2px_2px_0px_#22252A] shrink-0 overflow-hidden">
                  {localStorage.getItem('farmer_avatar_' + (user?.id || user?._id || 'default')) ? (
                    <img
                      src={localStorage.getItem('farmer_avatar_' + (user?.id || user?._id || 'default'))}
                      alt={user?.fullName || 'Farmer'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-black text-base text-dark-neutral truncate">
                    {user?.fullName || 'Kisan Bandhu'}
                  </h3>
                  <p className="text-xs font-mono font-bold text-dark-neutral-muted mt-0.5">
                    📱 +91 {user?.phone || '9876543210'}
                  </p>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-xs border border-emerald-300 inline-block mt-1">
                    Aadhaar Verified
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider text-[10px]">
                    {t('farmer.district_label', 'District')}:
                  </span>
                  <span className="font-black text-dark-neutral">{user?.district || 'Lucknow'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider text-[10px]">
                    {t('farmer.state_label', 'State')}:
                  </span>
                  <span className="font-black text-dark-neutral">{user?.state || 'Uttar Pradesh'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider text-[10px]">
                    {t('farmer.village_label', 'Village')}:
                  </span>
                  <span className="font-black text-dark-neutral">{user?.villageName || 'Chinhat'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider text-[10px]">
                    Primary Mandi:
                  </span>
                  <span className="font-black text-dark-neutral">Gomti Nagar APMC</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t-2 border-dark-neutral/10">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-warm-ivory hover:bg-forest-green-light cursor-pointer font-black"
                >
                  <User className="w-4 h-4 mr-1.5 text-forest-green" />
                  <span>{t('farmer.edit_profile_btn', 'Edit Farmer Profile')}</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* 4 Strong Primary Service Blocks */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {farmerActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.link)}
                    className="p-5 sm:p-6 rounded-xs bg-white border-3 border-dark-neutral shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg active:translate-y-0 active:shadow-brutal transition-all duration-normal ease-tactile cursor-pointer flex flex-col justify-between group min-h-[170px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-11 h-11 rounded-xs border-2 border-dark-neutral ${action.bgColor} shadow-[2px_2px_0px_#22252A] flex items-center justify-center`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral bg-warm-ivory border border-dark-neutral px-2 py-0.5 rounded-xs shadow-[1px_1px_0px_#22252A]">
                          {action.badgeText}
                        </span>
                      </div>

                      <h3 className="font-heading font-black text-lg text-dark-neutral group-hover:text-forest-green transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-dark-neutral-muted mt-1.5 leading-relaxed font-medium">
                        {action.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t-2 border-dark-neutral/10 flex items-center justify-between text-xs font-black text-forest-green">
                      <span>{t('farmer.access_service', 'Access Service')}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Slide-out Centre Details Drawer on Dashboard */}
      <CentreDetailsPanel
        centre={detailPanelCentre}
        isOpen={!!detailPanelCentre}
        onClose={() => setDetailPanelCentre(null)}
        onBookSlot={(c) => {
          setDetailPanelCentre(null);
          navigate(`/farmer/book-slot?centreId=${c._id || c.id}`);
        }}
        userLocation={LUCKNOW_COORDS}
        activeBooking={activeBooking}
      />

      {/* Full Profile Modal */}
      <FarmerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </div>
  );
};

export default FarmerDashboardPage;
