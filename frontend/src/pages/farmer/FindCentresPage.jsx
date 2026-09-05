import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import RecommendationBanner from '../../components/farmer/RecommendationBanner';
import CentreCard from '../../components/farmer/CentreCard';
import GoogleCentreMap from '../../components/farmer/GoogleCentreMap';
import CentreDetailsPanel from '../../components/farmer/CentreDetailsPanel';
import Modal from '../../components/common/Modal';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Map,
  ListFilter,
  Navigation,
  Info,
  ShieldCheck,
  Compass,
  Calendar,
  Phone,
  Clock,
  CheckCircle2,
  Wheat,
  Building2
} from 'lucide-react';

const LUCKNOW_COORDS = { latitude: 26.8467, longitude: 80.9462, district: 'Lucknow', state: 'Uttar Pradesh' };

export const FindCentresPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cardRefs = useRef({});

  const [centres, setCentres] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [detailModalCentre, setDetailModalCentre] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null); // { type: 'CENTRE' | 'MANDI', data: Object }
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Default demo geography is strictly LUCKNOW, UTTAR PRADESH
  const [locationMode, setLocationMode] = useState('REGISTERED'); // 'GPS' or 'REGISTERED'
  const [currentCoords, setCurrentCoords] = useState(LUCKNOW_COORDS);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, NEARBY, LOWEST_WAIT, AVAILABLE_SLOTS, OPEN_NOW
  const [cropFilter, setCropFilter] = useState('ALL'); // ALL, Wheat, Paddy, Mustard, Maize
  const [sortBy, setSortBy] = useState('RECOMMENDED'); // RECOMMENDED, NEAREST, LOWEST_QUEUE, EARLIEST_SLOT
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    fetchCentresAndRecommendation(currentCoords);
    fetchMandis();
    fetchActiveBooking();
  }, []);

  const fetchActiveBooking = async () => {
    try {
      const res = await apiClient.get('/bookings/my');
      if (res.success && res.data && res.data.length > 0) {
        const upcoming = res.data.find(
          (b) => b.bookingStatus === 'CONFIRMED' || b.operationalStatus !== 'COMPLETED'
        );
        if (upcoming) setActiveBooking(upcoming);
      }
    } catch (err) {
      // Handled silently
    }
  };

  const fetchMandis = async () => {
    try {
      const res = await apiClient.get('/mandis?district=Lucknow');
      if (res.success && res.data) {
        setMandis(res.data);
      }
    } catch (err) {
      console.warn('[FindCentres] Could not load Mandis list:', err.message);
    }
  };

  const handleUseGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            district: 'Lucknow',
            state: 'Uttar Pradesh'
          };
          setCurrentCoords(gpsCoords);
          setLocationMode('GPS');
          fetchCentresAndRecommendation(gpsCoords);
        },
        (err) => {
          console.info('[Location Service] GPS permission unavailable or denied. Using default demo location.', err.message);
          setCurrentCoords(LUCKNOW_COORDS);
          setLocationMode('REGISTERED');
          fetchCentresAndRecommendation(LUCKNOW_COORDS);
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    }
  };

  const fetchCentresAndRecommendation = async (coords) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const lat = coords?.latitude || LUCKNOW_COORDS.latitude;
      const lon = coords?.longitude || LUCKNOW_COORDS.longitude;

      // Fetch all approved/active centres relative to coordinates
      const centresRes = await apiClient.get(`/centres?lat=${lat}&lon=${lon}`);
      if (centresRes.success) {
        const fetchedCentres = centresRes.data || [];
        setCentres(fetchedCentres);
        if (fetchedCentres.length > 0 && !selectedCentre) {
          setSelectedCentre(fetchedCentres[0]);
        }
      }

      // Fetch transparent deterministic recommendation
      const recRes = await apiClient.get(`/centres/recommend?lat=${lat}&lon=${lon}`);
      if (recRes.success) {
        setRecommendation(recRes.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to fetch procurement centres. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookCentre = (centre) => {
    const centreId = centre._id || centre.id;
    navigate(`/farmer/book-slot?centreId=${centreId}`);
  };

  const handleSelectCentre = (centre, openDrawer = true, fromMap = false) => {
    setSelectedCentre(centre);
    if (openDrawer) {
      setSelectedEntity({ type: 'CENTRE', data: centre });
      setDetailModalCentre(centre);
    }
    // Only scroll into view if card is outside viewport and action didn't come from map
    const id = centre._id || centre.id;
    if (!fromMap && cardRefs.current[id]) {
      const rect = cardRefs.current[id].getBoundingClientRect();
      const isInViewport = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (!isInViewport) {
        cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleSelectMandi = (mandi) => {
    setSelectedEntity({ type: 'MANDI', data: mandi });
  };

  // 1. Filter Logic
  let filtered = [...centres];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.villageName && c.villageName.toLowerCase().includes(q)) ||
        c.district.toLowerCase().includes(q) ||
        (c.crops && c.crops.some((crop) => crop.toLowerCase().includes(q)))
    );
  }

  if (cropFilter !== 'ALL') {
    filtered = filtered.filter((c) => c.crops && c.crops.includes(cropFilter));
  }

  if (activeFilter === 'NEARBY') {
    filtered = filtered.filter((c) => c.distanceKm != null && c.distanceKm < 15);
  } else if (activeFilter === 'LOWEST_WAIT') {
    filtered = filtered.filter((c) => c.estimatedWaitMinutes != null && c.estimatedWaitMinutes <= 30);
  } else if (activeFilter === 'AVAILABLE_SLOTS') {
    filtered = filtered.filter((c) => c.availableSlotsToday && c.availableSlotsToday > 0);
  } else if (activeFilter === 'OPEN_NOW') {
    filtered = filtered.filter((c) => c.isActive);
  }

  // 2. Sort Logic
  if (sortBy === 'NEAREST') {
    filtered.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  } else if (sortBy === 'LOWEST_QUEUE') {
    filtered.sort((a, b) => (a.activeQueueCount || 0) - (b.activeQueueCount || 0));
  } else if (sortBy === 'EARLIEST_SLOT') {
    filtered.sort((a, b) => (b.availableSlotsToday || 0) - (a.availableSlotsToday || 0));
  } else if (sortBy === 'RECOMMENDED' && recommendation?.recommendedCentre) {
    const recId = recommendation.recommendedCentre._id || recommendation.recommendedCentre.id;
    filtered.sort((a, b) => {
      const aId = a._id || a.id;
      const bId = b._id || b.id;
      if (aId === recId) return -1;
      if (bId === recId) return 1;
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });
  }

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-page-enter">
        {/* Header with Geography Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <PageHeader
            title={t('farmer.find_centres_title', 'Procurement Centres Discovery')}
            subtitle={t('farmer.find_centres_subtitle', 'Browse verified mandis and state grain procurement centres across Lucknow District')}
            badge={
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xs text-[11px] font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
                <span>Lucknow & Adjacent Hubs</span>
              </span>
            }
          />

          {/* Location Mode Toggle */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xs border-2 border-dark-neutral shadow-brutal-sm self-start sm:self-auto">
            <button
              onClick={() => {
                setLocationMode('REGISTERED');
                setCurrentCoords(LUCKNOW_COORDS);
                fetchCentresAndRecommendation(LUCKNOW_COORDS);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 ${
                locationMode === 'REGISTERED'
                  ? 'bg-forest-green text-white shadow-[1px_1px_0px_#22252A]'
                  : 'text-dark-neutral hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('farmer.registered_village', 'Lucknow District')}</span>
            </button>

            <button
              onClick={handleUseGps}
              className={`px-3 py-1.5 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 ${
                locationMode === 'GPS'
                  ? 'bg-blue-600 text-white shadow-[1px_1px_0px_#22252A]'
                  : 'text-dark-neutral hover:bg-gray-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('farmer.use_live_gps', 'Live GPS')}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Toggle (Map vs List) */}
        <div className="lg:hidden mb-4 flex border-2 border-dark-neutral rounded-xs overflow-hidden shadow-brutal-sm">
          <button
            onClick={() => setShowMobileMap(false)}
            className={`flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 ${
              !showMobileMap ? 'bg-forest-green text-white' : 'bg-white text-dark-neutral'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{t('farmer.view_list', 'Centres List')} ({filtered.length})</span>
          </button>
          <button
            onClick={() => setShowMobileMap(true)}
            className={`flex-1 py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2 ${
              showMobileMap ? 'bg-forest-green text-white' : 'bg-white text-dark-neutral'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>{t('farmer.view_map', 'Interactive Map')}</span>
          </button>
        </div>

        {isLoading ? (
          <LoadingState message={t('farmer.loading_centres', 'Discovering procurement centres in Lucknow...')} />
        ) : errorMsg ? (
          <ErrorState
            title={t('farmer.error_loading_centres', 'Unable to Load Centres')}
            message={errorMsg}
            onRetry={() => fetchCentresAndRecommendation(currentCoords)}
          />
        ) : (
          <>
            {/* Smart Transparent Recommendation Banner */}
            {recommendation && (
              <RecommendationBanner
                recommendationData={recommendation}
                onBookRecommended={handleBookCentre}
                locationMode={locationMode}
              />
            )}

            {/* Search & Filter Controls */}
            <div className="bg-white p-4 rounded-xs border-2 border-dark-neutral shadow-brutal mb-6 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  placeholder={t('farmer.search_centre_placeholder', 'Search by centre name, locality, mandi, or crop...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xs border-2 border-dark-neutral bg-warm-ivory text-dark-neutral placeholder:text-dark-neutral-muted text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:bg-white"
                />
                <Search className="w-4 h-4 text-dark-neutral absolute left-3.5 top-3.5" />
              </div>

              {/* Filters & Sorting Bar */}
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between pt-1">
                {/* Category Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'ALL', label: t('farmer.filter_all', 'All Centres') },
                    { id: 'NEARBY', label: t('farmer.filter_nearby', 'Nearby (<15km)') },
                    { id: 'LOWEST_WAIT', label: t('farmer.filter_lowest_wait', 'Lowest Wait (<30m)') },
                    { id: 'AVAILABLE_SLOTS', label: t('farmer.filter_available_slots', 'Available Slots') },
                    { id: 'OPEN_NOW', label: t('farmer.filter_open_now', 'Open Today') },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-xs border-2 border-dark-neutral transition-all shadow-[1px_1px_0px_#22252A] ${
                        activeFilter === tab.id
                          ? 'bg-forest-green text-white -translate-y-0.5 shadow-brutal-sm'
                          : 'bg-warm-ivory text-dark-neutral hover:bg-gray-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Crop Filter, Sort Selectors, & Polyline Route Toggle */}
                <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-end">
                  <div className="flex items-center gap-1 text-xs font-bold text-dark-neutral">
                    <span className="text-dark-neutral-muted uppercase text-[10px] font-black">{t('farmer.crop_filter_label', 'Crop')}:</span>
                    <select
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                      className="px-2 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-bold shadow-[1px_1px_0px_#22252A] focus:outline-none"
                    >
                      <option value="ALL">{t('farmer.all_crops', 'All Crops')}</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Paddy">Paddy</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Maize">Maize</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-dark-neutral">
                    <span className="text-dark-neutral-muted uppercase text-[10px] font-black">{t('farmer.sort_label', 'Sort')}:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-bold shadow-[1px_1px_0px_#22252A] focus:outline-none"
                    >
                      <option value="RECOMMENDED">{t('farmer.sort_recommended', 'Recommended')}</option>
                      <option value="NEAREST">{t('farmer.sort_nearest', 'Nearest')}</option>
                      <option value="LOWEST_QUEUE">{t('farmer.sort_lowest_queue', 'Lowest Queue')}</option>
                      <option value="EARLIEST_SLOT">{t('farmer.sort_earliest_slot', 'Most Slots')}</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowRoute(!showRoute)}
                    className={`px-2.5 py-1 text-xs font-black rounded-xs border-2 border-dark-neutral transition-all flex items-center gap-1 shadow-[1px_1px_0px_#22252A] ${
                      showRoute
                        ? 'bg-emerald-800 text-white'
                        : 'bg-warm-ivory text-dark-neutral hover:bg-gray-100'
                    }`}
                    title="Toggle direct path route polyline to selected centre"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{showRoute ? 'Hide Route' : 'Show Route'}</span>
                  </button>
                </div>
              </div>

              {/* Route Preview vs External Nav Notice */}
              {showRoute && (
                <div className="mt-2 text-[11px] text-dark-neutral-muted flex items-center gap-1.5 font-medium bg-emerald-50 px-3 py-1.5 rounded-xs border border-emerald-300">
                  <Navigation className="w-3 h-3 text-forest-green flex-shrink-0" />
                  <span>{t('farmer.route_preview_notice', 'Route preview shown using direct path geometry. Click "Get Directions" in centre drawer for turn-by-turn navigation.')}</span>
                </div>
              )}
            </div>

            {/* Map-First Desktop View (7 cols Map, 5 cols Cards) / Stacked Mobile View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column on Desktop: Interactive Google / Leaflet Map with 2-Way Sync & Mandis (lg:order-2 lg:col-span-7) */}
              <div
                className={`lg:col-span-7 lg:order-2 ${
                  showMobileMap ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="sticky top-20 space-y-2">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xs border-2 border-dark-neutral shadow-brutal-xs">
                    <h3 className="text-xs font-black font-heading tracking-wider uppercase text-dark-neutral flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-forest-green" />
                      <span>{t('farmer.interactive_map', 'Lucknow District Map & Mandi Network')}</span>
                    </h3>
                    <span className="text-[10px] font-bold text-dark-neutral-muted bg-warm-ivory px-2 py-0.5 rounded-xs border border-dark-neutral/30 font-mono">
                      🏛️ {mandis.length} Mandis • 🌾 {centres.length} Centres
                    </span>
                  </div>
                  <GoogleCentreMap
                    centres={filtered}
                    mandis={mandis}
                    selectedCentre={selectedCentre}
                    onSelectCentre={(c) => handleSelectCentre(c, true, true)}
                    onSelectMandi={handleSelectMandi}
                    userLocation={{ lat: currentCoords.latitude, lon: currentCoords.longitude }}
                    locationMode={locationMode}
                    height="h-[620px]"
                    showRoute={showRoute}
                  />
                  <div className="flex items-center justify-between text-[11px] text-dark-neutral-muted px-1 font-medium">
                    <span>💡 Click any centre or mandi marker to inspect live capacity, wait time & details</span>
                    <span className="font-bold text-forest-green">{selectedCentre ? `Focused: ${selectedCentre.name}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Right Column on Desktop: Centre Cards List (lg:order-1 lg:col-span-5) */}
              <div
                className={`lg:col-span-5 lg:order-1 space-y-4 ${
                  showMobileMap ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-black text-dark-neutral uppercase tracking-wider">
                  <span>{t('farmer.available_centres', { count: filtered.length, defaultValue: `${filtered.length} Centres in Lucknow Scope` })}</span>
                  <span className="text-dark-neutral-muted">{t('farmer.click_to_view_map', 'Select to sync on map')}</span>
                </div>

                {filtered.length > 0 ? (
                  filtered.map((centre) => {
                    const isSelected = selectedCentre && (selectedCentre._id === centre._id || selectedCentre.id === centre.id);
                    const id = centre._id || centre.id;
                    return (
                      <div
                        key={id}
                        ref={(el) => (cardRefs.current[id] = el)}
                        onClick={() => handleSelectCentre(centre)}
                        className="cursor-pointer"
                      >
                        <CentreCard
                          centre={centre}
                          isSelected={isSelected}
                          onSelectCentre={handleBookCentre}
                          onViewDetails={() => {
                            setSelectedEntity({ type: 'CENTRE', data: centre });
                            setDetailModalCentre(centre);
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center bg-white rounded-xs border-2 border-dark-neutral shadow-brutal text-dark-neutral-muted space-y-2">
                    <p className="font-heading font-black text-base text-dark-neutral">{t('farmer.no_centres_found', 'No procurement centres matched')}</p>
                    <p className="text-xs font-medium">{t('farmer.no_centres_filter_hint', 'Try clearing your filters or search keywords.')}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('ALL');
                        setCropFilter('ALL');
                      }}
                      className="mt-3"
                    >
                      {t('farmer.reset_filters', 'Reset Filters')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Slide-out Centre / Mandi Details Drawer */}
        <CentreDetailsPanel
          entity={selectedEntity?.data || detailModalCentre}
          entityType={selectedEntity?.type || (detailModalCentre ? 'CENTRE' : null)}
          centre={detailModalCentre}
          isOpen={Boolean(selectedEntity || detailModalCentre)}
          onClose={() => {
            setSelectedEntity(null);
            setDetailModalCentre(null);
          }}
          onBookSlot={(c) => {
            setSelectedEntity(null);
            setDetailModalCentre(null);
            handleBookCentre(c);
          }}
          centres={centres}
          onSelectCentre={(c) => handleSelectCentre(c, true, false)}
          userLocation={{ lat: currentCoords.latitude, lon: currentCoords.longitude }}
          activeBooking={activeBooking}
        />
      </main>
    </div>
  );
};

export default FindCentresPage;
