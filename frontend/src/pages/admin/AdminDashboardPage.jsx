import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AdminMap from '../../components/admin/AdminMap';
import StaffVerificationsTab from '../../components/admin/StaffVerificationsTab';
import LoadingState from '../../components/common/LoadingState';
import {
  ShieldCheck,
  Building2,
  Users,
  Activity,
  AlertTriangle,
  FileText,
  Clock,
  Radio,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  Scale,
  IndianRupee,
  Sprout,
  FileCheck
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'ANALYTICS' | 'AUDIT'
  const [overview, setOverview] = useState(null);
  const [centres, setCentres] = useState([]);
  const [cropAnalytics, setCropAnalytics] = useState([]);
  const [paymentPipeline, setPaymentPipeline] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedCentre, setSelectedCentre] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [ovRes, cenRes, cropRes, payRes, altRes, audRes] = await Promise.all([
        apiClient.get('/admin/overview'),
        apiClient.get('/admin/centres'),
        apiClient.get('/admin/procurement'),
        apiClient.get('/admin/payments'),
        apiClient.get('/admin/alerts'),
        apiClient.get('/admin/audit-logs')
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (cenRes.success) setCentres(cenRes.data?.centres || []);
      if (cropRes.success) setCropAnalytics(cropRes.data?.cropBreakdown || []);
      if (payRes.success) setPaymentPipeline(payRes.data?.pipeline || []);
      if (altRes.success) setAlerts(altRes.data?.alerts || []);
      if (audRes.success) setAuditLogs(audRes.data?.auditLogs || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync government command centre data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // 30s auto sync
    return () => clearInterval(interval);
  }, []);

  const handleReassignHead = async (centreId, newHeadEmail) => {
    try {
      const res = await apiClient.patch(`/admin/centres/${centreId}/reassign-head`, {
        newHeadEmail: newHeadEmail.trim()
      });
      if (res.success) {
        alert(res.message || 'Appointed Head reallocated successfully.');
        fetchAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to reassign centre head.');
    }
  };

  const filteredCentres = centres.filter((c) => {
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.centreCode.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesDistrict = districtFilter ? c.district === districtFilter : true;
    const matchesHealth = healthFilter ? c.health?.toLowerCase() === healthFilter.toLowerCase() : true;
    return matchesSearch && matchesDistrict && matchesHealth;
  });

  const kpis = overview?.kpis || {};

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
        {/* Government Command Centre Header */}
        <PageHeader
          title={t('admin.title')}
          subtitle="State Operations Command Centre • Department of Consumer Affairs"
          badge={<Badge variant="success" icon={ShieldCheck}>Officer: {user?.fullName || 'Govt Administrator'}</Badge>}
          actions={
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="neutral" icon={Clock}>
                Date: {overview?.systemStatus?.operationalDate || '02 Sep 2026 IST'}
              </Badge>
              <Badge variant="success" icon={Radio}>
                Live Socket Online
              </Badge>
              <Button variant="ghost" size="sm" onClick={fetchAdminData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                <span>Sync Real-Time</span>
              </Button>
            </div>
          }
        />

        {/* Error Notification Alert */}
        {errorMsg && (
          <Alert type="error" className="mb-4" onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* Priority Operational Alerts Panel */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6 animate-fade-slide">
            <span className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Operational Attention Required ({alerts.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-3.5 rounded-md border-2 border-dark-neutral shadow-brutal-sm text-xs flex justify-between items-start ${
                    a.severity === 'CRITICAL' ? 'bg-red-100 text-red-950' : 'bg-amber-100 text-amber-950'
                  }`}
                >
                  <div>
                    <h5 className="font-black font-heading text-sm">{a.title}</h5>
                    <p className="mt-0.5 font-medium opacity-90">{a.reason}</p>
                    <span className="text-[10px] font-bold opacity-75 block mt-1 uppercase">District: {a.district}</span>
                  </div>
                  <Badge variant={a.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                    {a.metric}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8 Core Government KPI Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6 animate-fade-slide">
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-forest-green p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Active Centres</span>
            <h3 className="text-lg font-black text-forest-green mt-0.5">{kpis.activeCentresCount || 4}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-amber-500 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Farmers Waiting</span>
            <h3 className="text-lg font-black text-amber-700 mt-0.5">{kpis.totalWaitingFarmers || 0}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-blue-500 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Being Served</span>
            <h3 className="text-lg font-black text-info-blue mt-0.5">{kpis.totalServingFarmers || 0}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-emerald-600 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Completed Today</span>
            <h3 className="text-lg font-black text-emerald-800 mt-0.5">{kpis.totalCompletedToday || 0}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-wheat-accent p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Procured (Qtl)</span>
            <h3 className="text-lg font-black text-dark-neutral mt-0.5 font-mono">{(kpis.totalProcuredQuantityQuintals || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-purple-500 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Payable Value</span>
            <h3 className="text-lg font-black text-purple-700 mt-0.5 font-mono">₹{(kpis.totalProcuredValueRs || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-indigo-500 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Payments Active</span>
            <h3 className="text-lg font-black text-indigo-700 mt-0.5">{kpis.paymentsProcessingCount || 0}</h3>
          </div>
          <div className="bg-white rounded-md border-2 border-dark-neutral border-l-6 border-l-red-500 p-3 shadow-brutal-sm">
            <span className="text-[9px] font-black uppercase tracking-wider text-dark-neutral-muted block">Needing Attention</span>
            <h3 className="text-lg font-black text-red-600 mt-0.5">{kpis.centresNeedingAttentionCount || 0}</h3>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center gap-2 mb-6 border-b-2 border-dark-neutral">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'OVERVIEW'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Centre Operations Map & List</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'ANALYTICS'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Crop & Payment Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'AUDIT'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Compliance Audit Log</span>
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-3 -mb-[2px] ${
              activeTab === 'VERIFICATIONS'
                ? 'border-forest-green text-forest-green bg-white rounded-t-xs'
                : 'border-transparent text-dark-neutral-muted hover:text-dark-neutral'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Procurement Centre Applications</span>
          </button>
        </div>

        {/* Tab 1: Map & Centre Monitoring */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Leaflet Monitoring Map (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card title="Ecosystem Centre Map Monitoring" shadow="normal">
                <AdminMap
                  centres={filteredCentres}
                  selectedCentre={selectedCentre}
                  onSelectCentre={(c) => setSelectedCentre(c)}
                />
              </Card>

              {selectedCentre && (
                <Card title={`Centre Entity Oversight: ${selectedCentre.name}`} accentBorder shadow="normal">
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Persistent Centre ID:</span>
                      <span className="font-mono font-black text-forest-green bg-forest-green-light px-2 py-0.5 border border-dark-neutral rounded-xs">
                        {selectedCentre.centreCode || selectedCentre.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Current Appointed Head:</span>
                      <span className="font-black text-dark-neutral">
                        {selectedCentre.currentHeadName || 'Satish Kumar'} (Centre Head)
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Active Operating Staff:</span>
                      <span className="font-bold text-info-blue">3 Authorized Operators</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-dark-neutral/10">
                      <span className="text-dark-neutral-muted font-bold uppercase text-[10px]">Administrative Location:</span>
                      <span className="font-medium text-dark-neutral">{selectedCentre.district}, Madhya Pradesh</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <Badge variant="success">✓ Verified Procurement Facility</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newHeadEmail = window.prompt('Enter official email of the new Appointed Centre Head:');
                          if (newHeadEmail) handleReassignHead(selectedCentre.id, newHeadEmail);
                        }}
                      >
                        Change Appointed Head
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Searchable Centre List & Filters (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card title="Procurement Centres Status" shadow="normal">
                {/* Filters */}
                <div className="space-y-3 mb-4">
                  <Input
                    placeholder="Search by centre name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
                      <option value="">All Districts</option>
                      <option value="Lucknow">Lucknow</option>
                      <option value="Sehore">Sehore</option>
                      <option value="Bhopal">Bhopal</option>
                    </Select>

                    <Select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
                      <option value="">All Health States</option>
                      <option value="Healthy">Healthy</option>
                      <option value="Watch">Watch</option>
                      <option value="Critical">Critical</option>
                    </Select>
                  </div>
                </div>

                {/* Centre List */}
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredCentres.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCentre(c)}
                      className={`cursor-pointer p-3 rounded-xs border-2 border-dark-neutral transition-all ${
                        selectedCentre?.id === c.id
                          ? 'bg-forest-green-light border-forest-green shadow-brutal-sm -translate-y-0.5'
                          : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0px_#22252A]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[10px] font-black uppercase text-forest-green bg-forest-green-light border border-dark-neutral px-2 py-0.5 rounded-xs mr-2 shadow-[1px_1px_0px_#22252A]">
                            {c.centreCode}
                          </span>
                          <h4 className="font-heading font-black text-sm text-dark-neutral inline-block">{c.name}</h4>
                        </div>
                        <Badge variant={c.health === 'CRITICAL' ? 'danger' : c.health === 'WATCH' ? 'warning' : 'success'}>
                          {c.health}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-dark-neutral-muted mt-2 font-medium">
                        <div>
                          <span>Wait Time:</span>
                          <strong className="block text-dark-neutral font-black">~{c.estimatedWaitMinutes} min</strong>
                        </div>
                        <div>
                          <span>Queue Load:</span>
                          <strong className="block text-dark-neutral font-black">{c.queueLoadPercentage}%</strong>
                        </div>
                        <div>
                          <span>Active Queue:</span>
                          <strong className="block text-dark-neutral font-black">{c.activeQueueCount} farmers</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Analytics & Payment Pipeline */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            {/* Crop Analytics Grid */}
            <Card title="Crop Produce Distribution & Financial Breakdown" shadow="normal">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cropAnalytics.map((crop) => (
                  <div key={crop.cropType} className="p-4 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black font-heading text-forest-green text-sm flex items-center gap-1.5">
                        <Sprout className="w-4 h-4" /> {crop.cropType}
                      </span>
                      <Badge variant="neutral">MSP: ₹{crop.mspRate}/Qtl</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-dark-neutral-muted uppercase text-[10px] font-bold">Transactions:</span>
                        <span className="font-black text-dark-neutral">{crop.transactionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-neutral-muted uppercase text-[10px] font-bold">Volume Procured:</span>
                        <span className="font-black text-dark-neutral">{crop.totalQuantityQuintals} Qtl</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t-2 border-dark-neutral/10">
                        <span className="text-dark-neutral-muted uppercase text-[10px] font-bold">Total Payable:</span>
                        <span className="font-black text-forest-green text-sm font-mono">₹{crop.totalValueRs.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 8-Stage Payment Pipeline Analytics */}
            <Card title="8-Stage Payment Progression Pipeline" shadow="normal">
              <Alert type="info" className="mb-4">
                Demo Payment Status — Visual Tracking Only for Hackathon MVP
              </Alert>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                {paymentPipeline.map((p, idx) => (
                  <div key={p.stage} className="p-3 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                    <span className="text-[9px] font-black uppercase text-dark-neutral-muted block">Stage #{idx + 1}</span>
                    <span className="text-xs font-black text-dark-neutral block my-1 truncate" title={p.stage}>
                      {p.stage.replace(/_/g, ' ')}
                    </span>
                    <h4 className="text-lg font-black text-forest-green font-mono">{p.count}</h4>
                    <span className="text-[10px] text-dark-neutral-muted font-bold block">₹{(p.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Compliance Audit Log */}
        {activeTab === 'AUDIT' && (
          <Card title="Government Compliance Audit Log" subtitle="Read-only operational mutation history (Immutable Ledger)" shadow="normal">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-2 border-dark-neutral">
                <thead>
                  <tr className="border-b-2 border-dark-neutral text-xs font-black text-dark-neutral uppercase bg-warm-ivory tracking-wider">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor / Role</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">State Transition</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-dark-neutral/10 text-xs font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log._id || log.id} className="hover:bg-warm-ivory/80">
                      <td className="p-3 text-dark-neutral-muted font-semibold">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-dark-neutral block">{log.userRole}</span>
                        <span className="text-[10px] text-gray-500 font-semibold">ID: {log.userId}</span>
                      </td>
                      <td className="p-3 font-black text-forest-green">
                        {log.action}
                      </td>
                      <td className="p-3 font-semibold">
                        {log.previousState} ➔ <strong className="text-dark-neutral font-black">{log.newState}</strong>
                      </td>
                      <td className="p-3 text-dark-neutral-muted text-[11px] font-medium">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Staff & Centre Verification */}
        {activeTab === 'VERIFICATIONS' && <StaffVerificationsTab />}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
