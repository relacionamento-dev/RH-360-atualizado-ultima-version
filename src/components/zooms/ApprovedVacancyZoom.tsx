import React, { useRef, useState, useMemo } from 'react';
import { Search, Briefcase } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { AnchoredDropdown } from '../ui/AnchoredDropdown';

interface ApprovedVacancyZoomProps {
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
}

export function ApprovedVacancyZoom({ onSelect, label, placeholder }: ApprovedVacancyZoomProps) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    return config.vagas.filter(v => 
      v.status === 'Aberto' && // Only open/approved vacancies
      (v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
       v.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [config.vagas, searchTerm]);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative" ref={searchAnchorRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="text"
          placeholder={placeholder || "Buscar vaga aprovada..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsSearching(true);
          }}
          onFocus={() => setIsSearching(true)}
          onClick={() => setIsSearching(true)}
          className="w-full bg-gray-50 border border-gray-200 rounded-[12px] pl-9 pr-4 py-2 text-[12px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
        />

        <AnchoredDropdown anchorRef={searchAnchorRef} open={isSearching} onClose={() => setIsSearching(false)} maxHeight={240}>
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
                  className="w-full text-left px-3 py-3 rounded-[10px] hover:bg-orange-50 transition-colors flex items-start gap-3 group border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Briefcase size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                        {item.title}
                      </p>
                      <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                        {item.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">
                      {item.company} • {item.branch} • {item.sector}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Qtd: {item.quantity}</span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase">CC: {item.costCenter}</span>
                    </div>
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
    </div>
  );
}
