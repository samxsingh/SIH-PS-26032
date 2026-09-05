import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LandingNavbar from '../../components/public/LandingNavbar';
import LandingFooter from '../../components/public/LandingFooter';
import WorkflowDiagram from '../../components/public/WorkflowDiagram';
import AgriculturalNetworkBackground from '../../components/public/AgriculturalNetworkBackground';
import HeroFloatingSystem from '../../components/public/HeroFloatingSystem';
import {
  MapPin,
  Calendar,
  Ticket,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Building2,
  Scale,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';

export const LandingPage = () => {
  const { t } = useTranslation();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const featureCards = [
    {
      id: 'feature-find',
      icon: MapPin,
      title: t('landing.feature_1_title'),
      desc: t('landing.feature_1_desc'),
      bg: 'bg-emerald-50',
      iconBg: 'bg-forest-green text-wheat-accent',
      shadowColor: 'shadow-brutal'
    },
    {
      id: 'feature-book',
      icon: Calendar,
      title: t('landing.feature_2_title'),
      desc: t('landing.feature_2_desc'),
      bg: 'bg-wheat-accent/15',
      iconBg: 'bg-wheat-accent-dark text-white',
      shadowColor: 'shadow-brutal-wheat'
    },
    {
      id: 'feature-queue',
      icon: Ticket,
      title: t('landing.feature_3_title'),
      desc: t('landing.feature_3_desc'),
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-600 text-white',
      shadowColor: 'shadow-brutal-blue'
    },
    {
      id: 'feature-payment',
      icon: CreditCard,
      title: t('landing.feature_4_title'),
      desc: t('landing.feature_4_desc'),
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-600 text-white',
      shadowColor: 'shadow-brutal-amber'
    }
  ];

  const steps = [
    {
      num: t('landing.step_1_num'),
      title: t('landing.step_1_title'),
      desc: t('landing.step_1_desc'),
      icon: ShieldCheck
    },
    {
      num: t('landing.step_2_num'),
      title: t('landing.step_2_title'),
      desc: t('landing.step_2_desc'),
      icon: MapPin
    },
    {
      num: t('landing.step_3_num'),
      title: t('landing.step_3_title'),
      desc: t('landing.step_3_desc'),
      icon: Calendar
    },
    {
      num: t('landing.step_4_num'),
      title: t('landing.step_4_title'),
      desc: t('landing.step_4_desc'),
      icon: Scale
    },
    {
      num: t('landing.step_5_num'),
      title: t('landing.step_5_title'),
      desc: t('landing.step_5_desc'),
      icon: CreditCard
    }
  ];

  const trustItems = [
    {
      icon: MapPin,
      title: t('landing.trust_item_1_title'),
      desc: t('landing.trust_item_1_desc')
    },
    {
      icon: Clock,
      title: t('landing.trust_item_2_title'),
      desc: t('landing.trust_item_2_desc')
    },
    {
      icon: Lock,
      title: t('landing.trust_item_3_title'),
      desc: t('landing.trust_item_3_desc')
    },
    {
      icon: CreditCard,
      title: t('landing.trust_item_4_title'),
      desc: t('landing.trust_item_4_desc')
    }
  ];

  return (
    <div className="min-h-screen bg-warm-ivory flex flex-col selection:bg-forest-green selection:text-white font-sans overflow-x-hidden">
      <LandingNavbar />

      <main className="flex-1 overflow-x-hidden">
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Dynamic Agricultural Network (Layer 1 Dot Matrix + Layer 2 SVG Contours) */}
          <AgriculturalNetworkBackground />

          {/* Dedicated 3-Zone Hero Container with Collision-Safe Bounds */}
          <div className="relative z-10 w-full">
            {/* Peripheral Floating Information System (Safe Flanks: Desktop Only, 0 on Tablet/Mobile) */}
            <HeroFloatingSystem />

            {/* Central Hero Content Protected Safe Zone (z-20: strictly above ambient floating elements) */}
            <div className="relative z-20 text-center max-w-2xl lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto space-y-6 px-4 lg:px-0">
              {/* Government Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xs bg-forest-green-light border-2 border-dark-neutral text-forest-green text-xs sm:text-sm font-black tracking-wide shadow-[2px_2px_0px_#22252A] animate-page-enter">
                <span>{t('landing.badge')}</span>
              </div>

              {/* Main Editorial Hero Heading */}
              <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl text-dark-neutral tracking-tight leading-[1.08] uppercase animate-page-enter">
                <span className="block text-forest-green">{t('landing.hero_title_1')}</span>
                <span className="block">{t('landing.hero_title_2')}</span>
                <span className="block text-wheat-accent-dark">{t('landing.hero_title_3')}</span>
              </h1>

              {/* Supporting Hero Text */}
              <p className="text-base sm:text-xl text-dark-neutral-muted font-medium max-w-2xl mx-auto leading-relaxed animate-page-enter stagger-1">
                {t('landing.hero_subtitle')}
              </p>

              {/* CTA Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 animate-page-enter stagger-2">
                <Link to="/access" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-8 py-4 min-h-[52px] rounded-xs bg-forest-green text-white text-base sm:text-lg font-black tracking-wide border-3 border-dark-neutral shadow-brutal hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                  >
                    <span>{t('landing.cta_get_started')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto px-6 py-4 min-h-[52px] rounded-xs bg-white text-dark-neutral text-sm sm:text-base font-black tracking-wide border-3 border-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-micro ease-tactile focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:outline-none"
                >
                  {t('landing.cta_how_it_works')}
                </button>
              </div>
            </div>
          </div>

          {/* Editorial Visual: End-to-End Workflow Diagram */}
          <div className="relative z-10 mt-12 sm:mt-16 animate-page-enter stagger-3">
            <WorkflowDiagram />
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. CORE FEATURES / CAPABILITIES */}
        {/* ========================================================= */}
        <section id="for-farmers" className="py-14 sm:py-20 bg-white border-y-3 border-dark-neutral">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-forest-green bg-forest-green-light px-3 py-1 border-2 border-dark-neutral rounded-xs inline-block shadow-[2px_2px_0px_#22252A]">
                {t('landing.features_badge')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-heading text-dark-neutral tracking-tight">
                {t('landing.features_title')}
              </h2>
              <p className="text-sm sm:text-base text-dark-neutral-muted font-medium">
                {t('landing.features_subtitle')}
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className={`p-6 rounded-xs border-3 border-dark-neutral ${card.bg} ${card.shadowColor} hover:-translate-y-1 transition-transform flex flex-col justify-between`}
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xs border-2 border-dark-neutral flex items-center justify-center mb-5 shadow-[2px_2px_0px_#22252A] bg-white">
                        <Icon className="w-6 h-6 text-dark-neutral" />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-dark-neutral font-heading tracking-tight mb-2">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-dark-neutral-muted font-medium leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. HOW IT WORKS (5-STEP PROCESS) */}
        {/* ========================================================= */}
        <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-dark-neutral bg-wheat-accent/20 px-3 py-1 border-2 border-dark-neutral rounded-xs inline-block shadow-[2px_2px_0px_#22252A]">
              {t('landing.steps_badge')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-dark-neutral tracking-tight">
              {t('landing.steps_title')}
            </h2>
            <p className="text-sm sm:text-base text-dark-neutral-muted font-medium">
              {t('landing.steps_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white border-3 border-dark-neutral rounded-xs p-5 shadow-brutal-sm hover:-translate-y-1 transition-transform flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-dark-neutral/20 pb-3 mb-3">
                      <span className="font-heading font-black text-2xl sm:text-3xl text-forest-green">
                        {step.num}
                      </span>
                      <div className="w-8 h-8 rounded-xs bg-warm-ivory border-2 border-dark-neutral flex items-center justify-center">
                        <Icon className="w-4 h-4 text-dark-neutral" />
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-dark-neutral leading-snug mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-dark-neutral-muted font-medium leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. TRUST & TRANSPARENCY SECTION */}
        {/* ========================================================= */}
        <section id="for-centres" className="py-14 sm:py-20 bg-warm-ivory border-t-3 border-dark-neutral">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column Text */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <span className="text-xs font-black uppercase tracking-widest text-forest-green bg-forest-green-light px-3 py-1 border-2 border-dark-neutral rounded-xs inline-block shadow-[2px_2px_0px_#22252A]">
                  {t('landing.trust_badge')}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-dark-neutral tracking-tight leading-tight">
                  {t('landing.trust_title')}
                </h2>
                <p className="text-sm sm:text-base text-dark-neutral-muted font-medium leading-relaxed">
                  {t('landing.trust_desc')}
                </p>

                <div className="pt-2">
                  <Link to="/access">
                    <button
                      type="button"
                      className="px-6 py-3 min-h-[48px] rounded-xs bg-forest-green text-white text-sm font-black border-2 border-dark-neutral shadow-brutal-sm hover:-translate-y-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      <span>{t('landing.cta_get_started')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right Column 4 Guarantee Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trustItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-dark-neutral p-5 rounded-xs shadow-brutal-sm space-y-2"
                    >
                      <div className="w-9 h-9 rounded-xs bg-forest-green-light border-2 border-dark-neutral flex items-center justify-center text-forest-green shadow-[1px_1px_0px_#22252A]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-black text-dark-neutral leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-dark-neutral-muted font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. BIG CALL TO ACTION BANNER */}
        {/* ========================================================= */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="bg-forest-green border-3 border-dark-neutral rounded-xs p-8 sm:p-12 text-center text-white shadow-brutal-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <span className="text-xs font-black uppercase tracking-widest text-wheat-accent bg-dark-neutral px-3 py-1 border border-wheat-accent rounded-xs inline-block">
                {t('landing.cta_banner_badge')}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-white">
                {t('landing.cta_banner_title')}
              </h2>
              <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed">
                {t('landing.cta_banner_desc')}
              </p>
              <div className="pt-3">
                <Link to="/access">
                  <button
                    type="button"
                    className="px-8 py-4 min-h-[50px] rounded-xs bg-wheat-accent text-dark-neutral text-base font-black tracking-wide border-2 border-dark-neutral shadow-brutal hover:-translate-y-0.5 active:translate-y-0.5 transition-all inline-flex items-center gap-2"
                  >
                    <span>{t('landing.cta_banner_btn')}</span>
                    <ArrowRight className="w-5 h-5 text-dark-neutral" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
