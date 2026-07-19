import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, Building, MapPin, Hash, User, UserCheck } from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { SLABar, EmptyState } from './ui/Misc';
import { RHRequest } from '../types';

const statusVariants: Record<string, 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'gray'> = {
  'Rascunho': 'gray',
  'Enviada': 'blue',
  'Em Análise': 'amber',
  'Devolvida': 'purple',
  'Aprovada': 'green',
  'Reprovada': 'red',
  'Concluída': 'green',
  'Cancelada': 'red',
};

export default function GlobalQuery() {
  const { config, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState(config.highlightedRequestNumber || '');
  
  // Filters
  const [filters, setFilters] = useState({
    processo: 'all',
    status: 'all',
    origem: 'all',
    empresa: 'all',
    filial: 'all',
    setor: 'all',
    centroCusto: 'all',
    periodo: 'all'
  });

  const filteredRequests = config.solicitacoes.filter(req => {
    const matchesSearch = 
      req.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.alvo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filters.processo !== 'all' && req.tipoProcesso !== filters.processo) return false;
    if (filters.status !== 'all' && req.status !== filters.status) return false;
    if (filters.origem !== 'all' && req.origem !== filters.origem) return false;
    if (filters.empresa !== 'all' && req.empresa !== filters.empresa) return false;
    if (filters.filial !== 'all' && req.filial !== filters.filial) return false;
    if (filters.centroCusto !== 'all' && req.centroCusto !== filters.centroCusto) return false;
    // Note: Setor filtering would require joining with employee or adding to request data. 
    // For now, we'll filter by what's available in RHRequest.

    return true;
  });

  const openDetail = (request: RHRequest) => {
    updateConfig({ activeView: 'request-detail', currentRequestId: request.id });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Consulta Global" 
        subtitle="Rastreabilidade total de todos os processos do RH360"
        actions={
          <Button variant="outline" leftIcon={<Download size={18} />}>Exportar Relatório</Button>
        }
      />

      <Card className="p-6 bg-gray-50/30 border-dashed">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Busca Geral</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Nº, Alvo ou Solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none transition-all focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Processo</label>
            <select 
              className="w-full bg-white border border-[var(--color-brand-border)] rounded-[8px] px-3 py-2 text-[13px] outline-none"
              value={filters.processo}
              onChange={(e) => setFilters(prev => ({ ...prev, processo: e.target.value }))}
            >
              <option value="all">Todos os Processos</option>
              {config.processos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Empresa / Filial</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-white border border-[var(--color-brand-border)] rounded-[8px] px-3 py-2 text-[13px] outline-none"
                value={filters.empresa}
                onChange={(e) => setFilters(prev => ({ ...prev, empresa: e.target.value }))}
              >
                <option value="all">Empresa</option>
                {config.empresas.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select 
                className="flex-1 bg-white border border-[var(--color-brand-border)] rounded-[8px] px-3 py-2 text-[13px] outline-none"
                value={filters.filial}
                onChange={(e) => setFilters(prev => ({ ...prev, filial: e.target.value }))}
              >
                <option value="all">Filial</option>
                {config.filiais.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Status / Origem</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-white border border-[var(--color-brand-border)] rounded-[8px] px-3 py-2 text-[13px] outline-none"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">Status</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Devolvida">Devolvida</option>
                <option value="Concluída">Concluída</option>
                <option value="Reprovada">Reprovada</option>
              </select>
              <select 
                className="flex-1 bg-white border border-[var(--color-brand-border)] rounded-[8px] px-3 py-2 text-[13px] outline-none"
                value={filters.origem}
                onChange={(e) => setFilters(prev => ({ ...prev, origem: e.target.value }))}
              >
                <option value="all">Origem</option>
                <option value="manual">Manual</option>
                <option value="esteira-automatico">Automático</option>
                <option value="esteira-sugestao">Sugestão</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filteredRequests.length > 0 ? (
          <Table 
            rowClassName={(row) => row.numero === config.highlightedRequestNumber ? 'bg-amber-50/75 border-l-4 border-l-amber-500 font-bold' : ''}
            columns={[
              { header: 'NÚMERO', accessor: 'numero', render: (val) => <span className="font-mono text-[12px] font-bold text-gray-500">{val}</span> },
              { header: 'PROCESSO', accessor: 'tipoProcesso', render: (val) => {
                const process = config.processos.find(p => p.id === val);
                return <span className="text-[13px] font-bold text-gray-700">{process?.name}</span>
              }},
              { header: 'SOLICITANTE', accessor: 'solicitante', render: (val) => (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  <span className="text-[13px] font-medium text-gray-900">{val}</span>
                </div>
              )},
              { header: 'ALVO', accessor: 'alvo', render: (val) => (
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-gray-400" />
                  <span className="text-[13px] font-medium text-gray-900">{val}</span>
                </div>
              )},
              { header: 'ORIGEM', accessor: 'origem', render: (val) => <Badge variant="gray" className="text-[10px]">{val}</Badge> },
              { header: 'ETAPA / RESPONSÁVEL', accessor: 'etapaAtual', render: (val, row) => (
                <div>
                  <p className="font-bold text-[12px] text-gray-700">{val}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">{row.responsavelAtual || 'SISTEMA'}</p>
                </div>
              )},
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={statusVariants[val] || 'gray'}>{val}</Badge> },
              { header: 'SLA', accessor: 'slaStatus', render: (val) => (
                <div className="flex flex-col items-center gap-1">
                  <SLABar progress={val === 'critical' ? 95 : val === 'warning' ? 70 : 40} />
                </div>
              )},
              { header: 'DATA', accessor: 'createdAt', render: (val) => (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar size={12} />
                  <span className="text-[11px] font-bold">{new Date(val).toLocaleDateString('pt-BR')}</span>
                </div>
              )},
              { header: '', accessor: 'id', render: (_, row) => (
                <Button variant="ghost" size="icon" onClick={() => openDetail(row)}>
                  <Eye size={18} className="text-gray-400" />
                </Button>
              )}
            ]}
            data={filteredRequests}
          />
        ) : (
          <EmptyState 
            icon={<Search size={48} />}
            title="Nenhum processo encontrado"
            description="Tente ajustar os filtros ou o termo de busca para encontrar o que procura."
          />
        )}
      </Card>
    </div>
  );
}
