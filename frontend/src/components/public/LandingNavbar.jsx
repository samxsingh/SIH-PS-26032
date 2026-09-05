import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';
import { Sprout, Globe, ArrowRight } from 'lucide-react';

export const LandingNavbar = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white border-b-2 border-dark-neutral sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Brand & Government Identity */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-heading font-black text-lg sm:text-2xl text-dark-neutral block tracking-tight leading-tight">
                AgriNexus
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-dark-neutral-muted hidden sm:block">
                {t('app.department')} • {t('app.government_india')}
              </span>
            </div>
          </Link>

          {/* Center Navigation Links for Landing Page */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-black text-dark-neutral">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-forest-green hover:-translate-y-0.5 transition-all duration-micro ease-tactile focus:outline-none focus:underline"
            >
              {t('nav.how_it_works')}
            </button>
            <button
              onClick={() => scrollToSection('for-farmers')}
              className="hover:text-forest-green hover:-translate-y-0.5 transition-all duration-micro ease-tactile focus:outline-none focus:underline"
            >
              {t('nav.for_farmers')}
            </button>
            <button
              onClick={() => scrollToSection('for-centres')}
              className="hover:text-forest-green hover:-translate-y-0.5 transition-all duration-micro ease-tactile focus:outline-none focus:underline"
            >
              {t('nav.for_centres')}
            </button>
          </nav>

          {/* Right Controls: Bhashini Multi-Language Selector + Primary Get Started Action */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Bhashini Multi-Language Selector */}
            <LanguageSelector compact={true} />

            {/* Primary GET STARTED Button */}
            <Link to="/access" className="shrink-0">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-1.5 sm:py-2.5 min-h-[34px] sm:min-h-[48px] rounded-xs border-2 sm:border-3 border-dark-neutral bg-forest-green text-white text-[11px] sm:text-sm font-black tracking-wide shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
              >
                <span>{t('nav.get_started')}</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
