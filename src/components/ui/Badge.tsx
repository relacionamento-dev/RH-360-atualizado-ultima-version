import React from 'react';

export type BadgeVariant = 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'gray' | 'orange' | 'outline' | 'white';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className = '', size = 'md' }) => {
  const variants = {
    blue: 'bg-[var(--color-status-blue-bg)] text-[var(--color-status-blue-text)]',
    amber: 'bg-[var(--color-status-amber-bg)] text-[var(--color-status-amber-text)]',
    green: 'bg-[var(--color-status-green-bg)] text-[var(--color-status-green-text)]',
    red: 'bg-[var(--color-status-red-bg)] text-[var(--color-status-red-text)]',
    purple: 'bg-[var(--color-status-purple-bg)] text-[var(--color-status-purple-text)]',
    orange: 'bg-orange-50 text-orange-600',
    gray: 'bg-gray-100 text-gray-600',
    outline: 'bg-transparent border border-gray-200 text-gray-600',
    white: 'bg-white border border-gray-100 text-gray-900 shadow-sm',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-0.5 text-[11px]',
  };

  return (
    <span className={`inline-flex items-center rounded-[4px] font-bold uppercase tracking-wider ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
