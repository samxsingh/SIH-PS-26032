import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Radio, RefreshCw, LogOut, MapPin, Building2, Bell } from 'lucide-react';
import LanguageSelector from '../common/LanguageSelector';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const AdminHeader = ({ onRefresh, isRefreshing, alertsCount = 0, onToggleAlerts }) => {
  const { t } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/staff/login';
  };

  return (
    <header className="bg-white border-b-2 border-dark-neutral shadow-brutal-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: District Command Identity */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-white shadow-[2px_2px_0px_#22252A] flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-black text-lg sm:text-xl text-dark-neutral tracking-tight">
                  AgriNexus
                </h1>
                <span className="text-xs sm:text-sm font-black text-forest-green uppercase tracking-wider bg-forest-green-light px-2 py-0.5 border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                  {t('admin.command_centre', 'District Command Centre')}
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-xs uppercase tracking-wider">
                  {t('admin.demo_pilot_env', 'Demo / Pilot Environment')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-dark-neutral-muted font-medium">
                <span className="flex items-center gap-1 font-bold text-dark-neutral">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  {t('admin.district_context', 'Lucknow District • Uttar Pradesh')}
                </span>
                <span className="hidden sm:inline opacity-40">•</span>
                <span className="hidden sm:inline font-mono text-[11px] text-dark-neutral-muted">
                  UPSAMB Regulated Mandi Network
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions, Language, Role & Auth */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-1 border border-emerald-600 rounded-xs shadow-[1px_1px_0px_#22252A]">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span className="hidden xs:inline">Live Socket</span>
              </span>

              {onToggleAlerts && (
                <button
                  onClick={onToggleAlerts}
                  aria-label="Toggle Operational Alerts"
                  className="relative p-1.5 bg-warm-ivory hover:bg-gray-100 border-2 border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A] transition-all text-dark-neutral"
                  title="Operational Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {alertsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-dark-neutral">
                      {alertsCount}
                    </span>
                  )}
                </button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 text-xs font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin text-forest-green' : ''}`} />
                <span className="hidden sm:inline">{t('admin.sync_live', 'Sync')}</span>
              </Button>

              <LanguageSelector />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="neutral" icon={Shield} className="font-bold text-xs">
                {t('admin.identity_account', 'Administrator Account')}
              </Badge>

              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="p-1.5 bg-warm-ivory hover:bg-red-50 hover:text-red-700 border-2 border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A] transition-all text-dark-neutral"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
