import React, { useState, useMemo } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface ManagerZoomProps {
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
}

export function ManagerZoom({ onSelect, label, placeholder }: ManagerZoomProps) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredItems = useMemo(() => {
    return config.colaboradores.filter(e => 
      e.status === 'Ativo' &&
      (e.role.toLowerCase().includes('gerente') || e.role.toLowerCase().includes('coordenador') || e.role.toLowerCase().includes('diretor')) &&
      (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       e.registration.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [config.colaboradores, searchTerm]);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input 
          type="text"
          placeholder={placeholder || "Buscar gestor..."}
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
              filteredItems.map(item => (
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
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                      {item.role} • {item.department}
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
  );
}
