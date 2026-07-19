import React, { useState } from 'react';
import { 
  ClipboardList, FileText, CheckCircle2, Search, Filter, 
  Plus, Eye, Clock, AlertCircle, ArrowRight, User, Users,
  Briefcase, TrendingUp, UserMinus, Move, Scale, UserPlus,
  Palmtree, FileCheck, DollarSign, Shield, GraduationCap,
  CreditCard, Laptop, Watch, ChevronRight, X, Download,
  Paperclip, MessageSquare, History, Check, CornerUpLeft,
  MoreHorizontal, Flag, Activity, Target
} from 'lucide-react';
import { RHProcess, RHRequest, RequestStatus, SlaStatus, ProcessPermission, HistoryEntry, Job, Task } from '../types';
import { INITIAL_RH_PROCESSES, INITIAL_RH_REQUESTS } from '../data';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, SLABar, EmptyState } from './ui/Misc';
import RHRequestForm from './RHRequestForm';
import { Modal } from './ui/Misc';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { FormRenderer } from './FormRenderer';
import OnboardingManager from './process-managers/OnboardingManager';
import AdmissionManager from './process-managers/AdmissionManager';
import RecruitmentKanban from './process-managers/RecruitmentKanban';
import BenefitReceiptManager from './process-managers/BenefitReceiptManager';
import HierarchyManager from './process-managers/HierarchyManager';
import GenericProcessManager from './process-managers/GenericProcessManager';

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

const iconMap: Record<string, any> = {
  'UserPlus': <UserPlus />,
  'Search': <Search />,
  'CheckCircle2': <CheckCircle2 />,
  'Flag': <Flag />,
  'Palmtree': <Palmtree />,
  'TrendingUp': <TrendingUp />,
  'Move': <Move />,
  'Activity': <Activity />,
  'UserMinus': <UserMinus />,
  'GraduationCap': <GraduationCap />,
  'Target': <Target />,
  'DollarSign': <DollarSign />,
  'CreditCard': <CreditCard />,
  'Users': <Users />,
  'Clock': <Clock />,
};

