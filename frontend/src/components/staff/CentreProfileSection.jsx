import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  MapPin,
  Clock,
  Phone,
  Scale,
  Users,
  ShieldCheck,
  Edit2,
  Calendar,
  Layers,
  Wheat,
  CheckCircle2,
  Info
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import GoogleMapWrapper from '../common/GoogleMapWrapper';
import apiClient from '../../services/apiClient';

export const CentreProfileSection = ({
  centreProfile,
  isHead,
  onUpdateProfile,
  isUpdating
}) => {
  const { t } = useTranslation();

  const [allCentres, setAllCentres] = useState([]);
  const [allMandis, setAllMandis] = useState([]);
  const [selectedMapCentre, setSelectedMapCentre] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    contactPhone: '',
    operatingHours: { open: '08:00', close: '18:00' },
    dailyCapacityQuintals: 1500,
    address: ''
  });

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [centresRes, mandisRes] = await Promise.all([
          apiClient.get('/centres'),
          apiClient.get('/mandis')
        ]);
        if (centresRes.success) setAllCentres(centresRes.data || []);
        if (mandisRes.success) setAllMandis(mandisRes.data || []);
      } catch (err) {
        console.warn('Map data fetch handled gracefully:', err.message);
      }
    };
    fetchMapData();
  }, []);

  const handleOpenEdit = () => {
    setEditForm({
      contactPhone: centreProfile?.contactPhone || '+91 522 2720011',
      operatingHours: centreProfile?.operatingHours || { open: '08:00', close: '18:00' },
      dailyCapacityQuintals: centreProfile?.dailyCapacityQuintals || 1500,
      address: centreProfile?.address || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile && onUpdateProfile(editForm, () => setShowEditModal(false));
  };

  const currentCoords = centreProfile?.coordinates || [80.9980, 26.8530];
  const activeCentreForMap = selectedMapCentre || {
    id: centreProfile?.centreId || 'LKO_GOM01',
    name: centreProfile?.name || 'Krishi Seva Procurement Centre — Gomti Nagar',
    location: { coordinates: currentCoords },
    district: centreProfile?.district || 'Lucknow',
    address: centreProfile?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow',
    currentLoadPercentage: centreProfile?.currentLoadPercentage || 35
  };

  return (
    <div className="space-y-6">
      {/* Facility Profile Overview Card */}
      <div className="bg-white border-3 border-dark-neutral p-6 rounded-md shadow-brutal-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dark-neutral/10">
          <div>
            <h2 className="text-xl font-black font-heading text-dark-neutral flex items-center gap-2">
              <Building2 className="w-5 h-5 text-forest-green" />
              {t('staff.facility_profile_title', 'Procurement Facility Profile & Identity')}
            </h2>
            <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
              {t('staff.facility_profile_desc', 'Official administrative registration, parent Mandi affiliation, and operating capacity.')}
            </p>
          </div>

          {isHead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="text-xs font-bold self-start sm:self-center"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              {t('staff.edit_facility_details', 'Edit Operating Details')}
            </Button>
          )}
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Official Facility Name</span>
            <span className="font-black text-sm text-dark-neutral mt-0.5 block">
              {centreProfile?.name}
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Facility Type</span>
            <span className="font-bold text-forest-green mt-0.5 block">
              {centreProfile?.centreType || 'PROCUREMENT_CENTRE'}
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Parent Regulated Mandi</span>
            <span className="font-bold text-dark-neutral mt-0.5 block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-forest-green shrink-0" />
              {centreProfile?.mandiName || centreProfile?.mandi?.name || 'Gomti Nagar Regulated APMC Mandi'}
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Operating Hours</span>
            <span className="font-bold font-mono text-dark-neutral mt-0.5 block">
              {centreProfile?.operatingHours?.open || '08:00'} - {centreProfile?.operatingHours?.close || '18:00'} IST
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Daily Certified Intake Capacity</span>
            <span className="font-mono font-black text-forest-green mt-0.5 block text-sm">
              {centreProfile?.dailyCapacityQuintals || 1500} Quintals / Day
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Contact Helpdesk</span>
            <span className="font-mono font-bold text-dark-neutral mt-0.5 block">
              {centreProfile?.contactPhone || '+91 522 2720011'}
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30 sm:col-span-2">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Physical Location & Address</span>
            <span className="font-medium text-dark-neutral mt-0.5 block">
              {centreProfile?.address}, {centreProfile?.district || 'Lucknow'}, {centreProfile?.state || 'Uttar Pradesh'} ({centreProfile?.pincode || '226010'})
            </span>
          </div>

          <div className="p-3 bg-warm-ivory rounded-xs border border-dark-neutral/30">
            <span className="text-dark-neutral-muted block text-[10px] font-bold uppercase">Accepted Commodities</span>
            <span className="font-bold text-forest-green mt-0.5 block">
              {centreProfile?.crops ? centreProfile.crops.join(', ') : 'Wheat, Paddy, Mustard, Maize'}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Interactive Map Section */}
      <div className="bg-white border-3 border-dark-neutral p-6 rounded-md shadow-brutal-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black font-heading text-dark-neutral flex items-center gap-2">
              <MapPin className="w-5 h-5 text-forest-green" />
              {t('staff.centre_map_title', 'District Geographical Map & Mandi Links')}
            </h3>
            <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
              {t('staff.centre_map_desc', 'Geographical footprint showing this centre, affiliated Mandi, and nearby procurement stations in Lucknow.')}
            </p>
          </div>

          <Badge variant="neutral" size="sm">
            {t('staff.lucknow_district_zone', 'Lucknow District Operations')}
          </Badge>
        </div>

        {/* Embedded Map */}
        <div className="border-2 border-dark-neutral rounded-xs overflow-hidden shadow-brutal-sm">
          <GoogleMapWrapper
            centres={allCentres.length > 0 ? allCentres : [activeCentreForMap]}
            mandis={allMandis}
            selectedCentre={activeCentreForMap}
            onSelectCentre={(c) => setSelectedMapCentre(c)}
            height="h-80"
          />
        </div>

        {/* Map selection note */}
        {selectedMapCentre && (
          <div className="p-3 bg-sand/40 border border-dark-neutral/30 rounded-xs flex items-center justify-between text-xs">
            <div>
              <strong>{selectedMapCentre.name}</strong> • {selectedMapCentre.district}
              <p className="text-[11px] text-dark-neutral-muted mt-0.5">{selectedMapCentre.address}</p>
            </div>
            <Badge variant="primary" size="sm">
              Load: {selectedMapCentre.currentLoadPercentage || 30}%
            </Badge>
          </div>
        )}
      </div>

      {/* Edit Centre Profile Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={t('staff.edit_facility_title', 'Edit Procurement Centre Operational Details')}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Helpdesk Contact Phone</label>
              <input
                type="tel"
                value={editForm.contactPhone}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Daily Capacity (Quintals)</label>
              <input
                type="number"
                value={editForm.dailyCapacityQuintals}
                onChange={(e) => setEditForm({ ...editForm, dailyCapacityQuintals: Number(e.target.value) })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Physical Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-neutral/10">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isUpdating} className="font-bold bg-forest-green">
                {isUpdating ? 'Saving...' : 'Update Details'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CentreProfileSection;
