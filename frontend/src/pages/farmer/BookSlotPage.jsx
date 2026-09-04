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
import { Calendar, Clock, MapPin, CheckCircle2, Sprout, ArrowRight, ShieldCheck } from 'lucide-react';

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
    const displayLabel = i === 0 ? t('farmer.date_today') : i === 1 ? t('farmer.date_tomorrow') : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    return { dateStr, displayLabel };
  });

  const getCropLabel = (c) => {
    switch (c) {
      case 'Wheat': return t('farmer.crop_wheat');
      case 'Paddy': return t('farmer.crop_paddy');
      case 'Pulses': return t('farmer.crop_pulses');
      case 'Mustard': return t('farmer.crop_mustard');
      default: return c;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !centre) return;

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

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        <PageHeader
          title={t('farmer.select_slot_title')}
          subtitle={t('farmer.select_slot_subtitle')}
        />

        {isLoadingCentre ? (
          <LoadingState message={t('farmer.loading_centre_info')} />
        ) : errorMsg && !centre ? (
          <ErrorState message={errorMsg} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Centre Summary & Produce Form */}
            <div className="lg:col-span-1 space-y-6">
              {centre && (
                <Card title={t('farmer.selected_centre')} accentBorder shadow="normal">
                  <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green-light border border-dark-neutral px-2 py-0.5 rounded-xs shadow-[1px_1px_0px_#22252A]">
                    {centre.centreCode || 'SEH01'}
                  </span>
                  <h3 className="text-lg font-black font-heading tracking-tight text-dark-neutral mt-1.5">
                    {centre.name}
                  </h3>
                  <p className="text-xs text-dark-neutral-muted font-medium flex items-start gap-1 mt-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-forest-green flex-shrink-0 mt-0.5" />
                    <span>{centre.address}</span>
                  </p>

                  <div className="pt-3 border-t-2 border-dark-neutral/10 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-dark-neutral-muted uppercase tracking-wider">{t('farmer.est_wait_time_label')}</span>
                      <span className="font-black text-amber-700">~{centre.estimatedWaitMinutes || 30} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-neutral-muted uppercase tracking-wider">{t('farmer.operating_hours_label')}</span>
                      <span className="font-bold">{centre.operatingHours?.open || '08:00'} - {centre.operatingHours?.close || '18:00'}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Crop & Quantity Form */}
              <Card title={t('farmer.crop_produce_details')} shadow="normal">
                <div className="mb-4">
                  <label className="block text-xs font-black uppercase tracking-wider text-dark-neutral mb-2">
                    {t('farmer.select_crop_type')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Wheat', 'Paddy', 'Pulses', 'Mustard'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCropType(c)}
                        className={`p-2.5 rounded-xs border-2 border-dark-neutral text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
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
                  label={t('farmer.estimated_quantity_label')}
                  type="number"
                  min="1"
                  max="500"
                  value={estimatedQuantity}
                  onChange={(e) => setEstimatedQuantity(e.target.value)}
                  helperText={t('farmer.max_quantity_helper')}
                  required
                />
              </Card>
            </div>

            {/* Right Column: Date & Slot Picker */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selection Horizontal Bar */}
              <Card title={t('farmer.select_delivery_date_step')} shadow="normal">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {availableDates.map((d) => (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`px-4 py-3 rounded-xs border-2 border-dark-neutral text-center transition-all flex-shrink-0 min-w-[110px] focus:outline-none ${
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
              <Card title={t('farmer.select_slot_window_step')} shadow="normal">
                {isLoadingSlots ? (
                  <LoadingState message={t('farmer.loading_slots')} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isFull = slot.status === 'FULL' || slot.bookedFarmersCount >= slot.maxFarmersAllowed;
                      const isSelected = selectedSlot && (selectedSlot._id === slot._id || selectedSlot.id === slot.id);

                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3.5 rounded-xs border-2 border-dark-neutral text-left flex items-center justify-between transition-all duration-micro ease-tactile disabled:opacity-50 disabled:cursor-not-allowed ${
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
                              {t('farmer.slot_capacity_label', { booked: slot.bookedFarmersCount, max: slot.maxFarmersAllowed })}
                            </span>
                          </div>

                          <Badge variant={isFull ? 'danger' : isSelected ? 'success' : 'neutral'}>
                            {isFull ? t('farmer.slot_full') : isSelected ? t('farmer.slot_selected') : t('farmer.slot_available')}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Review & Submit Banner */}
              <div className="bg-white p-5 rounded-md border-2 border-dark-neutral shadow-brutal flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-heading font-black text-base text-dark-neutral">
                    {selectedSlot ? t('farmer.selected_slot_summary', { window: selectedSlot.timeWindow }) : t('farmer.prompt_select_slot')}
                  </h4>
                  <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                    {selectedSlot ? t('farmer.crop_qty_summary', { crop: getCropLabel(cropType), qty: estimatedQuantity }) : t('farmer.click_slot_to_proceed')}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!selectedSlot}
                  onClick={() => setShowReviewModal(true)}
                >
                  <span>{t('farmer.review_and_confirm')}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Review Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title={t('farmer.review_booking_modal_title')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
                {t('farmer.go_back')}
              </Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleConfirmBooking}>
                {t('farmer.confirm_booking')}
              </Button>
            </>
          }
        >
          {errorMsg && (
            <Alert type="error" className="mb-4">
              {errorMsg}
            </Alert>
          )}

          <div className="space-y-4 text-sm">
            <div className="p-4 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <h4 className="font-heading font-black text-forest-green text-base mb-1">{centre?.name}</h4>
              <p className="text-xs text-dark-neutral font-medium">{centre?.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.date_label')}</span>
                <span className="font-black text-dark-neutral">{selectedDate}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.time_label')}</span>
                <span className="font-black text-dark-neutral">{selectedSlot?.timeWindow}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.farmer_name_label')}</span>
                <span className="font-black text-dark-neutral">{user?.fullName}</span>
              </div>
              <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <span className="text-xs text-dark-neutral-muted uppercase font-bold block">{t('farmer.crop_and_qty_label')}</span>
                <span className="font-black text-dark-neutral">{getCropLabel(cropType)} • {estimatedQuantity} Qtl</span>
              </div>
            </div>

            <Alert type="info" title={t('farmer.arrival_directive_title')}>
              {t('farmer.arrival_directive_text')}
            </Alert>
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default BookSlotPage;
