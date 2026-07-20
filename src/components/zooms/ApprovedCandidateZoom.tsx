import React, { useRef, useState, useMemo } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { AnchoredDropdown } from '../ui/AnchoredDropdown';

interface ApprovedCandidateZoomProps {
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
}

export function ApprovedCandidateZoom({ onSelect, label, placeholder }: ApprovedCandidateZoomProps) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchAnchorRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    return config.candidaturas
      .filter(c => c.status === 'Aprovado')
      .map(c => {
        const vaga = config.vagas.find(v => v.id === c.jobId);
        return {
          ...c,
          vaga
        };
      })
      .filter(c => 
        c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.vaga?.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [config.candidaturas, config.vagas, searchTerm]);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative" ref={searchAnchorRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="text"
          placeholder={placeholder || "Buscar candidato aprovado..."}
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
                    e.preventDefault(); // Prevent blur before click
                    onSelect(item);
                    setIsSearching(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-3 py-3 rounded-[10px] hover:bg-orange-50 transition-colors flex items-start gap-3 group border-b border-gray-50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                        {item.candidateName}
                      </p>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Aprovado
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">
                      Vaga: {item.vaga?.title || 'N/A'} • {item.vaga?.code || 'N/A'}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase truncate">
                      {item.vaga?.company} • {item.vaga?.branch}
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
    </div>
  );
}
