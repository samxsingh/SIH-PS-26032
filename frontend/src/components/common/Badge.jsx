import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className = '',
}) => {
  const variants = {
    neutral: 'bg-gray-100 text-dark-neutral',
    success: 'bg-forest-green-light text-forest-green animate-badge-success',
    warning: 'bg-warning-amber-light text-amber-900',
    info: 'bg-info-blue-light text-blue-900',
    danger: 'bg-red-100 text-red-900',
    wheat: 'bg-wheat-accent-light text-dark-neutral',
    primary: 'bg-forest-green text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 font-bold tracking-tight rounded-xs border-2 border-dark-neutral shadow-[2px_2px_0px_#22252A] select-none',
          variants[variant] || variants.neutral,
          sizes[size],
          className
        )
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
