import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, List, Activity, Target, Clock, ChevronRight
} from 'lucide-react';
import { RHProcess, RHRequest } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SLABar } from '../ui/Misc';

const statusVariants: Record<string, 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'gray'> = {
  'Rascunho': 'gray',
  'Aberto': 'blue',
  'Enviada': 'blue',
  'Em Aprovação': 'amber',
  'Devolvida': 'purple',
  'Devolvido': 'purple',
  'Aprovada': 'green',
  'Reprovada': 'red',
  'Concluído': 'green',
  'Concluída': 'green',
  'Cancelada': 'red',
  'Cancelado': 'red',
};

interface GenericProcessManagerProps {
  process: RHProcess;
  onNewRequest: () => void;
}

export default function GenericProcessManager({ process, onNewRequest }: GenericProcessManagerProps) {
  const { config, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');

  const requests = config.solicitacoes.filter(r => 
    r.processId === process.id && 
    (r.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (r.alvo || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: requests.length,
    emAndamento: requests.filter(r => r.status === 'Em Análise' || r.status === 'Em Aprovação' || r.status === 'Enviada').length,
    concluidos: requests.filter(r => r.status === 'Concluída' || r.status === 'Concluído').length,
    atrasados: requests.filter(r => r.slaStatus === 'critical').length
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">{process.name}</h2>
           <p className="text-gray-500 font-medium text-[14px]">{process.description}</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={onNewRequest}>
          Nova Solicitação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Andamento</p>
          <p className="text-2xl font-black text-amber-600">{stats.emAndamento}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concluídos</p>
          <p className="text-2xl font-black text-green-600">{stats.concluidos}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atrasados</p>
          <p className="text-2xl font-black text-red-600">{stats.atrasados}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por Nº ou Alvo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
        </div>

        <Table 
          columns={[
            { header: 'Nº PROCESSO', accessor: 'numero', render: (val) => <span className="font-mono text-[12px] font-bold text-gray-400">{val}</span> },
            { header: 'ALVO / COLABORADOR', accessor: 'alvo', render: (val) => <span className="font-bold text-[14px] text-gray-900">{val}</span> },
            { header: 'ETAPA', accessor: 'etapaAtual', render: (val) => <span className="font-bold text-[13px] text-blue-600 uppercase tracking-tight">{val}</span> },
            { header: 'RESPONSÁVEL', accessor: 'responsavelAtual', render: (val) => <span className="font-bold text-[12px] text-gray-600">{val}</span> },
            { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={statusVariants[val] || 'gray'}>{val}</Badge> },
            { header: 'SLA', accessor: 'slaStatus', render: (val) => (
              <div className="flex flex-col items-center gap-1">
                <SLABar progress={val === 'critical' ? 95 : val === 'warning' ? 70 : 40} />
              </div>
            )},
            { header: 'AÇÕES', accessor: 'id', render: (_, row) => (
              <Button variant="ghost" size="icon" onClick={() => updateConfig({ currentRequestId: row.id })}>
                <Eye className="w-5 h-5 text-gray-300 hover:text-orange-500" />
              </Button>
            )}
          ]}
          data={requests}
        />
      </Card>
    </div>
  );
}
