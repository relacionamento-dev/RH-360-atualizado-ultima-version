import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, fullWidth, leftIcon, rightIcon, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px]';
    
    const variants = {
      primary: 'bg-[var(--color-brand-primary)] text-white hover:bg-orange-600 focus:ring-orange-500 shadow-sm',
      secondary: 'bg-white text-[var(--color-brand-text-primary)] hairline-border hover:bg-gray-50 focus:ring-gray-200 shadow-sm',
      outline: 'bg-transparent text-[var(--color-brand-text-primary)] hairline-border hover:bg-gray-50 focus:ring-gray-200',
      ghost: 'bg-transparent text-[var(--color-brand-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-brand-text-primary)] focus:ring-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      xs: 'px-2 py-1 text-[10px] uppercase tracking-wider',
      sm: 'px-3 py-1.5 text-[11px] uppercase tracking-wider',
      md: 'px-4 py-2 text-[13px]',
      lg: 'px-6 py-3 text-[15px]',
      icon: 'p-2',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
