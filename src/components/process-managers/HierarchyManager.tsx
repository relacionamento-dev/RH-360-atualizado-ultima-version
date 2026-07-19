import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, Shield, Users, MapPin, Building, 
  ChevronRight, ArrowRight, UserCog, History
} from 'lucide-react';
import { RHProcess, RHRequest } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export default function HierarchyManager({ process, onNewRequest }: { process: RHProcess, onNewRequest: () => void }) {
  const { config, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const hierarchyRequests = config.solicitacoes.filter(r => r.processId === process.id);
  
  const filtered = config.setores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestão de Hierarquia</h2>
           <p className="text-gray-500 font-medium text-[14px]">Estrutura organizacional, departamentos e alçadas de aprovação</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<History size={18} />}>
            Histórico de Versões
          </Button>
          <Button leftIcon={<Plus size={18} />} onClick={onNewRequest}>
            Nova Alteração
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</p>
          <p className="text-xl font-black text-gray-900 uppercase">RH360 Corporate</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-purple-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Versão Atual</p>
          <p className="text-2xl font-black text-purple-600">v2.4.0</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vigência</p>
          <p className="text-xl font-black text-green-600">JULHO/2026</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setores Ativos</p>
          <p className="text-2xl font-black text-amber-600">{config.setores.length}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar setor ou gestor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
        </div>

        <Table 
          columns={[
            { header: 'SETOR', accessor: 'name', render: (val) => (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Shield size={16} />
                </div>
                <span className="font-bold text-[14px] text-gray-900">{val}</span>
              </div>
            )},
            { header: 'FILIAL', accessor: 'branch', render: (val) => (
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin size={14} />
                <span className="text-[12px] font-bold">{val}</span>
              </div>
            )},
            { header: 'GESTOR', accessor: 'manager', render: (val) => (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <span className="text-[13px] font-bold text-gray-700">{val}</span>
              </div>
            )},
            { header: 'SUBSTITUTO', accessor: 'id', render: () => (
              <span className="text-[12px] font-bold text-gray-400">Não Definido</span>
            )},
            { header: 'SUBORDINADOS', accessor: 'id', render: (id) => {
              const count = config.colaboradores.filter(e => e.department === config.setores.find(s => s.id === id)?.name).length;
              return (
                <div className="flex items-center gap-2">
                   <Users size={14} className="text-gray-300" />
                   <span className="text-[13px] font-black text-gray-900">{count}</span>
                </div>
              );
            }},
            { header: 'STATUS', accessor: 'id', render: () => <Badge variant="green">ATIVO</Badge> },
            { header: '', accessor: 'id', render: () => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" title="Editar Estrutura">
                  <UserCog className="w-5 h-5 text-gray-300 hover:text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" title="Visualizar Árvore">
                  <ChevronRight className="w-5 h-5 text-gray-300 hover:text-orange-500" />
                </Button>
              </div>
            )}
          ]}
          data={filtered}
        />
      </Card>
    </div>
  );
}
