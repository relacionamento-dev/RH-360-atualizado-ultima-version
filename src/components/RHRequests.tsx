import React, { useState } from 'react';
import { 
  ClipboardList, CheckCircle2, Search, Filter, 
  Plus, Eye, Clock, AlertCircle, ArrowRight, User, Users,
  Briefcase, TrendingUp, UserMinus, Move, Scale, UserPlus,
  Palmtree, FileCheck, DollarSign, Shield, GraduationCap,
  CreditCard, Laptop, Watch, ChevronRight, X, Download,
  Paperclip, MessageSquare, History, Check, CornerUpLeft,
  MoreHorizontal, Flag, Activity, Target
} from 'lucide-react';
import { RHProcess, RHRequest, RequestStatus, SlaStatus, ProcessPermission, HistoryEntry, Job, Task } from '../types';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, SLABar, EmptyState } from './ui/Misc';
import { Modal } from './ui/Misc';
import { Select } from './ui/Select';
import { getStatusVariant, isPendingStatus } from '../utils/requestStatus';
import { ehMinhaAprovacao } from '../utils/approvalFlow';
import { podeAbrirPeloFluxoGenerico } from '../utils/permissions';
import { useAppConfig } from '../contexts/AppConfigContext';
import OnboardingManager from './process-managers/OnboardingManager';
import AdmissionManager from './process-managers/AdmissionManager';
import RecruitmentKanban from './process-managers/RecruitmentKanban';
import BenefitReceiptManager from './process-managers/BenefitReceiptManager';
import HierarchyManager from './process-managers/HierarchyManager';
import GenericProcessManager from './process-managers/GenericProcessManager';

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

export type VisaoDoHub = 'hub' | 'mine' | 'approvals';

/**
 * Cabeçalho de cada visão. A tela não tem mais barra de abas — a navegação é o
 * menu lateral, que está sempre visível —, então é o título que precisa dizer
 * onde o usuário está. O genérico "Hub de Processos RH" servia para as quatro
 * abas e não dizia nada sobre a lista exibida.
 */
const VISOES: Record<VisaoDoHub, { titulo: string; subtitulo: string }> = {
  hub: {
    titulo: 'Hub de Processos RH',
    subtitulo: 'Escolha um processo para abrir a fila e acompanhar as solicitações'
  },
  mine: {
    titulo: 'Minhas Solicitações',
    subtitulo: 'Solicitações que você abriu, em qualquer etapa do fluxo'
  },
  approvals: {
    titulo: 'Minhas Aprovações',
    subtitulo: 'Solicitações aguardando a sua aprovação'
  }
};

