import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import apiClient from '../../services/apiClient';
import { Building2, Save, X } from 'lucide-react';

export const EditCentreModal = ({ isOpen, onClose, centre, onCentreUpdated }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: centre?.name || '',
    contactPhone: centre?.contactPhone || '',
    address: centre?.address || '',
    villageName: centre?.villageName || '',
    district: centre?.district || '',
    pincode: centre?.pincode || '',
    dailyCapacityQuintals: centre?.dailyCapacityQuintals || 1500,
    maxConcurrentFarmers: centre?.maxConcurrentFarmers || 50,
    openHour: centre?.operatingHours?.open || '08:00',
    closeHour: centre?.operatingHours?.close || '18:00',
    centreType: centre?.centreType || 'PROCUREMENT_CENTRE'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !centre) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const centreId = centre.id || centre._id;
      const payload = {
        name: formData.name,
        contactPhone: formData.contactPhone,
        address: formData.address,
        villageName: formData.villageName,
        district: formData.district,
        pincode: formData.pincode,
        dailyCapacityQuintals: Number(formData.dailyCapacityQuintals),
        maxConcurrentFarmers: Number(formData.maxConcurrentFarmers),
        operatingHours: {
          open: formData.openHour,
          close: formData.closeHour
        },
        centreType: formData.centreType
      };

      const res = await apiClient.put(`/admin/centres/${centreId}`, payload);
      if (res.success) {
        if (onCentreUpdated) {
          onCentreUpdated(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res.error?.message || 'Failed to update centre facility.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating centre facility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.edit_centre', 'Edit Centre Facility')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-1.5" />
            <span>{isSubmitting ? t('common.loading', 'Saving...') : t('common.save', 'Save Changes')}</span>
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <Alert type="error" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <div className="flex items-center gap-2 pb-2 border-b border-dark-neutral/10">
          <span className="font-mono font-black text-forest-green bg-warm-ivory px-2 py-0.5 border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
            {centre.centreCode}
          </span>
          <span className="text-dark-neutral-muted font-bold text-xs">
            {centre.district} • {centre.state || 'Uttar Pradesh'}
          </span>
        </div>

        <div>
          <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
            Facility Name
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="e.g. Krishi Seva Procurement Centre — Gomti Nagar"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Contact Phone
            </label>
            <Input
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              required
              placeholder="+91 522 2720011"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Facility Type
            </label>
            <select
              value={formData.centreType}
              onChange={(e) => handleChange('centreType', e.target.value)}
              className="w-full text-xs font-bold bg-white border-2 border-dark-neutral rounded-xs p-2 shadow-[1px_1px_0px_#22252A] focus:outline-none focus:ring-1 focus:ring-forest-green"
            >
              <option value="PROCUREMENT_CENTRE">PROCUREMENT_CENTRE</option>
              <option value="MANDI">MANDI</option>
              <option value="COLLECTION_POINT">COLLECTION_POINT</option>
              <option value="MARKET_YARD">MARKET_YARD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Daily Capacity (Quintals)
            </label>
            <Input
              type="number"
              min="100"
              max="10000"
              value={formData.dailyCapacityQuintals}
              onChange={(e) => handleChange('dailyCapacityQuintals', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Max Concurrent Farmers
            </label>
            <Input
              type="number"
              min="10"
              max="200"
              value={formData.maxConcurrentFarmers}
              onChange={(e) => handleChange('maxConcurrentFarmers', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Opening Time (IST)
            </label>
            <Input
              type="time"
              value={formData.openHour}
              onChange={(e) => handleChange('openHour', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Closing Time (IST)
            </label>
            <Input
              type="time"
              value={formData.closeHour}
              onChange={(e) => handleChange('closeHour', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Village / Locality
            </label>
            <Input
              value={formData.villageName}
              onChange={(e) => handleChange('villageName', e.target.value)}
              placeholder="e.g. Gomti Nagar"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              District
            </label>
            <Input
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder="e.g. Lucknow"
            />
          </div>

          <div>
            <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
              Pincode
            </label>
            <Input
              value={formData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="e.g. 226010"
            />
          </div>
        </div>

        <div>
          <label className="block font-black uppercase text-[10px] text-dark-neutral mb-1">
            Physical Address
          </label>
          <textarea
            rows="2"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            required
            className="w-full text-xs font-medium bg-white border-2 border-dark-neutral rounded-xs p-2 shadow-[1px_1px_0px_#22252A] focus:outline-none focus:ring-1 focus:ring-forest-green"
          />
        </div>
      </form>
    </Modal>
  );
};

export default EditCentreModal;
