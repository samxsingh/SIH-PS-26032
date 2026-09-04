import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Select = React.forwardRef(
  (
    {
      label,
      options = [],
      error,
      helperText,
      required = false,
      className = '',
      id: customId,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;

    return (
      <div className="w-full mb-4">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 min-h-touch rounded-md border-2 border-dark-neutral font-medium text-dark-neutral bg-white transition-all shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm focus:-translate-y-0.5 cursor-pointer',
              error ? 'border-red-600 bg-red-50/30' : 'focus:border-dark-neutral',
              className
            )
          )}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs font-bold text-red-600 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-dark-neutral-muted font-medium">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
