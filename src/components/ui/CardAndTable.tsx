import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md', title, icon, actions, onClick }) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={`bg-white rounded-[12px] hairline-border subtle-shadow overflow-hidden ${className}`}
      onClick={onClick}
    >
      {(title || icon || actions) && (
        <div className="px-6 py-4 border-b border-[var(--color-brand-border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-[var(--color-brand-primary)]">{icon}</div>}
            {title && <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddings[padding]}>
        {children}
      </div>
    </div>
  );
};

interface TableProps {
  columns: { header: string; accessor: string; render?: (val: any, row: any) => React.ReactNode }[];
  data: any[];
  className?: string;
  rowClassName?: (row: any) => string;
}

export const Table: React.FC<TableProps> = ({ columns, data, className = '', rowClassName }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-brand-border)]">
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 label-caps bg-gray-50/50">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-brand-border)]">
          {data.map((row, i) => (
            <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${rowClassName ? rowClassName(row) : ''}`}>
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 text-[13px]">
                  {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
