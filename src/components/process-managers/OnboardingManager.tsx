import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, CheckCircle2, Clock, AlertCircle, ChevronRight, 
  ArrowLeft, Check, ClipboardList, Laptop, Users, Building, ShieldCheck, User
} from 'lucide-react';
import { RHProcess, RHRequest, OnboardingTask, OnboardingData } from '../../types';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { Card, Table } from '../ui/CardAndTable';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SLABar, Avatar } from '../ui/Misc';
import { Select } from '../ui/Select';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingManagerProps {
  process: RHProcess;
  onNewRequest: () => void;
}

export default function OnboardingManager({ process, onNewRequest }: OnboardingManagerProps) {
  const { config, updateConfig, updateOnboardingTask } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOnboardingId, setSelectedOnboardingId] = useState<string | null>(null);

  const onboardingRequests = config.solicitacoes.filter(r => r.processId === process.id);

  // Mesma derivação de status usada no badge da linha, para o filtro casar com a lista.
  const rowStatus = (r: RHRequest) =>
    r.slaStatus === 'critical' ? 'Atrasado' : r.status === 'Concluída' ? 'Concluído' : 'Em Andamento';

  const filteredRequests = onboardingRequests.filter(r =>
    (r.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.alvo || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || rowStatus(r) === statusFilter)
  );

  const selectedRequest = onboardingRequests.find(r => r.id === selectedOnboardingId);

  const stats = {
    andamento: onboardingRequests.filter(r => r.status === 'Em Análise' || r.status === 'Aberto').length,
    atrasados: onboardingRequests.filter(r => r.slaStatus === 'critical').length,
    concluidos: onboardingRequests.filter(r => r.status === 'Concluída').length,
    aguardando: onboardingRequests.filter(r => r.data?.progress === 0).length,
    progressoMedio: Math.round(onboardingRequests.reduce((acc, curr) => acc + (curr.data?.progress || 0), 0) / (onboardingRequests.length || 1))
  };

  if (selectedRequest) {
    return (
      <OnboardingDetail 
        request={selectedRequest} 
        onBack={() => setSelectedOnboardingId(null)} 
        updateTask={(section, taskId, updates) => updateOnboardingTask(selectedRequest.id, section, taskId, updates)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-gray-900 tracking-tight">Onboarding de Colaboradores</h2>
           <p className="text-gray-500 font-medium text-[14px]">Gestão de integração e boas-vindas aos novos talentos</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={onNewRequest}>
          Novo Onboarding
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Andamento</p>
          <p className="text-2xl font-black text-blue-600">{stats.andamento}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Atrasados</p>
          <p className="text-2xl font-black text-red-600">{stats.atrasados}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Concluídos</p>
          <p className="text-2xl font-black text-green-600">{stats.concluidos}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando Ação</p>
          <p className="text-2xl font-black text-amber-600">{stats.aguardando}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-[var(--color-brand-primary)]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso Médio</p>
          <p className="text-2xl font-black text-[var(--color-brand-primary)]">{stats.progressoMedio}%</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/30">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador ou gestor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex gap-2">
            <Select
              ariaLabel="Filtrar por status"
              className="min-w-[150px]"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Status: Todos' },
                { value: 'Em Andamento', label: 'Em Andamento' },
                { value: 'Atrasado', label: 'Atrasado' },
                { value: 'Concluído', label: 'Concluído' },
              ]}
            />
          </div>
        </div>

        <Table 
          columns={[
            { header: 'COLABORADOR', accessor: 'alvo', render: (val, row) => (
              <div className="flex items-center gap-3">
                <Avatar name={val} size="sm" />
                <div>
                  <p className="font-bold text-[14px] text-gray-900">{val}</p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase">{row.data?.cargo}</p>
                </div>
              </div>
            )},
            { header: 'GESTOR', accessor: 'data', render: (data) => (
              <span className="text-[13px] font-bold text-gray-600">{data?.gestor}</span>
            )},
            { header: 'ADMISSÃO', accessor: 'data', render: (data) => (
              <span className="text-[12px] font-bold text-gray-500">
                {data?.dataAdmissao ? new Date(data.dataAdmissao).toLocaleDateString('pt-BR') : 'A definir'}
              </span>
            )},
            { header: 'PROGRESSO', accessor: 'data', render: (data) => (
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${data?.progress || 0}%` }} />
                </div>
                <span className="text-[12px] font-black text-gray-700">{Math.round(data?.progress || 0)}%</span>
              </div>
            )},
            { header: 'TAREFAS', accessor: 'data', render: (data) => {
              const all = [...(data.rh || []), ...(data.ti || []), ...(data.facilities || []), ...(data.gestor || []), ...(data.colaborador || [])];
              const done = all.filter(t => t.done).length;
              return <span className="text-[12px] font-bold text-gray-500">{done}/{all.length}</span>;
            }},
            { header: 'STATUS', accessor: 'status', render: (val, row) => {
              const isLate = row.slaStatus === 'critical';
              if (isLate) return <Badge variant="red">ATRASADO</Badge>;
              if (val === 'Concluída') return <Badge variant="green">CONCLUÍDO</Badge>;
              return <Badge variant="blue">EM ANDAMENTO</Badge>;
            }},
            { header: '', accessor: 'id', render: (id) => (
              <Button variant="ghost" size="icon" title="Ver onboarding" aria-label="Ver onboarding" onClick={() => setSelectedOnboardingId(id)}>
                <Eye className="w-5 h-5 text-gray-500 hover:text-orange-500" />
              </Button>
            )}
          ]}
          data={filteredRequests}
        />
      </Card>
    </div>
  );
}

function OnboardingDetail({ request, onBack, updateTask }: { request: RHRequest, onBack: () => void, updateTask: (section: keyof OnboardingData, taskId: string, updates: Partial<OnboardingTask>) => void }) {
  const [activeTab, setActiveTab] = useState<keyof OnboardingData>('rh');

  const tabs: { id: keyof OnboardingData, label: string, icon: any }[] = [
    { id: 'rh', label: 'RH', icon: <Users size={16} /> },
    { id: 'ti', label: 'TI', icon: <Laptop size={16} /> },
    { id: 'facilities', label: 'Facilities', icon: <Building size={16} /> },
    { id: 'gestor', label: 'Gestor', icon: <User size={16} /> },
    { id: 'colaborador', label: 'Colaborador', icon: <ShieldCheck size={16} /> }
  ];

  const tasks = request.data?.[activeTab] || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Detalhes do Onboarding</h2>
          <p className="text-gray-500 font-medium text-[13px]">{request.alvo} • {request.data?.cargo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 space-y-6 h-fit sticky top-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
            <Avatar name={request.alvo} size="xl" className="mb-4" />
            <h3 className="text-lg font-black text-gray-900">{request.alvo}</h3>
            <p className="text-[13px] font-bold text-blue-600 uppercase tracking-widest">{request.data?.cargo}</p>
            <div className="mt-6 w-full">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-[11px] font-black text-gray-400 uppercase">Progresso Geral</span>
                 <span className="text-sm font-black text-gray-900">{Math.round(request.data?.progress || 0)}%</span>
               </div>
               <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-100">
                 <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${request.data?.progress || 0}%` }} />
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-400 font-bold uppercase">Empresa</span>
              <span className="text-gray-700 font-bold">{request.empresa}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-400 font-bold uppercase">Filial</span>
              <span className="text-gray-700 font-bold">{request.filial}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-400 font-bold uppercase">Gestor</span>
              <span className="text-gray-700 font-bold">{request.data?.gestor}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-400 font-bold uppercase">Admissão</span>
              <span className="text-gray-700 font-bold">{new Date(request.data?.dataAdmissao).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-400 font-bold uppercase">SLA Integração</span>
              <span className="text-gray-700 font-bold">15 dias</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 p-1 bg-gray-100/50 rounded-[16px] border border-gray-200 overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-[12px] font-black transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {tasks.map((task: OnboardingTask) => (
              <Card key={task.id} className={`p-4 transition-all ${task.done ? 'bg-gray-50/50' : 'bg-white border-l-4 border-l-blue-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => updateTask(activeTab, task.id, { done: !task.done })}
                      className={`mt-0.5 w-6 h-6 rounded-[8px] flex items-center justify-center border-2 transition-all ${
                        task.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      {task.done && <Check size={14} strokeWidth={4} />}
                    </button>
                    <div>
                      <p className={`font-bold text-[14px] ${task.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.task}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{task.owner}</span>
                        {task.date && <span className="text-[11px] font-bold text-gray-400">Concluído em: {new Date(task.date).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <CheckCircle2 className="w-4 h-4 text-gray-300" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Histórico do Onboarding</h3>
            <div className="space-y-4">
              {(request.historico || []).slice().reverse().map((h, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== (request.historico?.length || 0) - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100" />}
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 z-10">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-700">{h.comentario || h.action}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{h.userName || h.autor} • {new Date(h.timestamp || h.dataHora!).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
