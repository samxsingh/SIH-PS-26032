import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';

/**
 * ProgressLadder
 * A tactile, straight-line / ladder-style stage progression tracker.
 * Renders as a clean horizontal pipeline on large screens (lg+)
 * and seamlessly transforms into a vertical step ladder on mobile/tablet (<lg).
 * 
 * Visual States:
 * - Completed: Emerald badge with checkmark (✓ COMPLETED)
 * - Current: Bold forest green with pulse indicator (● CURRENT)
 * - Upcoming: Muted outline with step number (○ UPCOMING)
 */
export const ProgressLadder = ({
  stages = [],
  currentIndex = 0,
  className = '',
  orientation = 'responsive', // 'responsive' | 'horizontal' | 'vertical'
  compact = false,
  showMeanings = true,
  tone = 'dark' // 'dark' (on forest-green/dark card) | 'light' (on white/sand background)
}) => {
  const { t } = useTranslation();
  if (!stages || stages.length === 0) return null;

  const shouldShowMeanings = showMeanings && !compact;

  // =========================================================================
  // COMPACT MODE (Designed for Farmer Dashboard Hero)
  // =========================================================================
  if (compact) {
    const isDark = tone === 'dark';

    return (
      <div className={`w-full ${className}`}>
        {/* Desktop / Tablet Horizontal Stepper */}
        <div className="hidden sm:block relative py-1">
          {/* Thin connecting progress line */}
          <div
            className={`absolute top-3 left-4 right-4 h-0.5 -z-0 ${
              isDark ? 'bg-white/20' : 'bg-dark-neutral/20'
            }`}
          />

          {/* Grid of Steps */}
          <div className="grid grid-flow-col auto-cols-fr gap-1 relative z-10">
            {stages.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={stage.key || idx}
                  className="flex flex-col items-center text-center group"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Step Node */}
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      isCurrent
                        ? isDark
                          ? 'bg-wheat-accent text-dark-neutral border-dark-neutral font-black shadow-[1px_1px_0px_#22252A] ring-2 ring-white -translate-y-0.5 scale-110'
                          : 'bg-forest-green text-white border-dark-neutral font-black shadow-[1px_1px_0px_#22252A] ring-2 ring-forest-green -translate-y-0.5 scale-110'
                        : isPassed
                        ? isDark
                          ? 'bg-emerald-400 text-dark-neutral border-emerald-300 font-bold'
                          : 'bg-emerald-600 text-white border-dark-neutral font-bold'
                        : isDark
                        ? 'bg-white/15 text-white/50 border-white/25'
                        : 'bg-sand text-dark-neutral-muted border-dark-neutral/30'
                    }`}
                  >
                    {isPassed ? (
                      <span className="text-[11px] font-black leading-none">✓</span>
                    ) : (
                      <span className="font-mono text-[10px] font-black leading-none">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`text-[10px] block font-heading uppercase tracking-tight mt-1 truncate max-w-[70px] ${
                      isCurrent
                        ? isDark
                          ? 'font-black text-wheat-accent'
                          : 'font-black text-forest-green'
                        : isPassed
                        ? isDark
                          ? 'font-bold text-white/90'
                          : 'font-bold text-dark-neutral'
                        : isDark
                        ? 'font-medium text-white/40'
                        : 'font-medium text-dark-neutral-muted'
                    }`}
                  >
                    {stage.short || stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Horizontal Scrollable Strip (<sm) */}
        <div className="block sm:hidden overflow-x-auto py-1 no-scrollbar -mx-1 px-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {stages.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <React.Fragment key={stage.key || idx}>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-heading uppercase tracking-tight ${
                      isCurrent
                        ? 'bg-wheat-accent text-dark-neutral border-dark-neutral font-black shadow-[1px_1px_0px_#22252A]'
                        : isPassed
                        ? isDark
                          ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/50 font-bold'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                        : isDark
                        ? 'bg-white/10 text-white/50 border-white/20 font-medium'
                        : 'bg-sand/60 text-dark-neutral-muted border-dark-neutral/20 font-medium'
                    }`}
                  >
                    <span className="font-mono text-[9px] font-black">
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <span>{stage.short || stage.label}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <span
                      className={`h-0.5 w-1.5 shrink-0 ${
                        isPassed
                          ? isDark
                            ? 'bg-emerald-400'
                            : 'bg-emerald-600'
                          : isDark
                          ? 'bg-white/20'
                          : 'bg-dark-neutral/20'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD / DETAILED MODE (Used on /farmer/procurement/:id & detailed pages)
  // =========================================================================
  return (
    <div className={`w-full ${className}`}>
      {/* 1. HORIZONTAL PIPELINE (Desktop / Large Viewports) */}
      <div
        className={`${
          orientation === 'vertical' ? 'hidden' : orientation === 'horizontal' ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="relative overflow-x-auto py-2">
          {/* Connecting Line between nodes */}
          <div className="absolute top-7 left-6 right-6 h-0.5 bg-dark-neutral/20 -z-0" />

          {/* Grid of Steps */}
          <div className="grid grid-flow-col auto-cols-fr gap-2 relative z-10 min-w-[760px]">
            {stages.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isUpcoming = idx > currentIndex;

              return (
                <div
                  key={stage.key || idx}
                  className="flex flex-col items-center text-center group"
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Step Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-xs border-2 flex items-center justify-center transition-all duration-normal ease-tactile ${
                      isCurrent
                        ? 'bg-forest-green text-white border-dark-neutral shadow-[3px_3px_0px_#22252A] -translate-y-1 scale-105 ring-2 ring-forest-green ring-offset-1'
                        : isPassed
                        ? 'bg-emerald-100 text-emerald-800 border-dark-neutral shadow-[2px_2px_0px_#22252A]'
                        : 'bg-warm-ivory text-dark-neutral-muted border-dark-neutral/40 opacity-70'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-800 motion-reduce:animate-none animate-scale-check" />
                    ) : isCurrent ? (
                      <div className="flex items-center justify-center">
                        <span className="font-mono font-black text-xs">{idx + 1}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-bold text-dark-neutral-muted">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Label & Subtitle */}
                  <div className="mt-2.5 px-1 max-w-[140px]">
                    <div className="flex items-center justify-center gap-1">
                      {isCurrent && (
                        <span className="inline-block w-2 h-2 rounded-full bg-forest-green motion-reduce:animate-none animate-pulse" />
                      )}
                      <span
                        className={`text-xs block font-heading uppercase tracking-tight line-clamp-1 ${
                          isCurrent
                            ? 'font-black text-forest-green'
                            : isPassed
                            ? 'font-bold text-dark-neutral'
                            : 'font-medium text-dark-neutral-muted'
                        }`}
                      >
                        {stage.short || stage.label}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 bg-wheat-accent text-dark-neutral border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                        ● {t('farmer.stage_current', 'CURRENT')}
                      </span>
                    ) : isPassed ? (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-800">
                        ✓ {t('farmer.stage_completed', 'COMPLETED')}
                      </span>
                    ) : (
                      <span className="inline-block mt-0.5 text-[9px] font-medium text-dark-neutral-muted/70">
                        ○ {t('farmer.stage_upcoming', 'UPCOMING')}
                      </span>
                    )}

                    {shouldShowMeanings && (stage.meaning || stage.desc) && (
                      <span className={`block text-[10px] mt-1 leading-tight line-clamp-2 ${
                        isCurrent ? 'font-bold text-forest-green' : 'text-dark-neutral-muted/80'
                      }`}>
                        {stage.meaning || stage.desc}
                      </span>
                    )}

                    {stage.timestamp && (
                      <span className="text-[10px] text-dark-neutral-muted font-mono block mt-0.5">
                        {stage.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. VERTICAL LADDER (Mobile & Tablet Viewports) */}
      <div
        className={`${
          orientation === 'horizontal' ? 'hidden' : orientation === 'vertical' ? 'block' : 'block lg:hidden'
        }`}
      >
        <div className="space-y-3 relative">
          {/* Vertical connecting line */}
          <div className="absolute top-5 bottom-5 left-5 w-0.5 bg-dark-neutral/20 -z-0" />

          {stages.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;

            return (
              <div
                key={stage.key || idx}
                aria-current={isCurrent ? 'step' : undefined}
                className={`relative z-10 flex items-start gap-3.5 p-3 rounded-xs border-2 transition-all duration-normal ${
                  isCurrent
                    ? 'bg-forest-green-light border-forest-green shadow-brutal -translate-y-0.5 ring-2 ring-forest-green'
                    : isPassed
                    ? 'bg-white border-dark-neutral shadow-[2px_2px_0px_#22252A]'
                    : 'bg-warm-ivory/60 border-dark-neutral/30 opacity-70'
                }`}
              >
                {/* Node icon */}
                <div
                  className={`w-9 h-9 shrink-0 rounded-xs border-2 border-dark-neutral flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-forest-green text-white shadow-[2px_2px_0px_#22252A]'
                      : isPassed
                      ? 'bg-emerald-100 text-emerald-800 shadow-[1px_1px_0px_#22252A]'
                      : 'bg-white text-dark-neutral-muted'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-800 motion-reduce:animate-none animate-scale-check" />
                  ) : isCurrent ? (
                    <span className="font-mono font-black text-xs">{idx + 1}</span>
                  ) : (
                    <span className="font-mono text-xs font-bold text-dark-neutral-muted">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-sm uppercase font-heading tracking-tight ${
                          isCurrent
                            ? 'font-black text-forest-green'
                            : isPassed
                            ? 'font-bold text-dark-neutral'
                            : 'font-medium text-dark-neutral-muted'
                        }`}
                      >
                        {stage.short || stage.label}
                      </span>
                      {isCurrent ? (
                        <span className="inline-block text-[9px] font-black uppercase px-1.5 py-0.2 bg-wheat-accent text-dark-neutral border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                          ● {t('farmer.stage_current', 'CURRENT')}
                        </span>
                      ) : isPassed ? (
                        <span className="inline-block text-[9px] font-bold text-emerald-800">
                          ✓ {t('farmer.stage_completed', 'COMPLETED')}
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-medium text-dark-neutral-muted/70">
                          ○ {t('farmer.stage_upcoming', 'UPCOMING')}
                        </span>
                      )}
                    </div>

                    {stage.timestamp && (
                      <span className="text-[10px] text-dark-neutral-muted font-mono font-bold">
                        {stage.timestamp}
                      </span>
                    )}
                  </div>

                  {shouldShowMeanings && (stage.meaning || stage.desc) && (
                    <p className="text-[11px] sm:text-xs text-dark-neutral-muted font-medium mt-1 leading-relaxed">
                      {stage.meaning || stage.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressLadder;
