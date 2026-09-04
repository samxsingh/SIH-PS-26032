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
import { Calendar, MapPin, Ticket, PackageCheck, User, CheckCircle2, ArrowRight, Sprout, ShieldCheck } from 'lucide-react';

export const FarmerDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const res = await apiClient.get('/bookings/my');
        if (res.success && res.data && res.data.length > 0) {
          const upcoming = res.data.find((b) => b.bookingStatus === 'CONFIRMED');
          if (upcoming) setActiveBooking(upcoming);
        }
      } catch (err) {
        // Handled silently
      } finally {
        setIsLoadingBooking(false);
      }
    };

    fetchActiveBooking();
  }, []);

  const farmerActions = [
    {
      id: 'book-slot',
      title: t('farmer.action_book_slot'),
      description: t('farmer.action_book_slot_desc'),
      icon: Calendar,
      bgColor: 'bg-emerald-100 text-emerald-900',
      link: '/farmer/find-centres',
    },
    {
      id: 'find-centre',
      title: t('farmer.action_find_centre'),
      description: t('farmer.action_find_centre_desc'),
      icon: MapPin,
      bgColor: 'bg-blue-100 text-blue-900',
      link: '/farmer/find-centres',
    },
    {
      id: 'my-booking',
      title: t('farmer.action_my_booking'),
      description: t('farmer.action_my_booking_desc'),
      icon: Ticket,
      bgColor: 'bg-amber-100 text-amber-900',
      link: '/farmer/bookings',
    },
    {
      id: 'track-procurement',
      title: t('farmer.action_track_procurement'),
      description: t('farmer.action_track_procurement_desc'),
      icon: PackageCheck,
      bgColor: 'bg-purple-100 text-purple-900',
      link: '/farmer/bookings',
    }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        {/* Page Header */}
        <PageHeader
          title={`${t('farmer.greeting')}, ${user?.fullName || 'Kisan Bandhu'} 👋`}
          subtitle={t('farmer.welcome_sub')}
          badge={<Badge variant="success" icon={CheckCircle2}>{t('auth.role_farmer')}</Badge>}
        />

        {/* Dynamic Hero Banner */}
        {activeBooking ? (
          <div className="bg-forest-green text-white border-3 border-dark-neutral rounded-xs shadow-brutal-lg mb-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-dark-neutral bg-wheat-accent border border-dark-neutral px-3 py-1 rounded-xs inline-block mb-2 shadow-[2px_2px_0px_#22252A]">
                  {t('farmer.upcoming_visit')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-white">{activeBooking.centre?.name}</h2>
                <p className="text-sm opacity-90 mt-1 flex items-center gap-1 font-medium text-wheat-accent-light">
                  <MapPin className="w-4 h-4 text-wheat-accent flex-shrink-0" />
                  <span>{activeBooking.centre?.address}</span>
                </p>

                <div className="flex items-center gap-3 mt-4 text-xs font-bold flex-wrap">
                  <div className="bg-white/10 text-white px-3 py-1.5 rounded-xs border-2 border-white/30">
                    🗓️ {t('farmer.date_label')}: {activeBooking.bookingDate}
                  </div>
                  <div className="bg-white/10 text-white px-3 py-1.5 rounded-xs border-2 border-white/30">
                    ⏰ {t('farmer.time_label')}: {activeBooking.timeWindow}
                  </div>
                  <div className="bg-wheat-accent text-dark-neutral font-black font-mono px-3 py-1.5 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    🎟️ {activeBooking.tokenNumber}
                  </div>
                </div>
              </div>

              <Link to="/farmer/bookings">
                <Button variant="secondary" size="lg" className="shadow-brutal-sm min-h-[48px]">
                  <span>{t('farmer.view_ticket')}</span>
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-forest-green-light border-3 border-dark-neutral rounded-xs shadow-brutal-lg mb-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Badge variant="success" icon={Sprout} size="lg" className="mb-2">
                  {t('farmer.season_active')}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-black font-heading text-dark-neutral">
                  {t('farmer.ready_to_book')}
                </h2>
                <p className="text-sm text-dark-neutral-muted mt-1 max-w-xl leading-relaxed font-medium">
                  {t('farmer.avoid_queues_desc')}
                </p>
              </div>

              <Link to="/farmer/find-centres">
                <Button variant="primary" size="lg" className="shadow-brutal-sm min-h-[48px]">
                  <span>🌾 {t('farmer.book_slot_now')}</span>
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Farmer Profile Card with Administrative Location Hierarchy */}
          <div className="lg:col-span-1">
            <Card title={t('farmer.profile_summary')} accentBorder shadow="normal">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-dark-neutral/10">
                <div className="w-12 h-12 rounded-xs bg-forest-green-light border-2 border-dark-neutral text-forest-green flex items-center justify-center font-bold text-xl shadow-[2px_2px_0px_#22252A]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-dark-neutral">{user?.fullName}</h3>
                  <p className="text-xs font-bold text-dark-neutral-muted">📱 +91 {user?.phone}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider">{t('farmer.district_label')}:</span>
                  <span className="font-black text-dark-neutral">{user?.district || 'Lucknow'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider">{t('farmer.state_label')}:</span>
                  <span className="font-black text-dark-neutral">{user?.state || 'Uttar Pradesh'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-dark-neutral-muted uppercase font-bold tracking-wider">{t('farmer.village_label')}:</span>
                  <span className="font-black text-dark-neutral">{user?.villageName || 'Chinhat'}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {farmerActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.link)}
                    className="p-5 rounded-xs bg-white border-2 border-dark-neutral shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0 active:shadow-brutal transition-all duration-normal ease-tactile cursor-pointer flex flex-col justify-between group min-h-[140px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xs border-2 border-dark-neutral ${action.bgColor} shadow-[2px_2px_0px_#22252A]`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="font-heading font-black text-lg text-dark-neutral group-hover:text-forest-green transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-dark-neutral-muted mt-1 leading-relaxed font-medium">
                        {action.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-dark-neutral/10 flex items-center justify-between text-xs font-black text-forest-green">
                      <span>{t('farmer.access_service')}</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FarmerDashboardPage;
