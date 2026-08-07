import React, { useRef, useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { AnchoredDropdown } from '../ui/AnchoredDropdown';
import { READONLY_BOX } from '../ui/ReadOnlyField';

interface EmployeeZoomProps {
  onSelect: (item: any) => void;
  onClear?: () => void;
  value?: string;      // nome do colaborador selecionado
  selectedId?: string; // id do colaborador selecionado
  readOnly?: boolean;
  label?: string;
  placeholder?: string;
  filter?: (employee: any) => boolean;
}

export function EmployeeZoom({ onSelect, onClear, value, selectedId, readOnly, label, placeholder, filter }: EmployeeZoomProps) {
  const { config } = useAppConfig();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);

  const isSelected = !!value;
  // Empresa/Filial exibidas após a seleção derivam do próprio colaborador escolhido.
  const selectedEmployee = useMemo(
    () => (selectedId ? config.colaboradores.find(e => e.id === selectedId) : undefined),
    [config.colaboradores, selectedId]
  );

  const filteredItems = useMemo(() => {
    let items = config.colaboradores.filter(e => e.status === 'Ativo');

    if (selectedCompanyId) {
      const companyName = config.empresas.find(c => c.id === selectedCompanyId)?.name;
      items = items.filter(e => e.company === companyName);
    }
    if (selectedBranch) {
      items = items.filter(e => e.branch === selectedBranch);
    }

    if (searchTerm) {
      items = items.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.registration.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter) {
      items = items.filter(filter);
    }

    return items;
  }, [config.colaboradores, selectedBranch, selectedCompanyId, searchTerm, config.empresas, filter]);

  // Depois de escolher o colaborador, Empresa e Filial passam a ser dado dele:
  // viram caixa cinza (padrão de leitura do app). Antes disso são seletores de
  // verdade e ficam brancos, como todo campo editável.
  const readOnlyFieldClass = `${READONLY_BOX} truncate`;
  const editableFieldClass = 'bg-white border border-gray-200 rounded-[12px] px-4 py-2 text-[12px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Empresa: seletor editável antes da seleção; preenchida e read-only depois. */}
        {isSelected ? (
          <div className={readOnlyFieldClass} title={selectedEmployee?.company || ''}>
            {selectedEmployee?.company || '—'}
          </div>
        ) : (
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setSelectedBranch('');
            }}
            className={editableFieldClass}
          >
            <option value="">Empresa...</option>
            {config.empresas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* Filial */}
        {isSelected ? (
          <div className={readOnlyFieldClass} title={selectedEmployee?.branch || ''}>
            {selectedEmployee?.branch || '—'}
          </div>
        ) : (
          <select
            value={selectedBranch}
            disabled={!selectedCompanyId}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={`${editableFieldClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">Filial...</option>
            {config.filiais.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}

        {/* Busca (antes) / colaborador selecionado com botão de limpar (depois) */}
        {isSelected ? (
          <div className="flex items-center justify-between px-3 py-2 bg-orange-50 border border-orange-100 rounded-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-[10px] shrink-0">
                {String(value).charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-gray-900 truncate">{value}</p>
                <p className="text-[9px] text-orange-600 font-bold uppercase tracking-wider">Selecionado</p>
              </div>
            </div>
            {!readOnly && onClear && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setSelectedCompanyId('');
                  setSelectedBranch('');
                  setSearchTerm('');
                }}
                className="p-1.5 hover:bg-orange-100 rounded-full text-orange-400 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="relative" ref={searchAnchorRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder={placeholder || "Buscar colaborador..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              onClick={() => setIsSearching(true)}
              className={`w-full ${editableFieldClass} pl-9`}
            />

            <AnchoredDropdown anchorRef={searchAnchorRef} open={isSearching} onClose={() => setIsSearching(false)} maxHeight={192}>
              {filteredItems.length > 0 ? (
                filteredItems.slice(0, 10).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(item);
                      setIsSearching(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-orange-50 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400 uppercase">
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                        {item.role} • {item.registration}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Nenhum registro encontrado</p>
                </div>
              )}
            </AnchoredDropdown>
          </div>
        )}
      </div>
    </div>
  );
}
