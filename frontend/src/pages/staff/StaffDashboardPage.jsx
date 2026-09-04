import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useSocketQueue } from '../../hooks/useSocketQueue';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import StatusIndicator from '../../components/common/StatusIndicator';
import LoadingState from '../../components/common/LoadingState';
import DigitalReceiptModal from '../../components/farmer/DigitalReceiptModal';
import {
  Building2,
  Users,
  ArrowRightCircle,
  Scale,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Radio,
  UserCheck,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  UserPlus,
  MapPin,
  Settings,
  Check,
  X,
  Lock,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Ticket,
  Eye,
  Edit2,
  UserX,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export const StaffDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Navigation tab: 'OPERATIONS' | 'MANAGEMENT'
  const [activeTab, setActiveTab] = useState('OPERATIONS');

  const [counterId, setCounterId] = useState('Counter 1');
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});

  // Centre Profile & Staff State
  const [centreProfile, setCentreProfile] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [isLoadingCentreData, setIsLoadingCentreData] = useState(false);

  // Today's Operations Bookings State
  const [todayBookings, setTodayBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  // Add Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Procurement Officer',
    password: '',
    employeeId: ''
  });

  // Edit Staff Modal State
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({
    staffId: '',
    fullName: '',
    phone: '',
    designation: 'Procurement Officer'
  });

  // View Assignments Modal State
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);

  // Reassign Booking Staff Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedBookingForReassign, setSelectedBookingForReassign] = useState(null);
  const [targetStaffId, setTargetStaffId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // General loading & messages
  const [isLoading, setIsLoading] = useState(true);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  // Modals state for inspection & weighing
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Form inputs for verification & weighing
  const [verQty, setVerQty] = useState(50);
  const [moisture, setMoisture] = useState(12.0);
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [netWeight, setNetWeight] = useState(48.5);
  const [deductions, setDeductions] = useState(0);

  const centreId = user?.assignedCentreId || 'c1';
  const isHead = user?.isCentreHead || user?.designation === 'Centre Head' || (user?.email && user?.email.includes('centre'));

  const fetchQueueData = useCallback(async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        apiClient.get('/queue/today?centreId=' + centreId),
        apiClient.get('/queue/stats?centreId=' + centreId)
      ]);

      if (queueRes.success) setQueue(queueRes.data || []);
      if (statsRes.success) setStats(statsRes.data || {});
    } catch (err) {
      console.warn('Queue sync handled gracefully:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [centreId]);

  const fetchCentreManagementData = useCallback(async () => {
    setIsLoadingCentreData(true);
    try {
      const [profileRes, staffRes] = await Promise.all([
        apiClient.get('/centres/my/profile'),
        apiClient.get('/centres/my/staff')
      ]);

      if (profileRes.success) setCentreProfile(profileRes.data);
      if (staffRes.success) setStaffList(staffRes.data || []);
    } catch (err) {
      console.warn('[Centre Profile] Data fetch handled gracefully:', err.message);
    } finally {
      setIsLoadingCentreData(false);
    }
  }, []);

  const fetchTodayBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
      const res = await apiClient.get('/centres/my/bookings/today');
      if (res.success) {
        setTodayBookings(res.data || []);
      }
    } catch (err) {
      console.warn('Today bookings fetch handled gracefully:', err.message);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
    fetchCentreManagementData();
    fetchTodayBookings();
  }, [fetchQueueData, fetchCentreManagementData, fetchTodayBookings]);

  const { isConnected } = useSocketQueue({
    centreId,
    onQueueUpdate: () => {
      fetchQueueData();
      fetchTodayBookings();
    }
  });

  const activeServingEntry = queue.find((q) =>
    ['CALLED', 'ARRIVED', 'VERIFICATION', 'WEIGHING'].includes(q.state)
  );

  const handleCallNext = async () => {
    setIsCallingNext(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const res = await apiClient.post('/queue/call-next', { centreId, counterId });
      if (res.success && res.data?.queueEntry) {
        setActionSuccessMsg('Token ' + res.data.queueEntry.tokenNumber + ' called to ' + counterId);
        fetchQueueData();
        fetchTodayBookings();
      } else {
        setErrorMsg('No waiting farmers in queue for today.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to call next farmer.');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleStateTransition = async (entryId, targetState, payload = {}) => {
    setErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      let endpoint = '';
      if (targetState === 'ARRIVED') endpoint = '/queue/' + entryId + '/arrived';
      else if (targetState === 'VERIFICATION') endpoint = '/queue/' + entryId + '/verify';
      else if (targetState === 'WEIGHING') endpoint = '/queue/' + entryId + '/weigh';
      else if (targetState === 'COMPLETED') endpoint = '/queue/' + entryId + '/complete';

      const res = await apiClient.post(endpoint, payload);
      if (res.success) {
        setActionSuccessMsg('Workflow advanced to ' + targetState);
        fetchQueueData();
        fetchTodayBookings();
        return res.data;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to transition state to ' + targetState);
      throw err;
    }
  };

  const handleConfirmVerification = async () => {
    if (!activeServingEntry) return;
    setIsSubmittingModal(true);
    try {
      await handleStateTransition(activeServingEntry.id, 'VERIFICATION', {
        verifiedQuantityQuintals: Number(verQty),
        moisturePercentage: Number(moisture),
        qualityGrade
      });
      setShowVerifyModal(false);
    } catch (err) {
      // Error handled in handleStateTransition
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleConfirmWeighingAndComplete = async () => {
    if (!activeServingEntry) return;
    setIsSubmittingModal(true);
    try {
      await handleStateTransition(activeServingEntry.id, 'WEIGHING', {
        grossWeightQuintals: Number(netWeight) + 0.5,
        tareWeightQuintals: 0.5,
        netWeightQuintals: Number(netWeight),
        deductionsRs: Number(deductions)
      });

      const completeRes = await handleStateTransition(activeServingEntry.id, 'COMPLETED');
      setShowWeighModal(false);

      if (completeRes?.receipt) {
        setLastReceipt(completeRes.receipt);
        setShowReceiptModal(true);
      }
    } catch (err) {
      // Error handled in handleStateTransition
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Operational Booking Status Update
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    setErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await apiClient.patch('/centres/my/bookings/' + bookingId + '/status', {
        operationalStatus: newStatus,
        note: 'Operational status updated to ' + newStatus
      });
      if (res.success) {
        setActionSuccessMsg('Token ' + res.data.tokenNumber + ' updated to ' + newStatus + '.');
        fetchTodayBookings();
        fetchCentreManagementData();
        fetchQueueData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update booking status.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Staff Reassignment
  const handleOpenReassignModal = (booking) => {
    setSelectedBookingForReassign(booking);
    setTargetStaffId(booking.assignedStaffId || '');
    setShowReassignModal(true);
  };

  const handleReassignStaffSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReassign || !targetStaffId) return;
    setIsReassigning(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.patch('/centres/my/bookings/' + selectedBookingForReassign.id + '/reassign-staff', {
        staffId: targetStaffId
      });
      if (res.success) {
        setActionSuccessMsg('Token ' + selectedBookingForReassign.tokenNumber + ' reassigned to ' + res.data.assignedStaffName + '.');
        setShowReassignModal(false);
        fetchTodayBookings();
        fetchCentreManagementData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reassign staff member.');
    } finally {
      setIsReassigning(false);
    }
  };

  // Staff Management Actions
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setIsAddingStaff(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post('/centres/my/staff', newStaffForm);
      if (res.success) {
        setActionSuccessMsg('Staff member ' + newStaffForm.fullName + ' provisioned successfully.');
        setShowAddStaffModal(false);
        setNewStaffForm({
          fullName: '',
          email: '',
          phone: '',
          designation: 'Procurement Officer',
          password: '',
          employeeId: ''
        });
        fetchCentreManagementData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add staff member.');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleOpenEditStaffModal = (member) => {
    setEditStaffForm({
      staffId: member._id || member.id,
      fullName: member.fullName,
      phone: member.phone || '',
      designation: member.designation || 'Procurement Officer'
    });
    setShowEditStaffModal(true);
  };

  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    setIsEditingStaff(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.patch('/centres/my/staff/' + editStaffForm.staffId, {
        fullName: editStaffForm.fullName,
        phone: editStaffForm.phone,
        designation: editStaffForm.designation
      });
      if (res.success) {
        setActionSuccessMsg('Staff profile for ' + editStaffForm.fullName + ' updated.');
        setShowEditStaffModal(false);
        fetchCentreManagementData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update staff member details.');
    } finally {
      setIsEditingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staffMember) => {
    const newStatus = staffMember.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    if (!window.confirm('Are you sure you want to ' + actionLabel + ' ' + staffMember.fullName + '?')) {
      return;
    }

    try {
      const res = await apiClient.patch('/centres/my/staff/' + (staffMember._id || staffMember.id) + '/status', {
        accountStatus: newStatus
      });
      if (res.success) {
        setActionSuccessMsg('Staff account ' + actionLabel + 'd successfully.');
        fetchCentreManagementData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to ' + actionLabel + ' staff account.');
    }
  };

  const handleViewStaffAssignments = (member) => {
    setSelectedStaffMember(member);
    setShowAssignmentsModal(true);
  };

  const centreDisplayName = centreProfile?.name || 'Krishi Seva Procurement Centre — Gomti Nagar';
  const appointedHeadName = centreProfile?.currentHead?.fullName || 'Satish Kumar';
  const centreIdCode = centreProfile?.centreId || 'LKO-GOM-001';
  const operationalStats = centreProfile?.stats || {};

  // Status options for operations table
  const operationalStatuses = [
    'BOOKED',
    'ARRIVED',
    'IN QUEUE',
    'QUALITY CHECK',
    'WEIGHING',
    'PROCUREMENT COMPLETE',
    'PAYMENT PROCESSING',
    'COMPLETED',
    'CANCELLED'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'BOOKED': return 'bg-blue-100 text-blue-900 border-blue-400';
      case 'ARRIVED': return 'bg-indigo-100 text-indigo-900 border-indigo-400';
      case 'IN QUEUE': return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'QUALITY CHECK': return 'bg-yellow-100 text-yellow-950 border-yellow-500';
      case 'WEIGHING': return 'bg-purple-100 text-purple-900 border-purple-400';
      case 'PROCUREMENT COMPLETE': return 'bg-emerald-100 text-emerald-900 border-emerald-400';
      case 'PAYMENT PROCESSING': return 'bg-teal-100 text-teal-900 border-teal-400';
      case 'COMPLETED': return 'bg-forest-green-light text-forest-green border-forest-green';
      case 'CANCELLED': return 'bg-red-100 text-red-900 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        {/* ========================================================= */}
        {/* TOP SECTION: ORGANIZATION ENTITY HIERARCHY & IDENTITY     */}
        {/* ========================================================= */}
        <div className="bg-white border-3 border-dark-neutral p-5 sm:p-6 rounded-md shadow-brutal-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-forest-green bg-forest-green-light px-2 py-0.5 rounded-xs border border-dark-neutral shadow-[1px_1px_0px_#22252A]">
                  {t('staff.centre_entity_label', 'PROCUREMENT CENTRE')}
                </span>
                <span className="text-xs font-bold text-dark-neutral-muted">•</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-dark-neutral">
                  ID: <strong>{centreIdCode}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-dark-neutral">
                {t('staff.greeting_centre', { centreName: centreDisplayName })}
              </h1>
              <p className="text-xs text-dark-neutral-muted font-medium mt-1">
                {t('staff.title', 'Procurement Centre Operations')} • {centreProfile?.district || 'Lucknow'}, {centreProfile?.state || 'Uttar Pradesh'}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="success" size="lg" icon={ShieldCheck}>
                {t('common.status_active_verified', 'ACTIVE / VERIFIED')}
              </Badge>

              <Badge variant={isConnected ? 'success' : 'warning'} icon={Radio}>
                {isConnected ? t('farmer.live_updates_connected', 'Live Socket Connected') : t('farmer.live_updates_reconnecting', 'Reconnecting...')}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchQueueData();
                  fetchCentreManagementData();
                  fetchTodayBookings();
                }}
                className="text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>{t('common.refresh', 'Sync All')}</span>
              </Button>
            </div>
          </div>

          {/* Operational Hierarchy Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t-2 border-dark-neutral/10 text-xs">
            <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <span className="text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider block">
                {t('staff.centre_entity_label', 'Procurement Centre')}
              </span>
              <span className="font-black text-dark-neutral truncate block mt-0.5">
                {centreDisplayName}
              </span>
            </div>

            <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <span className="text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider block">
                {t('staff.centre_id_label', 'Centre ID')}
              </span>
              <span className="font-mono font-black text-forest-green block mt-0.5">
                {centreIdCode}
              </span>
            </div>

            <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <span className="text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider block">
                {t('staff.appointed_head_label', 'Appointed Head')}
              </span>
              <span className="font-black text-dark-neutral block mt-0.5">
                {appointedHeadName}
              </span>
            </div>

            <div className="p-2.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
              <span className="text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider block">
                {t('staff.table_assigned_staff', 'Staff Members')}
              </span>
              <span className="font-black text-blue-700 block mt-0.5">
                {t('staff.staff_members_count', { count: (centreProfile?.activeStaffCount || staffList.length || 6) })}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 8 OPERATIONAL KPI CARDS ROW                               */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
          {/* 1. Today's Bookings */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_today_bookings', "Today's Bookings")}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-dark-neutral">
                {operationalStats.todayBookingsCount ?? todayBookings.length}
              </span>
              <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
          </div>

          {/* 2. Farmers Waiting */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_farmers_waiting', 'Farmers Waiting')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-amber-700">
                {operationalStats.farmersWaitingCount ?? 3}
              </span>
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
          </div>

          {/* 3. Available Slots */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_available_slots', 'Available Slots')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-forest-green">
                {operationalStats.availableSlotsCount ?? 44}
              </span>
              <CheckCircle2 className="w-4 h-4 text-forest-green shrink-0" />
            </div>
          </div>

          {/* 4. Current Queue */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_current_queue', 'Current Queue')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-info-blue">
                {operationalStats.currentQueueCount ?? queue.length}
              </span>
              <Radio className="w-4 h-4 text-info-blue shrink-0" />
            </div>
          </div>

          {/* 5. Total Staff */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_total_staff', 'Total Staff')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-dark-neutral">
                {operationalStats.totalStaffCount ?? (staffList.length || 6)}
              </span>
              <Users className="w-4 h-4 text-dark-neutral shrink-0" />
            </div>
          </div>

          {/* 6. Completed Procurement */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_completed_procurement', 'Completed')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-forest-green">
                {operationalStats.completedProcurementCount ?? 1}
              </span>
              <Scale className="w-4 h-4 text-forest-green shrink-0" />
            </div>
          </div>

          {/* 7. Pending Quality Inspections */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_pending_quality', 'Pending Quality')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-yellow-700">
                {operationalStats.pendingQualityCount ?? 1}
              </span>
              <FileCheck className="w-4 h-4 text-yellow-600 shrink-0" />
            </div>
          </div>

          {/* 8. Pending Payments */}
          <div className="bg-white rounded-xs border-2 border-dark-neutral p-3 shadow-brutal-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted block truncate">
              {t('staff.kpi_pending_payment', 'Pending Payment')}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-black text-purple-700">
                {operationalStats.pendingPaymentCount ?? 1}
              </span>
              <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 mb-6 border-b-2 border-dark-neutral">
          <button
            type="button"
            onClick={() => setActiveTab('OPERATIONS')}
            className={'pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-micro ease-tactile flex items-center gap-2 border-b-3 -mb-[2px] ' + (
              activeTab === 'OPERATIONS'
                ? 'border-forest-green text-forest-green'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            )}
          >
            <Users className="w-4 h-4" />
            <span>{t('staff.tab_operations') || "Today's Operations & Queue"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MANAGEMENT')}
            className={'pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-micro ease-tactile flex items-center gap-2 border-b-3 -mb-[2px] ' + (
              activeTab === 'MANAGEMENT'
                ? 'border-forest-green text-forest-green'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('staff.tab_management') || 'Staff Management & Centre'}</span>
          </button>
        </div>

        {errorMsg && (
          <Alert type="error" className="mb-4 animate-fade-slide" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {actionSuccessMsg && (
          <Alert type="success" className="mb-4 animate-fade-slide" onClose={() => setActionSuccessMsg(null)}>
            {actionSuccessMsg}
          </Alert>
        )}

        {/* ========================================================= */}
        {/* TAB 1: TODAY'S OPERATIONS                                  */}
        {/* ========================================================= */}
        {activeTab === 'OPERATIONS' && (
          <div className="space-y-6 animate-step-enter">
            {/* 1. Today's Operations Booking Table */}
            <Card
              title={t('staff.table_title', "Today's Operational Bookings & Live Processing")}
              accentBorder
              shadow="normal"
              actions={
                <div className="flex items-center gap-2">
                  <Select
                    value={counterId}
                    onChange={(e) => setCounterId(e.target.value)}
                    className="py-1 text-xs mb-0"
                  >
                    <option value="Counter 1">Intake #1</option>
                    <option value="Counter 2">Intake #2</option>
                    <option value="Counter 3">Intake #3</option>
                  </Select>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isCallingNext}
                    onClick={handleCallNext}
                    className="text-xs font-bold"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5 mr-1" />
                    <span>{t('staff.call_next', 'Call Next')}</span>
                  </Button>
                </div>
              }
            >
              {isLoadingBookings ? (
                <LoadingState message={t('staff.loading_bookings', "Loading today's operational bookings...")} />
              ) : todayBookings.length === 0 ? (
                <div className="text-center py-10 text-dark-neutral-muted">
                  <p className="text-sm font-bold">{t('staff.no_bookings', 'No delivery bookings scheduled for today.')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5 -mb-5">
                  <table className="w-full text-left text-xs border-t-2 border-dark-neutral">
                    <thead className="bg-warm-ivory text-dark-neutral font-black uppercase text-[10px] tracking-wider border-b-2 border-dark-neutral">
                      <tr>
                        <th className="py-3 px-4">{t('staff.table_token', 'Token')}</th>
                        <th className="py-3 px-4">{t('staff.table_farmer', 'Farmer')}</th>
                        <th className="py-3 px-4">{t('staff.table_time', 'Time')}</th>
                        <th className="py-3 px-4">{t('staff.table_crop', 'Crop')}</th>
                        <th className="py-3 px-4">{t('staff.table_quantity', 'Quantity')}</th>
                        <th className="py-3 px-4">{t('staff.table_assigned_staff', 'Assigned Staff')}</th>
                        <th className="py-3 px-4">{t('staff.table_status', 'Status')}</th>
                        <th className="py-3 px-4">{t('staff.table_update_status', 'Update Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-neutral/20 font-medium">
                      {todayBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-warm-ivory/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-sm text-forest-green block">
                              {b.tokenNumber}
                            </span>
                            <span className="text-[10px] text-dark-neutral-muted font-mono">{b.bookingReference}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-dark-neutral block">{b.farmerName}</span>
                            <span className="text-[10px] text-dark-neutral-muted">
                              📱 {b.farmerPhone} • {b.farmerVillage}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-dark-neutral font-medium">{b.timeWindow}</td>

                          <td className="py-3 px-4">
                            <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-xs font-bold text-[10px]">
                              {b.cropType}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-dark-neutral">
                            {b.quantityQuintals} Qtl ({b.quantityKg} kg)
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center justify-between gap-1.5">
                              <div>
                                <span className="font-bold text-dark-neutral block">{b.assignedStaffName || 'Unassigned'}</span>
                                <span className="text-[10px] text-dark-neutral-muted block">{b.assignedStaffDesignation || 'Operator'}</span>
                              </div>
                              {isHead && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReassignModal(b)}
                                  className="text-[10px] font-black text-blue-700 hover:underline shrink-0"
                                >
                                  Reassign
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={'px-2 py-0.5 rounded-xs border text-[10px] font-black uppercase tracking-wider inline-block ' + getStatusColor(
                                b.operationalStatus
                              )}
                            >
                              {b.operationalStatus}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={b.operationalStatus}
                              disabled={updatingBookingId === b.id}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                              className="text-xs py-1 px-2 rounded-xs border-2 border-dark-neutral bg-white font-bold text-dark-neutral focus:outline-none focus:shadow-brutal-sm cursor-pointer disabled:opacity-50"
                            >
                              {operationalStatuses.map((st) => (
                                <option key={st} value={st}>
                                  → {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Counter Processing & Inspection Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Active Serving Counter Box */}
              <div className="lg:col-span-4 space-y-4">
                <Card title={'Currently Processing at ' + counterId} accentBorder shadow="normal">
                  {activeServingEntry ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] text-center">
                        <span className="text-xs font-black text-forest-green uppercase tracking-wider block">
                          ACTIVE TOKEN ({activeServingEntry.counterId})
                        </span>
                        <h2 className="text-3xl font-black text-forest-green font-mono my-1">
                          {activeServingEntry.tokenNumber}
                        </h2>
                        <StatusIndicator status={activeServingEntry.state} />
                      </div>

                      <div className="text-xs space-y-1.5 bg-warm-ivory p-3 rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                        <div className="flex justify-between">
                          <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Farmer:</span>
                          <span className="font-black text-dark-neutral">{activeServingEntry.farmer?.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Phone:</span>
                          <span className="font-bold text-dark-neutral">📱 +91 {activeServingEntry.farmer?.phone}</span>
                        </div>
                      </div>

                      {/* Stage Advancement Action Buttons */}
                      <div className="space-y-2 pt-2 border-t-2 border-dark-neutral/10">
                        <span className="text-xs font-black uppercase tracking-wider text-dark-neutral block">
                          Advance Workflow Stage:
                        </span>

                        {activeServingEntry.state === 'CALLED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() => handleStateTransition(activeServingEntry.id, 'ARRIVED')}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            <span>Mark Arrived</span>
                          </Button>
                        )}

                        {activeServingEntry.state === 'ARRIVED' && (
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={() => setShowVerifyModal(true)}
                          >
                            <FileCheck className="w-4 h-4 mr-1.5" />
                            <span>Record Produce Inspection</span>
                          </Button>
                        )}

                        {activeServingEntry.state === 'VERIFICATION' && (
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={() => setShowWeighModal(true)}
                          >
                            <Scale className="w-4 h-4 mr-1.5" />
                            <span>Record Net Weight & Issue Receipt</span>
                          </Button>
                        )}

                        {activeServingEntry.state === 'WEIGHING' && (
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={() => handleStateTransition(activeServingEntry.id, 'COMPLETED')}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            <span>Complete Purchase Settlement</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-dark-neutral-muted">
                      <Clock className="w-10 h-10 mx-auto text-dark-neutral-muted/40 mb-2" />
                      <p className="text-xs font-bold">No token currently serving at {counterId}.</p>
                      <p className="text-[11px] mt-1">Click "Call Next" above to begin serving farmers in queue.</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Live Centre Queue */}
              <div className="lg:col-span-8">
                <Card title="Live Queue Tokens for Today" shadow="normal">
                  {isLoading ? (
                    <LoadingState message="Fetching live queue updates..." />
                  ) : queue.length === 0 ? (
                    <div className="text-center py-10 text-dark-neutral-muted">
                      <p className="text-sm font-bold">No active tokens in queue currently.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-5 -mb-5">
                      <table className="w-full text-left text-xs border-t-2 border-dark-neutral">
                        <thead className="bg-warm-ivory text-dark-neutral font-black uppercase text-[10px] tracking-wider border-b-2 border-dark-neutral">
                          <tr>
                            <th className="py-3 px-4">Token #</th>
                            <th className="py-3 px-4">Farmer</th>
                            <th className="py-3 px-4">Crop</th>
                            <th className="py-3 px-4">Est. Qty</th>
                            <th className="py-3 px-4">Slot</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-neutral/20 font-medium">
                          {queue.map((entry) => (
                            <tr
                              key={entry.id}
                              className={'transition-all duration-micro ease-tactile hover:bg-forest-green-light/20 ' + (
                                entry.id === activeServingEntry?.id ? 'bg-forest-green-light/40 font-bold' : ''
                              )}
                            >
                              <td className="py-3 px-4 font-mono font-black text-forest-green">
                                {entry.tokenNumber}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold block text-dark-neutral">{entry.farmer?.fullName}</span>
                                <span className="text-[10px] text-dark-neutral-muted font-mono">{entry.farmer?.phone}</span>
                              </td>
                              <td className="py-3 px-4">{entry.booking?.cropType || 'Wheat'}</td>
                              <td className="py-3 px-4 font-mono">{entry.booking?.estimatedQuantityQuintals || 50} Qtl</td>
                              <td className="py-3 px-4 text-dark-neutral-muted">{entry.booking?.timeWindow || '09:00 - 10:00'}</td>
                              <td className="py-3 px-4">
                                <StatusIndicator status={entry.state} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: STAFF MANAGEMENT & CENTRE PROFILE                  */}
        {/* ========================================================= */}
        {activeTab === 'MANAGEMENT' && (
          <div className="space-y-6 animate-step-enter">
            {/* 1. Staff Members Section */}
            <Card
              title={t('staff.tab_management', 'Centre Operating Staff Members')}
              accentBorder
              shadow="normal"
              actions={
                isHead ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowAddStaffModal(true)}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    <span>{t('staff.btn_add_staff', '+ Add Staff Member')}</span>
                  </Button>
                ) : null
              }
            >
              {isLoadingCentreData ? (
                <LoadingState message={t('staff.loading_staff', 'Loading centre staff accounts...')} />
              ) : staffList.length === 0 ? (
                <p className="text-xs text-dark-neutral-muted text-center py-6">{t('staff.no_staff', 'No staff members currently registered.')}</p>
              ) : (
                <div className="overflow-x-auto -mx-5 -mb-5">
                  <table className="w-full text-left text-xs border-t-2 border-dark-neutral">
                    <thead className="bg-warm-ivory text-dark-neutral font-black uppercase text-[10px] tracking-wider border-b-2 border-dark-neutral">
                      <tr>
                        <th className="py-3 px-4">{t('staff.table_staff_member', 'Staff Member')}</th>
                        <th className="py-3 px-4">{t('staff.table_role', 'Role / Designation')}</th>
                        <th className="py-3 px-4">{t('staff.table_email', 'Email')}</th>
                        <th className="py-3 px-4">{t('staff.table_phone', 'Phone')}</th>
                        <th className="py-3 px-4">{t('staff.table_status', 'Status')}</th>
                        <th className="py-3 px-4">{t('staff.table_workload', 'Current Workload')}</th>
                        <th className="py-3 px-4">{t('staff.table_assignments', "Today's Assignments")}</th>
                        <th className="py-3 px-4">{t('staff.table_actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-neutral/20 font-medium">
                      {staffList.map((member) => (
                        <tr key={member._id || member.id} className="hover:bg-warm-ivory/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-dark-neutral block">{member.fullName}</span>
                            {member.isCentreHead && (
                              <span className="text-[10px] font-black text-forest-green uppercase">Appointed Head</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="bg-gray-100 text-dark-neutral px-2 py-0.5 rounded-xs border border-dark-neutral text-[10px] font-bold">
                              {member.designation || (member.isCentreHead ? 'Centre Head' : 'Procurement Officer')}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono">{member.email}</td>
                          <td className="py-3 px-4 font-mono">{member.phone || '—'}</td>

                          <td className="py-3 px-4">
                            <Badge variant={member.accountStatus === 'ACTIVE' ? 'success' : 'danger'}>
                              {member.accountStatus || 'ACTIVE'}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-300">
                              {member.currentWorkload || 0} active
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-xs border border-blue-300">
                              {member.todayAssignments || 0} today
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewStaffAssignments(member)}
                                className="text-[11px] font-bold text-dark-neutral hover:text-forest-green flex items-center gap-0.5"
                                title="View assignments"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>

                              {isHead && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditStaffModal(member)}
                                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                                  title="Edit details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {!member.isCentreHead && isHead && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStaffStatus(member)}
                                  className={'text-[11px] font-bold underline hover:no-underline ' + (
                                    member.accountStatus === 'ACTIVE' ? 'text-red-700' : 'text-forest-green'
                                  )}
                                >
                                  {member.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* 2. Centre Details & Appointed Head Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Centre Information */}
              <Card title="Procurement Centre Facility Profile" accentBorder shadow="normal">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                    <span className="text-dark-neutral-muted font-bold uppercase">Centre Name:</span>
                    <span className="font-black text-dark-neutral">{centreDisplayName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                    <span className="text-dark-neutral-muted font-bold uppercase">Facility ID:</span>
                    <span className="font-mono font-bold text-forest-green">{centreIdCode}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-dark-neutral/10">
                    <span className="text-dark-neutral-muted font-bold uppercase">Administrative Address:</span>
                    <span className="font-medium text-dark-neutral text-right max-w-xs">
                      {centreProfile?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-dark-neutral/10">
                    <span className="text-dark-neutral-muted font-bold uppercase">District & State:</span>
                    <span className="font-bold text-dark-neutral">
                      {centreProfile?.district || 'Lucknow'}, {centreProfile?.state || 'Uttar Pradesh'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-dark-neutral/10">
                    <span className="text-dark-neutral-muted font-bold uppercase">Daily Capacity:</span>
                    <span className="font-mono font-bold text-dark-neutral">
                      {centreProfile?.dailyCapacityQuintals || 1500} Quintals
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-neutral-muted font-bold uppercase">Official Contact Phone:</span>
                    <span className="font-mono font-bold text-dark-neutral">
                      {centreProfile?.contactPhone || '+91 522 2720011'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Appointed Head */}
              <Card title="Appointed Head / Administrator Profile" accentBorder shadow="normal">
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-blue-50 border-2 border-blue-600 rounded-xs shadow-[2px_2px_0px_#2563EB] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                      {appointedHeadName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-blue-950 font-heading">{appointedHeadName}</h4>
                      <span className="text-[11px] font-bold text-blue-800">
                        Designation: Centre Head / Appointed Administrator
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between pb-1.5 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase">Head Email:</span>
                      <span className="font-mono font-bold text-dark-neutral">
                        {centreProfile?.currentHead?.email || 'gomtinagar.centre@agrinexus.demo'}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase">Head Mobile:</span>
                      <span className="font-mono font-bold text-dark-neutral">
                        {centreProfile?.currentHead?.phone || '9876543211'}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase">Appointment Status:</span>
                      <Badge variant="success">Active Appointee</Badge>
                    </div>
                    <p className="text-[11px] text-dark-neutral-muted leading-relaxed pt-1">
                      The Appointed Head is legally responsible for procurement integrity, moisture grading standards, and staff assignment.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD STAFF MEMBER                                   */}
        {/* ========================================================= */}
        <Modal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          title="Provision New Centre Operating Staff Member"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowAddStaffModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isAddingStaff} onClick={handleAddStaffSubmit}>
                Provision Staff Account
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddStaffSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                required
                value={newStaffForm.fullName}
                onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                  Official Email <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  placeholder="e.g. ramesh@agrinexus.demo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <Input
                  type="tel"
                  required
                  maxLength={10}
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                  Operational Role <span className="text-red-600">*</span>
                </label>
                <Select
                  value={newStaffForm.designation}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                >
                  <option value="Centre Manager">Centre Manager</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Quality Inspector">Quality Inspector</option>
                  <option value="Weighing Operator">Weighing Operator</option>
                  <option value="Token/Queue Operator">Token/Queue Operator</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                  Employee ID (Optional)
                </label>
                <Input
                  type="text"
                  value={newStaffForm.employeeId}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, employeeId: e.target.value })}
                  placeholder="e.g. EMP-2026-08"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Temporary Password <span className="text-red-600">*</span>
              </label>
              <Input
                type="password"
                required
                value={newStaffForm.password}
                onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                placeholder="Min 6 characters"
              />
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: EDIT STAFF MEMBER                                  */}
        {/* ========================================================= */}
        <Modal
          isOpen={showEditStaffModal}
          onClose={() => setShowEditStaffModal(false)}
          title="Edit Staff Member Details"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowEditStaffModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isEditingStaff} onClick={handleEditStaffSubmit}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleEditStaffSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                required
                value={editStaffForm.fullName}
                onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Mobile Number
              </label>
              <Input
                type="tel"
                maxLength={10}
                value={editStaffForm.phone}
                onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Operational Role <span className="text-red-600">*</span>
              </label>
              <Select
                value={editStaffForm.designation}
                onChange={(e) => setEditStaffForm({ ...editStaffForm, designation: e.target.value })}
              >
                <option value="Centre Manager">Centre Manager</option>
                <option value="Procurement Officer">Procurement Officer</option>
                <option value="Quality Inspector">Quality Inspector</option>
                <option value="Weighing Operator">Weighing Operator</option>
                <option value="Token/Queue Operator">Token/Queue Operator</option>
              </Select>
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: VIEW STAFF TODAY'S ASSIGNMENTS                    */}
        {/* ========================================================= */}
        <Modal
          isOpen={showAssignmentsModal}
          onClose={() => setShowAssignmentsModal(false)}
          title={'Today\'s Assignments: ' + (selectedStaffMember?.fullName || 'Staff Member')}
          footer={
            <Button variant="primary" onClick={() => setShowAssignmentsModal(false)}>Close</Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-warm-ivory border-2 border-dark-neutral rounded-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-dark-neutral block">{selectedStaffMember?.fullName}</span>
                <span className="text-dark-neutral-muted">{selectedStaffMember?.designation}</span>
              </div>
              <Badge variant="info">
                {(selectedStaffMember?.currentWorkload || 0) + ' active bookings'}
              </Badge>
            </div>

            <h4 className="font-black uppercase tracking-wider text-dark-neutral pt-2">Assigned Appointments Today:</h4>
            {todayBookings.filter(b => b.assignedStaffId === (selectedStaffMember?._id || selectedStaffMember?.id)).length === 0 ? (
              <p className="text-dark-neutral-muted italic py-3 text-center">No bookings assigned for today yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {todayBookings
                  .filter(b => b.assignedStaffId === (selectedStaffMember?._id || selectedStaffMember?.id))
                  .map(b => (
                    <div key={b.id} className="p-2.5 bg-white rounded-xs border-2 border-dark-neutral flex items-center justify-between">
                      <div>
                        <span className="font-mono font-black text-forest-green">{b.tokenNumber}</span>
                        <span className="text-dark-neutral font-bold ml-2">{b.farmerName}</span>
                        <p className="text-[10px] text-dark-neutral-muted">{b.cropType} • {b.quantityQuintals} Qtl • {b.timeWindow}</p>
                      </div>
                      <span className={'px-2 py-0.5 text-[10px] font-black uppercase rounded-xs border ' + getStatusColor(b.operationalStatus)}>
                        {b.operationalStatus}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: REASSIGN BOOKING STAFF                             */}
        {/* ========================================================= */}
        <Modal
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          title={'Reassign Staff for Token ' + (selectedBookingForReassign?.tokenNumber || '')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowReassignModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isReassigning} onClick={handleReassignStaffSubmit}>
                Confirm Reassignment
              </Button>
            </>
          }
        >
          <form onSubmit={handleReassignStaffSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-warm-ivory border-2 border-dark-neutral rounded-xs space-y-1">
              <p><strong>Farmer:</strong> {selectedBookingForReassign?.farmerName}</p>
              <p><strong>Produce:</strong> {selectedBookingForReassign?.cropType} ({selectedBookingForReassign?.quantityQuintals} Qtl)</p>
              <p><strong>Scheduled Time:</strong> {selectedBookingForReassign?.timeWindow}</p>
              <p><strong>Currently Assigned:</strong> {selectedBookingForReassign?.assignedStaffName || 'None'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Select Active Staff Member <span className="text-red-600">*</span>
              </label>
              <Select
                value={targetStaffId}
                onChange={(e) => setTargetStaffId(e.target.value)}
                required
              >
                <option value="">-- Choose Active Staff --</option>
                {staffList
                  .filter(s => s.accountStatus === 'ACTIVE')
                  .map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.fullName} ({s.designation || 'Operator'}) — {(s.currentWorkload || 0) + ' active'}
                    </option>
                  ))}
              </Select>
            </div>
          </form>
        </Modal>

        {/* Modal 1: Produce Verification Modal */}
        <Modal
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          title="Produce Quality Inspection & Verification"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowVerifyModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmittingModal} onClick={handleConfirmVerification}>
                Confirm Verification & Advance
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <Input
              label="Verified Produce Quantity (Quintals)"
              type="number"
              value={verQty}
              onChange={(e) => setVerQty(e.target.value)}
              required
            />

            <Input
              label="Moisture Content Percentage (%)"
              type="number"
              step="0.1"
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1">
                Quality Grade <span className="text-red-600">*</span>
              </label>
              <Select value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)}>
                <option value="Grade A">Grade A (FAQ Standard)</option>
                <option value="Grade B">Grade B (Standard Quality)</option>
                <option value="Rejected">Rejected (Substandard)</option>
              </Select>
            </div>
          </div>
        </Modal>

        {/* Modal 2: Net Weighing & Settlement Modal */}
        <Modal
          isOpen={showWeighModal}
          onClose={() => setShowWeighModal(false)}
          title="Net Weighing & Official MSP Settlement"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowWeighModal(false)}>Cancel</Button>
              <Button variant="primary" isLoading={isSubmittingModal} onClick={handleConfirmWeighingAndComplete}>
                Complete Procurement & Issue Receipt
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <Input
              label="Net Weight Procured (Quintals)"
              type="number"
              step="0.1"
              value={netWeight}
              onChange={(e) => setNetWeight(e.target.value)}
              required
            />

            <Input
              label="Deductions (₹)"
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
            />

            <div className="p-3 bg-forest-green-light rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] text-center">
              <span className="text-[10px] font-black text-forest-green uppercase tracking-wider block">Estimated Settlement</span>
              <h3 className="text-2xl font-black text-forest-green my-0.5 font-mono">
                {'₹' + Math.max(0, Math.round(netWeight * 2275 - deductions)).toLocaleString('en-IN')}
              </h3>
              <span className="text-[10px] font-bold text-dark-neutral-muted">Calculated @ MSP Rate ₹2,275 / Qtl</span>
            </div>
          </div>
        </Modal>

        {/* Modal 3: Digital Receipt Modal */}
        <DigitalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={lastReceipt}
        />
      </main>
    </div>
  );
};

export default StaffDashboardPage;
