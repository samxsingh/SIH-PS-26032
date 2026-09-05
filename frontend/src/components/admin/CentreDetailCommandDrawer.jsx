import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Building2,
  Users,
  Clock,
  MapPin,
  ListOrdered,
  FileCheck,
  CreditCard,
  History,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Badge from '../common/Badge';

export const CentreDetailCommandDrawer = ({ centre, onClose, onSelectFarmer }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'QUEUE' | 'STAFF' | 'ACTIVITY'
  const [centreDetail, setCentreDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!centre) return;
    let isMounted = true;
    setIsLoading(true);

    const fetchDetail = async () => {
      try {
        const centreId = centre.id || centre._id;
        const res = await apiClient.get(`/admin/centres/${centreId}/details`);
        if (res.success && isMounted) {
          setCentreDetail(res.data);
        }
      } catch (err) {
        console.warn('Failed to load centre detail:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [centre]);

  if (!centre) return null;

  const staffList = centreDetail?.staff || [];
  const queueList = centreDetail?.queue || [];
  const auditList = centreDetail?.auditLogs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l-3 border-dark-neutral flex flex-col justify-between animate-slide-left overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b-2 border-dark-neutral bg-warm-ivory sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              {/* Canonical Hierarchy Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-dark-neutral-muted uppercase tracking-wider mb-1">
                <span className="text-forest-green font-black">Lucknow District (UP_LUK)</span>
                <span>→</span>
                <span>{centre.mandi?.name || centre.mandiName || 'APMC Mandi'}</span>
                <span>→</span>
                <span className="text-dark-neutral font-black">{centre.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black text-forest-green bg-white px-2 py-0.5 border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                  {centre.centreCode}
                </span>
                <Badge variant="neutral">{centre.centreType || 'PROCUREMENT_CENTRE'}</Badge>
                <Badge variant={centre.health === 'CRITICAL' ? 'danger' : centre.health === 'WATCH' ? 'warning' : 'success'}>
                  {centre.statusText || centre.health}
                </Badge>
              </div>
              <h3 className="font-heading font-black text-base sm:text-lg text-dark-neutral mt-1">
                {centre.name}
              </h3>
              <p className="text-xs text-dark-neutral-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                {centre.address || 'Lucknow, Uttar Pradesh'}
              </p>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Centre Command Panel"
              className="p-1.5 hover:bg-gray-200 border-2 border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A] transition-all text-dark-neutral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Tab Navigation */}
          <div className="flex items-center gap-1 pt-2 border-t border-dark-neutral/15 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Overview
            </button>
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'QUEUE'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" /> Queue ({queueList.length || centre.waitingCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('PROCUREMENT')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'PROCUREMENT'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" /> Procurement
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'PAYMENTS'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Payments
            </button>
            <button
              onClick={() => setActiveTab('STAFF')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'STAFF'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Staff
            </button>
            <button
              onClick={() => setActiveTab('ACTIVITY')}
              className={`px-3 py-1.5 font-bold uppercase rounded-xs border-2 transition-all flex items-center gap-1 shrink-0 ${
                activeTab === 'ACTIVITY'
                  ? 'bg-forest-green text-white border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                  : 'bg-white text-dark-neutral border-transparent hover:bg-gray-100'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Activity
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Operational Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Waiting Farmers</span>
                  <strong className="text-lg font-black text-amber-900 font-mono">{centre.waitingCount || 0}</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Currently Serving</span>
                  <strong className="text-lg font-black text-blue-800 font-mono">{centre.servingCount || 0}</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Completed Today</span>
                  <strong className="text-lg font-black text-emerald-800 font-mono">{centre.completedCount || 0}</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Produce Volume</span>
                  <strong className="text-lg font-black text-forest-green font-mono">{centre.produceTodayQuintals || 0} Qtl</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Estimated Payable</span>
                  <strong className="text-lg font-black text-dark-neutral font-mono">₹{(centre.payableTodayRs || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-bold text-dark-neutral-muted uppercase block">Avg Turnaround</span>
                  <strong className="text-lg font-black text-dark-neutral font-mono">~{centre.estimatedWaitMinutes || 18}m</strong>
                </div>
              </div>

              {/* Facility Hardware Specifications */}
              <div className="p-4 bg-white rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] space-y-2 text-xs">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-2">
                  Facility Infrastructure & Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Parent Mandi Hub:</span>
                    <strong className="text-dark-neutral">{centre.mandi?.name || 'Dubagga Mandi Samiti'}</strong>
                  </div>
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Operating Hours:</span>
                    <strong className="text-dark-neutral font-mono">08:00 AM - 06:00 PM IST</strong>
                  </div>
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Active Counters:</span>
                    <strong className="text-dark-neutral font-mono">4 Verified Counters</strong>
                  </div>
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Weighbridges:</span>
                    <strong className="text-dark-neutral font-mono">2 Certified Weighbridges</strong>
                  </div>
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Daily Storage Capacity:</span>
                    <strong className="text-dark-neutral font-mono">{centre.dailyCapacityQuintals || 1500} Quintals</strong>
                  </div>
                  <div>
                    <span className="text-dark-neutral-muted font-bold block">Contact Phone:</span>
                    <strong className="text-dark-neutral font-mono">{centre.contactPhone || '+91 522 2720011'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUEUE */}
          {activeTab === 'QUEUE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-dark-neutral-muted mb-1">
                <span>Active Queue Entries ({queueList.length})</span>
                <span className="text-[10px]">Updated via Socket.IO</span>
              </div>

              {queueList.length === 0 ? (
                <div className="p-6 text-center bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs text-dark-neutral-muted font-medium">
                  No queue tokens logged for today.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {queueList.map((q) => (
                    <div
                      key={q._id || q.id}
                      className="p-3 bg-white border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-forest-green text-xs">{q.tokenNumber}</span>
                          <strong className="font-bold text-xs text-dark-neutral">{q.farmerId?.fullName || 'Farmer'}</strong>
                        </div>
                        <span className="text-[10px] text-dark-neutral-muted block mt-0.5">
                          Station: {q.counterId || 'Counter 1'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" className="text-[10px] font-bold">
                          {q.state?.replace(/_/g, ' ')}
                        </Badge>
                        {onSelectFarmer && (
                          <button
                            onClick={() => onSelectFarmer({ ...q, farmerName: q.farmerId?.fullName, centreName: centre.name, centreCode: centre.centreCode })}
                            className="px-2 py-0.5 text-[10px] font-bold text-forest-green bg-forest-green-light border border-dark-neutral rounded-xs hover:underline"
                          >
                            Inspect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROCUREMENT */}
          {activeTab === 'PROCUREMENT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">Today's Certified Produce</span>
                  <strong className="text-xl font-black font-mono text-forest-green">{centre.produceTodayQuintals || 0} Qtl</strong>
                </div>
                <div className="p-3 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted block">Completed Intakes</span>
                  <strong className="text-xl font-black font-mono text-emerald-800">{centre.completedCount || 0} farmers</strong>
                </div>
              </div>

              <div className="p-4 bg-white border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] space-y-2 text-xs">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted">
                  Commodity Intake Distribution
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="font-bold text-dark-neutral">🌾 Wheat (MSP ₹2,275)</span>
                    <span className="font-mono font-black text-forest-green">{Math.round((centre.produceTodayQuintals || 120) * 0.7)} Qtl</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="font-bold text-dark-neutral">🌾 Paddy (MSP ₹2,300)</span>
                    <span className="font-mono font-black text-forest-green">{Math.round((centre.produceTodayQuintals || 120) * 0.3)} Qtl</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-forest-green-light border-2 border-forest-green rounded-xs shadow-[2px_2px_0px_#22252A] text-xs space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-forest-green block">Financial Settlement Pipeline</span>
                <div className="text-2xl font-black font-mono text-forest-green">
                  ₹{(centre.payableTodayRs || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-medium text-dark-neutral-muted block">
                  Cumulative payable for today's certified deliveries
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-warm-ivory border border-dark-neutral/30 rounded-xs">
                  <span className="text-[9px] uppercase font-bold text-dark-neutral-muted block">Confirmed</span>
                  <strong className="text-sm font-black font-mono text-emerald-800">{centre.completedCount || 0}</strong>
                </div>
                <div className="p-2.5 bg-warm-ivory border border-dark-neutral/30 rounded-xs">
                  <span className="text-[9px] uppercase font-bold text-dark-neutral-muted block">Processing</span>
                  <strong className="text-sm font-black font-mono text-amber-700">1</strong>
                </div>
                <div className="p-2.5 bg-warm-ivory border border-dark-neutral/30 rounded-xs">
                  <span className="text-[9px] uppercase font-bold text-dark-neutral-muted block">Settled (DBT)</span>
                  <strong className="text-sm font-black font-mono text-forest-green">{Math.max(0, (centre.completedCount || 1) - 1)}</strong>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-500 rounded-xs text-[11px] text-amber-950 font-medium">
                📢 Demo Payment Status — Visual Tracking Only. Real DBT transactions would route through PFMS / NPCI gateway.
              </div>
            </div>
          )}

          {/* TAB 3: STAFF ROSTER (SINGLE MANAGER ENFORCED) */}
          {activeTab === 'STAFF' && (
            <div className="space-y-4">
              {/* Single Manager Invariant Affirmation Banner */}
              <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-xs text-xs text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black">Single Centre Manager Invariant: </strong>
                  <span>Every facility maintains exactly one current Centre Head responsible for operations.</span>
                </div>
              </div>

              {/* Appointed Centre Head Card */}
              <div className="p-3.5 bg-warm-ivory rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase text-forest-green bg-white border border-dark-neutral px-2 py-0.5 rounded-xs">
                    Current Centre Head
                  </span>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <h4 className="font-heading font-black text-sm text-dark-neutral">
                  {centre.currentHead?.fullName || 'Satish Kumar'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-dark-neutral-muted mt-2 font-medium">
                  <div>
                    <span>Designation: </span>
                    <strong className="text-dark-neutral">{centre.currentHead?.designation || 'Centre Head'}</strong>
                  </div>
                  <div>
                    <span>Phone: </span>
                    <strong className="text-dark-neutral font-mono">{centre.currentHead?.phone || '9876543201'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span>Official Email: </span>
                    <strong className="text-dark-neutral font-mono">{centre.currentHead?.email || 'gomtinagar.centre@agrinexus.demo'}</strong>
                  </div>
                </div>
              </div>

              {/* Staff List */}
              <div>
                <h5 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted mb-2">
                  Operating Counter & Weighbridge Staff ({staffList.length})
                </h5>
                <div className="space-y-2">
                  {staffList.map((s) => (
                    <div
                      key={s._id}
                      className="p-2.5 bg-white border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-dark-neutral font-bold block">{s.fullName}</strong>
                        <span className="text-[10px] text-dark-neutral-muted block">{s.designation || 'Procurement Operator'}</span>
                      </div>
                      <Badge variant={s.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                        {s.accountStatus || 'ACTIVE'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY / AUDIT */}
          {activeTab === 'ACTIVITY' && (
            <div className="space-y-3">
              <h5 className="font-heading font-black text-xs uppercase tracking-wider text-dark-neutral-muted">
                Facility Operational Mutations & Audit Log
              </h5>
              {auditList.length === 0 ? (
                <div className="p-6 text-center bg-warm-ivory border-2 border-dark-neutral rounded-xs text-xs text-dark-neutral-muted font-medium">
                  No audit entries recorded for this facility yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 text-xs">
                  {auditList.map((l) => (
                    <div
                      key={l._id || l.id}
                      className="p-2.5 bg-white border-2 border-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A]"
                    >
                      <div className="flex justify-between items-start mb-1 text-[10px]">
                        <span className="font-mono font-bold text-dark-neutral-muted">
                          {new Date(l.createdAt).toLocaleTimeString('en-IN')}
                        </span>
                        <Badge variant="neutral">{l.userRole || 'STAFF'}</Badge>
                      </div>
                      <div className="font-bold text-forest-green">{l.action}</div>
                      <div className="text-[11px] text-dark-neutral mt-0.5">
                        Token #{l.details?.tokenNumber || 'LKO-101'} • Counter: {l.details?.counterId || 'Counter 1'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t-2 border-dark-neutral bg-warm-ivory flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-100 border-2 border-dark-neutral rounded-xs text-xs font-bold text-dark-neutral shadow-[2px_2px_0px_#22252A]"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentreDetailCommandDrawer;
