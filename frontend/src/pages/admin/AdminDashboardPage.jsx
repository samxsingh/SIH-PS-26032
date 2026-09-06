import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import useAdminSocket from '../../hooks/useAdminSocket';

// District Command Centre Subcomponents
import AdminHeader from '../../components/admin/AdminHeader';
import DistrictStatusRibbon from '../../components/admin/DistrictStatusRibbon';
import CongestionAlertsBanner from '../../components/admin/CongestionAlertsBanner';
import DistrictCommandMap from '../../components/admin/DistrictCommandMap';
import MandiHierarchyDrilldown from '../../components/admin/MandiHierarchyDrilldown';
import CentreHealthSection from '../../components/admin/CentreHealthSection';
import DistrictLiveQueuePipeline from '../../components/admin/DistrictLiveQueuePipeline';
import PaymentCommandView from '../../components/admin/PaymentCommandView';
import ProcurementAnalyticsSection from '../../components/admin/ProcurementAnalyticsSection';
import CentrePerformanceTable from '../../components/admin/CentrePerformanceTable';
import OperationalExceptionDesk from '../../components/admin/OperationalExceptionDesk';
import AuditActivityTimeline from '../../components/admin/AuditActivityTimeline';
import CentreDetailCommandDrawer from '../../components/admin/CentreDetailCommandDrawer';
import AdminFarmerDrawer from '../../components/admin/AdminFarmerDrawer';
import StaffVerificationsTab from '../../components/admin/StaffVerificationsTab';

