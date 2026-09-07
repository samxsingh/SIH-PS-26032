import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, ArrowUpDown, Building2, Eye, Edit3, Power, Trash2, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import EditCentreModal from './EditCentreModal';
import apiClient from '../../services/apiClient';

export const CentrePerformanceTable = ({ centres = [], onSelectCentre, onRefresh }) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('centreCode');
  const [sortDir, setSortDir] = useState('asc');

  // Management Action State
  const [editingCentre, setEditingCentre] = useState(null);
  const [statusConfirmCentre, setStatusConfirmCentre] = useState(null);
  const [deleteConfirmCentre, setDeleteConfirmCentre] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedCentres = [...centres].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'mandi') {
      valA = a.mandi?.name || '';
      valB = b.mandi?.name || '';
    }

    if (typeof valA === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
  });

  const handleToggleStatus = async () => {
    if (!statusConfirmCentre) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const centreId = statusConfirmCentre.id || statusConfirmCentre._id;
      const newActiveState = statusConfirmCentre.isActive === false; // Toggle
      const res = await apiClient.patch(`/admin/centres/${centreId}/status`, { isActive: newActiveState });

      if (res.success) {
        setStatusConfirmCentre(null);
        if (onRefresh) onRefresh();
      } else {
        setActionError(res.error?.message || 'Failed to update centre status.');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating centre status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCentre = async () => {
    if (!deleteConfirmCentre) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const centreId = deleteConfirmCentre.id || deleteConfirmCentre._id;
      const res = await apiClient.delete(`/admin/centres/${centreId}`);

      if (res.success) {
        setDeleteConfirmCentre(null);
        if (onRefresh) onRefresh();
      } else {
        setActionError(res.error?.message || 'Failed to delete centre.');
      }
    } catch (err) {
      setActionError(err.message || 'Error deleting centre.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-dark-neutral rounded-xs shadow-brutal-sm p-3.5 sm:p-4 mb-6 animate-fade-slide min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-dark-neutral/10">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-forest-green" />
            <h3 className="font-heading font-black text-sm sm:text-base text-dark-neutral uppercase tracking-tight">
              {t('admin.performance_table_title', 'Procurement Centres Reporting & Performance Table')}
            </h3>
          </div>
          <p className="text-xs text-dark-neutral-muted mt-0.5">
            {t('admin.performance_table_subtitle', 'Comprehensive cross-facility comparison table with multi-column sorting')}
          </p>
        </div>
      </div>

      {actionError && (
        <Alert type="error" className="mb-3 text-xs" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Table */}
      <div className="overflow-x-auto w-full max-w-full">
        <table className="w-full text-left border-collapse border-2 border-dark-neutral">
          <thead>
            <tr className="border-b-2 border-dark-neutral text-xs font-black text-dark-neutral uppercase bg-warm-ivory tracking-wider">
              <th className="p-2.5 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Centre Facility <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('tehsil')}>
                <div className="flex items-center gap-1">
                  Area / Tehsil <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('mandi')}>
                <div className="flex items-center gap-1">
                  Parent Mandi <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('waitingCount')}>
                <div className="flex items-center justify-center gap-1">
                  Queue Depth <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('servingCount')}>
                <div className="flex items-center justify-center gap-1">
                  Processing <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center cursor-pointer hover:bg-gray-200" onClick={() => handleSort('completedCount')}>
                <div className="flex items-center justify-center gap-1">
                  Completed Today <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center">
                Current Bottleneck
              </th>
              <th className="p-2.5 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('produceTodayQuintals')}>
                <div className="flex items-center justify-end gap-1">
                  Produce (Qtl) <ArrowUpDown className="w-3 h-3 text-dark-neutral-muted" />
                </div>
              </th>
              <th className="p-2.5 text-center">Status</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dark-neutral/10 text-xs font-medium">
            {sortedCentres.map((c) => {
              const isCentreActive = c.isActive !== false && c.verificationStatus !== 'INACTIVE';
              return (
                <tr key={c.id || c._id} className="hover:bg-warm-ivory/60 transition-colors">
                  <td className="p-2.5">
                    <span className="font-mono font-black text-forest-green text-[10px] block">{c.centreCode}</span>
                    <strong className="text-dark-neutral block font-bold">{c.name}</strong>
                  </td>
                  <td className="p-2.5 font-bold text-dark-neutral">
                    {c.tehsil || 'Lucknow Sadar'}
                  </td>
                  <td className="p-2.5 text-dark-neutral-muted">
                    {c.mandi?.name || 'Dubagga Mandi'}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-amber-900">
                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-xs">
                      {c.waitingCount || 0} waiting
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-blue-800">
                    {c.servingCount || 0} active
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-800">
                    {c.completedCount || 0} done
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-xs ${
                      c.currentBottleneck && c.currentBottleneck !== 'None'
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {c.currentBottleneck || 'Optimal Flow'}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-forest-green">
                    {c.produceTodayQuintals || 0} Qtl
                  </td>
                  <td className="p-2.5 text-center">
                    {!isCentreActive ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-gray-200 text-gray-700 border border-gray-400 rounded-xs">
                        INACTIVE
                      </span>
                    ) : (
                      <Badge variant={c.health === 'CRITICAL' ? 'danger' : c.health === 'WATCH' ? 'warning' : 'success'} className="text-[10px] font-bold">
                        {c.statusText || c.health}
                      </Badge>
                    )}
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => onSelectCentre(c)}
                        title="Inspect Facility"
                        className="px-2 py-1 text-[11px] font-bold text-forest-green bg-forest-green-light border border-dark-neutral rounded-xs hover:bg-forest-green hover:text-white transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => setEditingCentre(c)}
                        title="Edit Centre Metadata"
                        className="px-2 py-1 text-[11px] font-bold text-dark-neutral bg-white border border-dark-neutral rounded-xs hover:bg-gray-100 transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-blue-700" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setActionError(null);
                          setStatusConfirmCentre(c);
                        }}
                        title={isCentreActive ? 'Deactivate Centre' : 'Reactivate Centre'}
                        className={`px-2 py-1 text-[11px] font-bold border border-dark-neutral rounded-xs transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center gap-1 cursor-pointer ${
                          isCentreActive
                            ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{isCentreActive ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setActionError(null);
                          setDeleteConfirmCentre(c);
                        }}
                        title="Delete Centre"
                        className="p-1 text-[11px] font-bold text-red-700 bg-red-50 border border-dark-neutral rounded-xs hover:bg-red-600 hover:text-white transition-all shadow-[1px_1px_0px_#22252A] inline-flex items-center cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Centre Modal */}
      {editingCentre && (
        <EditCentreModal
          isOpen={Boolean(editingCentre)}
          onClose={() => setEditingCentre(null)}
          centre={editingCentre}
          onCentreUpdated={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Deactivate / Reactivate Confirmation Dialog */}
      {statusConfirmCentre && (
        <Modal
          isOpen={Boolean(statusConfirmCentre)}
          onClose={() => setStatusConfirmCentre(null)}
          title={statusConfirmCentre.isActive !== false ? t('admin.confirm_deactivate_title', 'Deactivate Procurement Centre?') : t('admin.confirm_activate_title', 'Reactivate Procurement Centre?')}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setStatusConfirmCentre(null)} disabled={actionLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant={statusConfirmCentre.isActive !== false ? 'warning' : 'primary'}
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                <Power className="w-4 h-4 mr-1.5" />
                <span>
                  {actionLoading
                    ? t('common.loading', 'Updating...')
                    : statusConfirmCentre.isActive !== false
                    ? t('admin.deactivate_centre', 'Deactivate Centre')
                    : t('admin.activate_centre', 'Activate Centre')}
                </span>
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="font-bold text-dark-neutral leading-relaxed">
              {statusConfirmCentre.isActive !== false
                ? t('admin.confirm_deactivate_desc', 'Deactivating this centre immediately prevents farmers from booking new slots. All existing bookings, queue records, and historical receipts remain completely preserved and accessible.')
                : t('admin.confirm_activate_desc', 'Reactivating this centre will restore it to the active directory and allow farmers to resume booking intake slots.')}
            </p>

            <div className="p-3 bg-warm-ivory border-2 border-dark-neutral rounded-xs">
              <span className="font-mono font-black text-forest-green block">{statusConfirmCentre.centreCode}</span>
              <strong className="text-dark-neutral block text-sm">{statusConfirmCentre.name}</strong>
              <span className="text-dark-neutral-muted block text-[11px] mt-0.5">{statusConfirmCentre.address}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmCentre && (
        <Modal
          isOpen={Boolean(deleteConfirmCentre)}
          onClose={() => setDeleteConfirmCentre(null)}
          title={t('admin.confirm_delete_title', 'Permanently Delete Centre?')}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteConfirmCentre(null)} disabled={actionLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCentre}
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>{actionLoading ? t('common.loading', 'Deleting...') : t('admin.delete_centre', 'Delete Centre')}</span>
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-600 rounded-xs text-red-950">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="font-bold leading-relaxed">
                {t('admin.confirm_delete_desc', 'This action cannot be undone. Centres with active or historical records cannot be deleted and must be deactivated instead.')}
              </p>
            </div>

            <div className="p-3 bg-warm-ivory border-2 border-dark-neutral rounded-xs">
              <span className="font-mono font-black text-red-700 block">{deleteConfirmCentre.centreCode}</span>
              <strong className="text-dark-neutral block text-sm">{deleteConfirmCentre.name}</strong>
              <span className="text-dark-neutral-muted block text-[11px] mt-0.5">{deleteConfirmCentre.address}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CentrePerformanceTable;

