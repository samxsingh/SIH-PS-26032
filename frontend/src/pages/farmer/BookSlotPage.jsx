import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import AgriculturalVisualBackground from '../../components/public/AgriculturalVisualBackground';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Building2,
  Check
} from 'lucide-react';

export const BookSlotPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const centreIdParam = searchParams.get('centreId') || 'c1';

  const [centre, setCentre] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [cropType, setCropType] = useState('Wheat');
  const [estimatedQuantity, setEstimatedQuantity] = useState(50);

  const [isLoadingCentre, setIsLoadingCentre] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch Centre info
  useEffect(() => {
    const fetchCentre = async () => {
      setIsLoadingCentre(true);
      setErrorMsg(null);
      try {
        const res = await apiClient.get(`/centres/${centreIdParam}`);
        if (res.success) {
          setCentre(res.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load centre details.');
      } finally {
        setIsLoadingCentre(false);
      }
    };

    fetchCentre();
  }, [centreIdParam]);

  // Fetch Slots when date or centre changes
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const res = await apiClient.get(`/slots?centreId=${centreIdParam}&date=${selectedDate}`);
        if (res.success) {
          setSlots(res.data || []);
          setSelectedSlot(null);
        }
      } catch (err) {
        // Handled silently
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [centreIdParam, selectedDate]);

  // Generate 7 upcoming dates
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const displayLabel = i === 0 ? t('farmer.date_today', 'Today') : i === 1 ? t('farmer.date_tomorrow', 'Tomorrow') : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    return { dateStr, displayLabel };
  });

  const getCropLabel = (c) => {
    switch (c) {
      case 'Wheat': return t('farmer.crop_wheat', 'Wheat');
      case 'Paddy': return t('farmer.crop_paddy', 'Paddy');
      case 'Pulses': return t('farmer.crop_pulses', 'Pulses');
      case 'Mustard': return t('farmer.crop_mustard', 'Mustard');
      case 'Maize': return t('farmer.crop_maize', 'Maize');
      default: return c;
    }
  };

  const isQtyValid = Number(estimatedQuantity) >= 1 && Number(estimatedQuantity) <= 500;

  const handleConfirmBooking = async () => {
    if (isSubmitting || !selectedSlot || !centre || !isQtyValid) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        centreId: centre._id || centre.id,
        slotId: selectedSlot._id || selectedSlot.id,
        cropType,
        estimatedQuantityQuintals: Number(estimatedQuantity)
      };

      const res = await apiClient.post('/bookings', payload);
      if (res.success && res.data?.booking) {
        setShowReviewModal(false);
        navigate('/farmer/booking-success', { state: { booking: res.data.booking } });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Slot booking failed. Please try another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine current active stepper step (1 to 6)
  // 1: Centre (Done) -> 2: Date (Done) -> 3: Produce (Selected) -> 4: Slot (Selected) -> 5: Review -> 6: Confirm
  const currentStep = !selectedSlot ? 3 : showReviewModal ? 5 : 4;

  const steps = [
    { num: 1, title: 'Centre', done: !!centre },
    { num: 2, title: 'Date', done: !!selectedDate },
    { num: 3, title: 'Produce', done: !!cropType && !!estimatedQuantity },
    { num: 4, title: 'Slot', done: !!selectedSlot },
    { num: 5, title: 'Review', done: showReviewModal },
    { num: 6, title: 'Confirm', done: false }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans relative overflow-x-hidden">
      {/* Contextual Visual Background - FARM mode (subtle) */}
      <AgriculturalVisualBackground variant="farm" position="left" intensity="subtle" showBotanicalFrame={true} />

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter relative z-10">
        <PageHeader
          title={t('farmer.select_slot_title', 'Book a Delivery Slot')}
          subtitle={t('farmer.select_slot_subtitle', 'Choose your preferred date, crop commodity, and reserved intake arrival window')}
          badge={
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xs text-[11px] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-forest-green animate-pulse" />
              <span>Lucknow District Operations</span>
            </span>
          }
        />

        {/* 6-Step Visual Progress Stepper */}
        <div className="bg-white border-2 border-dark-neutral rounded-xs p-3.5 mb-6 shadow-brutal-sm">
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {steps.map((s, idx) => {
              const isCompleted = s.done;
              const isCurrent = s.num === currentStep;
              return (
                <div key={s.num} className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-7 h-7 rounded-xs border-2 border-dark-neutral flex items-center justify-center text-xs font-mono font-black ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCurrent
                        ? 'bg-forest-green text-white shadow-[2px_2px_0px_#22252A]'
                        : 'bg-warm-ivory text-dark-neutral-muted'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-forest-green" /> : s.num}
                  </div>
                  <span
                    className={`text-xs uppercase font-heading ${
                      isCurrent
                        ? 'font-black text-forest-green'
                        : isCompleted
                        ? 'font-bold text-dark-neutral'
                        : 'font-medium text-dark-neutral-muted'
                    }`}
                  >
                    {s.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className="w-4 sm:w-8 h-0.5 bg-dark-neutral/20 ml-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isLoadingCentre ? (
          <LoadingState message={t('farmer.loading_centre_info', 'Loading centre details...')} />
        ) : errorMsg && !centre ? (
          <ErrorState message={errorMsg} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Centre Summary & Produce Form */}
            <div className="lg:col-span-1 space-y-6">
              {centre && (
                <Card title={t('farmer.selected_centre', 'Procurement Centre')} accentBorder shadow="normal">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green-light border border-dark-neutral px-2 py-0.5 rounded-xs shadow-[1px_1px_0px_#22252A]">
                      {centre.centreCode || 'LKO_CENTRE'}
                    </span>
                    <Badge variant="success" size="sm">
                      {centre.verificationStatus || 'Verified'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black font-heading tracking-tight text-dark-neutral mt-1">
                    {centre.name}
                  </h3>

                  {centre.mandiId && (
                    <div className="flex items-center gap-1.5 text-xs text-forest-green font-bold mt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{centre.mandiId.name || 'Lucknow Principal APMC'}</span>
                    </div>
                  )}

                  <p className="text-xs text-dark-neutral-muted font-medium flex items-start gap-1 mt-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-forest-green flex-shrink-0 mt-0.5" />
                    <span>{centre.address}</span>
                  </p>

                  <div className="pt-3 border-t-2 border-dark-neutral/10 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-dark-neutral-muted uppercase tracking-wider">{t('farmer.est_wait_time_label', 'Est. Wait Time')}</span>
                      <span className="font-black text-amber-700">~{centre.estimatedWaitMinutes || 15} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-neutral-muted uppercase tracking-wider">{t('farmer.operating_hours_label', 'Operating Hours')}</span>
                      <span className="font-bold">{centre.operatingHours?.open || '08:00'} - {centre.operatingHours?.close || '18:00'}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Crop & Quantity Form */}
              <Card title={t('farmer.crop_produce_details', 'Crop Produce Details')} shadow="normal">
                <div className="mb-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-dark-neutral mb-2">
                    {t('farmer.select_crop_type', 'Select Crop Commodity')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(centre?.crops && centre.crops.length > 0
                      ? centre.crops
                      : ['Wheat', 'Paddy', 'Mustard', 'Maize']
                    ).slice(0, 4).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCropType(c)}
                        className={`p-2.5 rounded-xs border-2 border-dark-neutral text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                          cropType === c
                            ? 'bg-forest-green text-white shadow-[2px_2px_0px_#22252A] -translate-y-0.5'
                            : 'bg-white text-dark-neutral hover:bg-gray-100'
                        }`}
                      >
                        <Sprout className="w-4 h-4" />
                        <span>{getCropLabel(c)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label={t('farmer.estimated_quantity_label', 'Estimated Produce Quantity (Quintals)')}
                  type="number"
                  min="1"
                  max="500"
                  value={estimatedQuantity}
                  onChange={(e) => setEstimatedQuantity(e.target.value)}
                  helperText={t('farmer.max_quantity_helper', 'Standard truck/trolley capacity: 10 - 250 Quintals')}
                  required
                />
              </Card>
            </div>

            {/* Right Column: Date & Slot Picker */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selection Horizontal Bar */}
              <Card title={t('farmer.select_delivery_date_step', 'Step 2: Select Delivery Date')} shadow="normal">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((d) => (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.dateStr);
                        setSelectedSlot(null);
                      }}
                      className={`px-4 py-3 rounded-xs border-2 border-dark-neutral text-center transition-all flex-shrink-0 min-w-[110px] focus:outline-none cursor-pointer ${
                        selectedDate === d.dateStr
                          ? 'bg-forest-green text-white font-black shadow-brutal-sm -translate-y-0.5'
                          : 'bg-white text-dark-neutral font-bold hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xs block opacity-90 uppercase tracking-wider">{d.displayLabel}</span>
                      <span className="text-sm font-black block mt-0.5 font-mono">{d.dateStr}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Slot Selection Grid */}
              <Card title={t('farmer.select_slot_window_step', 'Step 3: Select Arrival Window')} shadow="normal">
                {isLoadingSlots ? (
                  <LoadingState message={t('farmer.loading_slots', 'Checking live slot availability...')} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isFull = slot.status === 'FULL' || slot.bookedFarmersCount >= slot.maxFarmersAllowed;
                      const slotKey = slot.slotId || slot._id || slot.id || slot.timeWindow;
                      const isSelected = selectedSlot && (
                        (selectedSlot.slotId && slot.slotId && selectedSlot.slotId === slot.slotId) ||
                        (selectedSlot._id && slot._id && selectedSlot._id === slot._id) ||
                        (selectedSlot.id && slot.id && selectedSlot.id === slot.id) ||
                        (selectedSlot.timeWindow === slot.timeWindow)
                      );

                      return (
                        <button
                          key={slotKey}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3.5 rounded-xs border-2 border-dark-neutral text-left flex items-center justify-between transition-all duration-micro ease-tactile disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                            isFull
                              ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-forest-green-light text-forest-green ring-2 ring-forest-green shadow-brutal-sm -translate-y-0.5'
                              : 'bg-white hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-y-0 active:shadow-none shadow-[2px_2px_0px_#22252A]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-black text-sm font-heading">
                              <Clock className="w-4 h-4 text-forest-green" />
                              <span>{slot.timeWindow}</span>
                            </div>
                            <span className="text-xs text-dark-neutral-muted font-bold mt-1 block">
                              {slot.bookedFarmersCount || 0} / {slot.maxFarmersAllowed || 20} slots booked
                            </span>
                          </div>

                          <Badge variant={isFull ? 'danger' : isSelected ? 'success' : 'neutral'}>
                            {isFull ? 'Full' : isSelected ? 'Selected' : 'Available'}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Review & Submit Banner */}
              <div className="bg-white p-5 rounded-xs border-2 border-dark-neutral shadow-brutal flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-heading font-black text-base text-dark-neutral">
                    {selectedSlot ? `Selected Slot: ${selectedSlot.timeWindow}` : 'Please select an arrival slot'}
                  </h4>
                  <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                    {selectedSlot ? `${getCropLabel(cropType)} • ${estimatedQuantity} Quintals on ${selectedDate}` : 'Click any available window above to proceed with booking'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedSlot || !cropType || !isQtyValid || isSubmitting}
                  onClick={() => setShowReviewModal(true)}
                  className="font-black"
                >
                  <span>{t('farmer.review_and_confirm', 'Review & Confirm Booking')}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => !isSubmitting && setShowReviewModal(false)}
          title={t('farmer.review_booking_modal_title', 'Review & Confirm Delivery Appointment')}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" disabled={isSubmitting} onClick={() => setShowReviewModal(false)}>
                {t('farmer.go_back', 'Go Back')}
              </Button>
              <Button variant="primary" isLoading={isSubmitting} disabled={isSubmitting || !isQtyValid} onClick={handleConfirmBooking}>
                <span>{t('farmer.confirm_booking', 'Confirm & Issue Token')}</span>
              </Button>
            </div>
          }
        >
          {errorMsg && (
            <Alert type="error" className="mb-4">
              {errorMsg}
            </Alert>
          )}

          <div className="space-y-4 text-sm font-sans">
            <div className="p-4 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] font-black uppercase bg-white px-2 py-0.5 rounded-xs border border-dark-neutral">
                  {centre?.centreCode || 'LKO_CENTRE'}
                </span>
                <span className="text-xs font-bold text-forest-green">
                  {centre?.district || 'Lucknow'}, Uttar Pradesh
                </span>
              </div>
              <h4 className="font-heading font-black text-forest-green text-base mb-1">{centre?.name}</h4>
              <p className="text-xs text-dark-neutral font-medium">{centre?.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.date_label', 'Date')}</span>
                <span className="font-black text-dark-neutral">{selectedDate}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.time_label', 'Arrival Window')}</span>
                <span className="font-black text-dark-neutral">{selectedSlot?.timeWindow}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.farmer_name_label', 'Farmer Name')}</span>
                <span className="font-black text-dark-neutral">{user?.fullName || 'Kisan Bandhu'}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.crop_and_qty_label', 'Crop & Quantity')}</span>
                <span className="font-black text-dark-neutral">{getCropLabel(cropType)} • {estimatedQuantity} Qtl</span>
              </div>
            </div>

            <Alert type="info" title="Intake Verification Directive">
              Please carry your official Farmer ID / Aadhaar card and registered mobile number for biometric verification at the security intake gate.
            </Alert>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default BookSlotPage;
