import React, { useState, useMemo } from 'react';
import { Search, Heart } from 'lucide-react';
import { useAppConfig } from '../../contexts/AppConfigContext';

interface DependentZoomProps {
  employeeId?: string;
  employeeName?: string;
  onSelect: (item: any) => void;
  label?: string;
  placeholder?: string;
}

export function DependentZoom({ employeeId, employeeName, onSelect, label, placeholder }: DependentZoomProps) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredItems = useMemo(() => {
    let targetEmployees = config.colaboradores;

    // If an employeeId or name is specified, narrow search to that employee
    if (employeeId) {
      targetEmployees = config.colaboradores.filter(e => e.id === employeeId);
    } else if (employeeName) {
      targetEmployees = config.colaboradores.filter(e => e.name === employeeName);
    }

    const dependentsList: any[] = [];
    targetEmployees.forEach(emp => {
      if (emp.dependents && emp.dependents.length > 0) {
        emp.dependents.forEach(dep => {
          dependentsList.push({
            ...dep,
            employeeName: emp.name,
            employeeId: emp.id
          });
        });
      }
    });

    if (searchTerm) {
      return dependentsList.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.relationship.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return dependentsList;
  }, [config.colaboradores, employeeId, employeeName, searchTerm]);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input 
          type="text"
          placeholder={placeholder || "Selecionar dependente..."}
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
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <Heart size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-gray-900 truncate group-hover:text-orange-600">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                      {item.relationship} • Colaborador: {item.employeeName}
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
