import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getStates,
  getDistrictsByState,
  getVillagesByDistrict,
  findClosestDistrictFromCoords
} from '../../data/locations';
import SearchableSelect from '../../components/common/SearchableSelect';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import GoogleMapWrapper from '../../components/common/GoogleMapWrapper';
import {
  Sprout,
  Globe,
  Building2,
  User,
  ShieldCheck,
  MapPin,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  Trash2,
  Lock,
  Phone,
  Mail,
  Navigation,
  FileCheck
} from 'lucide-react';
import apiClient from '../../services/apiClient';

export const StaffRegisterPage = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account Details
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',

    // Step 2: Centre Information
    centreName: '',
    centreType: 'GOVERNMENT_CENTRE',
    registrationNumber: '',
    state: '',
    stateCode: '',
    district: '',
    districtCode: '',
    localityName: '',
    localityCode: '',
    locationSource: 'OFFICIAL_DATA',
    address: '',
    pinCode: '',
    centreContact: '',
    latitude: null,
    longitude: null,

    // Step 3: Documents List
    documents: []
  });

  const [isManualVillage, setIsManualVillage] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsSuggestion, setGpsSuggestion] = useState(null);

  // India-wide Location Lists
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

  const handleStateSelect = (selectedStateCode, stateObj) => {
    if (!selectedStateCode) {
      setFormData((prev) => ({
        ...prev,
        state: '',
        stateCode: '',
        district: '',
        districtCode: '',
        localityName: '',
        localityCode: ''
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      stateCode: selectedStateCode,
      state: stateObj ? stateObj.stateName || stateObj.label : selectedStateCode,
      districtCode: '',
      district: '',
      localityName: '',
      localityCode: ''
    }));
  };

  const handleDistrictSelect = (selectedDistrictCode, distObj) => {
    if (!selectedDistrictCode) {
      setFormData((prev) => ({
        ...prev,
        district: '',
        districtCode: '',
        localityName: '',
        localityCode: ''
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      districtCode: selectedDistrictCode,
      district: distObj ? distObj.districtName || distObj.label : selectedDistrictCode,
      localityName: '',
      localityCode: '',
      latitude: distObj?.coordinates?.latitude || prev.latitude,
      longitude: distObj?.coordinates?.longitude || prev.longitude
    }));
  };

  const handleLocalitySelect = (selectedLocalityCode, locObj) => {
    setFormData((prev) => ({
      ...prev,
      localityCode: selectedLocalityCode || '',
      localityName: locObj ? locObj.localityName || locObj.label : '',
      locationSource: 'OFFICIAL_DATA'
    }));
  };

  const handleGpsAssist = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const closest = findClosestDistrictFromCoords(latitude, longitude);
        setIsLocating(false);

        if (closest) {
          setGpsSuggestion({
            state: closest.stateName,
            stateCode: closest.stateCode,
            district: closest.districtName,
            districtCode: closest.districtCode,
            latitude,
            longitude
          });
        }
      },
      (err) => {
        setIsLocating(false);
        setErrorMsg('Unable to detect GPS coordinates. Please select manually from the official list.');
      },
      { timeout: 8000 }
    );
  };

  const applyGpsSuggestion = () => {
    if (!gpsSuggestion) return;
    setFormData((prev) => ({
      ...prev,
      state: gpsSuggestion.state,
      stateCode: gpsSuggestion.stateCode,
      district: gpsSuggestion.district,
      districtCode: gpsSuggestion.districtCode,
      latitude: gpsSuggestion.latitude,
      longitude: gpsSuggestion.longitude
    }));
    setGpsSuggestion(null);
  };

  const handleFileUpload = (docType, docName, file) => {
    if (!file) return;

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File "${file.name}" exceeds the maximum allowed size of 10MB.`);
      return;
    }

    // Check allowed format
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setErrorMsg(`Invalid file type. Only PDF, JPG, JPEG, and PNG files are accepted.`);
      return;
    }

    setErrorMsg(null);
    setFormData((prev) => {
      const existing = prev.documents.filter((d) => d.docType !== docType);
      return {
        ...prev,
        documents: [
          ...existing,
          {
            docType,
            docName,
            originalFileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileInstance: file
          }
        ]
      };
    });
  };

  const handleRemoveDoc = (docType) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.docType !== docType)
    }));
  };

  // Step Validation
  const validateStep = (step) => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.fullName.trim()) {
        setErrorMsg('Please enter Authorized Representative Name.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email.trim())) {
        setErrorMsg('Please enter a valid Official Centre Email.');
        return false;
      }
      const cleanPhone = formData.mobile.replace(/\D/g, '');
      if (cleanPhone.length !== 10 || !['6', '7', '8', '9'].includes(cleanPhone[0])) {
        setErrorMsg('Please enter a valid 10-digit Indian Contact Mobile Number.');
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('Confirm password must match the password.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.centreName.trim()) {
        setErrorMsg('Please enter Procurement Centre Name.');
        return false;
      }
      if (!formData.registrationNumber.trim()) {
        setErrorMsg('Please enter Centre Registration / License Number.');
        return false;
      }
      if (!formData.stateCode || !formData.districtCode) {
        setErrorMsg('Please select State and District.');
        return false;
      }
      if (!formData.address.trim()) {
        setErrorMsg('Please enter Complete Centre Address.');
        return false;
      }
      if (!formData.pinCode || formData.pinCode.replace(/\D/g, '').length !== 6) {
        setErrorMsg('Please enter a valid 6-digit Indian PIN Code.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      const requiredTypes = ['CENTRE_REGISTRATION', 'MANDI_AUTHORIZATION', 'GOVT_AUTHORIZATION', 'ADDRESS_PROOF'];
      const uploadedTypes = formData.documents.map((d) => d.docType);
      const missing = requiredTypes.filter((t) => !uploadedTypes.includes(t));

      if (missing.length > 0) {
        setErrorMsg(`Please upload all 4 required verification documents before proceeding.`);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const dataPayload = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        centreName: formData.centreName,
        centreType: formData.centreType,
        registrationNumber: formData.registrationNumber,
        state: formData.state,
        stateCode: formData.stateCode,
        district: formData.district,
        districtCode: formData.districtCode,
        localityName: formData.localityName || formData.district,
        localityCode: formData.localityCode || '',
        locationSource: isManualVillage ? 'USER_ENTERED' : 'OFFICIAL_DATA',
        address: formData.address,
        pinCode: formData.pinCode,
        centreContact: formData.centreContact || formData.mobile,
        latitude: formData.latitude,
        longitude: formData.longitude,
        documentsMetadata: JSON.stringify(
          formData.documents.map((d) => ({
            docType: d.docType,
            docName: d.docName,
            originalFileName: d.originalFileName,
            fileSize: d.fileSize,
            mimeType: d.mimeType
          }))
        )
      };

      const hasFiles = formData.documents.some((d) => d.fileInstance);
      let payload;
      let headers = {};

      if (hasFiles) {
        payload = new FormData();
        Object.entries(dataPayload).forEach(([key, val]) => {
          if (key !== 'documentsMetadata' && val !== undefined && val !== null) {
            payload.append(key, val);
          }
        });
        formData.documents.forEach((d, idx) => {
          if (d.fileInstance) {
            payload.append('files', d.fileInstance);
            payload.append(`docType_${idx}`, d.docType);
            payload.append(`docName_${idx}`, d.docName);
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = dataPayload;
      }

      const res = await apiClient.post('/staff/applications', payload, { headers });

      if (res && res.success) {
        setSuccessData(res.data);
      } else {
        setErrorMsg(res?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'Account Details', icon: User },
    { num: 2, label: 'Centre Details', icon: Building2 },
    { num: 3, label: 'Authorization Docs', icon: FileText },
    { num: 4, label: 'Review & Submit', icon: ShieldCheck }
  ];

  const docCategories = [
    {
      id: 'CENTRE_REGISTRATION',
      name: '1. Centre Registration / Authorization Certificate',
      required: true,
      desc: 'Official certificate of establishment, license, or Mandi registration document.'
    },
    {
      id: 'MANDI_AUTHORIZATION',
      name: '2. Procurement / Mandi / APMC Authorization',
      required: true,
      desc: 'Mandi Board approval, APMC operating certificate, or purchase authority order.'
    },
    {
      id: 'GOVT_AUTHORIZATION',
      name: '3. Government or Institutional Authorization',
      required: true,
      desc: 'Official departmental nomination letter or institutional oversight agreement.'
    },
    {
      id: 'ADDRESS_PROOF',
      name: '4. Centre Address / Premises Proof',
      required: true,
      desc: 'Electricity bill, property tax receipt, or land revenue registry of the premises.'
    },
    {
      id: 'SUPPORTING_DOC',
      name: '5. Additional Supporting Document',
      required: false,
      desc: 'Weighbridge calibration certificate, warehouse license, or authorized rep ID.'
    }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans">
      {/* Header */}
      <header className="bg-white border-b-2 border-dark-neutral sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-black text-xl sm:text-2xl text-dark-neutral block tracking-tight leading-tight">
                  AgriNexus
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-dark-neutral-muted hidden sm:block">
                  {t('app.department')} • {t('app.government_india')}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xs border-2 border-dark-neutral bg-warm-ivory text-xs sm:text-sm font-black text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                aria-label="Switch Language"
              >
                <Globe className="w-4 h-4 text-forest-green" />
                <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
              </button>

              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black text-dark-neutral hover:text-forest-green hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to role selection</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {successData ? (
          /* Application Submission Success Card */
          <div className="bg-white rounded-xs border-3 border-dark-neutral shadow-brutal-xl p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-xs bg-emerald-100 border-3 border-dark-neutral text-forest-green mx-auto flex items-center justify-center shadow-[3px_3px_0px_#22252A]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-dark-neutral tracking-tight">
                Application Submitted
              </h1>
              <p className="text-sm text-dark-neutral-muted font-medium max-w-md mx-auto">
                Your application will be reviewed by the Government Administrator before your procurement centre can become active.
              </p>
            </div>

            {/* Application Reference ID Box */}
            <div className="bg-warm-ivory border-2 border-dark-neutral p-4 sm:p-5 rounded-xs inline-block max-w-md w-full shadow-brutal-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-dark-neutral-muted block mb-1">
                Official Application Reference ID
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-blue-800 tracking-wider block">
                {successData.applicationId}
              </span>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-xs border border-amber-300 inline-block mt-2">
                Status: PENDING ADMIN REVIEW
              </span>
            </div>

            {/* Review Note */}
            <div className="p-4 bg-blue-50 border-2 border-blue-300 text-blue-950 rounded-xs text-xs font-medium max-w-lg mx-auto flex items-start gap-2.5 text-left">
              <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Government Review Notice</strong>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Your application will be reviewed by the Government Administrator before your procurement centre can become active.
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/auth">
                <Button variant="primary" size="lg" className="min-h-[48px] w-full sm:w-auto">
                  <span>Return to Access Selection</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-Step Staff Registration Wizard */
          <div className="space-y-6">
            {/* Quick Return to Access Selection */}
            <div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-dark-neutral-muted hover:text-dark-neutral transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('login.back_to_access')}</span>
              </Link>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border-2 border-dark-neutral rounded-xs text-blue-900 text-xs font-black shadow-[2px_2px_0px_#22252A] mb-1">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>Institutional Onboarding Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-dark-neutral tracking-tight">
                Register a Procurement Centre
              </h1>
              <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium max-w-xl mx-auto">
                Submit your centre details and authorization documents for Government Administrator verification.
              </p>
            </div>

            {/* Notice Banner */}
            <div className="p-3 bg-amber-50 border-2 border-dark-neutral rounded-xs shadow-brutal-sm text-xs text-amber-950 font-medium flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Centre accounts are activated only after official verification by the Government Administrator.
              </span>
            </div>

            {/* Wizard Step Bar */}
            <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
              <div className="w-full bg-warm-ivory border border-dark-neutral h-2 rounded-xs overflow-hidden mb-3">
                <div
                  className="bg-blue-600 h-full transition-all duration-normal ease-tactile"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
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
                      className={`flex flex-col items-center justify-center p-2 rounded-xs transition-all duration-micro ease-tactile text-center ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-black shadow-[2px_2px_0px_#22252A]'
                          : isPast
                          ? 'bg-blue-50 text-blue-900 font-bold cursor-pointer hover:bg-blue-100'
                          : 'bg-warm-ivory/60 text-dark-neutral-muted cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isPast ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0 animate-scale-check" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="text-[11px] sm:text-xs">Step {s.num}</span>
                      </div>
                      <span className="text-[10px] hidden sm:block mt-0.5 truncate max-w-full">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <Alert type="error" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            {/* Wizard Step Forms Container */}
            <div className="bg-white rounded-xs border-3 border-dark-neutral shadow-brutal-xl p-6 sm:p-8 animate-page-enter">
              {/* STEP 1: ACCOUNT DETAILS */}
              {currentStep === 1 && (
                <div key="step-1" className="space-y-4 animate-step-enter">
                  <h2 className="text-lg font-black text-dark-neutral pb-2 border-b-2 border-dark-neutral flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-700" />
                    <span>STEP 1 — ACCOUNT DETAILS</span>
                  </h2>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                      Authorized Representative Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ramesh Kumar Verma"
                      className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Official Centre Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. gomtinagar.centre@agrinexus.demo"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      />
                      <span className="text-[10px] text-dark-neutral-muted block mt-1 font-medium">
                        Primary login identifier for this centre account.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Contact Mobile Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                        }
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Password (Min 6 chars) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create strong password"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button variant="primary" onClick={handleNext} className="min-h-[44px]">
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROCUREMENT CENTRE DETAILS */}
              {currentStep === 2 && (
                <div key="step-2" className="space-y-4 animate-step-enter">
                  <h2 className="text-lg font-black text-dark-neutral pb-2 border-b-2 border-dark-neutral flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    <span>STEP 2 — PROCUREMENT CENTRE DETAILS</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Procurement Centre Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.centreName}
                        onChange={(e) => setFormData({ ...formData, centreName: e.target.value })}
                        placeholder="e.g. Lucknow Krishi Upaj Mandi"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Centre Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.centreType}
                        onChange={(e) => setFormData({ ...formData, centreType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                      >
                        <option value="GOVERNMENT_CENTRE">Government Procurement Centre</option>
                        <option value="APMC_MANDI">APMC Mandi Yard</option>
                        <option value="COOPERATIVE">Primary Agricultural Cooperative (PACS)</option>
                        <option value="AUTHORIZED_PRIVATE">Authorized State Sub-Depot</option>
                        <option value="OTHER">Other Institutional Centre</option>
                      </select>
                    </div>
                  </div>

                  {/* Centre Registration / License Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                      Centre Registration / License Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="e.g. APMC-SEH-2024-0491 or MANDI-REG-9810"
                      className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm"
                    />
                  </div>

                  {/* GPS Coordinate Assistance Button */}
                  <div className="flex items-center justify-between p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-forest-green" />
                      <span className="text-xs font-bold text-dark-neutral">
                        GPS Location Discovery (Optional)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isLoading={isLocating}
                      onClick={handleGpsAssist}
                      className="text-xs"
                    >
                      Discover Nearest Administrative District
                    </Button>
                  </div>

                  {gpsSuggestion && (
                    <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xs text-xs space-y-2">
                      <p className="font-bold text-emerald-950">
                        GPS Suggestion: {gpsSuggestion.district}, {gpsSuggestion.state}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={applyGpsSuggestion}>
                          Apply Suggestion
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setGpsSuggestion(null)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* State & District Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SearchableSelect
                      label={`${t('auth.state')} *`}
                      placeholder={t('auth.select_state')}
                      options={states}
                      value={formData.stateCode}
                      onChange={handleStateSelect}
                      required
                    />

                    <SearchableSelect
                      label={`${t('auth.district')} *`}
                      placeholder={formData.stateCode ? t('auth.select_district') : t('auth.select_state_first')}
                      options={districts}
                      value={formData.districtCode}
                      onChange={handleDistrictSelect}
                      disabled={!formData.stateCode}
                      required
                    />
                  </div>

                  {/* Locality Selector / Manual Fallback */}
                  <div>
                    {!isManualVillage ? (
                      <SearchableSelect
                        label="Village / Town / Locality"
                        placeholder={
                          formData.districtCode ? 'Search or select locality...' : 'Select district first'
                        }
                        options={villages}
                        value={formData.localityCode}
                        onChange={handleLocalitySelect}
                        disabled={!formData.districtCode}
                      />
                    ) : (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                          Locality (Manual Entry)
                        </label>
                        <input
                          type="text"
                          value={formData.localityName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              localityName: e.target.value,
                              locationSource: 'USER_ENTERED'
                            })
                          }
                          placeholder="Enter your town, mandi yard, or village name"
                          className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A]"
                        />
                      </div>
                    )}
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={() => setIsManualVillage(!isManualVillage)}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        {isManualVillage ? "← Use official reference list" : "Can't find your locality?"}
                      </button>
                    </div>
                  </div>

                  {/* Complete Address & PIN */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                      Complete Centre Address <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Mandi Yard, Gate No 2, Main Highway..."
                      className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        PIN Code <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={formData.pinCode}
                        onChange={(e) =>
                          setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                        }
                        placeholder="6-digit PIN code"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                        Centre Helpdesk / Contact Number
                      </label>
                      <input
                        type="tel"
                        value={formData.centreContact}
                        onChange={(e) => setFormData({ ...formData, centreContact: e.target.value })}
                        placeholder="Centre landline or contact phone"
                        className="w-full px-3.5 py-2.5 rounded-xs border-2 border-dark-neutral bg-white text-dark-neutral text-sm font-semibold shadow-[2px_2px_0px_#22252A]"
                      />
                    </div>
                  </div>

                  {/* Interactive Location Confirmation Map */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral">
                        Confirm Procurement Centre Location on Map <span className="text-red-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGpsAssist}
                        className="text-xs font-bold text-forest-green hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Use GPS Coordinates</span>
                      </button>
                    </div>

                    <GoogleMapWrapper
                      interactiveSelect={true}
                      height="h-64"
                      initialCoordinates={{ lat: formData.latitude || 23.2040, lng: formData.longitude || 77.0850 }}
                      onLocationSelected={(coords) => {
                        setFormData((prev) => ({
                          ...prev,
                          latitude: parseFloat(coords.lat.toFixed(6)),
                          longitude: parseFloat(coords.lng.toFixed(6)),
                          locationSource: 'GOOGLE_MAPS_CONFIRMED'
                        }));
                      }}
                    />

                    {/* Confirmation Summary Card */}
                    <div className="mt-3 p-3.5 bg-forest-green-light border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-forest-green tracking-wider">
                          Confirm Procurement Centre Location
                        </span>
                        <span className="text-[10px] font-bold text-dark-neutral-muted">
                          Source: <strong className="text-forest-green">{formData.locationSource || 'GOOGLE_MAPS_CONFIRMED'}</strong>
                        </span>
                      </div>
                      <div className="text-dark-neutral font-medium">
                        <strong>{formData.centreName || 'Procurement Centre'}</strong>
                        {formData.address && <span> • {formData.address}</span>}
                        {formData.district && <span> • {formData.district}, {formData.state}</span>}
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px] font-bold text-dark-neutral pt-1">
                        <span>Latitude: <strong>{formData.latitude?.toFixed(4) || '23.2040'}</strong></span>
                        <span>Longitude: <strong>{formData.longitude?.toFixed(4) || '77.0850'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={handlePrev}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button variant="primary" onClick={handleNext}>
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: LEGAL / AUTHORIZATION DOCUMENTS */}
              {currentStep === 3 && (
                <div key="step-3" className="space-y-5 animate-step-enter">
                  <div>
                    <h2 className="text-lg font-black text-dark-neutral pb-1 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-700" />
                      <span>STEP 3 — LEGAL / AUTHORIZATION DOCUMENTS</span>
                    </h2>
                    <p className="text-xs text-dark-neutral-muted font-medium">
                      Upload official documents proving that this procurement centre is authorized by government or mandi authorities. (PDF, JPG, PNG under 10MB).
                    </p>
                  </div>

                  <div className="space-y-4">
                    {docCategories.map((cat) => {
                      const uploaded = formData.documents.find((d) => d.docType === cat.id);

                      return (
                        <div
                          key={cat.id}
                          className="p-4 rounded-xs border-2 border-dark-neutral bg-warm-ivory/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-brutal-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-dark-neutral">{cat.name}</span>
                              {cat.required && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.5 rounded-xs">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-dark-neutral-muted font-medium">{cat.desc}</p>
                          </div>

                          <div className="shrink-0">
                            {uploaded ? (
                              <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-400 rounded-xs animate-fade-slide">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <div className="text-left">
                                  <span className="text-xs font-bold text-emerald-950 block max-w-[140px] truncate">
                                    {uploaded.originalFileName}
                                  </span>
                                  <span className="text-[10px] text-emerald-800">
                                    {(uploaded.fileSize / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(cat.id)}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded-xs transition-colors"
                                  title="Remove Document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xs border-2 border-dark-neutral bg-white text-xs font-black text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile">
                                <UploadCloud className="w-4 h-4 text-blue-700" />
                                <span>Upload Document</span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileUpload(cat.id, cat.name, e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={handlePrev}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button variant="primary" onClick={handleNext}>
                      <span>{t('auth.btn_next')}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {currentStep === 4 && (
                <div key="step-4" className="space-y-5 animate-step-enter">
                  <h2 className="text-lg font-black text-dark-neutral pb-2 border-b-2 border-dark-neutral flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <span>STEP 4 — REVIEW & SUBMIT</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Representative Information */}
                    <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-brutal-sm space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block border-b pb-1 border-blue-200">
                        Representative Information
                      </span>
                      <div className="text-xs space-y-1">
                        <p>
                          <strong>Name:</strong> {formData.fullName}
                        </p>
                        <p>
                          <strong>Official Email:</strong> {formData.email}
                        </p>
                        <p>
                          <strong>Contact Mobile:</strong> +91 {formData.mobile}
                        </p>
                      </div>
                    </div>

                    {/* Centre Details */}
                    <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-brutal-sm space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block border-b pb-1 border-blue-200">
                        Procurement Centre Details
                      </span>
                      <div className="text-xs space-y-1">
                        <p>
                          <strong>Centre Name:</strong> {formData.centreName}
                        </p>
                        <p>
                          <strong>Registration / License Number:</strong> {formData.registrationNumber}
                        </p>
                        <p>
                          <strong>Type:</strong> {formData.centreType}
                        </p>
                        <p>
                          <strong>Complete Address:</strong> {formData.address}
                        </p>
                        <p>
                          <strong>Administrative Location:</strong> {formData.localityName || formData.district},{' '}
                          {formData.district}, {formData.state} ({formData.pinCode})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-brutal-sm space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block border-b pb-1 border-blue-200">
                      Attached Legal & Authorization Documents ({formData.documents.length})
                    </span>
                    <ul className="text-xs space-y-1.5 pt-1">
                      {formData.documents.map((d, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>{d.docName}:</strong> {d.originalFileName} (
                            {(d.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Crucial Institutional Notice */}
                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-xs text-xs text-blue-950 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Application Status: PENDING ADMIN REVIEW</strong>
                      <p className="text-[11px] text-blue-900 leading-relaxed">
                        Your application will be reviewed by the Government Administrator before your procurement centre can become active.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={handlePrev}>
                      <ArrowLeft className="w-4 h-4 mr-1.5" />
                      <span>{t('auth.btn_prev')}</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      isLoading={isSubmitting}
                      onClick={handleSubmit}
                      className="min-h-[48px] text-base font-black shadow-brutal-sm bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span>Submit for Verification</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Already Registered Staff Login Link */}
              <div className="pt-4 border-t-2 border-dark-neutral/20 text-center text-xs sm:text-sm text-dark-neutral-muted font-medium">
                <span>Already applied or registered? </span>
                <Link
                  to="/auth/login?role=CENTRE_STAFF"
                  className="font-black text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Login with Official Centre Email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-dark-neutral py-4 text-center">
        <p className="text-[11px] text-dark-neutral-muted font-medium">
          {t('landing.footer_gov')}
        </p>
      </footer>
    </div>
  );
};

export default StaffRegisterPage;
