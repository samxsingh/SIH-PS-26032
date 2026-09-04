import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Alert from '../common/Alert';
import LoadingState from '../common/LoadingState';
import {
  FileCheck,
  Search,
  User,
  Building2,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  Mail,
  Phone,
  Eye,
  Map,
  List
} from 'lucide-react';
import AdminCentresMap from './AdminCentresMap';

export const StaffVerificationsTab = () => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'MAP'
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    needsCorrection: 0
  });

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Selected Application for Detail Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetailLoading, setAppDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Action Inputs inside Modal
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [activeActionModal, setActiveActionModal] = useState(null); // 'REJECT' | 'CORRECTION' | null

  const fetchApplications = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let queryUrl = `/admin/staff-applications?status=${statusFilter}`;
      if (searchQuery) queryUrl += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await apiClient.get(queryUrl);
      if (res.success) {
        setApplications(res.data.applications || []);
        if (res.data.counts) setStats(res.data.counts);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch procurement centre applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const openApplicationDetail = async (appId) => {
    setAppDetailLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.get(`/admin/staff-applications/${appId}`);
      if (res.success) {
        setSelectedApp(res.data.application);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch application details.');
    } finally {
      setAppDetailLoading(false);
    }
  };

  // Verify Document Action
  const handleVerifyDocument = async (documentId) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/staff-applications/${selectedApp.applicationId}/documents/${documentId}/verify`,
        { notes: 'Verified authentic by Government Administrator' }
      );
      if (res.success) {
        setSuccessMsg(`Document marked as VERIFIED.`);
        await openApplicationDetail(selectedApp.applicationId);
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to verify document.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Document Action
  const handleRejectDocument = async (documentId) => {
    if (!selectedApp) return;
    const reason = prompt('Enter reason for document rejection:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/staff-applications/${selectedApp.applicationId}/reject-document`,
        { documentId, notes: reason }
      );
      if (res.success) {
        setSuccessMsg(`Document marked as REJECTED.`);
        await openApplicationDetail(selectedApp.applicationId);
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject document.');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Application Action
  const handleApproveApplication = async () => {
    if (!selectedApp) return;
    const unverified = (selectedApp.documents || []).filter((d) => d.status !== 'VERIFIED');
    if (unverified.length > 0) {
      if (!window.confirm(`Warning: ${unverified.length} documents are not yet marked VERIFIED. Do you want to mark all documents verified and approve?`)) {
        return;
      }
      // Auto-verify remaining docs first
      for (const d of unverified) {
        await apiClient.post(`/admin/staff-applications/${selectedApp.applicationId}/documents/${d.documentId}/verify`, {
          notes: 'Admin bulk approval'
        });
      }
    } else {
      if (!window.confirm(`Are you sure you want to approve ${selectedApp.centreDetails?.name || selectedApp.centreName} and activate the staff account?`)) {
        return;
      }
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post(`/admin/staff-applications/${selectedApp.applicationId}/approve`, {});
      if (res.success) {
        setSuccessMsg(`Application approved successfully! Verified Procurement Centre activated.`);
        await openApplicationDetail(selectedApp.applicationId);
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Application Action
  const handleRejectApplication = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post(`/admin/staff-applications/${selectedApp.applicationId}/reject`, {
        rejectionReason
      });
      if (res.success) {
        setSuccessMsg(`Application #${selectedApp.applicationId} marked as REJECTED.`);
        setActiveActionModal(null);
        setRejectionReason('');
        await openApplicationDetail(selectedApp.applicationId);
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Request Correction Action
  const handleRequestCorrection = async () => {
    if (!selectedApp || !correctionNote.trim()) return;

    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post(
        `/admin/staff-applications/${selectedApp.applicationId}/request-correction`,
        { correctionNote }
      );
      if (res.success) {
        setSuccessMsg(`Correction request sent to applicant.`);
        setActiveActionModal(null);
        setCorrectionNote('');
        await openApplicationDetail(selectedApp.applicationId);
        fetchApplications();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Correction request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved & Active</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Rejected</Badge>;
      case 'NEEDS_CORRECTION':
      case 'NEEDS_MORE_INFORMATION':
        return <Badge variant="neutral">Needs Correction</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 5 Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-amber-500 p-3 shadow-brutal-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block">
            Pending Review
          </span>
          <h3 className="text-xl font-black text-amber-900 mt-0.5">{stats.pending || 0}</h3>
        </div>

        <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-blue-600 p-3 shadow-brutal-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block">
            Under Review
          </span>
          <h3 className="text-xl font-black text-blue-700 mt-0.5">{stats.underReview || 0}</h3>
        </div>

        <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-emerald-600 p-3 shadow-brutal-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block">
            Approved Centres
          </span>
          <h3 className="text-xl font-black text-emerald-800 mt-0.5">{stats.approved || 0}</h3>
        </div>

        <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-red-500 p-3 shadow-brutal-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block">
            Rejected
          </span>
          <h3 className="text-xl font-black text-red-600 mt-0.5">{stats.rejected || 0}</h3>
        </div>

        <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-purple-500 p-3 shadow-brutal-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block">
            Needs Correction
          </span>
          <h3 className="text-xl font-black text-purple-700 mt-0.5">{stats.needsCorrection || 0}</h3>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <Alert type="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert type="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Search & Status Filter Controls */}
      <Card shadow="normal">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xs text-xs font-black border-2 border-dark-neutral transition-all ${
                    statusFilter === st
                      ? 'bg-forest-green text-white shadow-brutal-sm'
                      : 'bg-warm-ivory text-dark-neutral hover:bg-white'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Applications'
                    : st === 'PENDING_REVIEW'
                    ? 'Pending'
                    : st === 'UNDER_REVIEW'
                    ? 'Under Review'
                    : st === 'APPROVED'
                    ? 'Approved'
                    : st === 'REJECTED'
                    ? 'Rejected'
                    : 'Needs Correction'}
                </button>
              )
            )}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-dark-neutral-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, Centre, Email, Phone..."
                className="pl-8 pr-3 py-1.5 rounded-xs border-2 border-dark-neutral bg-white text-xs font-semibold shadow-[1px_1px_0px_#22252A] focus:outline-none w-64"
              />
            </div>
            <Button type="submit" variant="ghost" size="sm">
              Filter
            </Button>
          </form>

          {/* View Toggle: LIST VIEW | MAP VIEW */}
          <div className="flex items-center gap-1 bg-warm-ivory p-1 border-2 border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-xs font-black rounded-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'LIST'
                  ? 'bg-forest-green text-white shadow-sm'
                  : 'text-dark-neutral hover:bg-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>LIST VIEW</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 text-xs font-black rounded-xs flex items-center gap-1.5 transition-all ${
                viewMode === 'MAP'
                  ? 'bg-forest-green text-white shadow-sm'
                  : 'text-dark-neutral hover:bg-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>MAP VIEW</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Map View Mode */}
      {viewMode === 'MAP' ? (
        <AdminCentresMap
          applications={applications}
          onOpenApplication={openApplicationDetail}
        />
      ) : isLoading ? (
        <LoadingState message="Fetching procurement centre applications..." />
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xs border-2 border-dark-neutral p-8 text-center space-y-3 shadow-brutal-sm">
          <FileCheck className="w-10 h-10 text-dark-neutral-muted mx-auto" />
          <p className="text-sm font-bold text-dark-neutral">
            No procurement centre applications found matching the selected criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => {
            const rep = app.representative || {};
            return (
              <div
                key={app.applicationId}
                className="bg-white rounded-xs border-3 border-dark-neutral p-5 shadow-brutal hover:-translate-y-1 transition-transform flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black font-mono uppercase text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-300 rounded-xs block mb-1">
                        {app.applicationId}
                      </span>
                      <h4 className="text-base font-black text-dark-neutral leading-snug">
                        {app.centreName}
                      </h4>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="text-xs space-y-1 text-dark-neutral">
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>
                        <strong>{rep.fullName || app.fullName}</strong>
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span className="text-dark-neutral-muted truncate max-w-[200px]">
                        {rep.email || app.email}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>+91 {rep.mobile || app.mobile}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-forest-green shrink-0" />
                      <span>
                        {app.localityName ? `${app.localityName}, ` : ''}{app.district}, {app.state}
                      </span>
                    </p>
                    {app.registrationNumber && (
                      <p className="flex items-center gap-1.5 text-[11px] text-dark-neutral-muted">
                        <Building2 className="w-3.5 h-3.5 text-dark-neutral-muted shrink-0" />
                        <span>Reg No: <strong>{app.registrationNumber}</strong></span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 pt-1">
                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        <strong>{app.verifiedDocCount}</strong> / {app.documentCount} Documents Verified
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-dark-neutral/20 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-dark-neutral-muted font-medium">
                    {new Date(app.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openApplicationDetail(app.applicationId)}
                    className="text-xs font-black shadow-brutal-sm"
                  >
                    <span>REVIEW</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED APPLICATION REVIEW MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-xs border-3 border-dark-neutral shadow-brutal-xl max-w-3xl w-full max-h-[90vh] flex flex-col my-8 animate-modal-dialog">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b-2 border-dark-neutral flex items-center justify-between bg-warm-ivory">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-blue-600 text-white flex items-center justify-center border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-dark-neutral font-heading">
                      Procurement Centre Application #{selectedApp.applicationId}
                    </h3>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <span className="text-xs text-dark-neutral-muted font-medium">
                    Submitted: {new Date(selectedApp.submittedAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xs border-2 border-dark-neutral hover:bg-white text-dark-neutral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Correction / Rejection Notes if already recorded */}
              {selectedApp.correctionNote && (
                <div className="p-3 bg-purple-50 border-2 border-purple-400 rounded-xs text-xs text-purple-950">
                  <strong>Pending Correction Note:</strong> {selectedApp.correctionNote}
                </div>
              )}
              {selectedApp.rejectionReason && (
                <div className="p-3 bg-red-50 border-2 border-red-400 rounded-xs text-xs text-red-950">
                  <strong>Rejection Reason:</strong> {selectedApp.rejectionReason}
                </div>
              )}

              {/* CENTRE INFORMATION & REPRESENTATIVE INFORMATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Centre Information */}
                <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral space-y-2 shadow-brutal-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block border-b pb-1 border-blue-200">
                    CENTRE INFORMATION
                  </span>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Centre Name:</strong> {selectedApp.centreDetails?.name || selectedApp.centreName}
                    </p>
                    <p>
                      <strong>Registration / License No:</strong>{' '}
                      {selectedApp.centreDetails?.registrationNumber || selectedApp.registrationNumber || 'Not provided'}
                    </p>
                    <p>
                      <strong>Centre Type:</strong> {selectedApp.centreDetails?.type || selectedApp.centreType}
                    </p>
                    <p>
                      <strong>Complete Address:</strong> {selectedApp.centreDetails?.address || selectedApp.address}
                    </p>
                    <p>
                      <strong>Location:</strong> {selectedApp.centreDetails?.locality || selectedApp.localityName || selectedApp.district},{' '}
                      {selectedApp.centreDetails?.district || selectedApp.district},{' '}
                      {selectedApp.centreDetails?.state || selectedApp.state} -{' '}
                      {selectedApp.centreDetails?.pinCode || selectedApp.pinCode}
                    </p>
                    <p>
                      <strong>Contact:</strong> {selectedApp.centreDetails?.contactPhone || selectedApp.centreContact}
                    </p>
                    <p className="text-[11px] text-dark-neutral-muted">
                      Source: {selectedApp.centreDetails?.locationSource || selectedApp.locationSource || 'OFFICIAL_DATA'}
                    </p>
                  </div>
                </div>

                {/* Representative Information */}
                <div className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral space-y-2 shadow-brutal-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block border-b pb-1 border-blue-200">
                    APPLICANT INFORMATION
                  </span>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Authorized Representative:</strong>{' '}
                      {selectedApp.representative?.fullName || selectedApp.fullName}
                    </p>
                    <p>
                      <strong>Official Centre Email:</strong>{' '}
                      {selectedApp.representative?.email || selectedApp.email}
                    </p>
                    <p>
                      <strong>Contact Mobile Number:</strong> +91{' '}
                      {selectedApp.representative?.phone || selectedApp.mobile}
                    </p>
                  </div>
                </div>
              </div>

              {/* LEGAL DOCUMENTS INSPECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-dark-neutral uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span>LEGAL & AUTHORIZATION DOCUMENTS ({selectedApp.documents?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {(selectedApp.documents || []).map((doc) => (
                    <div
                      key={doc.documentId}
                      className="p-3.5 rounded-xs border-2 border-dark-neutral bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#22252A]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-dark-neutral">{doc.docName}</span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-xs border ${
                              doc.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                : doc.status === 'REJECTED'
                                ? 'bg-red-100 text-red-900 border-red-400'
                                : 'bg-amber-100 text-amber-900 border-amber-400'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-dark-neutral-muted block">
                          Type: <strong>{doc.docType}</strong> • File: {doc.originalFileName} ({(doc.fileSize / 1024).toFixed(1)} KB)
                        </span>
                        {doc.uploadedAt && (
                          <span className="text-[10px] text-dark-neutral-muted block">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleString('en-IN')}
                          </span>
                        )}
                        {doc.notes && (
                          <span className="text-[11px] text-dark-neutral italic block">
                            Note: {doc.notes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* View Document Action */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/admin/staff-applications/${selectedApp.applicationId}/documents/${doc.documentId}`,
                              '_blank'
                            )
                          }
                          className="text-xs border-dark-neutral hover:bg-warm-ivory"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          <span>View Document</span>
                        </Button>

                        {doc.status !== 'VERIFIED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={actionLoading}
                            onClick={() => handleVerifyDocument(doc.documentId)}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>Mark Verified</span>
                          </Button>
                        )}

                        {doc.status !== 'REJECTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            isLoading={actionLoading}
                            onClick={() => handleRejectDocument(doc.documentId)}
                            className="text-xs text-red-700 hover:bg-red-50 border-red-400"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Reject</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Modals for Rejection or Requesting Correction */}
              {activeActionModal === 'REJECT' && (
                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xs space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-red-900">
                    Administrator Remarks / Rejection Reason (Required)
                  </h5>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete mandi authorization certificate, unverified address proof."
                    className="w-full p-2 text-xs border-2 border-dark-neutral bg-white rounded-xs focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoading}
                      onClick={handleRejectApplication}
                      className="bg-red-700 hover:bg-red-800"
                    >
                      Confirm Rejection
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveActionModal(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {activeActionModal === 'CORRECTION' && (
                <div className="p-4 bg-purple-50 border-2 border-purple-500 rounded-xs space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-purple-900">
                    Administrator Remarks / Correction Note (Required)
                  </h5>
                  <textarea
                    rows={2}
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="e.g. APMC authorization document is unclear. Please upload a valid copy."
                    className="w-full p-2 text-xs border-2 border-dark-neutral bg-white rounded-xs focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoading}
                      onClick={handleRequestCorrection}
                      className="bg-purple-700 hover:bg-purple-800"
                    >
                      Send Correction Request
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setActiveActionModal(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 border-t-2 border-dark-neutral bg-warm-ivory flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedApp.status !== 'REJECTED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveActionModal('REJECT')}
                    className="text-red-700 border-red-500 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    <span>REJECT APPLICATION</span>
                  </Button>
                )}

                {selectedApp.status !== 'APPROVED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveActionModal('CORRECTION')}
                    className="text-purple-700 border-purple-500 hover:bg-purple-50"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    <span>REQUEST CORRECTION</span>
                  </Button>
                )}
              </div>

              {selectedApp.status !== 'APPROVED' && (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={actionLoading}
                  onClick={handleApproveApplication}
                  className="min-h-[44px] shadow-brutal-sm font-black bg-emerald-700 hover:bg-emerald-800"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span>APPROVE CENTRE</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffVerificationsTab;
