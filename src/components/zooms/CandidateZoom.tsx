import React, { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface CandidateZoomProps {
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
  vacancyId?: string;
}

export function CandidateZoom({ onSelect, label, placeholder, vacancyId }: CandidateZoomProps) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredItems = useMemo(() => {
    return config.candidaturas.filter(c => 
      (!vacancyId || c.jobId === vacancyId) &&
      (c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [config.candidaturas, searchTerm, vacancyId]);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input 
          type="text"
          placeholder={placeholder || "Buscar candidato..."}
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[16px] shadow-2xl z-[60] max-h-60 overflow-y-auto custom-scrollbar p-1">
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
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <User size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                        {item.candidateName}
                      </p>
                      <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">
                      {item.email} • {item.phone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Origem: {item.source}</span>
                      {item.score && <span className="text-[9px] font-bold text-emerald-600 uppercase">Nota: {item.score}</span>}
                    </div>
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
