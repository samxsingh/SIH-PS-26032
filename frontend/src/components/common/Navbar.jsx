import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from './Button';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import {
  Sprout,
  Globe,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Ticket,
  PackageCheck,
  Menu,
  X,
  Activity,
  Layers,
  FileCheck
} from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define role-specific navigation links
  const getNavLinks = () => {
    if (!user) return [];
    if (user.role === 'FARMER') {
      return [
        { label: t('nav.dashboard', 'Dashboard'), to: '/farmer' },
        { label: t('farmer.action_find_centre', 'Find Centres'), to: '/farmer/find-centres' },
        { label: t('farmer.action_my_booking', 'My Bookings & Token'), to: '/farmer/bookings' },
      ];
    }
    if (user.role === 'CENTRE_STAFF') {
      return [
        { label: 'Operations & Queue', to: '/staff' },
      ];
    }
    if (user.role === 'ADMIN') {
      return [
        { label: 'Command Centre', to: '/admin' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b-2 border-dark-neutral sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-black text-lg sm:text-xl text-dark-neutral block tracking-tight leading-tight">
                  {t('app.title', 'AgriNexus')}
                </span>
                <span className="text-[10px] font-bold text-dark-neutral-muted hidden sm:block">
                  {t('app.department', 'Department of Consumer Affairs')} • {t('app.government_india', 'Govt of India')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links for Authenticated Users */}
            {isAuthenticated && navLinks.length > 0 && (
              <nav className="hidden lg:flex items-center gap-1 border-l-2 border-dark-neutral/20 pl-5">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to + link.label}
                      to={link.to}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xs transition-all ${
                        isActive
                          ? 'bg-forest-green-light text-forest-green border-2 border-dark-neutral shadow-[1px_1px_0px_#22252A]'
                          : 'text-dark-neutral-muted hover:text-dark-neutral hover:bg-warm-ivory'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Header Controls: Notifications, Language, Profile & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Bhashini Multi-Language Selector */}
            <LanguageSelector />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User Role & Name Badge */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-warm-ivory rounded-xs border-2 border-dark-neutral text-xs font-bold text-dark-neutral shadow-[2px_2px_0px_#22252A]">
                  <User className="w-3.5 h-3.5 text-forest-green" />
                  <span className="truncate max-w-[120px] font-black">{user?.fullName || 'User'}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-xs font-black uppercase border border-dark-neutral ${
                      user?.role === 'FARMER'
                        ? 'bg-emerald-100 text-forest-green'
                        : user?.role === 'CENTRE_STAFF'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {user?.role === 'FARMER'
                      ? t('auth.role_farmer', 'Farmer')
                      : user?.role === 'CENTRE_STAFF'
                      ? t('auth.role_staff', 'Centre')
                      : t('auth.role_admin', 'Admin')}
                  </span>
                </div>

                {/* Logout Button (desktop/tablet, mobile uses drawer) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:flex text-red-700 hover:bg-red-50 hover:border-red-600 min-h-[40px] px-2.5 sm:px-3"
                >
                  <LogOut className="w-4 h-4 sm:mr-1" />
                  <span>{t('nav.logout', 'Logout')}</span>
                </Button>

                {/* Mobile/Tablet Menu Toggle */}
                {navLinks.length > 0 && (
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xs border-2 border-dark-neutral bg-warm-ivory text-dark-neutral shadow-[2px_2px_0px_#22252A]"
                    aria-label="Toggle navigation menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/access">
                  <Button variant="primary" size="sm" className="shadow-brutal-sm font-black text-xs min-h-[40px]">
                    {t('nav.get_started', 'GET STARTED')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation Drawer */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="lg:hidden border-t-2 border-dark-neutral bg-warm-ivory p-4 space-y-2 animate-page-enter">
          <div className="flex items-center justify-between pb-3 border-b border-dark-neutral/20 mb-2">
            <span className="text-xs font-black text-dark-neutral">{user?.fullName}</span>
            <span className="text-[10px] bg-forest-green text-white px-2 py-0.5 rounded-xs font-black uppercase">
              {user?.role === 'FARMER' ? 'Farmer' : user?.role === 'CENTRE_STAFF' ? 'Centre' : 'Admin'}
            </span>
          </div>
          {navLinks.map((link) => (
            <Link
              key={'mobile-' + link.to + link.label}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-xs font-black uppercase tracking-wider rounded-xs border-2 border-dark-neutral bg-white shadow-[2px_2px_0px_#22252A] text-dark-neutral"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-3 py-2.5 text-xs font-black uppercase tracking-wider rounded-xs border-2 border-red-600 bg-red-50 text-red-700 shadow-[2px_2px_0px_#22252A] flex items-center gap-2 mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout', 'Logout')}</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
