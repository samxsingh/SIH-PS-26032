import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
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
  Upload
} from 'lucide-react';

/**
 * FarmerProfileModal
 * Displays comprehensive farmer identity, farming details, and administrative location.
 * Allows profile photo upload/change and protects sensitive registered mobile & verification info.
 */
export const FarmerProfileModal = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  // Local state for profile avatar preview
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem('farmer_avatar_' + (user?.id || user?._id || 'default')) || null;
  });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setAvatarUrl(result);
        localStorage.setItem('farmer_avatar_' + (user?.id || user?._id || 'default'), result);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('farmer.profile_modal_title', 'Farmer Identity & Farming Profile')}
      size="lg"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="primary" size="md" onClick={onClose}>
            <span>{t('common.done', 'Done')}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-dark-neutral font-sans">
        {/* Top Summary Banner with Photo Upload */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-warm-ivory border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A]">
          <div className="relative group">
            <div className="w-16 h-16 rounded-xs bg-forest-green-light border-2 border-dark-neutral flex items-center justify-center text-forest-green shadow-[2px_2px_0px_#22252A] shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.fullName || 'Farmer'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>

            {/* Photo change overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1 rounded-xs bg-dark-neutral text-white border border-dark-neutral shadow-[1px_1px_0px_#22252A] hover:bg-forest-green transition-colors"
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
                {user?.fullName || 'Kisan Bandhu'}
              </h3>
              <Badge variant="success" icon={ShieldCheck} size="sm">
                Verified Farmer
              </Badge>
            </div>
            <p className="text-xs text-dark-neutral-muted font-bold flex items-center gap-1">
              <span>Aadhaar-Linked Self-Service Profile</span>
            </p>
            {uploadSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-green mt-1">
                <Check className="w-3.5 h-3.5" /> Photo updated successfully
              </span>
            )}
          </div>
        </div>

        {/* 1. PERSONAL & CONTACT INFORMATION */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <User className="w-4 h-4 text-forest-green" />
              <span>Personal & Contact Information</span>
            </span>
            <span className="text-[10px] text-forest-green font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Verified & Protected</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Full Legal Name</span>
              <span className="font-black text-dark-neutral text-sm">{user?.fullName || '—'}</span>
            </div>
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Registered Mobile Number</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-black text-dark-neutral text-sm">+91 {user?.phone || '—'}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-xs border border-emerald-300">
                  Primary ID
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ADMINISTRATIVE LOCATION */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-forest-green" />
              <span>Administrative Location</span>
            </span>
            <span className="text-[10px] text-dark-neutral-muted font-bold">
              Official Revenue Hierarchy
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/40">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">State</span>
              <span className="font-black text-dark-neutral">{user?.state || 'Uttar Pradesh'}</span>
            </div>
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/40">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">District</span>
              <span className="font-black text-dark-neutral">{user?.district || 'Lucknow'}</span>
            </div>
            <div className="p-2.5 bg-warm-ivory rounded-xs border border-dark-neutral/40">
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Village / Locality</span>
              <span className="font-black text-dark-neutral">{user?.villageName || 'Chinhat'}</span>
            </div>
          </div>
        </div>

        {/* 3. FARMING & CROP PARTICULARS */}
        <div className="border-2 border-dark-neutral rounded-xs p-4 bg-white shadow-brutal-sm">
          <div className="flex items-center justify-between border-b-2 border-dark-neutral/15 pb-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-dark-neutral flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-forest-green" />
              <span>Farming & Crop Particulars</span>
            </span>
            <span className="text-[10px] text-dark-neutral-muted font-bold">
              Kharif / Rabi Mandi Registration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Primary Crops Handled</span>
              <span className="font-black text-dark-neutral text-sm">Wheat (PBW-550), Paddy, Mustard</span>
            </div>
            <div>
              <span className="text-dark-neutral-muted uppercase font-bold text-[10px] block">Assigned / Nearest Procurement Hub</span>
              <span className="font-black text-dark-neutral text-sm">Gomti Nagar APMC Yard</span>
            </div>
          </div>
        </div>

        {/* Information security note */}
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xs text-[11px] text-blue-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            To update your registered mobile number or government identity documents, please visit your local district agriculture office or procurement centre desk with your original Aadhaar and land records.
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default FarmerProfileModal;
