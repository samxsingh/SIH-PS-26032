import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import apiClient from '../../services/apiClient';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import {
  Sprout,
  ShieldCheck,
  Building2,
  User,
  Globe,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Sparkles
} from 'lucide-react';
import DemoAccountsModal from '../../components/auth/DemoAccountsModal';

export const LoginPage = ({ defaultRole }) => {
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Normalize role from query parameter or prop (e.g. ?role=FARMER -> FARMER)
  const getNormalizedRole = (param) => {
    if (!param) return defaultRole || 'FARMER';
    const lower = param.toLowerCase();
    if (lower === 'staff' || lower === 'centre_staff') return 'CENTRE_STAFF';
    if (lower === 'admin') return 'ADMIN';
    return 'FARMER';
  };

  const initialRole = getNormalizedRole(searchParams.get('role'));
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState(''); // Holds phone/mobile or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [demoLoadedRole, setDemoLoadedRole] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Handle demo account selection from modal without auto-submitting
  const handleSelectDemoAccount = (account) => {
    if (account) {
      setIdentifier(account.identifier);
      setPassword(account.password);
      setDemoLoadedRole(account.category || selectedRole);
      setErrorMsg(null);
    }
  };

  // Dedicated Pending Approval / Application Status State
  const [pendingApprovalData, setPendingApprovalData] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  // Sync state if URL query param changes
  useEffect(() => {
    const roleFromUrl = getNormalizedRole(searchParams.get('role'));
    if (roleFromUrl !== selectedRole) {
      setSelectedRole(roleFromUrl);
      setIdentifier('');
      setPassword('');
      setErrorMsg(null);
      setDemoLoadedRole(null);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg(
        selectedRole === 'ADMIN'
          ? t('login.email_password_required')
          : selectedRole === 'CENTRE_STAFF'
          ? t('login.email_password_required')
          : t('login.mobile_password_required')
      );
      return;
    }

    // Client-side format checks
    if (selectedRole === 'FARMER' && !/^[6-9]\d{9}$/.test(identifier.trim())) {
      setErrorMsg(t('auth.valid_mobile_error'));
      return;
    }

    if (selectedRole === 'CENTRE_STAFF' && !identifier.includes('@')) {
      setErrorMsg('Procurement Centre accounts must log in using your Official Centre Email (e.g. gomtinagar.centre@agrinexus.demo), not a mobile number.');
      return;
    }

    if (selectedRole === 'ADMIN' && !identifier.includes('@')) {
      setErrorMsg('Please enter a valid official administrative email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setStatusFeedback(null);

    try {
      // Authenticate with server passing the authoritative chosen role
      const user = await login(identifier.trim(), password, selectedRole);

      // Strict role verification check on client side
      if (user.role !== selectedRole) {
        logout();
        setErrorMsg(
          selectedRole === 'ADMIN'
            ? t('login.admin_mismatch_error')
            : t('login.role_mismatch_error')
        );
        return;
      }

      // Route strictly according to backend-verified user role
      if (user.role === 'FARMER') {
        navigate('/farmer');
      } else if (user.role === 'CENTRE_STAFF') {
        navigate('/staff');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/farmer');
      }
    } catch (err) {
      if (
        err.code === 'APPLICATION_PENDING_REVIEW' ||
        err.code === 'APPLICATION_REJECTED' ||
        err.code === 'ACCOUNT_SUSPENDED' ||
        err.code === 'APPLICATION_NEEDS_INFO' ||
        (err.message && (err.message.includes('awaiting Government Administrator approval') || err.message.includes('not approved')))
      ) {
        setPendingApprovalData({
          applicationId: err.details?.applicationId || 'AGR-CENTRE-PENDING',
          centreName: err.details?.centreName || 'Procurement Centre',
          district: err.details?.district || 'Lucknow',
          state: err.details?.state || 'Uttar Pradesh',
          status: err.code === 'APPLICATION_REJECTED' ? 'REJECTED' : err.code === 'ACCOUNT_SUSPENDED' ? 'SUSPENDED' : 'PENDING',
          rejectionReason: err.details?.rejectionReason,
          submittedAt: err.details?.submittedAt || new Date().toISOString()
        });
        return;
      }

      if (err.message && err.message.includes('ROLE_MISMATCH')) {
        setErrorMsg(
          selectedRole === 'ADMIN'
            ? t('login.admin_mismatch_error')
            : t('login.role_mismatch_error')
        );
      } else {
        setErrorMsg(err.message || t('common.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!identifier.trim()) return;
    setIsCheckingStatus(true);
    setStatusFeedback(null);
    try {
      const res = await apiClient.get(`/staff/applications/me?email=${encodeURIComponent(identifier.trim())}`);
      if (res.success && res.data) {
        const latestStatus = res.data.status;
        setPendingApprovalData((prev) => ({
          ...prev,
          status: latestStatus,
          applicationId: res.data.applicationId || prev?.applicationId,
          centreName: res.data.centreName || prev?.centreName,
          district: res.data.district || prev?.district,
          state: res.data.state || prev?.state,
          rejectionReason: res.data.rejectionReason || prev?.rejectionReason
        }));

        if (latestStatus === 'APPROVED') {
          setStatusFeedback('Approved! Your procurement centre is now active. You may proceed to log in.');
        } else if (latestStatus === 'REJECTED') {
          setStatusFeedback('Application has been rejected by the Government Administrator.');
        } else {
          setStatusFeedback('Status updated: Application is still awaiting administrator review.');
        }
      }
    } catch (e) {
      setStatusFeedback('Application is currently under review by the Government Administrator.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans">
      {/* Clean Header */}
      <header className="bg-white border-b-2 border-dark-neutral sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            {/* Brand Logo & Wordmark */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-black text-xl sm:text-2xl text-dark-neutral block tracking-tight leading-tight">
                  AgriNexus
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-dark-neutral-muted hidden sm:block">
                  {t('app.department')} • {t('app.government_india')}
                </span>
              </div>
            </Link>

            {/* Right Header Controls */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xs border-2 border-dark-neutral bg-warm-ivory text-xs sm:text-sm font-black text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                aria-label="Switch Language"
              >
                <Globe className="w-4 h-4 text-forest-green" />
                <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Focused Authentication Card */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto">
          {/* Quick Return to Access Selection */}
          <div className="mb-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-dark-neutral-muted hover:text-dark-neutral transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('login.back_to_access')}</span>
            </Link>
          </div>

          {pendingApprovalData ? (
            /* Dedicated Application Pending / Review Status Screen */
            <div className="bg-white rounded-xs border-3 border-dark-neutral shadow-brutal-xl p-6 sm:p-8 text-center space-y-6 animate-page-enter">
              <div
                className={`w-16 h-16 rounded-xs border-3 border-dark-neutral mx-auto flex items-center justify-center shadow-[3px_3px_0px_#22252A] ${
                  pendingApprovalData.status === 'APPROVED'
                    ? 'bg-emerald-100 text-forest-green'
                    : pendingApprovalData.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {pendingApprovalData.status === 'APPROVED' ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : pendingApprovalData.status === 'REJECTED' ? (
                  <XCircle className="w-9 h-9" />
                ) : (
                  <Clock className="w-9 h-9" />
                )}
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-dark-neutral tracking-tight">
                  {pendingApprovalData.status === 'APPROVED'
                    ? 'Registration Approved'
                    : pendingApprovalData.status === 'REJECTED'
                    ? 'Application Not Approved'
                    : pendingApprovalData.status === 'SUSPENDED'
                    ? 'Centre Account Suspended'
                    : 'Registration Submitted / Pending Approval'}
                </h1>
                <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium max-w-md mx-auto leading-relaxed">
                  {pendingApprovalData.status === 'APPROVED'
                    ? 'Your procurement centre is active. You can now log in to the Procurement Centre portal.'
                    : pendingApprovalData.status === 'REJECTED'
                    ? (pendingApprovalData.rejectionReason || 'Your application was not approved by the Government Administrator.')
                    : pendingApprovalData.status === 'SUSPENDED'
                    ? 'This centre account has been suspended. Please contact the Government Administrator.'
                    : 'Your application has been submitted and is currently under review by the Government Administrator. Once verified and approved, you will be able to log in to the Procurement Centre portal.'}
                </p>
              </div>

              {/* Centre & Reference Details Box */}
              <div className="bg-warm-ivory border-2 border-dark-neutral p-4 sm:p-5 rounded-xs text-left space-y-3 shadow-brutal-sm">
                <div className="flex justify-between items-center border-b border-dark-neutral/20 pb-2">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted">
                    Application Reference ID
                  </span>
                  <span className="font-mono font-black text-sm text-blue-900">
                    {pendingApprovalData.applicationId}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-dark-neutral/20 pb-2">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted">
                    Centre Name
                  </span>
                  <span className="font-black text-xs text-dark-neutral text-right">
                    {pendingApprovalData.centreName}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-dark-neutral/20 pb-2">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted">
                    Location
                  </span>
                  <span className="font-bold text-xs text-dark-neutral text-right">
                    {pendingApprovalData.district}, {pendingApprovalData.state}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-black uppercase text-dark-neutral-muted">
                    Current Status
                  </span>
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-xs border border-dark-neutral ${
                      pendingApprovalData.status === 'APPROVED'
                        ? 'bg-emerald-100 text-forest-green'
                        : pendingApprovalData.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {pendingApprovalData.status === 'APPROVED'
                      ? 'APPROVED / ACTIVE'
                      : pendingApprovalData.status === 'REJECTED'
                      ? 'REJECTED'
                      : 'PENDING ADMIN REVIEW'}
                  </span>
                </div>
              </div>

              {/* Live Status Feedback Message */}
              {statusFeedback && (
                <div className="p-3 bg-blue-50 border border-blue-300 text-blue-950 text-xs font-bold rounded-xs">
                  {statusFeedback}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {pendingApprovalData.status === 'APPROVED' ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={() => setPendingApprovalData(null)}
                    className="min-h-[48px]"
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    isLoading={isCheckingStatus}
                    loadingText="Checking with Government Portal..."
                    onClick={handleCheckStatus}
                    className="min-h-[48px] bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    <span>Check Status</span>
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    fullWidth
                    size="md"
                    onClick={() => setPendingApprovalData(null)}
                  >
                    <span>Back to Sign In</span>
                  </Button>
                  <Link to="/" className="w-full">
                    <Button variant="outline" fullWidth size="md">
                      <span>Return to Home</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xs border-3 border-dark-neutral shadow-brutal-xl p-6 sm:p-8 relative animate-page-enter">
            {/* Card Header with Role-Specific Title */}
            <div className="text-left mb-6 pb-4 border-b-2 border-dark-neutral">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xs border-2 border-dark-neutral flex items-center justify-center shadow-[2px_2px_0px_#22252A] shrink-0 ${
                    selectedRole === 'FARMER'
                      ? 'bg-forest-green text-wheat-accent'
                      : selectedRole === 'CENTRE_STAFF'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {selectedRole === 'FARMER' ? (
                    <User className="w-7 h-7" />
                  ) : selectedRole === 'CENTRE_STAFF' ? (
                    <Building2 className="w-7 h-7" />
                  ) : (
                    <ShieldCheck className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-dark-neutral tracking-tight font-heading">
                    {selectedRole === 'FARMER'
                      ? t('login.title_farmer')
                      : selectedRole === 'CENTRE_STAFF'
                      ? t('login.title_staff')
                      : t('login.title_admin')}
                  </h1>
                  <span className="text-xs text-dark-neutral-muted font-medium block mt-0.5">
                    {selectedRole === 'FARMER'
                      ? t('login.subtitle_farmer')
                      : selectedRole === 'CENTRE_STAFF'
                      ? t('login.subtitle_staff')
                      : t('login.subtitle_admin')}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <Alert type="error" className="mb-5" onClose={() => setErrorMsg(null)}>
                {errorMsg}
              </Alert>
            )}

            {/* Role-Specific Supporting Notices */}
            {selectedRole === 'CENTRE_STAFF' && (
              <div className="mb-5 p-3.5 bg-blue-50 border-2 border-blue-600 text-blue-950 rounded-xs shadow-[2px_2px_0px_#2563EB] text-xs font-medium flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Authorized Procurement Centre Access</strong>
                  <span className="text-[11px] text-blue-900 leading-relaxed block mt-0.5">
                    {t('login.notice_staff')}
                  </span>
                </div>
              </div>
            )}

            {selectedRole === 'ADMIN' && (
              <div className="mb-5 p-3.5 bg-amber-50 border-2 border-amber-600 text-amber-950 rounded-xs shadow-[2px_2px_0px_#D97706] text-xs font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Demonstration Administrator Account</strong>
                  <span className="text-[11px] text-amber-900 leading-relaxed block mt-0.5">
                    {t('login.notice_admin')}
                  </span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Official Email (for Admin or Staff) OR Mobile Number (for Farmer) */}
              {selectedRole === 'ADMIN' ? (
                <div>
                  <label
                    htmlFor="login-admin-email"
                    className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
                  >
                    {t('login.email_address')} <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-admin-email"
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setDemoLoadedRole(null);
                      }}
                      placeholder="Enter official government email"
                      className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-xs input-tactile bg-white text-dark-neutral placeholder:text-dark-neutral-muted shadow-[2px_2px_0px_#22252A] text-sm font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('login.demo_accounts_btn', '✨ Demo Accounts')}</span>
                      {demoLoadedRole === 'ADMIN' && (
                        <span className="text-[10px] text-forest-green font-black ml-1 flex items-center gap-0.5">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : selectedRole === 'CENTRE_STAFF' ? (
                <div>
                  <label
                    htmlFor="login-staff-email"
                    className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
                  >
                    {t('login.email_address')} <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-staff-email"
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setDemoLoadedRole(null);
                      }}
                      placeholder="e.g. gomtinagar.centre@agrinexus.demo"
                      className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-xs input-tactile bg-white text-dark-neutral placeholder:text-dark-neutral-muted shadow-[2px_2px_0px_#22252A] text-sm font-semibold"
                    />
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('login.demo_accounts_btn', '✨ Demo Accounts')}</span>
                      {demoLoadedRole === 'CENTRE_STAFF' && (
                        <span className="text-[10px] text-forest-green font-black ml-1 flex items-center gap-0.5">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="login-farmer-mobile"
                    className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
                  >
                    {t('login.registered_mobile')} <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="login-farmer-mobile"
                      type="tel"
                      required
                      maxLength={10}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value.replace(/\D/g, ''));
                        setDemoLoadedRole(null);
                      }}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 min-h-[48px] rounded-xs input-tactile bg-white text-dark-neutral placeholder:text-dark-neutral-muted shadow-[2px_2px_0px_#22252A] text-sm font-semibold tracking-wider font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-forest-green bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-forest-green" />
                      <span>{t('login.demo_accounts_btn', '✨ Demo Accounts')}</span>
                      {demoLoadedRole === 'FARMER' && (
                        <span className="text-[10px] text-forest-green font-black ml-1 flex items-center gap-0.5">
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Password Input with Visibility Toggle */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
                >
                  {t('auth.password')} <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-neutral-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setDemoLoadedRole(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 min-h-[48px] rounded-xs input-tactile bg-white text-dark-neutral placeholder:text-dark-neutral-muted shadow-[2px_2px_0px_#22252A] text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-dark-neutral-muted hover:text-dark-neutral transition-transform duration-micro active:scale-95 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                loadingText={
                  selectedRole === 'FARMER'
                    ? t('login.signing_in_farmer')
                    : selectedRole === 'CENTRE_STAFF'
                    ? t('login.signing_in_staff')
                    : t('login.signing_in_admin')
                }
                className={`min-h-[48px] text-base font-black shadow-brutal-sm mt-3 ${
                  selectedRole === 'CENTRE_STAFF'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : selectedRole === 'ADMIN'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : ''
                }`}
              >
                <span>
                  {selectedRole === 'FARMER'
                    ? t('login.sign_in_farmer_btn')
                    : selectedRole === 'CENTRE_STAFF'
                    ? t('login.sign_in_staff_btn')
                    : t('login.sign_in_admin_btn')}
                </span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Role-Specific Footer Registration Link */}
            {selectedRole === 'FARMER' && (
              <div className="mt-6 pt-4 border-t-2 border-dark-neutral/20 text-center text-xs sm:text-sm text-dark-neutral-muted font-medium">
                <span>{t('login.no_account_prompt')} </span>
                <Link
                  to="/auth/register?role=FARMER"
                  className="font-black text-forest-green hover:underline inline-flex items-center gap-1"
                >
                  <span>{t('login.register_farmer_link')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {selectedRole === 'CENTRE_STAFF' && (
              <div className="mt-6 pt-4 border-t-2 border-dark-neutral/20 text-center text-xs sm:text-sm text-dark-neutral-muted font-medium space-y-2">
                <p className="text-xs font-bold text-dark-neutral">
                  Centre accounts are activated only after verification by the Government Administrator.
                </p>
                <div>
                  <span>Operating a new procurement centre? </span>
                  <Link
                    to="/staff/register"
                    className="font-black text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Register Your Procurement Centre</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Trust & Service Notice */}
            <div className="mt-4 pt-2 text-center border-t border-dark-neutral/10">
              <p className="text-[10px] text-dark-neutral-muted font-medium leading-tight">
                {t('login.security_notice')}
              </p>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t-2 border-dark-neutral py-4 text-center">
        <p className="text-[11px] text-dark-neutral-muted font-medium">
          {t('landing.footer_gov')}
        </p>
      </footer>

      {/* Demo Accounts Selector Modal */}
      <DemoAccountsModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        role={selectedRole}
        activeIdentifier={identifier}
        onSelectAccount={handleSelectDemoAccount}
      />
    </div>
  );
};

export default LoginPage;
