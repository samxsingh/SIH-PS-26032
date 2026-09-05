import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import FarmerProfileModal from '../../components/farmer/FarmerProfileModal';
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
  ExternalLink
} from 'lucide-react';

export const FarmerDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const res = await apiClient.get('/bookings/my');
        if (res.success && res.data && res.data.length > 0) {
          const upcoming = res.data.find((b) => b.bookingStatus === 'CONFIRMED');
          if (upcoming) setActiveBooking(upcoming);
        }
      } catch (err) {
        // Handled gracefully
      } finally {
        setIsLoadingBooking(false);
      }
    };

    fetchActiveBooking();
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
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-page-enter">
        {/* Top Header with Government Greeting and Role Status */}
        <PageHeader
          title={`${t('farmer.greeting', 'Namaste')}, ${user?.fullName || 'Kisan Bandhu'} 👋`}
          subtitle={t('farmer.welcome_sub', 'Your official agricultural procurement workspace')}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="success" icon={ShieldCheck}>
                {t('auth.role_farmer', 'Farmer')} • Verified
              </Badge>
            </div>
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-white hover:bg-forest-green-light"
            >
              <User className="w-4 h-4 mr-1.5 text-forest-green" />
              <span>{t('farmer.view_profile', 'View Profile')}</span>
            </Button>
          }
        />

        {/* ========================================================================= */}
        {/* 1. PRIMARY OPERATIONAL INFO: ACTIVE BOOKING / UPCOMING DELIVERY */}
        {/* ========================================================================= */}
        {activeBooking ? (
          <div className="bg-forest-green text-white border-3 border-dark-neutral rounded-xs shadow-brutal-lg mb-8 p-6 sm:p-7 relative overflow-hidden">
            {/* Faint ambient pattern in card background */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#FFFFFF 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-dark-neutral bg-wheat-accent border border-dark-neutral px-3 py-1 rounded-xs inline-block shadow-[2px_2px_0px_#22252A]">
                    {t('farmer.upcoming_visit', 'Upcoming Delivery Slot')}
                  </span>
                  <span className="text-xs font-mono font-black text-white/90 bg-white/15 px-2.5 py-1 rounded-xs border border-white/20">
                    Token: {activeBooking.tokenNumber || 'TKN-LKO-1042'}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">
                  {activeBooking.centre?.name || 'Krishi Seva Procurement Centre'}
                </h2>

                <p className="text-sm opacity-90 flex items-center gap-1.5 font-medium text-wheat-accent-light">
                  <MapPin className="w-4 h-4 text-wheat-accent shrink-0" />
                  <span>{activeBooking.centre?.address || 'Gomti Nagar, Lucknow'}</span>
                </p>

                {/* Delivery Snapshot Indicators */}
                <div className="flex items-center gap-3 pt-2 text-xs font-bold flex-wrap">
                  <div className="bg-white/10 text-white px-3 py-1.5 rounded-xs border border-white/30 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-wheat-accent" />
                    <span>{activeBooking.bookingDate}</span>
                  </div>
                  <div className="bg-white/10 text-white px-3 py-1.5 rounded-xs border border-white/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-wheat-accent" />
                    <span>{activeBooking.timeWindow || '09:00 AM - 10:00 AM'}</span>
                  </div>
                  <div className="bg-white/10 text-white px-3 py-1.5 rounded-xs border border-white/30 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-wheat-accent" />
                    <span>{activeBooking.cropType || 'Wheat'} • {activeBooking.estimatedQuantityQuintals || 50} Qtl</span>
                  </div>
                </div>
              </div>

              {/* View Action CTA */}
              <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <Link to={`/farmer/procurement/${activeBooking.id || activeBooking._id}`}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto shadow-brutal-sm min-h-[50px] font-black text-dark-neutral"
                  >
                    <span>{t('farmer.track_journey', 'Track Journey')}</span>
                    <ArrowRight className="w-5 h-5 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/farmer/bookings">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/40 min-h-[50px]"
                  >
                    <span>{t('farmer.view_ticket', 'View Ticket')}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border-3 border-dark-neutral rounded-xs shadow-brutal-lg mb-8 p-6 sm:p-7">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <Badge variant="success" icon={Sprout} size="md">
                  {t('farmer.season_active', 'Active Rabi/Kharif Season')}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black font-heading text-dark-neutral">
                  {t('farmer.ready_to_book', 'Ready to deliver your produce?')}
                </h2>
                <p className="text-xs sm:text-sm text-dark-neutral-muted leading-relaxed font-medium">
                  {t('farmer.avoid_queues_desc', 'Book a guaranteed delivery slot in advance to avoid long queue wait times and ensure prompt weighment and direct MSP payment.')}
                </p>
              </div>

              <Link to="/farmer/find-centres" className="shrink-0 w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-brutal min-h-[52px] font-black">
                  <span>🌾 {t('farmer.book_slot_now', 'Book a Slot Now')}</span>
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. FARMER SERVICES & PROFILE GRID */}
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
                  className="text-xs font-black text-forest-green hover:underline flex items-center gap-1"
                >
                  <span>{t('common.view_details', 'Details')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              }
            >
              <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-dark-neutral/10">
                <div className="w-14 h-14 rounded-xs bg-forest-green-light border-2 border-dark-neutral text-forest-green flex items-center justify-center font-bold text-xl shadow-[2px_2px_0px_#22252A] shrink-0">
                  <User className="w-7 h-7" />
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
                  className="bg-warm-ivory"
                >
                  <User className="w-4 h-4 mr-1.5 text-forest-green" />
                  <span>View Full Farming Profile</span>
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