export default function RHRequests({
  initialTab = 'hub',
  initialProcessId
}: {
  initialTab?: VisaoDoHub,
  initialProcessId?: string
}) {
  const { config, updateConfig, isAuthorized } = useAppConfig();

  // A visão vem DIRETO da rota, sem estado intermediário: com as abas fora, não
  // há mais nenhuma forma de trocar de visão sem trocar de rota. Isso mata de
  // vez o bug em que o menu lateral acendia o item mas a tela ficava na visão
  // anterior — 'requests', 'approvals' e 'hr-processes' renderizam o MESMO
  // componente na mesma posição da árvore, então o React o reaproveita e um
  // `useState(initialTab)` só valeria na primeira montagem.
  const visao = initialTab;
  const { titulo, subtitulo } = VISOES[visao];

  const [selectedProcess, setSelectedProcess] = useState<RHProcess | null>(
    initialProcessId ? config.processos.find(p => p.id === initialProcessId) || null : null
  );
  const isNewRequestOpen = config.isNewRequestModalOpen || false;
  const setIsNewRequestOpen = (open: boolean) => updateConfig({ isNewRequestModalOpen: open });

  // O processo aberto pelo Hub também acompanha a rota: sair para uma lista (ou
  // voltar para 'hr-processes' sem processo na URL) fecha o gerenciador, senão
  // a tela continuaria nele em vez de mostrar o que o menu pediu.
  //
  // As dependências são SÓ as props de rota, de propósito: incluir
  // `config.processos` faria o efeito rodar a cada `updateConfig` (abrir o modal
  // de nova solicitação, por exemplo) e desfazer a navegação que o usuário
  // acabou de fazer dentro da própria tela.
  React.useEffect(() => {
    setSelectedProcess(initialProcessId ? config.processos.find(p => p.id === initialProcessId) || null : null);
  }, [initialTab, initialProcessId]);

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
        title={titulo}
        subtitle={subtitulo}
        actions={
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsNewRequestOpen(true)}>Nova Solicitação</Button>
        }
      />

      {/* Sem barra de abas: cada visão tem seu item no menu lateral, que é a
          navegação primária e fica sempre visível. A visão ampla de todas as
          solicitações é a tela "Consulta Global" do próprio menu. */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {visao === 'hub' && <ProcessHub onOpen={openProcess} />}
        {visao === 'mine' && <ConsultationPanel type="mine" onOpenDetail={openDetail} />}
        {visao === 'approvals' && <ConsultationPanel type="approvals" onOpenDetail={openDetail} />}
      </div>

      {/* New Request Modal */}
      <Modal isOpen={isNewRequestOpen} onClose={() => setIsNewRequestOpen(false)} title="Nova Solicitação">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          {config.processos.filter(p => p.ativo && isAuthorized(p.id, 'solicitar') && podeAbrirPeloFluxoGenerico(p.id)).map(process => (
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

/**
 * Lista de solicitações recortada por usuário. A visão ampla (todas, sem
 * recorte) não mora mais aqui: é a tela "Consulta Global" do menu lateral,
 * que tem filtros próprios e exportação.
 */
function ConsultationPanel({ type, onOpenDetail }: { type: 'mine' | 'approvals', onOpenDetail: (req: RHRequest) => void }) {
  const { config } = useAppConfig();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcessId, setSelectedProcessId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const requests = config.solicitacoes.filter(req => {
    // Search filter
    const matchesSearch =
      req.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.alvo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.solicitante.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Process filter
    if (selectedProcessId !== 'all' && req.processId !== selectedProcessId) return false;

    // Status filter
    if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;

    // Cada visão é um recorte diferente da MESMA base — é o filtro por usuário
    // que as separa.
    if (type === 'mine') {
      // Abertas PELO usuário. O nome também conta porque a demo tem contas
      // duplicadas da mesma pessoa (Marcos GEST-001 e GEST-002).
      return req.requesterId === config.usuarioAtual.id || req.solicitante === config.usuarioAtual.name;
    }
    // Paradas NA MÃO do usuário: ele responde pela alçada pendente agora.
    // Mesmo motor usado pelo botão Aprovar e pelo atalho da Intranet
    // (utils/approvalFlow).
    return ehMinhaAprovacao(req, config.processos, config.usuarioAtual, config.grupos);
  });

  // Contadores derivados do MESMO array já filtrado que popula a lista, usando o
  // conjunto canônico de pendências (não só 'Em Análise', que ignorava as
  // solicitações recém-criadas em 'Pendente de Aprovação').
  const stats = {
    total: requests.length,
    slaEstourado: requests.filter(r => r.slaStatus === 'critical').length,
    emAndamento: requests.filter(r => isPendingStatus(r.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-blue-500">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total de Processos</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-red-500">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SLA Estourado</p>
          <p className="text-2xl font-black text-red-600">{stats.slaEstourado}</p>
        </Card>
        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Em Andamento</p>
          <p className="text-2xl font-black text-amber-600">{stats.emAndamento}</p>
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
            <Select
              ariaLabel="Filtrar por processo"
              className="min-w-[150px]"
              value={selectedProcessId}
              onChange={setSelectedProcessId}
              options={[
                { value: 'all', label: 'Todos Processos' },
                ...config.processos.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              ariaLabel="Filtrar por status"
              className="min-w-[150px]"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: 'Todos Status' },
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
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> },
              { header: 'ORIGEM', accessor: 'category', render: (val) => (
                <span className="text-[11px] font-bold text-gray-500 uppercase">{val}</span>
              )},
              { header: 'SLA', accessor: 'slaStatus', render: (val, row) => (
                <div className="flex flex-col items-center gap-1">
                  <SLABar progress={val === 'critical' ? 95 : val === 'warning' ? 70 : 40} />
                  <span className="text-[10px] font-bold text-gray-500">Aging: 2d</span>
                </div>
              )},
              { header: 'AÇÕES', accessor: 'id', render: (_, row) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title="Ver detalhes" aria-label="Ver detalhes" onClick={() => onOpenDetail(row)}>
                    <Eye className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>
              )}
            ]}
            data={requests}
          />
        ) : (
          <EmptyState
            icon={type === 'approvals' ? <CheckCircle2 size={40} /> : <Search size={40} />}
            title={
              searchTerm || selectedProcessId !== 'all' || selectedStatus !== 'all'
                ? 'Nada encontrado com esses filtros'
                : type === 'mine' ? 'Você ainda não abriu solicitações' : 'Nenhuma aprovação pendente'
            }
            description={
              searchTerm
                ? `Nenhuma solicitação corresponde aos termos "${searchTerm}".`
                : selectedProcessId !== 'all' || selectedStatus !== 'all'
                  ? 'Ajuste o processo ou o status para ver outras solicitações.'
                  : type === 'mine'
                    ? 'As solicitações que você abrir aparecem aqui, em qualquer etapa do fluxo.'
                    : 'Nada está parado esperando a sua decisão no momento.'
            }
            className="border-none bg-white rounded-none"
          />
        )}
      </Card>
    </div>
  );
}


