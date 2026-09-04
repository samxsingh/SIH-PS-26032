import React, { useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      className = '',
      id: customId,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;

    return (
      <div className="w-full mb-4">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-dark-neutral mb-1.5"
          >
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 min-h-touch rounded-md border-2 border-dark-neutral text-dark-neutral bg-white placeholder:text-dark-neutral-muted transition-all shadow-[2px_2px_0px_#22252A] focus:outline-none focus:shadow-brutal-sm focus:-translate-y-0.5',
              error ? 'border-red-600 bg-red-50/30' : 'focus:border-dark-neutral',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-bold text-red-600 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-dark-neutral-muted font-medium">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
