import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  Info,
  Check
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export const StaffRosterSection = ({
  staffList = [],
  isHead,
  onAddStaff,
  onEditStaff,
  onToggleStatus,
  isSubmitting
}) => {
  const { t } = useTranslation();

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Procurement Officer',
    password: '',
    employeeId: ''
  });

  // Edit Staff Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    designation: 'Procurement Officer'
  });

  const handleOpenAdd = () => {
    setAddForm({
      fullName: '',
      email: '',
      phone: '',
      designation: 'Procurement Officer',
      password: '',
      employeeId: ''
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddStaff && onAddStaff(addForm, () => setShowAddModal(false));
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setEditForm({
      fullName: member.fullName,
      phone: member.phone || '',
      designation: member.designation || 'Procurement Officer'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    onEditStaff && onEditStaff(editingStaff._id || editingStaff.id, editForm, () => setShowEditModal(false));
  };

  return (
    <div className="bg-white border-3 border-dark-neutral p-6 rounded-md shadow-brutal-md space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dark-neutral/10">
        <div>
          <h2 className="text-xl font-black font-heading text-dark-neutral flex items-center gap-2">
            <Users className="w-5 h-5 text-forest-green" />
            {t('staff.roster_title', 'Procurement Centre Staff Management')}
          </h2>
          <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
            {t('staff.roster_desc', 'Authorized roster of operations staff, inspectors, and weighbridge operators.')}
          </p>
        </div>

        {isHead && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs font-black bg-forest-green hover:bg-forest-green-dark self-start sm:self-center"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>{t('staff.add_staff_member', 'ADD STAFF MEMBER')}</span>
          </Button>
        )}
      </div>

      {/* Single Manager Rule Info Box */}
      <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-xs flex items-start gap-2.5 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong>{t('staff.single_manager_rule_title', 'Single Centre Manager Rule')}:</strong>{' '}
          {t('staff.single_manager_rule_desc', 'By statutory operational standard, a procurement centre can have only ONE appointed Centre Head at a time. Other team members operate as Procurement Officers, Quality Inspectors, and Weighing Operators.')}
        </div>
      </div>

      {/* Staff Roster Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((member) => {
          const isActive = member.accountStatus === 'ACTIVE' && member.isActive !== false;
          const isManager = member.isCentreHead || member.designation === 'Centre Head';

          return (
            <div
              key={member._id || member.id}
              className={`p-4 rounded-xs border-2 transition-all bg-warm-ivory/50 ${
                isManager ? 'border-forest-green shadow-brutal-sm' : 'border-dark-neutral'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm text-dark-neutral">
                      {member.fullName}
                    </span>
                    {isManager && (
                      <Badge variant="success" size="sm">
                        {t('staff.centre_head', 'HEAD')}
                      </Badge>
                    )}
                  </div>

                  <span className="text-xs font-bold text-forest-green block mt-0.5">
                    {member.designation || 'Procurement Operator'}
                  </span>
                </div>

                <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-dark-neutral/15 space-y-1.5 text-xs text-dark-neutral-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-dark-neutral-muted" />
                  <span className="truncate">{member.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-dark-neutral-muted" />
                  <span>{member.phone || '—'}</span>
                </div>
              </div>

              {/* Action Buttons for Centre Head */}
              {isHead && (
                <div className="mt-4 pt-3 border-t border-dark-neutral/15 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(member)}
                    className="text-xs font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    {t('common.edit', 'Edit')}
                  </Button>

                  {!isManager && (
                    <Button
                      variant={isActive ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => onToggleStatus && onToggleStatus(member)}
                      className="text-xs font-bold"
                    >
                      {isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          {t('staff.deactivate', 'Deactivate')}
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          {t('staff.activate', 'Activate')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={t('staff.provision_new_staff', 'Provision New Centre Staff')}
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                placeholder="e.g. Ramesh Chandra"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                placeholder="e.g. ramesh.staff@agrinexus.demo"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Operational Designation</label>
              <select
                value={addForm.designation}
                onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory font-bold"
              >
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Quality Assayer">Quality Assayer</option>
                <option value="Weighing Operator">Weighing Operator</option>
                <option value="Counter Operator">Counter Operator</option>
              </select>
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-neutral/10">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="font-bold bg-forest-green">
                {isSubmitting ? 'Provisioning...' : 'Provision Staff Account'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={t('staff.edit_staff_member', 'Edit Staff Member Details')}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory"
              />
            </div>

            <div>
              <label className="block font-black uppercase text-dark-neutral mb-1">Designation</label>
              <select
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full p-2 border-2 border-dark-neutral rounded-xs bg-warm-ivory font-bold"
              >
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Quality Assayer">Quality Assayer</option>
                <option value="Weighing Operator">Weighing Operator</option>
                <option value="Counter Operator">Counter Operator</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-neutral/10">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowEditModal(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="font-bold bg-forest-green">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StaffRosterSection;
