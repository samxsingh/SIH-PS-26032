import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, ShieldCheck, ArrowRight } from 'lucide-react';

export const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t-3 border-dark-neutral mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b-2 border-dark-neutral/20">
          {/* Brand & Department Context */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xs bg-forest-green border-2 border-dark-neutral flex items-center justify-center text-wheat-accent shadow-[2px_2px_0px_#22252A]">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading font-black text-xl text-dark-neutral block tracking-tight">
                  AgriNexus
                </span>
                <span className="text-xs font-bold text-dark-neutral-muted">
                  {t('app.department')}
                </span>
              </div>
            </div>

            <p className="text-sm text-dark-neutral-muted font-medium max-w-md leading-relaxed">
              {t('landing.trust_desc')}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-warm-ivory border-2 border-dark-neutral text-xs font-bold text-forest-green shadow-[2px_2px_0px_#22252A]">
              <ShieldCheck className="w-4 h-4 text-forest-green" />
              <span>{t('landing.footer_tagline')}</span>
            </div>
          </div>

          {/* Quick Access Navigation */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-dark-neutral">
              Platform Access
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-dark-neutral-muted">
              <li>
                <Link to="/access" className="hover:text-forest-green hover:underline">
                  Get Started / Role Selection
                </Link>
              </li>
              <li>
                <Link to="/login?role=FARMER" className="hover:text-forest-green hover:underline">
                  Farmer Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-forest-green hover:underline">
                  Farmer Self-Registration
                </Link>
              </li>
              <li>
                <Link to="/login?role=CENTRE_STAFF" className="hover:text-forest-green hover:underline">
                  Procurement Staff Portal
                </Link>
              </li>
              <li>
                <Link to="/login?role=ADMIN" className="hover:text-forest-green hover:underline">
                  Government Command Centre
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct CTA */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-dark-neutral">
              Get Started
            </h4>
            <p className="text-xs text-dark-neutral-muted font-medium">
              Discover your nearest procurement centre and book your guaranteed delivery slot today.
            </p>
            <Link to="/access" className="inline-block pt-1">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xs bg-forest-green text-white text-xs font-black border-2 border-dark-neutral shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <span>{t('landing.cta_get_started')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Attribution Notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-dark-neutral-muted font-semibold">
            {t('landing.footer_gov')}
          </p>
          <p className="text-[11px] text-dark-neutral-muted font-medium">
            © 2026 AgriNexus • {t('landing.footer_rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
