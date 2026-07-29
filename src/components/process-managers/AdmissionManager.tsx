import React, { useState } from 'react';
import {
  Search, Filter, Plus, Eye, FileCheck, UserPlus, Clock, ChevronRight,
  ClipboardCheck, ShieldAlert, CheckCircle2, UserCheck
} from 'lucide-react';
import { RHProcess, RHRequest } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SLABar } from '../ui/Misc';
import AdmissaoDigitalDisparo from '../admissao-digital/AdmissaoDigitalDisparo';
import AdmissaoDigitalRevisao from '../admissao-digital/AdmissaoDigitalRevisao';

/**
 * `onNewRequest` (formulário genérico do processo) não é usado aqui: a Admissão
 * Digital tem uma entrada única — "+ Nova Admissão" abre o disparo do link.
 */
export default function AdmissionManager({ process }: { process: RHProcess, onNewRequest: () => void }) {
  const { config, updateConfig } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDisparoOpen, setIsDisparoOpen] = useState(false);

  const admissions = config.solicitacoes.filter(r => r.processId === process.id);
  
  const filtered = admissions.filter(r => 
    r.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.alvo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    andamento: admissions.filter(r => r.status === 'Em Análise' || r.status === 'Em Aprovação').length,
    docPendentes: 8, // Mock based on request count for demo
    asoPendente: 3,
    assinaturaPendente: 5,
    concluidas: admissions.filter(r => r.status === 'Concluída').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Admissão Digital</h2>
           <p className="text-gray-500 font-medium text-[14px]">Do link enviado ao candidato até a aprovação dos documentos pelo RH</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsDisparoOpen(true)}>
            Nova Admissão
          </Button>
        </div>
      </div>

      <Card>
        <AdmissaoDigitalRevisao />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Andamento</p>
          <p className="text-2xl font-black text-blue-600">{stats.andamento}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Docs Pendentes</p>
          <p className="text-2xl font-black text-amber-600">{stats.docPendentes}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-orange-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ASO Pendente</p>
          <p className="text-2xl font-black text-orange-600">{stats.asoPendente}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-purple-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assinaturas</p>
          <p className="text-2xl font-black text-purple-600">{stats.assinaturaPendente}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concluídas</p>
          <p className="text-2xl font-black text-green-600">{stats.concluidas}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar candidato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
        </div>

        <Table 
          columns={[
            { header: 'CANDIDATO', accessor: 'alvo', render: (val) => <span className="font-bold text-[14px] text-gray-900">{val}</span> },
            { header: 'DATA PREVISTA', accessor: 'createdAt', render: (val) => (
              <span className="text-[13px] font-bold text-gray-600">{new Date(new Date(val).getTime() + 15*24*3600000).toLocaleDateString('pt-BR')}</span>
            )},
            { header: 'RESPONSÁVEL', accessor: 'responsavelAtual', render: (val) => <span className="text-[12px] font-bold text-blue-600 uppercase">{val}</span> },
            { header: 'ETAPA', accessor: 'etapaAtual', render: (val) => <Badge variant="gray">{val}</Badge> },
            { header: 'STATUS DOCS', accessor: 'id', render: (_, row) => {
              const stages = [
                { icon: <ClipboardCheck size={14} />, color: row.status === 'Concluída' ? 'text-green-500' : 'text-blue-500', label: 'Docs' },
                { icon: <ShieldAlert size={14} />, color: row.status === 'Concluída' ? 'text-green-500' : 'text-amber-500', label: 'ASO' },
                { icon: <UserCheck size={14} />, color: row.status === 'Concluída' ? 'text-green-500' : 'text-gray-300', label: 'Contrato' }
              ];
              return (
                <div className="flex gap-2">
                  {stages.map((s, i) => (
                    <div key={i} title={s.label} className={`p-1.5 rounded-md bg-gray-50 ${s.color}`}>
                      {s.icon}
                    </div>
                  ))}
                </div>
              );
            }},
            { header: 'AÇÕES', accessor: 'id', render: (id) => (
              <Button variant="ghost" size="icon" title="Ver admissão" aria-label="Ver admissão" onClick={() => updateConfig({ currentRequestId: id })}>
                <Eye className="w-5 h-5 text-gray-500 hover:text-orange-500" />
              </Button>
            )}
          ]}
          data={filtered}
        />
      </Card>

      <AdmissaoDigitalDisparo isOpen={isDisparoOpen} onClose={() => setIsDisparoOpen(false)} />
    </div>
  );
}
