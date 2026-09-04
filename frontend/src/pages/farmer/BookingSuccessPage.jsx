import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { CheckCircle2, Ticket, Calendar, Clock, MapPin, Sprout, ArrowRight } from 'lucide-react';

export const BookingSuccessPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state?.booking || {
    tokenNumber: 'TOK-LKO01-20261015-014',
    bookingReference: 'BKG-20261015-9982',
    bookingDate: '2026-10-15',
    timeWindow: '10:00 AM - 11:00 AM',
    cropType: 'Wheat',
    estimatedQuantityQuintals: 50,
    centreName: 'Krishi Seva Procurement Centre — Gomti Nagar',
    centreAddress: 'Vibhuti Khand, Gomti Nagar, Lucknow',
    assignedStaffName: 'Anil Verma',
    assignedStaffDesignation: 'Quality Inspector',
    assignmentStatus: 'ASSIGNED'
  };

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-center">
        {/* Success Card */}
        <div className="bg-white rounded-md border-3 border-dark-neutral shadow-brutal-xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-sm bg-forest-green-light border-2 border-dark-neutral text-forest-green mx-auto flex items-center justify-center mb-4 shadow-[2px_2px_0px_#22252A]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <Badge variant="success" size="lg" className="mb-2">
            {t('farmer.booking_confirmed_badge')}
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-dark-neutral">
            {t('farmer.procurement_slot_reserved')}
          </h2>
          <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium mt-1 max-w-md mx-auto">
            {t('farmer.booking_success_desc')}
          </p>

          {/* Digital Token Ticket Box */}
          <div className="my-6 p-6 bg-forest-green-light rounded-xs border-2 border-dashed border-dark-neutral text-center shadow-[3px_3px_0px_#22252A]">
            <span className="text-xs font-black text-forest-green uppercase tracking-widest block">
              {t('farmer.your_ticket')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-forest-green my-2 font-mono tracking-tight">
              {booking.tokenNumber}
            </h1>
            <p className="text-xs font-bold text-dark-neutral-muted">{t('farmer.ref_label')} {booking.bookingReference}</p>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-left text-sm mb-6 bg-warm-ivory p-4 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
            <div className="flex items-start gap-2 pb-2 border-b-2 border-dark-neutral/10">
              <MapPin className="w-4 h-4 text-forest-green flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.procurement_centre_label')}</span>
                <span className="font-black text-dark-neutral">{booking.centreName}</span>
                <p className="text-xs text-dark-neutral-muted font-medium">{booking.centreAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forest-green" />
                <div>
                  <span className="text-[11px] text-dark-neutral-muted uppercase font-bold block">{t('farmer.date_label')}</span>
                  <span className="font-black text-dark-neutral">{booking.bookingDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-green" />
                <div>
                  <span className="text-[11px] text-dark-neutral-muted uppercase font-bold block">{t('farmer.time_label')}</span>
                  <span className="font-black text-dark-neutral">{booking.timeWindow}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-dark-neutral/10 flex items-center justify-between text-xs">
              <span className="text-dark-neutral-muted uppercase font-bold">{t('farmer.crop_produce_label')}</span>
              <span className="font-black text-dark-neutral">{booking.cropType} • {booking.estimatedQuantityQuintals} Qtl</span>
            </div>

            {/* Assigned Centre Staff Operator */}
            <div className="pt-2 border-t-2 border-dark-neutral/10 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-dark-neutral-muted uppercase font-bold">{t('farmer.assigned_operator_label')}</span>
                <span className="font-black text-forest-green">
                  {booking.assignedStaffName || (booking.assignmentStatus === 'ASSIGNED' ? 'Ravi Sharma' : t('farmer.operator_pending_assignment'))}
                </span>
              </div>
              {booking.assignedStaffDesignation && (
                <div className="flex items-center justify-between">
                  <span className="text-dark-neutral-muted uppercase font-bold">{t('farmer.designation_label')}</span>
                  <span className="font-medium text-dark-neutral">
                    {booking.assignedStaffDesignation}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-dark-neutral-muted uppercase font-bold">{t('farmer.status_label')}</span>
                <Badge variant={booking.assignedStaffName || booking.assignmentStatus === 'ASSIGNED' ? 'success' : 'neutral'}>
                  {booking.assignedStaffName || booking.assignmentStatus === 'ASSIGNED' ? t('farmer.status_assigned') : t('farmer.operator_pending_assignment')}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/farmer/bookings" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" fullWidth>
                <Ticket className="w-5 h-5 mr-2" />
                <span>{t('farmer.view_my_bookings')}</span>
              </Button>
            </Link>

            <Link to="/farmer/find-centres" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth>
                <span>{t('farmer.find_another_centre')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingSuccessPage;
