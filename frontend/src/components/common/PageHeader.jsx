import React from 'react';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  actions,
  children,
}) => {
  return (
    <div className="mb-6 bg-white p-5 sm:p-6 rounded-md border-2 border-dark-neutral shadow-brutal">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-dark-neutral">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-dark-neutral-muted text-xs sm:text-sm font-medium mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
      </div>
      {children && <div className="mt-4 pt-4 border-t-2 border-dark-neutral">{children}</div>}
    </div>
  );
};

export default PageHeader;
