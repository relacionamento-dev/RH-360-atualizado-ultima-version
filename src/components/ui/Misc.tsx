import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-16 h-16 text-[20px]',
    xl: 'w-24 h-24 text-[32px]',
  };

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm hover:shadow-md transition-shadow duration-300 ${className.includes('rounded-') ? '' : 'rounded-full'} ${sizes[size]} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <span className="font-bold text-gray-500 tracking-tighter">{initials}</span>
        </div>
      )}
    </div>
  );
};

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-[var(--color-brand-border)] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-6 py-4 text-[13px] font-bold transition-all border-b-2 -mb-[2px] ${
            activeTab === tab.id
              ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
              : 'border-transparent text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)] hover:border-gray-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

interface SLABarProps {
  progress: number;
  status?: 'normal' | 'warning' | 'critical';
  className?: string;
}

export const SLABar: React.FC<SLABarProps> = ({ progress, status = 'normal', className = '' }) => {
  const colors = {
    normal: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <div className={`w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-500 ${colors[status]}`} 
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className={`bg-white w-full rounded-[20px] shadow-2xl relative z-10 animate-in zoom-in-95 fade-in duration-300 ${sizes[size]}`}>
        <div className="px-8 py-6 border-b border-[var(--color-brand-border)] flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100 ${className}`}>
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
      <p className="text-[13px] text-gray-500 font-medium mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'blue', 
  size = 'md',
  className = '' 
}) => {
  const variants = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-[12px]',
  };

  return (
    <span className={`inline-flex items-center font-black uppercase tracking-widest rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};
