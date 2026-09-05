import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Sprout,
  CheckCircle2,
  Lock,
  AlertCircle,
  Camera,
  Edit2,
  Check,
  Save,
  Globe,
  Calendar,
  Ticket,
  CreditCard
} from 'lucide-react';

/**
 * FarmerProfileModal
 * Displays comprehensive farmer identity, farming details, administrative location,
 * active booking summary, and procurement history summary.
 * Allows editing legal name, village, and language preference, with photo upload/change,
 * persisting edits via PATCH /api/auth/profile.
 */
export const FarmerProfileModal = ({ isOpen, onClose, user: propUser }) => {
  const { t, i18n } = useTranslation();
  const { user: authUser, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const currentUser = propUser || authUser;

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [villageName, setVillageName] = useState(currentUser?.villageName || '');
  const [languagePreference, setLanguagePreference] = useState(currentUser?.languagePreference || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Profile avatar preview
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('farmer_avatar_' + (currentUser?.id || currentUser?._id || 'default')) || null;
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Booking & Procurement History Summary
  const [farmerBookings, setFarmerBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setVillageName(currentUser.villageName || '');
      setLanguagePreference(currentUser.languagePreference || 'en');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingBookings(true);
      apiClient.get('/bookings/my')
        .then((res) => {
          if (res.success && res.data) {
            setFarmerBookings(res.data);
          }
        })
        .catch((err) => {
          console.warn('[FarmerProfileModal] Could not fetch bookings:', err.message);
        })
        .finally(() => {
          setIsLoadingBookings(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setAvatarUrl(result);
        localStorage.setItem('farmer_avatar_' + (currentUser?.id || currentUser?._id || 'default'), result);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.patch('/auth/profile', {
        fullName,
        villageName,
        languagePreference
      });

      if (res.success && res.data) {
        if (updateUser) updateUser(res.data);
        if (languagePreference && languagePreference !== i18n.language) {
          i18n.changeLanguage(languagePreference);
        }
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('farmer.profile_modal_title', 'Farmer Identity & Farming Profile')}
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-white"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5 text-forest-green" />
                <span>{t('common.edit', 'Edit Details')}</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setFullName(currentUser?.fullName || '');
                  setVillageName(currentUser?.villageName || '');
                  setLanguagePreference(currentUser?.languagePreference || 'en');
                }}
              >
                <span>{t('common.cancel', 'Cancel')}</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={isEditing ? handleSaveProfile : onClose}
              disabled={isSaving}
            >
              {isSaving ? (
                <span>{t('common.saving', 'Saving...')}</span>
              ) : isEditing ? (
                <span className="flex items-center gap-1">
                  <Save className="w-4 h-4" /> {t('common.save_changes', 'Save Changes')}
                </span>
              ) : (
                <span>{t('common.done', 'Done')}</span>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-dark-neutral font-sans">
        {errorMessage && (
          <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xs text-xs font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border-2 border-forest-green rounded-xs text-xs font-bold text-forest-green flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile details saved successfully!</span>
          </div>
        )}

        {/* Top Summary Banner with Photo Upload */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-warm-ivory border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A]">
          <div className="relative group">
            <div className="w-16 h-16 rounded-xs bg-forest-green-light border-2 border-dark-neutral flex items-center justify-center text-forest-green shadow-[2px_2px_0px_#22252A] shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName || 'Farmer'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>

            {/* Photo change overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1 rounded-xs bg-dark-neutral text-white border border-dark-neutral shadow-[1px_1px_0px_#22252A] hover:bg-forest-green transition-colors cursor-pointer"
              title="Upload profile photo"
              aria-label="Upload profile photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-heading font-black text-xl text-dark-neutral truncate">
                {fullName || currentUser?.fullName || 'Kisan Bandhu'}
              </h3>
              <Badge variant="success" icon={ShieldCheck} size="sm">
                Verified Farmer
              </Badge>
            </div>
            <p className="text-xs text-dark-neutral-muted font-bold flex items-center gap-1">
              <span>Aadhaar-Linked Self-Service Profile • Lucknow Demo</span>
            </p>
            {uploadSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-green mt-1">
                <Check className="w-3.5 h-3.5" /> Photo updated successfully
              </span>
            )}
          </div>
        </div>

        {/* 1. PERSONAL INFORMATION */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <User className="w-4 h-4 text-forest-green" />
              <span>Personal Information</span>
            </span>
            <span className="text-[10px] text-forest-green font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Verified Identity</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block mb-1">
                Full Name {isEditing && <span className="text-red-500">*</span>}
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border-2 border-dark-neutral rounded-xs text-xs font-bold bg-warm-ivory focus:bg-white focus:outline-none shadow-[1px_1px_0px_#22252A]"
                  placeholder="e.g. Ramesh Chandra Verma"
                  required
                />
              ) : (
                <span className="font-black text-dark-neutral text-sm">{currentUser?.fullName || '—'}</span>
              )}
            </div>

            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block mb-1">
                Registered Mobile Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-black text-dark-neutral text-sm">+91 {currentUser?.phone || '—'}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-xs border border-emerald-300">
                  Primary Mobile
                </span>
              </div>
            </div>

            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block mb-1">
                Village / Locality {isEditing && <span className="text-red-500">*</span>}
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border-2 border-dark-neutral rounded-xs text-xs font-bold bg-warm-ivory focus:bg-white focus:outline-none shadow-[1px_1px_0px_#22252A]"
                  placeholder="Village name"
                />
              ) : (
                <span className="font-bold text-dark-neutral">{currentUser?.villageName || 'Chinhat'}</span>
              )}
            </div>

            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block mb-1">
                Language Preference
              </span>
              {isEditing ? (
                <select
                  value={languagePreference}
                  onChange={(e) => setLanguagePreference(e.target.value)}
                  className="w-full px-2.5 py-1.5 border-2 border-dark-neutral rounded-xs text-xs font-bold bg-warm-ivory focus:bg-white focus:outline-none shadow-[1px_1px_0px_#22252A]"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              ) : (
                <span className="font-bold text-dark-neutral">
                  {currentUser?.languagePreference === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. FARMING INFORMATION */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-forest-green" />
              <span>Farming Information</span>
            </span>
            <span className="text-[10px] text-dark-neutral-muted font-bold">
              Kharif / Rabi Mandi Registration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Farming Particulars</span>
              <span className="font-black text-dark-neutral text-sm">4.2 Hectares Cultivated • Irrigated Land</span>
            </div>
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Main Crops Produced</span>
              <span className="font-black text-dark-neutral text-sm">Wheat (PBW-550), Paddy, Mustard, Pulses</span>
            </div>
          </div>
        </div>

        {/* 3. ACCOUNT INFORMATION */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-forest-green" />
              <span>Account Information</span>
            </span>
            <span className="text-[10px] text-dark-neutral-muted font-bold">
              District Operational Registry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">System Role</span>
              <span className="font-black text-dark-neutral">Farmer (Kisan)</span>
            </div>
            <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">District</span>
              <span className="font-black text-dark-neutral">{currentUser?.district || 'Lucknow District'}</span>
            </div>
            <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Registration Status</span>
              <span className="font-black text-forest-green">Verified Active</span>
            </div>
            <div className="p-2 bg-warm-ivory rounded-xs border border-dark-neutral/30">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Masked Aadhaar</span>
              <span className="font-mono font-black text-dark-neutral">XXXX-XXXX-4821</span>
            </div>
          </div>
        </div>

        {/* 4. ACTIVE BOOKING & PROCUREMENT SUMMARY */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-forest-green" />
              <span>Active Bookings & Procurement History</span>
            </span>
            <span className="text-[10px] text-dark-neutral-muted font-bold font-mono">
              {farmerBookings.length} {farmerBookings.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {isLoadingBookings ? (
            <div className="py-4 text-center text-xs text-dark-neutral-muted font-bold animate-pulse">
              Loading procurement history...
            </div>
          ) : farmerBookings.length === 0 ? (
            <div className="py-3 text-center text-xs text-dark-neutral-muted font-medium">
              No delivery bookings or past procurements recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {farmerBookings.slice(0, 3).map((b) => {
                const isCompleted = b.operationalStatus === 'COMPLETED' || b.operationalStatus === 'PAYMENT_COMPLETED';
                return (
                  <div
                    key={b.id || b._id}
                    className="p-2.5 bg-warm-ivory border border-dark-neutral/30 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-forest-green">{b.tokenNumber}</span>
                        <span className="text-dark-neutral font-bold">• {b.cropType} ({b.estimatedQuantityQuintals} Qtl)</span>
                      </div>
                      <p className="text-[11px] text-dark-neutral-muted truncate max-w-sm">
                        {b.centre?.name || 'Procurement Centre'} • {b.bookingDate} ({b.timeWindow})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-xs font-mono font-bold text-[10px] uppercase border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {b.operationalStatus || b.bookingStatus}
                      </span>
                      <a
                        href={`/farmer/procurement/${b.id || b._id}`}
                        className="px-2 py-0.5 bg-forest-green text-white rounded-xs font-bold text-[10px] uppercase shadow-[1px_1px_0px_#22252A] hover:bg-forest-green/90"
                      >
                        Track
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xs text-[11px] text-blue-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            To update your registered mobile number or statutory land record identifiers, please visit the District Agriculture Officer in Lucknow or your assigned Mandi Secretary desk with your physical Aadhaar card.
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default FarmerProfileModal;
