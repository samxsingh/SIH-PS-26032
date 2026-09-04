import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from './Button';
import NotificationBell from './NotificationBell';
import { Sprout, Globe, LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b-2 border-dark-neutral sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Platform Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-sm bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-heading font-black text-lg sm:text-xl text-dark-neutral block tracking-tight leading-tight">
                {t('app.title')}
              </span>
              <span className="text-[10px] font-bold text-dark-neutral-muted hidden sm:block">
                {t('app.department')} • {t('app.government_india')}
              </span>
            </div>
          </Link>

          {/* Right Controls: Notification Bell, Language Toggle, Auth & User Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell for Authenticated Users */}
            {isAuthenticated && <NotificationBell />}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border-2 border-dark-neutral bg-warm-ivory text-xs font-black text-dark-neutral shadow-[2px_2px_0px_#22252A] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
              aria-label={t('nav.switch_language')}
            >
              <Globe className="w-3.5 h-3.5 text-forest-green" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-warm-ivory rounded-sm border-2 border-dark-neutral text-xs font-bold text-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <User className="w-3.5 h-3.5 text-forest-green" />
                  <span>{user?.fullName}</span>
                  <span className="text-[10px] bg-forest-green text-white px-2 py-0.5 rounded-xs font-black uppercase">
                    {user?.role === 'FARMER' ? t('auth.role_farmer') : user?.role === 'CENTRE_STAFF' ? t('auth.role_staff') : t('auth.role_admin')}
                  </span>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-700 hover:bg-red-50 hover:border-red-600">
                  <LogOut className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t('nav.logout')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/access">
                  <Button variant="primary" size="sm" className="shadow-brutal-sm">
                    {t('nav.get_started')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
