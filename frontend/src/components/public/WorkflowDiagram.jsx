import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Building2, CheckCircle2, Scale, CreditCard, ArrowRight } from 'lucide-react';

export const WorkflowDiagram = () => {
  const { t } = useTranslation();

  const stages = [
    {
      step: '01',
      icon: User,
      title: t('landing.wf_farmer'),
      desc: t('landing.wf_farmer_desc'),
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-800',
      borderColor: 'border-dark-neutral'
    },
    {
      step: '02',
      icon: Building2,
      title: t('landing.wf_centre'),
      desc: t('landing.wf_centre_desc'),
      bg: 'bg-blue-50',
      iconColor: 'text-blue-800',
      borderColor: 'border-dark-neutral'
    },
    {
      step: '03',
      icon: CheckCircle2,
      title: t('landing.wf_quality'),
      desc: t('landing.wf_quality_desc'),
      bg: 'bg-amber-50',
      iconColor: 'text-amber-800',
      borderColor: 'border-dark-neutral'
    },
    {
      step: '04',
      icon: Scale,
      title: t('landing.wf_weighing'),
      desc: t('landing.wf_weighing_desc'),
      bg: 'bg-wheat-accent/15',
      iconColor: 'text-wheat-accent-dark',
      borderColor: 'border-dark-neutral'
    },
    {
      step: '05',
      icon: CreditCard,
      title: t('landing.wf_payment'),
      desc: t('landing.wf_payment_desc'),
      bg: 'bg-forest-green-light',
      iconColor: 'text-forest-green',
      borderColor: 'border-dark-neutral'
    }
  ];

  return (
    <div className="w-full bg-white border-3 border-dark-neutral rounded-xs p-5 sm:p-7 shadow-brutal-xl">
      <div className="flex items-center justify-between border-b-2 border-dark-neutral pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-forest-green border border-dark-neutral" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-dark-neutral">
            {t('landing.workflow_title')}
          </span>
        </div>
        <span className="text-[11px] font-bold text-dark-neutral-muted bg-warm-ivory px-2.5 py-1 border border-dark-neutral rounded-xs">
          5 Seamless Steps
        </span>
      </div>

      {/* Grid of 5 Flow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.step} className="relative flex flex-col justify-between">
              <div
                className={`h-full p-4 rounded-xs border-2 ${stage.borderColor} ${stage.bg} shadow-brutal-sm hover:-translate-y-0.5 transition-transform flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-dark-neutral-muted uppercase tracking-widest">
                      {stage.step}
                    </span>
                    <div className="w-8 h-8 rounded-xs bg-white border-2 border-dark-neutral flex items-center justify-center shadow-[1px_1px_0px_#22252A]">
                      <Icon className={`w-4 h-4 ${stage.iconColor}`} />
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-dark-neutral leading-tight mb-1">
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-dark-neutral-muted font-medium leading-snug">
                    {stage.desc}
                  </p>
                </div>
              </div>

              {/* Arrow separator on desktop */}
              {!isLast && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border-2 border-dark-neutral items-center justify-center shadow-[1px_1px_0px_#22252A]">
                  <ArrowRight className="w-3 h-3 text-dark-neutral" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowDiagram;