import LoadingState from '../../components/common/LoadingState';
import Alert from '../../components/common/Alert';
import AgriculturalVisualBackground from '../../components/public/AgriculturalVisualBackground';
import {
  Activity,
  Layers,
  Building2,
  ListOrdered,
  CreditCard,
  BarChart3,
  History,
  FileCheck,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Primary State
  const [districtOverview, setDistrictOverview] = useState(null);
  const [activeTab, setActiveTab] = useState('COMMAND'); // 'COMMAND' | 'CENTRES' | 'QUEUE' | 'PAYMENTS' | 'VERIFICATIONS'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected Entities for Drilldown / Drawers
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showAlertsBanner, setShowAlertsBanner] = useState(true);

  // Data Fetcher
  const fetchDistrictData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.get('/admin/district-overview');
      if (res.success && res.data) {
        setDistrictOverview(res.data);
      } else {
        setErrorMsg('Failed to parse district overview payload.');
      }
    } catch (err) {
      console.warn('Error fetching district overview:', err.message);
      setErrorMsg(err.message || 'Failed to sync District Command Centre data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDistrictData(true);
    // Background polling fallback every 45s
    const timer = setInterval(() => fetchDistrictData(false), 45000);
    return () => clearInterval(timer);
  }, [fetchDistrictData]);

  // Real-Time Socket.IO Synchronization Hook
  const handleSocketUpdate = useCallback((type, data) => {
    console.log(`[Admin Real-Time Sync] Triggering background refresh on socket event (${type}):`, data);
    fetchDistrictData(false);
  }, [fetchDistrictData]);

  const { isConnected: isSocketConnected } = useAdminSocket({
    onUpdate: handleSocketUpdate
  });

  const handleSelectCentreByCode = (code) => {
    if (!districtOverview?.centres) return;
    const match = districtOverview.centres.find((c) => c.centreCode === code);
    if (match) setSelectedCentre(match);
  };

  if (isLoading && !districtOverview) {
    return (
      <div className="min-h-screen bg-warm-ivory flex items-center justify-center">
        <LoadingState message="Connecting to District Command Centre & Agro-Climatic Intelligence..." />
      </div>
    );
  }

  const district = districtOverview?.district || {};
  const centres = districtOverview?.centres || [];
  const mandis = districtOverview?.mandis || [];
  const queueFunnel = districtOverview?.queueFunnel || {};
  const recentFarmersQueue = districtOverview?.recentFarmersQueue || [];
  const commodityBreakdown = districtOverview?.commodityBreakdown || [];
  const paymentPipeline = districtOverview?.paymentPipeline || {};
  const alerts = districtOverview?.alerts || [];
  const exceptions = districtOverview?.exceptions || [];
  const recentAuditLogs = districtOverview?.recentAuditLogs || [];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white relative overflow-x-hidden">
      {/* Contextual Visual Background - DISTRICT mode (data-first, clean contours & matrix, no heavy photos) */}
      <AgriculturalVisualBackground variant="district" showContours={true} showBotanicalFrame={false} />

      {/* 1. Official Government Navigation Bar */}
      <AdminHeader
        user={user}
        district={district}
        isConnected={isSocketConnected}
        onRefresh={() => fetchDistrictData(false)}
        isRefreshing={isRefreshing}
        alertsCount={alerts.length}
        onToggleAlerts={() => setShowAlertsBanner(!showAlertsBanner)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 min-w-0 max-w-full overflow-x-hidden relative z-10">
        {/* Error Notification Banner */}
        {errorMsg && (
          <Alert type="error" className="mb-4" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* 2. Congestion & Facility Alerts */}
        {showAlertsBanner && alerts.length > 0 && (
          <CongestionAlertsBanner
            alerts={alerts}
            onSelectCentreByCode={handleSelectCentreByCode}
          />
        )}

        {/* 3. Compact District Status Ribbon */}
        <DistrictStatusRibbon
          districtData={district}
          queueFunnel={queueFunnel}
        />

        {/* 4. Operational View Selector Navigation */}
        <div className="flex items-center gap-1.5 mb-6 border-b-2 border-dark-neutral overflow-x-auto">
          <button
            data-testid="tab-command"
            onClick={() => setActiveTab('COMMAND')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'COMMAND'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('admin.tab_command', 'Operational Command View')}</span>
          </button>

          <button
            data-testid="tab-centres"
            onClick={() => setActiveTab('CENTRES')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'CENTRES'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('admin.tab_centres', 'Centres & Capacity')} ({centres.length})</span>
          </button>

          <button
            data-testid="tab-queue"
            onClick={() => setActiveTab('QUEUE')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'QUEUE'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>{t('admin.tab_queue', 'District Live Queue')}</span>
          </button>

          <button
            data-testid="tab-payments"
            onClick={() => setActiveTab('PAYMENTS')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'PAYMENTS'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t('admin.tab_payments', 'Payment Pipeline')}</span>
          </button>

          <button
            data-testid="tab-exceptions"
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'EXCEPTIONS'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>{t('admin.tab_exceptions', 'Exception Desk')} ({exceptions.length})</span>
          </button>

          <button
            data-testid="tab-verifications"
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border-b-3 -mb-[2px] whitespace-nowrap ${
              activeTab === 'VERIFICATIONS'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>{t('admin.tab_verifications', 'Centre Applications')}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: COMPREHENSIVE COMMAND VIEW (PRIMARY DEFAULT)                      */}
        {/* ========================================================================= */}
        {activeTab === 'COMMAND' && (
          <div className="space-y-6">
            {/* 1. Large Map-First Command View */}
            <DistrictCommandMap
              centres={centres}
              mandis={mandis}
              selectedCentre={selectedCentre}
              onSelectCentre={(c) => setSelectedCentre(c)}
              selectedMandi={selectedMandi}
              onSelectMandi={(m) => setSelectedMandi(m)}
            />

            {/* 2. Mandi -> Centre Hierarchy Drilldown */}
            <MandiHierarchyDrilldown
              mandis={mandis}
              selectedMandi={selectedMandi}
              onSelectMandi={(m) => setSelectedMandi(m)}
              selectedCentre={selectedCentre}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />

            {/* 3. Centre Health Overview */}
            <CentreHealthSection
              centres={centres}
              selectedCentre={selectedCentre}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />

            {/* 4. District-Wide Live Queue Pipeline */}
            <DistrictLiveQueuePipeline
              queueFunnel={queueFunnel}
              farmersQueue={recentFarmersQueue}
              onSelectFarmer={(f) => setSelectedFarmer(f)}
            />

            {/* 5. Payment Command View */}
            <PaymentCommandView
              paymentPipeline={paymentPipeline}
            />

            {/* 6. District Procurement Analytics */}
            <ProcurementAnalyticsSection
              commodityBreakdown={commodityBreakdown}
            />

            {/* 7. Centre Performance Table */}
            <CentrePerformanceTable
              centres={centres}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />

            {/* 8. Operational Exception Desk */}
            <OperationalExceptionDesk
              exceptions={exceptions}
            />

            {/* 9. Audit Activity Timeline */}
            <AuditActivityTimeline
              auditLogs={recentAuditLogs}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DEDICATED CENTRES & PERFORMANCE                                   */}
        {/* ========================================================================= */}
        {activeTab === 'CENTRES' && (
          <div className="space-y-6">
            <CentreHealthSection
              centres={centres}
              selectedCentre={selectedCentre}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />
            <CentrePerformanceTable
              centres={centres}
              onSelectCentre={(c) => setSelectedCentre(c)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: DEDICATED LIVE QUEUE PIPELINE                                     */}
        {/* ========================================================================= */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-6">
            <DistrictLiveQueuePipeline
              queueFunnel={queueFunnel}
              farmersQueue={recentFarmersQueue}
              onSelectFarmer={(f) => setSelectedFarmer(f)}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: DEDICATED PAYMENT PIPELINE                                        */}
        {/* ========================================================================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6">
            <PaymentCommandView
              paymentPipeline={paymentPipeline}
            />
            <ProcurementAnalyticsSection
              commodityBreakdown={commodityBreakdown}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: DEDICATED EXCEPTION DESK                                          */}
        {/* ========================================================================= */}
        {activeTab === 'EXCEPTIONS' && (
          <div className="space-y-6">
            <OperationalExceptionDesk
              exceptions={exceptions}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: STAFF & CENTRE VERIFICATIONS (PRESERVED)                          */}
        {/* ========================================================================= */}
        {activeTab === 'VERIFICATIONS' && (
          <StaffVerificationsTab />
        )}
      </main>

      {/* DRAWERS */}
      {/* Centre Detail Command Drawer */}
      {selectedCentre && (
        <CentreDetailCommandDrawer
          centre={selectedCentre}
          onClose={() => setSelectedCentre(null)}
          onSelectFarmer={(f) => {
            setSelectedFarmer(f);
          }}
        />
      )}

      {/* Farmer Detail Journey Drawer */}
      {selectedFarmer && (
        <AdminFarmerDrawer
          farmer={selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
