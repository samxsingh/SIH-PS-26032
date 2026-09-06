import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      disabled = false,
      fullWidth = false,
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-md border-2 border-dark-neutral transition-all duration-micro ease-tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-neutral focus-visible:ring-offset-2 focus-visible:ring-offset-warm-ivory disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none min-h-touch select-none text-center max-w-full';

    const variants = {
      primary: 'bg-forest-green text-white shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      secondary: 'bg-wheat-accent text-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      outline: 'bg-white text-dark-neutral shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal hover:bg-warm-ivory active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      ghost: 'bg-transparent text-dark-neutral border-transparent shadow-none hover:border-dark-neutral hover:bg-white hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      danger: 'bg-red-600 text-white shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      info: 'bg-info-blue text-white shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-[40px]',
      md: 'px-4 py-2.5 text-sm min-h-[48px]',
      lg: 'px-6 py-3.5 text-base min-h-[54px]',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-current shrink-0" />
            <span className="truncate">{loadingText || (typeof children === 'string' ? (children.endsWith('...') ? children : `${children}...`) : 'Processing...')}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
