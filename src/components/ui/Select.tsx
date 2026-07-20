import { useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnchoredDropdown } from './AnchoredDropdown';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;  // aplicado ao botão gatilho (ex.: largura)
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Dropdown de filtro padronizado — mesmo mecanismo (AnchoredDropdown via portal)
 * usado nos campos de busca do app, substituindo os <select> nativos dos filtros.
 * Não é clipado por overflow, faz flip e acompanha scroll.
 */
export function Select({ value, onChange, options, placeholder = 'Selecione...', className = '', ariaLabel, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className={`truncate ${selected ? 'text-gray-700' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      <AnchoredDropdown anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} maxHeight={280}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-[8px] text-[12px] font-bold flex items-center justify-between gap-2 transition-colors ${opt.value === value ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <span className="truncate">{opt.label}</span>
            {opt.value === value && <Check size={14} className="text-orange-500 shrink-0" />}
          </button>
        ))}
      </AnchoredDropdown>
    </>
  );
}