export default function RHRequests({ 
  initialTab = 'hub',
  initialProcessId
}: { 
  initialTab?: 'hub' | 'mine' | 'approvals',
  initialProcessId?: string
}) {
  const { config, updateConfig, createRequest, isAuthorized } = useAppConfig();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'hub' | 'mine' | 'approvals' | 'consultation'>(initialTab);

  const [selectedProcess, setSelectedProcess] = useState<RHProcess | null>(
    initialProcessId ? config.processos.find(p => p.id === initialProcessId) || null : null
  );
  const isNewRequestOpen = config.isNewRequestModalOpen || false;
  const setIsNewRequestOpen = (open: boolean) => updateConfig({ isNewRequestModalOpen: open });
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  React.useEffect(() => {
    if (initialProcessId) {
      const process = config.processos.find(p => p.id === initialProcessId);
      if (process) {
        setSelectedProcess(process);
      }
    }
  }, [initialProcessId]);

  const openDetail = (request: RHRequest) => {
    updateConfig({ activeView: 'request-detail', currentRequestId: request.id });
  };

  const openProcess = (process: RHProcess) => {
    setSelectedProcess(process);
  };

  const handleNewRequest = (pId: string) => {
    updateConfig({ activeView: 'request-form', currentRequestId: pId });
  };

  if (selectedProcess) {
    const renderManager = () => {
      const props = { 
        process: selectedProcess, 
        onNewRequest: () => handleNewRequest(selectedProcess.id) 
      };

      switch (selectedProcess.viewType) {
        case 'onboarding': return <OnboardingManager {...props} />;
        case 'admission': return <AdmissionManager {...props} />;
        case 'recruitment': return <RecruitmentKanban {...props} />;
        case 'vr-va': return <BenefitReceiptManager {...props} />;
        case 'hierarchy': return <HierarchyManager {...props} />;
        default: return <GenericProcessManager {...props} />;
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" leftIcon={<CornerUpLeft className="w-4 h-4" />} onClick={() => setSelectedProcess(null)}>
            Voltar para Hub
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <Badge variant="gray">{selectedProcess.category}</Badge>
        </div>

        {renderManager()}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Hub de Processos RH" 
        subtitle="Gerencie solicitações, admissões e movimentações de pessoal"
        actions={
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsNewRequestOpen(true)}>Nova Solicitação</Button>
        }
      />

      <div className="flex gap-2 p-1 bg-gray-100/50 rounded-[12px] w-fit border border-[var(--color-brand-border)]">
        {[
          { id: 'hub', label: 'Hub de Processos', icon: <ClipboardList size={16} /> },
          { id: 'mine', label: 'Minhas Solicitações', icon: <FileText size={16} /> },
          { id: 'approvals', label: 'Minhas Aprovações', icon: <CheckCircle2 size={16} /> },
          { id: 'consultation', label: 'Consulta Global', icon: <Search size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-[var(--color-brand-primary)] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'hub' && <ProcessHub onOpen={openProcess} />}
        {activeTab === 'mine' && <ConsultationPanel type="mine" onOpenDetail={openDetail} />}
        {activeTab === 'approvals' && <ConsultationPanel type="approvals" onOpenDetail={openDetail} />}
        {activeTab === 'consultation' && <ConsultationPanel type="global" onOpenDetail={openDetail} initialProcessId={selectedProcess?.id} />}
      </div>

      {/* New Request Modal */}
      <Modal isOpen={isNewRequestOpen} onClose={() => setIsNewRequestOpen(false)} title="Nova Solicitação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          {config.processos.filter(p => p.ativo && isAuthorized(p.id, 'solicitar')).map(process => (
            <button
              key={process.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-[12px] border border-[var(--color-brand-border)] hover:bg-white hover:border-[var(--color-brand-primary)] hover:shadow-md transition-all text-left group"
              onClick={() => {
                setIsNewRequestOpen(false);
                handleNewRequest(process.id);
              }}
            >
              <div className="p-3 bg-white rounded-[8px] shadow-sm text-gray-400 group-hover:text-[var(--color-brand-primary)] transition-colors">
                {React.cloneElement(iconMap[process.icon] || <ClipboardList />, { className: 'w-6 h-6' })}
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-tight">{process.name}</p>
                <p className="text-[12px] text-gray-500 mt-1">{process.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function ProcessHub({ onOpen }: { onOpen: (p: RHProcess) => void }) {
  const { config, isAuthorized } = useAppConfig();

  const filteredProcesses = config.processos.filter(p => p.ativo && isAuthorized(p.id, 'ver'));

  if (filteredProcesses.length === 0) {
    return (
      <EmptyState 
        icon={<ClipboardList size={48} />}
        title="Nenhum processo disponível"
        description="Você não tem permissão para visualizar nenhum processo ou não há processos ativos no momento."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProcesses.map(process => {
        const pendingCount = config.solicitacoes.filter(s => s.processId === process.id && (s.status === 'Em Aprovação' || s.status === 'Enviada' || s.status === 'Pendente de Aprovação' || s.status === 'Em Análise')).length;
        return (
          <Card key={process.id} className="p-6 group hover:border-[var(--color-brand-primary)] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-gray-50 rounded-[8px] group-hover:bg-orange-50 group-hover:text-[var(--color-brand-primary)] transition-colors text-gray-400">
                {React.cloneElement(iconMap[process.icon] || <ClipboardList />, { className: 'w-6 h-6' })}
              </div>
              {pendingCount > 0 ? (
                <Badge variant="amber">{pendingCount} PENDÊNCIAS</Badge>
              ) : (
                <Badge variant="gray">{process.viewType === 'request' ? 'SOLICITAÇÃO' : 'GERENCIAL'}</Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-[var(--color-brand-text-primary)] mb-2">{process.name}</h3>
            <p className="text-[13px] text-[var(--color-brand-text-secondary)] mb-6 h-10 line-clamp-2">{process.description}</p>
            <Button 
              variant="outline"
              className="w-full"
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => onOpen(process)}
            >
              Acessar
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

function ConsultationPanel({ type, onOpenDetail, initialProcessId }: { type: 'mine' | 'approvals' | 'global', onOpenDetail: (req: RHRequest) => void, initialProcessId?: string }) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState(initialProcessId || 'all');
  
  const requests = config.solicitacoes.filter(req => {
    // Search filter
    const matchesSearch = 
      req.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.alvo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Process filter
    if (selectedProcessId !== 'all' && req.processId !== selectedProcessId) return false;

    // Type filter
    if (type === 'mine') {
      return req.requesterId === config.usuarioAtual.id || req.solicitante === config.usuarioAtual.name;
    }
    if (type === 'approvals') {
      // Find pending tasks linked to this request
      const pendingTasksForRequest = config.tarefas.filter(t => t.relatedRequestId === req.id && t.status === 'Pendente');
      
      // If no tasks found, fallback to old logic for compatibility with any un-tasked legacy items
      if (pendingTasksForRequest.length === 0) {
        const isUserAdminDemo = config.usuarioAtual.name === 'Administrador Demo' || config.usuarioAtual.id === 'ADMIN-001';
        if (isUserAdminDemo) return req.status === 'Em Análise' || req.status === 'Devolvida';
        
        const isResponsible = 
          (req.responsavelAtual === 'Ricardo Silva' && config.usuarioAtual.profile === 'Diretoria') ||
          (req.responsavelAtual === 'Ana Paula Lima' && config.usuarioAtual.profile === 'RH/DP') ||
          (req.responsavelAtual === 'Gestor Direto' && config.usuarioAtual.profile === 'Gestor') ||
          (req.responsavelAtual === config.usuarioAtual.name);
        
        return (req.status === 'Em Análise' || req.status === 'Devolvida') && isResponsible;
      }

      // Check if user is Administrador Demo (who sees all)
      const isUserAdminDemo = config.usuarioAtual.name === 'Administrador Demo' || config.usuarioAtual.id === 'ADMIN-001';
      if (isUserAdminDemo) return true;

      // Check if any of the pending tasks match the current user
      const userGroups = config.usuarioAtual.groups || [];
      const matchesUser = pendingTasksForRequest.some(task => {
        // Current user is responsibleUserId or assignedTo
        const isUserResponsible = task.responsibleUserId === config.usuarioAtual.id || task.assignedTo === config.usuarioAtual.id;
        
        // Current user belongs to responsibleGroupId
        const isGroupResponsible = task.responsibleGroupId ? userGroups.includes(task.responsibleGroupId) : false;

        // Fallbacks for profile/role-based initial data
        const roleBasedCheck = 
          (task.assignedTo === 'RH-001' && config.usuarioAtual.profile === 'RH/DP') ||
          (task.assignedTo === 'DIR-001' && config.usuarioAtual.profile === 'Diretoria') ||
          (task.assignedTo === config.usuarioAtual.id);

        return isUserResponsible || isGroupResponsible || roleBasedCheck;
      });

      return matchesUser;
    }
    return true; // global
  });

  const stats = {
    total: requests.length,
    slaEstourado: requests.filter(r => r.slaStatus === 'critical').length,
    emAnalise: requests.filter(r => r.status === 'Em Análise').length,
  };

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Processos</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-red-500">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SLA Estourado</p>
          <p className="text-2xl font-black text-red-600">{stats.slaEstourado}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Em Análise</p>
          <p className="text-2xl font-black text-amber-600">{stats.emAnalise}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-[var(--color-brand-border)] flex flex-wrap gap-4 items-center justify-between bg-gray-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por Nº ou Alvo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white hairline-border rounded-[8px] text-[13px] outline-none transition-all focus:border-[var(--color-brand-primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-white hairline-border rounded-[8px] px-3 py-2 text-[12px] font-bold outline-none"
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
            >
              <option value="all">Todos Processos</option>
              {config.processos.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="bg-white hairline-border rounded-[8px] px-3 py-2 text-[12px] font-bold outline-none">
              <option>Todos Status</option>
            </select>
            <Button variant="ghost" size="sm" leftIcon={<Filter className="w-4 h-4" />}>Filtros</Button>
          </div>
        </div>
        {requests.length > 0 ? (
          <Table 
            rowClassName={(row) => row.numero === config.highlightedRequestNumber ? 'bg-orange-50/50 animate-pulse-subtle' : ''}
            columns={[
              { header: 'Nº SOLICITAÇÃO', accessor: 'numero', render: (val) => <span className="font-mono text-[12px] font-bold text-gray-500">{val}</span> },
              { header: 'ALVO / PROCESSO', accessor: 'alvo', render: (val, row) => {
                const process = config.processos.find(p => p.id === row.processId);
                const targetDisplay = val || 'N/A';
                return (
                  <div>
                    <p className="font-bold text-[13px] text-gray-900">{targetDisplay}</p>
                    <p className="text-[11px] text-gray-500">{process?.name || row.processName}</p>
                  </div>
                );
              }},
              { header: 'CENTRO DE CUSTO', accessor: 'centroCusto', render: (val) => (
                <span className="text-[12px] font-bold text-gray-600">{val || 'N/A'}</span>
              )},
              { header: 'ETAPA / RESPONSÁVEL', accessor: 'etapaAtual', render: (val, row) => (
                <div>
                  <p className="font-bold text-[13px] text-gray-700">{val}</p>
                  <p className="text-[11px] font-bold text-blue-600 uppercase">{row.responsavelAtual}</p>
                </div>
              )},
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={statusVariants[val] || 'gray'}>{val}</Badge> },
              { header: 'ORIGEM', accessor: 'category', render: (val) => (
                <span className="text-[11px] font-bold text-gray-400 uppercase">{val}</span>
              )},
              { header: 'SLA', accessor: 'slaStatus', render: (val, row) => (
                <div className="flex flex-col items-center gap-1">
                  <SLABar progress={val === 'critical' ? 95 : val === 'warning' ? 70 : 40} />
                  <span className="text-[10px] font-bold text-gray-400">Aging: 2d</span>
                </div>
              )},
              { header: '', accessor: 'id', render: (_, row) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onOpenDetail(row)}>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onOpenDetail(row)}>
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>
              )}
            ]}
            data={requests}
          />
        ) : (
          <EmptyState 
            icon={<Search size={40} />}
            title="Nada encontrado aqui ainda"
            description={searchTerm ? `Nenhuma solicitação corresponde aos termos "${searchTerm}".` : "Parece que não há solicitações registradas nesta visualização."}
            className="border-none bg-white rounded-none"
          />
        )}
      </Card>
    </div>
  );
}


