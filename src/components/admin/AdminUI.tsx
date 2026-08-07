import React from 'react';
import { Search, ChevronRight, Info } from 'lucide-react';
import { READONLY_SURFACE, READONLY_TEXT } from '../ui/ReadOnlyField';

// Blocos de apresentação compartilhados pela Central Adm.
//
// A régua visual é a mesma da aba Aprovações: borda fina (gray-100), sem
// sombras fortes, cabeçalhos de seção discretos e detalhe sob demanda em vez de
// dezenas de campos abertos ao mesmo tempo. Toda aba da Central Adm usa estes
// blocos para parecer uma coisa só.

// Input de texto padronizado — mesma altura, raio e tipografia do <Select>.
export const ADMIN_FIELD_CLASS =
  'bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-medium';

/** O mesmo campo em leitura: fundo cinza do padrão único (ui/ReadOnlyField). */
export const ADMIN_FIELD_READONLY_CLASS =
  `${READONLY_SURFACE} ${READONLY_TEXT} border rounded-[8px] px-3 py-2 text-[13px] font-bold cursor-not-allowed`;

/**
 * Escolhe entre as duas classes. Use sempre que o mesmo campo alterna entre
 * editar e ler — concatenar as duas não funciona: `bg-white` e `bg-gray-50`
 * disputam a mesma propriedade e quem vence é a ordem do CSS gerado, não a da
 * string.
 */
export const adminFieldClass = (editavel: boolean) =>
  editavel ? ADMIN_FIELD_CLASS : ADMIN_FIELD_READONLY_CLASS;

/** Cabeçalho de seção: título, explicação em linguagem simples e ações. */
export function SectionHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-[17px] font-black text-gray-900 tracking-tight">{title}</h3>
        {description && <p className="text-[13px] text-gray-500 font-medium">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Abas secundárias em pílulas discretas. */
export function SubTabs<T extends string>({
  tabs,
  value,
  onChange
}: {
  tabs: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-gray-50 rounded-[12px] w-fit max-w-full">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-[8px] font-bold text-[12px] transition-colors ${
            value === tab.id
              ? 'bg-white text-gray-900 border border-gray-200'
              : 'text-gray-500 border border-transparent hover:text-gray-900'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Campo de busca padronizado. */
export function AdminSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-[8px] text-[13px] font-medium outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  );
}

/** Nota explicativa discreta — substitui as caixas coloridas de destaque. */
export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] bg-gray-50 px-4 py-3">
      <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
      <p className="text-[13px] text-gray-600 font-medium leading-relaxed">{children}</p>
    </div>
  );
}

/** Rótulo + campo, com dica opcional em linguagem simples. */
export function Field({
  label,
  hint,
  children,
  className = ''
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 min-w-0 ${className}`}>
      <label className="label-caps ml-1 block">{label}</label>
      {children}
      {hint && <p className="text-[12px] text-gray-400 font-medium ml-1">{hint}</p>}
    </div>
  );
}

/**
 * Linha de lista com detalhe sob demanda: resumo sempre visível, edição só
 * quando o usuário abre. Mesma mecânica dos níveis de aprovação.
 */
export function ExpandableRow({
  leading,
  title,
  subtitle,
  meta,
  badge,
  open,
  onToggle,
  actions,
  children
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-[12px] border transition-colors ${open ? 'border-gray-200 subtle-shadow' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-3 text-left"
        >
          {leading}
          <span className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[14px] font-bold text-gray-900 truncate">{title}</span>
            {subtitle && <span className="text-[12px] text-gray-500 font-medium truncate">{subtitle}</span>}
          </span>
          {meta && <span className="hidden sm:inline text-[12px] font-medium text-gray-400 shrink-0">{meta}</span>}
          {badge}
          <ChevronRight size={16} className={`text-gray-300 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      </div>
      {open && children && (
        <div className="border-t border-gray-100 px-5 py-5">{children}</div>
      )}
    </div>
  );
}

/** Círculo de ordem/índice usado nas listas. */
export function RowIndex({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-7 h-7 shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[12px] font-black">
      {children}
    </span>
  );
}
