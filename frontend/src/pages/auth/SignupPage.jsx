import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import SearchableSelect from '../../components/common/SearchableSelect';
import {
  getStates,
  getDistrictsByState,
  getVillagesByDistrict,
  findClosestDistrictFromCoords
} from '../../data/locations';
import {
  Sprout,
  User,
  MapPin,
  Globe,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Navigation,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export const SignupPage = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route guarding: Only Farmer registration is supported here
  useEffect(() => {
    const role = searchParams.get('role');
    if (role) {
      const upperRole = role.toUpperCase();
      if (upperRole === 'CENTRE_STAFF' || upperRole === 'STAFF') {
        navigate('/staff/register', { replace: true });
      } else if (upperRole === 'ADMIN') {
        navigate('/auth', { replace: true });
      }
    }
  }, [searchParams, navigate]);

  // Wizard Step: 1 = Basic, 2 = Location, 3 = Preferences, 4 = Review
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // Location selection state
  const [isManualVillage, setIsManualVillage] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuggestion, setGpsSuggestion] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    state: '',
    stateCode: '',
    district: '',
    districtCode: '',
    villageName: '',
    localityCode: '',
    locationSource: 'OFFICIAL_DATA',
    languagePreference: 'en'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Dynamic location options
  const states = getStates().map((s) => ({
    value: s.stateCode,
    label: s.stateName,
    stateCode: s.stateCode,
    stateName: s.stateName,
    subtext: `${s.districtCount} districts`
  }));

  const districts = formData.stateCode
    ? getDistrictsByState(formData.stateCode).map((d) => ({
        value: d.districtCode,
        label: d.districtName,
        districtCode: d.districtCode,
        districtName: d.districtName,
        coordinates: d.coordinates,
        subtext: `${d.villageCount} sub-district localities`
      }))
    : [];

  const villages = formData.districtCode
    ? getVillagesByDistrict(formData.districtCode).map((v) => ({
        value: v.localityCode,
        label: v.localityName,
        localityCode: v.localityCode,
        localityName: v.localityName
      }))
    : [];

  // State Change: clears district, village
  const handleStateSelect = (selectedStateCode, stateObj) => {
    if (!selectedStateCode) {
      setFormData((prev) => ({
        ...prev,
        state: '',
        stateCode: '',
        district: '',
        districtCode: '',
        villageName: '',
        localityCode: '',
        locationSource: 'OFFICIAL_DATA'
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      stateCode: selectedStateCode,
      state: stateObj ? stateObj.stateName || stateObj.label : selectedStateCode,
      districtCode: '',
      district: '',
      villageName: '',
      localityCode: '',
      locationSource: isManualVillage ? 'USER_ENTERED' : 'OFFICIAL_DATA'
    }));
  };

  // District Change: clears village
  const handleDistrictSelect = (selectedDistrictCode, distObj) => {
    if (!selectedDistrictCode) {
      setFormData((prev) => ({
        ...prev,
        district: '',
        districtCode: '',
        villageName: '',
        localityCode: '',
        locationSource: 'OFFICIAL_DATA'
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      districtCode: selectedDistrictCode,
      district: distObj ? distObj.districtName || distObj.label : selectedDistrictCode,
      villageName: '',
      localityCode: '',
      locationSource: isManualVillage ? 'USER_ENTERED' : 'OFFICIAL_DATA'
    }));
  };

  // Official Village Select
  const handleVillageSelect = (selectedLocalityCode, villageObj) => {
    setFormData((prev) => ({
      ...prev,
      localityCode: selectedLocalityCode,
      villageName: villageObj ? villageObj.localityName || villageObj.label : selectedLocalityCode,
      locationSource: 'OFFICIAL_DATA'
    }));
  };

  // Manual Village Input
  const handleManualVillageChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      villageName: val,
      localityCode: 'USER_ENTERED',
      locationSource: 'USER_ENTERED'
    }));
  };

  // GPS Assist Handler
  const handleGpsAssist = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please select location manually.');
      return;
    }

    setGpsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const { latitude, longitude } = position.coords;
        const match = findClosestDistrictFromCoords(latitude, longitude);

        if (match) {
          setGpsSuggestion(match);
        } else {
          setErrorMsg(t('auth.detect_district_error'));
        }
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg(t('auth.location_permission_denied'));
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Apply GPS Suggestion with User Confirmation
  const confirmGpsSuggestion = () => {
    if (!gpsSuggestion) return;
    setFormData((prev) => ({
      ...prev,
      state: gpsSuggestion.stateName,
      stateCode: gpsSuggestion.stateCode,
      district: gpsSuggestion.districtName,
      districtCode: gpsSuggestion.districtCode,
      villageName: '',
      localityCode: '',
      locationSource: isManualVillage ? 'USER_ENTERED' : 'OFFICIAL_DATA'
    }));
    setGpsSuggestion(null);
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageSelect = (langCode) => {
    setFormData((prev) => ({
      ...prev,
      languagePreference: langCode
    }));
    changeLanguage(langCode);
  };

  const validateStep = (step) => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setErrorMsg(t('auth.name_required_error'));
        return false;
      }
      if (!formData.phone || formData.phone.length !== 10) {
        setErrorMsg(t('auth.valid_mobile_error'));
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMsg(t('auth.password_min_error'));
        return false;
      }
    } else if (step === 2) {
      if (!formData.stateCode || !formData.state) {
        setErrorMsg(t('auth.select_state_error'));
        return false;
      }
      if (!formData.districtCode || !formData.district) {
        setErrorMsg(t('auth.select_district_error'));
        return false;
      }
      if (!formData.villageName || !formData.villageName.trim()) {
        setErrorMsg(t('auth.specify_village_error'));
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Backend registers exclusively as FARMER
      await register(formData);
      navigate('/farmer');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: t('auth.step_basic'), icon: User },
    { num: 2, label: t('auth.step_location'), icon: MapPin },
    { num: 3, label: t('auth.step_preferences'), icon: Globe },
    { num: 4, label: t('auth.step_review'), icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* Quick Return to Access Selection */}
          <div className="mb-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-dark-neutral-muted hover:text-dark-neutral transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('login.back_to_access')}</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xs bg-forest-green border-2 border-dark-neutral text-wheat-accent mx-auto flex items-center justify-center shadow-[3px_3px_0px_#22252A] mb-3">
              <Sprout className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-dark-neutral">
              {t('auth.signup_title')}
            </h1>
            <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium mt-1">
              {t('auth.signup_subtitle')}
            </p>
          </div>

          {/* Wizard Step Progress Tracker */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm mb-5">
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {steps.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.num;
                const isPast = currentStep > s.num;

                return (
                  <button
                    key={s.num}
                    type="button"
                    disabled={!isPast && !isCurrent}
                    onClick={() => {
                      if (isPast) setCurrentStep(s.num);
                    }}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xs transition-all text-center ${
                      isCurrent
                        ? 'bg-forest-green text-white font-black shadow-[2px_2px_0px_#22252A]'
                        : isPast
                        ? 'bg-forest-green-light text-forest-green font-bold cursor-pointer'
                        : 'bg-warm-ivory/60 text-dark-neutral-muted cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {isPast ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-green shrink-0" />
                      ) : (
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="text-[11px] sm:text-xs">{t('auth.step_num', { num: s.num })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Card shadow="xl" className="border-3 border-dark-neutral p-5 sm:p-7 relative bg-white">
            {errorMsg && (
              <Alert type="error" className="mb-4" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* STEP 1: BASIC DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="border-b-2 border-dark-neutral pb-2 mb-3">
                    <h2 className="text-base font-black font-heading text-dark-neutral flex items-center gap-2">
                      <User className="w-4 h-4 text-forest-green" />
                      <span>{t('auth.step_basic')}</span>
                    </h2>
                  </div>

                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5">
                      {t('auth.full_name')} <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="reg-name"
                      name="fullName"
                      type="text"
                      required
                      placeholder={t('auth.full_name_placeholder')}
                      value={formData.fullName}
                      onChange={handleTextChange}
                      className="w-full px-4 py-3 min-h-[48px] rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral placeholder:text-dark-neutral-muted transition-all shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5">
                      {t('auth.phone')} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-phone"
                        name="phone"
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                        placeholder={t('auth.phone_placeholder')}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                          }))
                        }
                        className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral placeholder:text-dark-neutral-muted transition-all shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm text-sm font-semibold"
                      />
                    </div>
                    <span className="text-[11px] text-dark-neutral-muted font-medium mt-1 block">
                      {t('auth.phone_help')}
                    </span>
                  </div>

                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5">
                      {t('auth.password')} <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={t('auth.password_placeholder')}
                        value={formData.password}
                        onChange={handleTextChange}
                        className="w-full pl-10 pr-11 py-3 min-h-[48px] rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral placeholder:text-dark-neutral-muted transition-all shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dark-neutral-muted hover:text-dark-neutral focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="button" variant="primary" fullWidth size="lg" onClick={nextStep} className="min-h-[48px]">
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION (SEARCHABLE INDIA-WIDE SELECTORS) */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-b-2 border-dark-neutral pb-2 mb-3 flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-black font-heading text-dark-neutral flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-forest-green" />
                        <span>{t('auth.step_location')}</span>
                      </h2>
                      <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                        {t('auth.location_help_text')}
                      </p>
                    </div>

                    {/* GPS Assist Button */}
                    <button
                      type="button"
                      onClick={handleGpsAssist}
                      disabled={gpsLoading}
                      className="px-2.5 py-1.5 bg-warm-ivory border-2 border-neutral-900 text-[11px] font-bold text-forest-800 flex items-center gap-1.5 shadow-[2px_2px_0px_#22252A] hover:bg-forest-50 active:translate-y-0.5"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                      <span>{gpsLoading ? '...' : t('auth.use_current_gps')}</span>
                    </button>
                  </div>

                  {/* GPS Suggestion Modal / Prompt */}
                  {gpsSuggestion && (
                    <div className="bg-forest-50 border-2 border-forest-700 p-3.5 shadow-[3px_3px_0px_#1B4D3E] animate-fadeIn mb-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-forest-800 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-forest-900 uppercase tracking-wider">
                            {t('auth.gps_suggestion_title')}
                          </h4>
                          <p className="text-xs text-forest-800 font-medium mt-0.5">
                            {t('auth.gps_suggestion_desc')}{' '}
                            <strong className="font-bold text-neutral-950">
                              {gpsSuggestion.districtName}, {gpsSuggestion.stateName}
                            </strong>{' '}
                            ({t('farmer.km_away', { distance: gpsSuggestion.distanceKm })})
                          </p>
                          <div className="flex items-center gap-2 mt-2.5">
                            <button
                              type="button"
                              onClick={confirmGpsSuggestion}
                              className="px-3 py-1 bg-forest-700 text-white text-xs font-bold border border-neutral-900 shadow-[2px_2px_0px_#22252A] hover:bg-forest-800"
                            >
                              ✓ {t('auth.gps_confirm_btn')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setGpsSuggestion(null)}
                              className="px-3 py-1 bg-white text-gray-700 text-xs font-bold border border-gray-400 hover:bg-gray-100"
                            >
                              ✕ {t('auth.gps_cancel_btn')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Searchable State / UT Select */}
                  <SearchableSelect
                    id="state-select"
                    label={t('auth.state')}
                    placeholder={t('auth.select_state')}
                    searchPlaceholder={t('auth.search_states_placeholder')}
                    options={states}
                    value={formData.stateCode}
                    onChange={handleStateSelect}
                    required
                  />

                  {/* Searchable District Select */}
                  <SearchableSelect
                    id="district-select"
                    label={t('auth.district')}
                    placeholder={formData.stateCode ? t('auth.select_district') : t('auth.select_state_first')}
                    searchPlaceholder={`${t('common.search')} ${formData.state || ''}...`}
                    options={districts}
                    value={formData.districtCode}
                    onChange={handleDistrictSelect}
                    disabled={!formData.stateCode}
                    required
                    badge={formData.stateCode ? `${districts.length}` : ''}
                  />

                  {/* Village / Town / Locality Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {t('auth.village')} <span className="text-red-600">*</span>
                      </label>

                      {/* Manual Entry Fallback Toggle */}
                      {formData.districtCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualVillage(!isManualVillage);
                            setFormData((prev) => ({
                              ...prev,
                              villageName: '',
                              localityCode: !isManualVillage ? 'USER_ENTERED' : '',
                              locationSource: !isManualVillage ? 'USER_ENTERED' : 'OFFICIAL_DATA'
                            }));
                          }}
                          className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{isManualVillage ? t('auth.use_official_list') : t('auth.cant_find_village')}</span>
                        </button>
                      )}
                    </div>

                    {isManualVillage ? (
                      <div>
                        <input
                          type="text"
                          required
                          value={formData.villageName}
                          onChange={handleManualVillageChange}
                          placeholder={t('auth.manual_village_placeholder')}
                          className="w-full px-4 py-2.5 min-h-[48px] rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral placeholder:text-gray-400 font-semibold text-sm shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                        />
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>
                            {t('auth.location_pending_verification')} ({formData.district},{' '}
                            {formData.state})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <SearchableSelect
                        id="village-select"
                        placeholder={
                          formData.districtCode
                            ? t('auth.select_village')
                            : t('auth.select_district_first')
                        }
                        searchPlaceholder={`${t('common.search')} ${formData.district || ''}...`}
                        options={villages}
                        value={formData.localityCode}
                        onChange={handleVillageSelect}
                        disabled={!formData.districtCode}
                        required
                        badge={formData.districtCode ? `${villages.length}` : ''}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <Button type="button" variant="outline" size="lg" onClick={prevStep} className="min-h-[48px]">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button type="button" variant="primary" size="lg" onClick={nextStep} className="min-h-[48px]">
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: LANGUAGE PREFERENCE */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-b-2 border-dark-neutral pb-2 mb-3">
                    <h2 className="text-base font-black font-heading text-dark-neutral flex items-center gap-2">
                      <Globe className="w-4 h-4 text-forest-green" />
                      <span>{t('auth.step_preferences')}</span>
                    </h2>
                    <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                      {t('auth.preferred_language_desc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect('en')}
                      className={`p-4 rounded-xs border-2 border-dark-neutral text-left transition-all relative flex flex-col justify-between min-h-[100px] ${
                        formData.languagePreference === 'en'
                          ? 'bg-forest-green text-white shadow-brutal -translate-y-0.5'
                          : 'bg-warm-ivory text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-sm font-black">English</span>
                      <span className="text-xs opacity-80">{t('auth.lang_en_desc')}</span>
                      {formData.languagePreference === 'en' && (
                        <CheckCircle2 className="w-4 h-4 text-wheat-accent self-end mt-1" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLanguageSelect('hi')}
                      className={`p-4 rounded-xs border-2 border-dark-neutral text-left transition-all relative flex flex-col justify-between min-h-[100px] ${
                        formData.languagePreference === 'hi'
                          ? 'bg-forest-green text-white shadow-brutal -translate-y-0.5'
                          : 'bg-warm-ivory text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-sm font-black">हिन्दी</span>
                      <span className="text-xs opacity-80">{t('auth.lang_hi_desc')}</span>
                      {formData.languagePreference === 'hi' && (
                        <CheckCircle2 className="w-4 h-4 text-wheat-accent self-end mt-1" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button type="button" variant="outline" size="lg" onClick={prevStep} className="min-h-[48px]">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button type="button" variant="primary" size="lg" onClick={nextStep} className="min-h-[48px]">
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="border-b-2 border-dark-neutral pb-2 mb-3">
                    <h2 className="text-base font-black font-heading text-dark-neutral flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-forest-green" />
                      <span>{t('auth.review_heading')}</span>
                    </h2>
                    <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                      {t('auth.review_desc')}
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-warm-ivory border-2 border-dark-neutral p-4 rounded-xs shadow-[2px_2px_0px_#22252A] space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.full_name')}:</span>
                      <span className="font-black text-dark-neutral">{formData.fullName}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.phone')}:</span>
                      <span className="font-black text-dark-neutral">+91 {formData.phone}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.state')}:</span>
                      <span className="font-black text-dark-neutral">
                        {formData.state} ({formData.stateCode})
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.district')}:</span>
                      <span className="font-black text-dark-neutral">{formData.district}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.village')}:</span>
                      <span className="font-black text-dark-neutral">{formData.villageName}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-dark-neutral/20">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.location_source_label')}:</span>
                      <span
                        className={`font-black ${
                          formData.locationSource === 'USER_ENTERED' ? 'text-amber-700' : 'text-forest-700'
                        }`}
                      >
                        {formData.locationSource === 'USER_ENTERED'
                          ? t('auth.user_entered')
                          : t('auth.official_data')}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-dark-neutral-muted font-bold">{t('auth.role_and_access_label')}</span>
                      <span className="font-black text-forest-green">{t('auth.role_farmer_badge')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button type="button" variant="outline" size="lg" onClick={prevStep} className="min-h-[48px]">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      className="min-h-[48px]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>{t('auth.btn_submit')}</span>
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Login Link & Privileged Account Notice */}
            <div className="mt-6 pt-4 border-t-2 border-dark-neutral/20 text-center text-xs sm:text-sm text-dark-neutral-muted font-medium space-y-2">
              <div>
                <span>{t('auth.already_account')} </span>
                <Link to="/auth/login?role=FARMER" className="font-bold text-forest-green hover:underline">
                  {t('auth.login_here')}
                </Link>
              </div>
              <p className="text-[11px] text-dark-neutral-muted">
                {t('auth.privileged_notice')}
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
