import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  bodyClassName = '',
  footer,
  accentBorder = false,
  interactive = false,
  shadow = 'normal', // 'none', 'sm', 'normal', 'lg'
  ...props
}) => {
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-brutal-sm',
    normal: 'shadow-brutal',
    lg: 'shadow-brutal-lg',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-md border-2 border-dark-neutral overflow-hidden transition-all duration-normal ease-tactile',
          shadowClasses[shadow] || 'shadow-brutal',
          accentBorder && 'border-l-4 border-l-forest-green',
          interactive && 'hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0 active:shadow-brutal cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-5 py-3.5 border-b-2 border-dark-neutral bg-warm-ivory/50 flex items-center justify-between flex-wrap gap-2">
          <div>
            {title && <h3 className="text-base sm:text-lg font-black font-heading tracking-tight text-dark-neutral">{title}</h3>}
            {subtitle && <p className="text-xs text-dark-neutral-muted mt-0.5 font-medium">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={twMerge(clsx('p-5', bodyClassName))}>{children}</div>
      {footer && <div className="px-5 py-3.5 bg-warm-ivory/50 border-t-2 border-dark-neutral">{footer}</div>}
    </div>
  );
};

export default Card;
