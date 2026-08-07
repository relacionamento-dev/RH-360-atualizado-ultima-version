import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calendar, Building, MapPin, Hash, User, UserCheck } from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { SLABar, EmptyState } from './ui/Misc';
import { Select } from './ui/Select';
import { getStatusVariant } from '../utils/requestStatus';
import { RHRequest } from '../types';

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
            <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Busca Geral</label>
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
            <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Processo</label>
            <Select
              ariaLabel="Filtrar por processo"
              className="w-full"
              value={filters.processo}
              onChange={(v) => setFilters(prev => ({ ...prev, processo: v }))}
              options={[
                { value: 'all', label: 'Todos os Processos' },
                ...config.processos.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Empresa / Filial</label>
            <div className="flex gap-2">
              <Select
                ariaLabel="Filtrar por empresa"
                className="flex-1"
                value={filters.empresa}
                onChange={(v) => setFilters(prev => ({ ...prev, empresa: v }))}
                options={[
                  { value: 'all', label: 'Empresa' },
                  ...config.empresas.map(c => ({ value: c.name, label: c.name })),
                ]}
              />
              <Select
                ariaLabel="Filtrar por filial"
                className="flex-1"
                value={filters.filial}
                onChange={(v) => setFilters(prev => ({ ...prev, filial: v }))}
                options={[
                  { value: 'all', label: 'Filial' },
                  ...config.filiais.map(f => ({ value: f, label: f })),
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Status / Origem</label>
            <div className="flex gap-2">
              <Select
                ariaLabel="Filtrar por status"
                className="flex-1"
                value={filters.status}
                onChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                options={[
                  { value: 'all', label: 'Status' },
                  { value: 'Pendente de Aprovação', label: 'Pendente de Aprovação' },
                  { value: 'Em Análise', label: 'Em Análise' },
                  { value: 'Em Aprovação', label: 'Em Aprovação' },
                  { value: 'Devolvida', label: 'Devolvida' },
                  { value: 'Aguardando Encerramento', label: 'Aguardando Encerramento' },
                  { value: 'Concluída', label: 'Concluída' },
                  { value: 'Reprovada', label: 'Reprovada' },
                  { value: 'Cancelada', label: 'Cancelada' },
                ]}
              />
              <Select
                ariaLabel="Filtrar por origem"
                className="flex-1"
                value={filters.origem}
                onChange={(v) => setFilters(prev => ({ ...prev, origem: v }))}
                options={[
                  { value: 'all', label: 'Origem' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'esteira-automatico', label: 'Automático' },
                  { value: 'esteira-sugestao', label: 'Sugestão' },
                ]}
              />
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
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> },
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
              { header: 'AÇÕES', accessor: 'id', render: (_, row) => (
                <Button variant="ghost" size="icon" title="Ver detalhes" aria-label="Ver detalhes" onClick={() => openDetail(row)}>
                  <Eye size={18} className="text-gray-500" />
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
