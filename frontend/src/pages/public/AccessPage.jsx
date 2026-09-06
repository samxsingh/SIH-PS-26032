import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Sprout,
  Globe,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Info,
  Lock,
  UserPlus,
  FileCheck
} from 'lucide-react';
import AgriculturalVisualBackground from '../../components/public/AgriculturalVisualBackground';

export const AccessPage = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans relative overflow-x-hidden">
      {/* Contextual Visual Background - NEUTRAL mode */}
      <AgriculturalVisualBackground variant="neutral" showContours={true} showBotanicalFrame={true} />

      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b-2 border-dark-neutral sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
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

              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-dark-neutral-muted hover:text-dark-neutral hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('access.back_to_home')}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Role Selection Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col justify-center relative z-10">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          {/* Header Title & Subheading */}
          <div className="text-center space-y-3 animate-page-enter">
            <Link
              to="/"
              className="inline-flex sm:hidden items-center gap-1 text-xs font-bold text-forest-green mb-2 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('access.back_to_home')}</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-dark-neutral tracking-tight">
              {t('access.title')}
            </h1>
            <p className="text-base sm:text-lg text-dark-neutral-muted font-medium max-w-lg mx-auto">
              {t('access.subtitle')}
            </p>
          </div>

          {/* 3 Clear Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* 1. FARMER CARD */}
            <div className="bg-white border-3 border-dark-neutral rounded-xs p-6 sm:p-7 shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-normal ease-tactile flex flex-col justify-between animate-page-enter stagger-1 focus-within:ring-2 focus-within:ring-dark-neutral">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xs bg-emerald-100 border-2 border-dark-neutral flex items-center justify-center text-forest-green shadow-[2px_2px_0px_#22252A]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-xs inline-block mb-1">
                    Self-Service Portal
                  </span>
                  <h2 className="text-xl font-black font-heading text-dark-neutral tracking-tight">
                    {t('access.role_farmer_title')}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium leading-relaxed">
                  {t('access.role_farmer_desc')}
                </p>
              </div>

              {/* Farmer Actions: Login + Register */}
              <div className="pt-6 space-y-2.5">
                <Link to="/auth/login?role=FARMER" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-3 min-h-[48px] rounded-xs bg-forest-green text-white text-xs sm:text-sm font-black border-2 border-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <span>{t('access.btn_login')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <Link to="/auth/register?role=FARMER" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-3 min-h-[48px] rounded-xs bg-warm-ivory text-dark-neutral text-xs sm:text-sm font-black border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <UserPlus className="w-4 h-4 text-forest-green" />
                    <span>{t('access.btn_register')}</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* 2. PROCUREMENT CENTRE STAFF CARD */}
            <div className="bg-white border-3 border-dark-neutral rounded-xs p-6 sm:p-7 shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-normal ease-tactile flex flex-col justify-between animate-page-enter stagger-2 focus-within:ring-2 focus-within:ring-dark-neutral">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xs bg-blue-100 border-2 border-dark-neutral flex items-center justify-center text-blue-700 shadow-[2px_2px_0px_#22252A]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-800 bg-blue-50 px-2 py-0.5 border border-blue-300 rounded-xs inline-block mb-1">
                    Operational Portal
                  </span>
                  <h2 className="text-xl font-black font-heading text-dark-neutral tracking-tight leading-snug">
                    {t('access.role_staff_title')}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium leading-relaxed">
                  {t('access.role_staff_desc')}
                </p>
              </div>

              {/* Staff Actions: Login + Register (Subject to verification) */}
              <div className="pt-6 space-y-2.5">
                <Link to="/auth/login?role=CENTRE_STAFF" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-3 min-h-[48px] rounded-xs bg-blue-600 text-white text-xs sm:text-sm font-black border-2 border-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <span>{t('access.btn_login')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <Link to="/staff/register" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-3 min-h-[48px] rounded-xs bg-blue-50 text-blue-900 text-xs sm:text-sm font-black border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <FileCheck className="w-4 h-4 text-blue-700" />
                    <span>{t('access.btn_register')}</span>
                  </button>
                </Link>

                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-xs flex items-start gap-1.5 text-[11px] text-blue-900 font-medium">
                  <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <span>{t('access.role_staff_notice')}</span>
                </div>
              </div>
            </div>

            {/* 3. GOVERNMENT ADMINISTRATOR CARD */}
            <div className="bg-white border-3 border-dark-neutral rounded-xs p-6 sm:p-7 shadow-brutal hover:-translate-y-1 hover:shadow-brutal-lg transition-all duration-normal ease-tactile flex flex-col justify-between animate-page-enter stagger-3 focus-within:ring-2 focus-within:ring-dark-neutral">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xs bg-amber-100 border-2 border-dark-neutral flex items-center justify-center text-amber-800 shadow-[2px_2px_0px_#22252A]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-300 rounded-xs inline-block mb-1">
                    State Oversight
                  </span>
                  <h2 className="text-xl font-black font-heading text-dark-neutral tracking-tight leading-snug">
                    {t('access.role_admin_title')}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium leading-relaxed">
                  {t('access.role_admin_desc')}
                </p>
              </div>

              {/* Admin has ONLY Login action + Strict Departmental Notice */}
              <div className="pt-6 space-y-3">
                <Link to="/auth/login?role=ADMIN" className="block">
                  <button
                    type="button"
                    className="w-full px-4 py-3 min-h-[48px] rounded-xs bg-amber-600 text-white text-xs sm:text-sm font-black border-2 border-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <span>{t('access.btn_login')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>

                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xs flex items-start gap-1.5 text-[11px] text-amber-900 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>{t('access.role_admin_notice')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t-2 border-dark-neutral py-4 text-center">
        <p className="text-[11px] text-dark-neutral-muted font-medium">
          {t('landing.footer_gov')}
        </p>
      </footer>
    </div>
  );
};

export default AccessPage;
