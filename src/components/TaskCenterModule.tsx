import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, Search, Filter, 
  ArrowRight, User, Users, Sparkles, ClipboardList
} from 'lucide-react';
import { Card, Table } from './ui/CardAndTable';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SLABar, Tabs } from './ui/Misc';
import { PageHeader } from './ui/FormAndHeader';

import { useAppConfig } from '../contexts/AppConfigContext';
import { Task } from '../types';

export default function TaskCenterModule() {
  const { config, updateConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState('all');

  const tasks = config.tarefas.map(t => {
    const relatedReq = config.solicitacoes.find(r => r.id === t.relatedRequestId);
    
    let type = 'Pendência';
    if (t.title.toLowerCase().includes('aprovar') && t.assignedTo === config.usuarioAtual.id) {
      type = 'Aprovação';
    } else if (t.assignedTo === 'Grupo') {
      type = 'Fila de Grupo';
    } else if (relatedReq?.status === 'Devolvido') {
      type = 'Correção';
    } else if (t.title.toLowerCase().includes('ia')) {
      type = 'Sugestão IA';
    } else if (t.title.toLowerCase().includes('integração')) {
      type = 'Pendência de Integração';
    } else if (t.title.toLowerCase().includes('documento')) {
      type = 'Pendência de Documento';
    } else if (t.title.toLowerCase().includes('assinatura')) {
      type = 'Pendência de Assinatura';
    }

    return {
      id: t.id,
      type,
      origin: 'RH360',
      subject: t.title,
      requester: relatedReq?.solicitante || 'Sistema',
      date: new Date(t.createdAt).toLocaleDateString('pt-BR'),
      sla: t.status === 'Atrasada' ? 100 : Math.floor(Math.random() * 40) + 40,
      slaStatus: t.status === 'Atrasada' ? 'critical' : 'normal',
      group: t.assignedTo === config.usuarioAtual.id ? 'Meus Pendentes' : 'Grupo'
    };
  });

  const stats = {
    approvals: tasks.filter(t => t.type === 'Aprovação').length,
    queue: tasks.filter(t => t.type === 'Fila de Grupo').length,
    ai: 0, // Mock for now as requested
    critical: tasks.filter(t => t.slaStatus === 'critical').length
  };

  const filteredTasks = activeTab === 'all' ? tasks : tasks.filter(t => {
    if (activeTab === 'approvals') return t.type === 'Aprovação';
    if (activeTab === 'queues') return t.type === 'Fila de Grupo';
    if (activeTab === 'stepper') return t.type === 'Esteira';
    return true;
  });

  const columns = [
    { 
      header: 'Tipo', 
      accessor: 'type',
      render: (val: string) => (
        <Badge 
          variant={val === 'Aprovação' ? 'purple' : val === 'Fila de Grupo' ? 'blue' : 'amber'}
          size="sm"
        >
          {val}
        </Badge>
      )
    },
    { 
      header: 'Origem', 
      accessor: 'origin',
      render: (val: string) => (
        <div className="font-bold text-gray-900">{val}</div>
      )
    },
    { header: 'Assunto', accessor: 'subject' },
    { 
      header: 'Solicitante', 
      accessor: 'requester',
      render: (val: string) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span>{val}</span>
        </div>
      )
    },
    { 
      header: 'SLA', 
      accessor: 'sla',
      render: (val: number, row: any) => (
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>{val}%</span>
            <span className={row.slaStatus === 'critical' ? 'text-red-500' : row.slaStatus === 'warning' ? 'text-amber-500' : 'text-green-500'}>
              {row.slaStatus}
            </span>
          </div>
          <SLABar progress={val} status={row.slaStatus as any} />
        </div>
      )
    },
    {
      header: 'Ação',
      accessor: 'id',
      render: (_: string, row: any) => {
        const task = config.tarefas.find(t => t.id === row.id);
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            rightIcon={<ArrowRight size={14} />}
            onClick={() => {
              if (task?.relatedRequestId) {
                updateConfig({ activeView: 'request-detail', currentRequestId: task.relatedRequestId });
              }
            }}
          >
            Tratar
          </Button>
        );
      }
    }
  ];

  const tabs = [
    { id: 'all', label: 'Todas as Tarefas', icon: <ClipboardList size={16} /> },
    { id: 'approvals', label: 'Aprovações', icon: <CheckCircle2 size={16} /> },
    { id: 'queues', label: 'Filas de Grupo', icon: <Users size={16} /> },
    { id: 'stepper', label: 'Sugestões IA', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <PageHeader 
        title="Central de Tarefas" 
        subtitle="Consolidado de ações pendentes que exigem sua atenção ou de seu grupo."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md" className="bg-purple-50 border-purple-100">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-purple-600 uppercase tracking-widest">Aprovações</p>
            <p className="text-2xl font-bold text-purple-900">{stats.approvals}</p>
          </div>
        </Card>
        <Card padding="md" className="bg-blue-50 border-blue-100">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Em Fila</p>
            <p className="text-2xl font-bold text-blue-900">{stats.queue}</p>
          </div>
        </Card>
        <Card padding="md" className="bg-amber-50 border-amber-100">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Sugestões IA</p>
            <p className="text-2xl font-bold text-amber-900">{stats.ai}</p>
          </div>
        </Card>
        <Card padding="md" className="bg-red-50 border-red-100">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">Críticos (SLA)</p>
            <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
          </div>
        </Card>
      </div>

      <Card padding="none">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar tarefas..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-[8px] text-[13px] focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <Button variant="ghost" size="sm" leftIcon={<Filter size={16} />}>Mais Filtros</Button>
          </div>
          <Table columns={columns} data={filteredTasks} />
        </div>
      </Card>
    </div>
  );
}
