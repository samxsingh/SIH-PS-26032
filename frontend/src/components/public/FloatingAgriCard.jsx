import React from 'react';

/**
 * FloatingAgriCard
 * Tactile, editorial informational card for the AgriNexus hero section.
 * Strictly adheres to the Government of India / AgriNexus Neo-Brutalist design system.
 */
export const FloatingAgriCard = ({
  icon: Icon,
  badgeText,
  badgeBg = 'bg-forest-green-light',
  badgeTextCol = 'text-forest-green',
  label,
  title,
  desc,
  metric,
  substeps = null,
  compact = false,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`select-none bg-white border-2 border-dark-neutral/90 shadow-[3px_3px_0px_#22252A] rounded-xs transition-all duration-normal ${
        compact 
          ? 'p-3 w-full' 
          : 'p-3.5 xl:p-4 w-[230px] xl:w-[260px]'
      } ${className}`}
      style={style}
    >
      {/* Top Meta Bar: Category Tag & Status Pill */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <div className="w-5 h-5 rounded-xs border border-dark-neutral/80 bg-forest-green-light flex items-center justify-center text-forest-green shrink-0 shadow-[1px_1px_0px_#22252A]">
              <Icon className="w-3 h-3" />
            </div>
          )}
          {label && (
            <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted truncate">
              {label}
            </span>
          )}
        </div>
        {badgeText && (
          <span
            className={`text-[8px] xl:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs border border-dark-neutral/60 shrink-0 ${badgeBg} ${badgeTextCol}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Title */}
      <h3 className="text-xs xl:text-sm font-black text-dark-neutral font-heading tracking-tight leading-snug">
        {title}
      </h3>

      {/* Description */}
      {desc && (
        <p className="text-[10px] xl:text-[11px] text-dark-neutral-muted font-medium leading-normal mt-1">
          {desc}
        </p>
      )}

      {/* Optional Stepper (Used for Pipeline / Multi-role Cards) */}
      {substeps && substeps.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-dark-neutral/15">
          <div className="flex items-center justify-between text-[8px] xl:text-[9px] font-black uppercase tracking-tight text-dark-neutral gap-0.5">
            {substeps.map((step, idx) => {
              // Subtle accent on the active/leading step without loud distraction
              const isFirst = idx === 0;
              return (
                <React.Fragment key={step}>
                  <span
                    className={`px-1 py-0.5 rounded-xs border text-center truncate max-w-[56px] transition-colors ${
                      isFirst
                        ? 'bg-forest-green text-white border-dark-neutral font-black shadow-[1px_1px_0px_#22252A]'
                        : 'bg-forest-green-light/80 border-dark-neutral/40 text-forest-green font-bold'
                    }`}
                  >
                    {step}
                  </span>
                  {idx < substeps.length - 1 && (
                    <span className="text-dark-neutral/40 text-[8px] shrink-0 select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Metric / Indicator Footer */}
      {metric && (
        <div className="flex items-center justify-between border-t border-dark-neutral/15 pt-1.5 mt-2 text-[10px]">
          <span className="text-forest-green font-black tracking-wide uppercase">
            {metric}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-green animate-pulse" />
          </span>
        </div>
      )}
    </div>
  );
};

export default FloatingAgriCard;
