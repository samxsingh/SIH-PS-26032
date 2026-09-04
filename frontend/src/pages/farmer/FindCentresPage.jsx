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
  Wheat
} from 'lucide-react';

const LUCKNOW_COORDS = { latitude: 26.8467, longitude: 80.9462, district: 'Lucknow', state: 'Uttar Pradesh' };

export const FindCentresPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cardRefs = useRef({});

  const [centres, setCentres] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [detailModalCentre, setDetailModalCentre] = useState(null);
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

  useEffect(() => {
    fetchCentresAndRecommendation(currentCoords);
  }, []);

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

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre);
    const id = centre._id || centre.id;
    if (cardRefs.current[id]) {
      cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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

  if (activeFilter === 'NEARBY') {
    filtered = filtered.filter((c) => (c.distanceKm || 0) <= 8);
  } else if (activeFilter === 'LOWEST_WAIT') {
    filtered = filtered.filter((c) => (c.estimatedWaitMinutes || 0) <= 30);
  } else if (activeFilter === 'AVAILABLE_SLOTS') {
    filtered = filtered.filter((c) => (c.availableSlotsToday || 12) > 10);
  } else if (activeFilter === 'OPEN_NOW') {
    filtered = filtered.filter((c) => c.isActive !== false);
  }

  if (cropFilter !== 'ALL') {
    filtered = filtered.filter((c) => c.crops && c.crops.includes(cropFilter));
  }

  // 2. Sorting Logic
  if (sortBy === 'NEAREST') {
    filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  } else if (sortBy === 'LOWEST_QUEUE') {
    filtered.sort((a, b) => (a.currentLoadPercentage || 0) - (b.currentLoadPercentage || 0));
  } else if (sortBy === 'EARLIEST_SLOT') {
    filtered.sort((a, b) => (b.availableSlotsToday || 0) - (a.availableSlotsToday || 0));
  } else {
    // RECOMMENDED: balanced score (distance + load + slots)
    filtered.sort((a, b) => {
      const scoreA = (a.distanceKm || 5) * 1.5 + (a.currentLoadPercentage || 40) * 0.5 - (a.availableSlotsToday || 10);
      const scoreB = (b.distanceKm || 5) * 1.5 + (b.currentLoadPercentage || 40) * 0.5 - (b.availableSlotsToday || 10);
      return scoreA - scoreB;
    });
  }

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        <PageHeader
          title={t('farmer.action_find_centre')}
          subtitle={t('farmer.find_centres_subtitle')}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseGps}
                className="hidden sm:inline-flex"
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5 text-forest-green" />
                <span>{t('farmer.refresh_location')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileMap(!showMobileMap)}
                className="lg:hidden"
              >
                {showMobileMap ? <ListFilter className="w-4 h-4 mr-1.5" /> : <Map className="w-4 h-4 mr-1.5" />}
                <span>{showMobileMap ? t('farmer.view_list') : t('farmer.view_map')}</span>
              </Button>
            </div>
          }
        />

        {/* Location Provenance Notice Banner */}
        <div className="bg-white border-2 border-dark-neutral p-3.5 rounded-xs shadow-brutal-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-xs flex items-center justify-center border border-dark-neutral text-white font-bold text-xs ${
              locationMode === 'GPS' ? 'bg-info-blue' : 'bg-forest-green'
            }`}>
              {locationMode === 'GPS' ? <Compass className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-dark-neutral">
                  {locationMode === 'GPS' ? t('farmer.gps_using') : t('farmer.registered_location_badge')}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xs border border-dark-neutral bg-emerald-100 text-forest-green">
                  {currentCoords.district}, {currentCoords.state}
                </span>
              </div>
              <span className="text-[11px] text-dark-neutral-muted font-medium block">
                {t('farmer.coords_verified', {
                  lat: currentCoords.latitude.toFixed(4),
                  lon: currentCoords.longitude.toFixed(4)
                })}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message={t('farmer.fetching_centres')} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={() => fetchCentresAndRecommendation(currentCoords)} />
        ) : (
          <>
            {/* Transparent Smart Recommendation Banner */}
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
                  placeholder={t('farmer.search_centre_placeholder')}
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
                    { id: 'ALL', label: t('farmer.filter_all') },
                    { id: 'NEARBY', label: t('farmer.filter_nearby') },
                    { id: 'LOWEST_WAIT', label: t('farmer.filter_lowest_wait') },
                    { id: 'AVAILABLE_SLOTS', label: t('farmer.filter_available_slots') },
                    { id: 'OPEN_NOW', label: t('farmer.filter_open_now') },
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

                {/* Crop Filter & Sort Selectors */}
                <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-end">
                  <div className="flex items-center gap-1 text-xs font-bold text-dark-neutral">
                    <span className="text-dark-neutral-muted uppercase text-[10px] font-black">{t('farmer.crop_filter_label')}:</span>
                    <select
                      value={cropFilter}
                      onChange={(e) => setCropFilter(e.target.value)}
                      className="px-2 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-bold shadow-[1px_1px_0px_#22252A] focus:outline-none"
                    >
                      <option value="ALL">{t('farmer.all_crops')}</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Paddy">Paddy</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Maize">Maize</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-dark-neutral">
                    <span className="text-dark-neutral-muted uppercase text-[10px] font-black">{t('farmer.sort_label')}:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2 py-1 bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs font-bold shadow-[1px_1px_0px_#22252A] focus:outline-none"
                    >
                      <option value="RECOMMENDED">{t('farmer.sort_recommended')}</option>
                      <option value="NEAREST">{t('farmer.sort_nearest')}</option>
                      <option value="LOWEST_QUEUE">{t('farmer.sort_lowest_queue')}</option>
                      <option value="EARLIEST_SLOT">{t('farmer.sort_earliest_slot')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Desktop View / Stacked Mobile View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Centre Cards List */}
              <div
                className={`lg:col-span-7 space-y-4 ${
                  showMobileMap ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-black text-dark-neutral uppercase tracking-wider">
                  <span>{t('farmer.available_centres', { count: filtered.length })}</span>
                  <span className="text-dark-neutral-muted">{t('farmer.click_to_view_map')}</span>
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
                          onViewDetails={() => setDetailModalCentre(centre)}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center bg-white rounded-xs border-2 border-dark-neutral shadow-brutal text-dark-neutral-muted space-y-2">
                    <p className="font-heading font-black text-base text-dark-neutral">{t('farmer.no_centres_found')}</p>
                    <p className="text-xs font-medium">{t('farmer.no_centres_filter_hint')}</p>
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
                      {t('farmer.reset_filters')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Google / Leaflet Map with 2-Way Sync */}
              <div
                className={`lg:col-span-5 ${
                  showMobileMap ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="sticky top-20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-black font-heading tracking-wider uppercase text-dark-neutral flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-forest-green" />
                      <span>{t('farmer.interactive_map')}</span>
                    </h3>
                  </div>
                  <GoogleCentreMap
                    centres={filtered}
                    selectedCentre={selectedCentre}
                    onSelectCentre={handleSelectCentre}
                    userLocation={{ lat: currentCoords.latitude, lon: currentCoords.longitude }}
                    locationMode={locationMode}
                    height="h-[560px]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Centre Details Modal */}
        {detailModalCentre && (
          <Modal
            isOpen={!!detailModalCentre}
            onClose={() => setDetailModalCentre(null)}
            title={detailModalCentre.name}
            maxWidth="max-w-xl"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="ghost" onClick={() => setDetailModalCentre(null)}>
                  {t('common.close')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const c = detailModalCentre;
                    setDetailModalCentre(null);
                    handleBookCentre(c);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  <span>{t('farmer.book_slot')}</span>
                </Button>
              </div>
            }
          >
            <div className="space-y-3.5 text-xs font-medium text-dark-neutral">
              {/* 1 & 2. Centre Name, Verification Status, and Centre ID */}
              <div className="p-3.5 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-forest-green bg-white px-2 py-0.5 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
                    ID: {detailModalCentre.centreCode || 'LKO-GOM-001'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-green-900 bg-green-100 border border-green-800 px-2.5 py-0.5 rounded-xs inline-flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-800" />
                    <span>GOVERNMENT CERTIFIED PROCUREMENT CENTRE</span>
                  </span>
                </div>
                <h4 className="text-lg font-black font-heading text-dark-neutral">{detailModalCentre.name}</h4>
              </div>

              {/* 3. Full Address & Contact Info */}
              <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] space-y-1.5">
                <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">
                  3. Address & Administrative Contacts
                </span>
                <p className="text-dark-neutral flex items-start gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-forest-green shrink-0 mt-0.5" />
                  <span>{detailModalCentre.address}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-dark-neutral/10">
                  <p className="text-dark-neutral-muted flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-forest-green shrink-0" />
                    <span className="font-bold">{detailModalCentre.contactPhone || '+91 522 2720011'}</span>
                  </p>
                  <p className="text-dark-neutral-muted flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase">District:</span>
                    <span className="font-bold text-dark-neutral">{detailModalCentre.district || 'Lucknow'}, {detailModalCentre.state || 'Uttar Pradesh'}</span>
                  </p>
                </div>
              </div>

              {/* 4 & 5. Operating Hours & Real-Time Queue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block mb-1">
                    4. Operating Schedule
                  </span>
                  <p className="font-black text-dark-neutral">08:00 AM – 06:00 PM</p>
                  <span className="text-[10px] text-dark-neutral-muted block mt-0.5">Monday to Saturday • Open Today</span>
                </div>

                <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block mb-1">
                    5. Real-Time Queue & Wait Time
                  </span>
                  <p className="font-black text-amber-800">
                    ~{detailModalCentre.estimatedWaitMinutes || 25} mins estimated wait
                  </p>
                  <span className="text-[10px] text-dark-neutral-muted block mt-0.5">
                    Queue status: Low congestion ({detailModalCentre.availableSlotsToday || 12} slots available)
                  </span>
                </div>
              </div>

              {/* 6. Capacity (Daily Intake vs Current Load) */}
              <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted">
                    6. Facility Capacity & Current Load
                  </span>
                  <span className="font-mono font-bold text-forest-green">
                    {detailModalCentre.dailyCapacityQuintals || 1500} Qtl / Day Intake
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden border border-dark-neutral">
                  <div
                    className="bg-forest-green h-full rounded-full"
                    style={{ width: `${detailModalCentre.currentLoadPercentage || 40}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-dark-neutral-muted mt-1">
                  <span>Current Utilization: {detailModalCentre.currentLoadPercentage || 40}%</span>
                  <span>Ample Capacity Available</span>
                </div>
              </div>

              {/* 7. Accepted Commodities & Quality Guidelines */}
              <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] space-y-1.5">
                <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">
                  7. Accepted Crops & Fair Average Quality (FAQ) Standards
                </span>
                <div className="flex gap-1.5 flex-wrap pb-1">
                  {(detailModalCentre.crops || ['Wheat', 'Paddy', 'Mustard', 'Maize']).map((crop) => (
                    <span key={crop} className="px-2.5 py-0.5 bg-amber-50 border border-amber-400 text-amber-950 text-[11px] font-black rounded-xs">
                      {crop}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-dark-neutral-muted leading-relaxed border-t border-dark-neutral/10 pt-1">
                  • Produce must meet standard FAQ criteria: Maximum moisture limit 12.0%, foreign matter &lt; 0.75%, damaged/weeviled grains &lt; 2.0%.
                </p>
              </div>

              {/* 8. Appointed Head & Staff Availability */}
              <div className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">
                    8. Appointed Head & Operating Personnel
                  </span>
                  <span className="font-black text-dark-neutral block mt-0.5">
                    Satish Kumar (Appointed Centre Head)
                  </span>
                  <span className="text-[10px] text-dark-neutral-muted">
                    6 Active Staff Personnel on Duty (Quality Inspectors & Weighing Operators)
                  </span>
                </div>
                <Badge variant="success">Staff Ready</Badge>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default FindCentresPage;
