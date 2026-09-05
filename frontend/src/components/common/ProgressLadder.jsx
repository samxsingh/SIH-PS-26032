import React from 'react';
import { CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';

/**
 * ProgressLadder
 * A tactile, straight-line / ladder-style stage progression tracker.
 * Renders as a clean horizontal pipeline on large screens (lg+)
 * and seamlessly transforms into a vertical step ladder on mobile/tablet (<lg).
 * 
 * Visual States:
 * - Completed: Emerald badge with checkmark (✓)
 * - Current: Bold forest green with pulse indicator (● CURRENT)
 * - Upcoming: Muted outline with step number (○)
 */
export const ProgressLadder = ({
  stages = [],
  currentIndex = 0,
  className = '',
  orientation = 'responsive' // 'responsive' | 'horizontal' | 'vertical'
}) => {
  if (!stages || stages.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {/* ========================================================================= */}
      {/* 1. HORIZONTAL PIPELINE (Desktop / Large Viewports) */}
      {/* ========================================================================= */}
      <div
        className={`${
          orientation === 'vertical' ? 'hidden' : orientation === 'horizontal' ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="relative">
          {/* Connecting Line between nodes */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-dark-neutral/20 -z-0" />

          {/* Grid of Steps */}
          <div className="grid grid-flow-col auto-cols-fr gap-2 relative z-10">
            {stages.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isUpcoming = idx > currentIndex;

              return (
                <div key={stage.key || idx} className="flex flex-col items-center text-center group">
                  {/* Step Icon Badge */}
                  <div
                    className={`w-10 h-10 rounded-xs border-2 border-dark-neutral flex items-center justify-center transition-all duration-normal ease-tactile ${
                      isCurrent
                        ? 'bg-forest-green text-white shadow-[3px_3px_0px_#22252A] -translate-y-1 scale-105'
                        : isPassed
                        ? 'bg-emerald-100 text-emerald-800 shadow-[2px_2px_0px_#22252A]'
                        : 'bg-warm-ivory text-dark-neutral-muted border-dark-neutral/40'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-800 animate-scale-check" />
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
                        <span className="inline-block w-2 h-2 rounded-full bg-forest-green animate-pulse" />
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

                    {isCurrent && (
                      <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 bg-wheat-accent text-dark-neutral border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                        Current
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

      {/* ========================================================================= */}
      {/* 2. VERTICAL LADDER (Mobile & Tablet Viewports) */}
      {/* ========================================================================= */}
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
                className={`relative z-10 flex items-start gap-3.5 p-3 rounded-xs border-2 transition-all duration-normal ${
                  isCurrent
                    ? 'bg-forest-green-light border-forest-green shadow-brutal -translate-y-0.5'
                    : isPassed
                    ? 'bg-white border-dark-neutral shadow-[2px_2px_0px_#22252A]'
                    : 'bg-warm-ivory/60 border-dark-neutral/30 opacity-75'
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
                    <CheckCircle2 className="w-5 h-5 text-emerald-800 animate-scale-check" />
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
                      {isCurrent && (
                        <span className="inline-block text-[9px] font-black uppercase px-1.5 py-0.2 bg-wheat-accent text-dark-neutral border border-dark-neutral rounded-xs shadow-[1px_1px_0px_#22252A]">
                          Current
                        </span>
                      )}
                    </div>

                    {stage.timestamp && (
                      <span className="text-[10px] text-dark-neutral-muted font-mono font-bold">
                        {stage.timestamp}
                      </span>
                    )}
                  </div>

                  {stage.desc && (
                    <p className="text-[11px] sm:text-xs text-dark-neutral-muted font-medium mt-1 leading-relaxed">
                      {stage.desc}
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
