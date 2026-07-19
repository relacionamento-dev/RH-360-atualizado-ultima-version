import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface EmployeeZoomProps {
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
  filter?: (employee: any) => boolean;
}

export function EmployeeZoom({ onSelect, label, placeholder, filter }: EmployeeZoomProps) {
  const { config } = useAppConfig();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select 
          value={selectedCompanyId}
          onChange={(e) => {
            setSelectedCompanyId(e.target.value);
            setSelectedBranch('');
          }}
          className="bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="">Empresa...</option>
          {config.empresas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          value={selectedBranch}
          disabled={!selectedCompanyId}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-[12px] px-4 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
        >
          <option value="">Filial...</option>
          {config.filiais.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <div className="relative">
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
            onBlur={() => setIsSearching(false)}
            onClick={() => setIsSearching(true)}
            className="w-full bg-gray-50 border border-gray-200 rounded-[12px] pl-9 pr-4 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
          />

          {isSearching && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[16px] shadow-2xl z-[60] max-h-48 overflow-y-auto custom-scrollbar p-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
