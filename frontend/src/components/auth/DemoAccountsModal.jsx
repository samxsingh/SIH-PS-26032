import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, MapPin, Check, Building2, User, ShieldCheck, Phone, Mail } from 'lucide-react';
import { getDemoAccountsForRole } from '../../config/demoAccounts';

/**
 * DemoAccountsModal
 * 
 * Neo-Brutalist selector modal that lists available demonstration accounts
 * strictly for the active portal role. Does NOT display passwords in plain text.
 * Selecting an account populates the credentials without auto-submitting.
 */
export const DemoAccountsModal = ({ isOpen, onClose, role, onSelectAccount, activeIdentifier }) => {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const accounts = getDemoAccountsForRole(role);

  // Close on Escape key and trap focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getRoleHeader = () => {
    switch (role) {
      case 'ADMIN':
        return {
          title: t('login.demo_admin_title', 'Administrator Demo Accounts'),
          subtitle: t('login.demo_admin_subtitle', 'Authorized state oversight and governance profiles'),
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-400',
          icon: ShieldCheck
        };
      case 'CENTRE_STAFF':
        return {
          title: t('login.demo_staff_title', 'Procurement Centre Accounts'),
          subtitle: t('login.demo_staff_subtitle', 'Authorized APMC Mandis & grain procurement facilities'),
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-400',
          icon: Building2
        };
      case 'FARMER':
      default:
        return {
          title: t('login.demo_farmer_title', 'Farmer Demo Accounts'),
          subtitle: t('login.demo_farmer_subtitle', 'Verified registered farmers across procurement districts'),
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-400',
          icon: User
        };
    }
  };

  const headerInfo = getRoleHeader();
  const HeaderIcon = headerInfo.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-neutral/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-accounts-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[85vh] bg-[#FAF8F5] border-3 border-dark-neutral shadow-[6px_6px_0px_#22252A] rounded-none flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b-2 border-dark-neutral bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border-2 border-dark-neutral bg-amber-300 flex items-center justify-center shadow-[2px_2px_0px_#22252A] shrink-0">
              <HeaderIcon className="w-5 h-5 text-dark-neutral" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-accounts-modal-title" className="text-base md:text-lg font-black text-dark-neutral uppercase tracking-tight">
                  {headerInfo.title}
                </h2>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border ${headerInfo.badgeColor}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-dark-neutral-muted font-medium mt-0.5">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close demo accounts modal"
            className="w-8 h-8 flex items-center justify-center border-2 border-dark-neutral bg-sand-muted/50 hover:bg-sand-muted text-dark-neutral shadow-[2px_2px_0px_#22252A] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Bar */}
        <div className="px-4 md:px-5 py-2.5 bg-amber-50 border-b-2 border-dark-neutral flex items-center justify-between text-xs text-amber-950 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            {t('login.demo_select_instruction', 'Select an account to autofill credentials into the login form.')}
          </span>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 border border-amber-400">
            {accounts.length} {t('login.demo_available_count', 'available')}
          </span>
        </div>

        {/* Account List */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-3.5 bg-[#FAF8F5] focus:outline-none">
          {accounts.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-dark-neutral/40 bg-white">
              <p className="text-sm font-bold text-dark-neutral">{t('login.no_demo_accounts', 'No demo accounts configured for this role.')}</p>
            </div>
          ) : (
            accounts.map((acc) => {
              const isCurrentlyActive = activeIdentifier === acc.identifier;

              return (
                <div
                  key={acc.id}
                  className={`p-3.5 md:p-4 border-2 border-dark-neutral bg-white transition-all shadow-[3px_3px_0px_#22252A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#22252A] ${
                    isCurrentlyActive ? 'ring-2 ring-forest-green bg-emerald-50/40' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Name & Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-dark-neutral tracking-tight">
                          {t(`login.demo_account_name_${acc.id}`, acc.name)}
                        </h3>
                        {(!acc.hideIdentifier && (acc.roleTitle || acc.badge)) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 border border-dark-neutral bg-sand-muted text-dark-neutral">
                            {t(`login.demo_account_role_${acc.id}`, acc.roleTitle || acc.badge)}
                          </span>
                        )}
                        {acc.code && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-gray-700">
                            {acc.code}
                          </span>
                        )}
                      </div>

                      {/* Description / Role purpose */}
                      {acc.description && (
                        <p className="text-xs text-dark-neutral font-semibold">
                          {t(`login.demo_account_desc_${acc.id}`, acc.description)}
                        </p>
                      )}

                      {/* Location / District */}
                      <div className="flex items-center gap-1.5 text-xs text-dark-neutral-muted font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-dark-neutral/60" />
                        <span className="truncate">{acc.location} • {acc.district}</span>
                      </div>

                      {/* Identifier & Context Tag */}
                      <div className="flex items-center gap-3 text-xs pt-0.5 flex-wrap">
                        {!acc.hideIdentifier && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-dark-neutral bg-sand-light px-2 py-0.5 border border-dark-neutral/30">
                            {acc.identifierType === 'phone' ? (
                              <Phone className="w-3 h-3 text-forest-green" />
                            ) : (
                              <Mail className="w-3 h-3 text-blue-600" />
                            )}
                            {acc.identifier}
                          </span>
                        )}

                        {acc.crops && (
                          <span className="text-emerald-800 text-[11px] font-semibold">
                            🌾 {acc.crops}
                          </span>
                        )}

                        {acc.centreName && (
                          <span className="text-blue-900 text-[11px] font-semibold truncate">
                            🏢 {acc.centreName}
                          </span>
                        )}

                        {acc.organization && (
                          <span className="text-amber-900 text-[11px] font-semibold truncate">
                            🏛 {acc.organization}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="sm:self-center shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        data-account-id={acc.id}
                        onClick={() => {
                          onSelectAccount(acc);
                          onClose();
                        }}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase tracking-wider border-2 border-dark-neutral cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                          isCurrentlyActive
                            ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_#22252A]'
                            : 'bg-sand hover:bg-sand-dark text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:shadow-[3px_3px_0px_#22252A]'
                        }`}
                      >
                        {isCurrentlyActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('login.active_account', 'Active')}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-forest-green" />
                            <span>{t('login.use_this_account', 'Use Account')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t-2 border-dark-neutral bg-sand-light/60 flex items-center justify-between text-xs text-dark-neutral-muted">
          <span className="font-semibold text-[11px]">
            🔒 {t('login.demo_credential_note', 'Credentials populate securely without revealing credentials in plain text.')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 font-bold text-dark-neutral hover:underline cursor-pointer"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoAccountsModal;
