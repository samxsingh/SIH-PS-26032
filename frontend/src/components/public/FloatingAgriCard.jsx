import React from 'react';

/**
 * FloatingAgriCard
 * Subtle, editorial agricultural status badge/card that floats in the hero background.
 * Follows AgriNexus light-first neo-brutalist government design system.
 */
export const FloatingAgriCard = ({
  icon: Icon,
  badgeText,
  badgeBg = 'bg-forest-green-light',
  badgeTextCol = 'text-forest-green',
  title,
  subtitle,
  stat,
  statLabel,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`pointer-events-none select-none bg-white/95 backdrop-blur-[2px] border-2 border-dark-neutral/90 shadow-[3px_3px_0px_rgba(34,37,42,0.85)] rounded-xs p-3 min-w-[210px] max-w-[250px] transition-transform duration-normal ${className}`}
      style={style}
    >
      {/* Header with mini badge & icon */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div className="w-5 h-5 rounded-xs border border-dark-neutral/80 bg-forest-green-light flex items-center justify-center text-forest-green">
              <Icon className="w-3 h-3" />
            </div>
          )}
          <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral">
            {title}
          </span>
        </div>
        {badgeText && (
          <span
            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs border border-dark-neutral/60 ${badgeBg} ${badgeTextCol}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Subtitle / Key info */}
      <div className="text-[11px] font-semibold text-dark-neutral-muted leading-tight mb-1 truncate">
        {subtitle}
      </div>

      {/* Metric / Stat pill */}
      {stat && (
        <div className="flex items-baseline justify-between border-t border-dark-neutral/15 pt-1.5 mt-1 text-[11px]">
          <span className="text-dark-neutral font-black">{stat}</span>
          {statLabel && (
            <span className="text-[9px] text-dark-neutral-muted font-medium uppercase tracking-tight">
              {statLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingAgriCard;
