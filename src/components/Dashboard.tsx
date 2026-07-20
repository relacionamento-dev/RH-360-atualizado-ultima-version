import React from 'react';
import { 
  Users, UserCheck, UserMinus, Clock, 
  TrendingUp, TrendingDown, Calendar, 
  ChevronRight, AlertCircle, CheckCircle2,
  FileText, ArrowUpRight, BarChart3,
  Search, Filter, Plus, Briefcase, Zap,
  Building2, MapPin, Settings
} from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, SLABar, EmptyState } from './ui/Misc';
import { getStatusVariant, isPendingStatus } from '../utils/requestStatus';

interface DashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { config, updateConfig } = useAppConfig();

  const totalEmployeesCount = config.colaboradores.filter(c => c.status === 'Ativo').length;
  const openJobsCount = config.vagas.filter(v => v.status === 'Aberto').length;
  // Aprovações pendentes derivam das solicitações (mesma fonte/status das listas),
  // não de tarefas por assignedTo que não casava com o usuário logado.
  const pendingApprovalsCount = config.solicitacoes.filter(s => isPendingStatus(s.status)).length;
  const overdueCount = config.tarefas.filter(t => t.status === 'Atrasada' || (t.status === 'Pendente' && new Date(t.dueDate) < new Date())).length;

  // trendType reflete o SIGNIFICADO (pos = melhora → verde, neg = piora → vermelho);
  // direction segue o sinal do número (seta pra cima/baixo).
  const stats = [
    {
      label: 'Colaboradores Ativos',
      value: totalEmployeesCount.toLocaleString('pt-BR'),
      change: '+12%',
      direction: 'up' as const,
      trendType: 'pos' as const,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Vagas Abertas',
      value: openJobsCount.toString(),
      change: '+5',
      direction: 'up' as const,
      trendType: 'pos' as const,
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      label: 'Aprovações Pendentes',
      value: pendingApprovalsCount.toString(),
      change: '-2',
      direction: 'down' as const,
      trendType: 'pos' as const, // menos pendências = melhora
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      label: 'SLA Vencido',
      value: overdueCount.toString(),
      change: '+1',
      direction: 'up' as const,
      trendType: 'neg' as const, // mais SLA vencido = piora
      icon: <Clock className="w-5 h-5" />,
    }
  ];

  const recentRequests = config.solicitacoes.slice(0, 5).map(req => ({
    id: req.id,
    numero: req.numero,
    type: config.processos.find(p => p.id === req.tipoProcesso)?.name || 'Processo',
    requester: req.solicitante,
    target: req.alvo === 'Nova Vaga' ? req.data.cargo || 'Nova Vaga' : req.alvo,
    date: new Date(req.createdAt).toLocaleDateString('pt-BR'),
    status: req.status,
    sla: Math.floor(Math.random() * 40) + 60 // Mock SLA for demo
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title={`Bem-vindo, ${config.usuarioAtual.name.split(' ')[0]}`}
        subtitle={`Aqui está o resumo da ${config.empresaAtual.name} para hoje.`}
        actions={
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={<BarChart3 className="w-4 h-4" />} onClick={() => onNavigate('reports')}>
              Relatórios
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => onNavigate('hr-processes')}>
              Nova Solicitação
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-[8px] bg-gray-50 text-gray-500`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[12px] font-bold ${stat.trendType === 'pos' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
                {stat.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="label-caps opacity-80">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-1 tabular-nums">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Requests */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Solicitações Recentes" 
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate('requests')}>
                Ver tudo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            }
          >
            {recentRequests.length > 0 ? (
              <Table 
                columns={[
                  { header: 'PROCESSO / ALVO', accessor: 'id', render: (val, row) => (
                    <div>
                      <p className="font-bold text-[13px] text-[var(--color-brand-text-primary)]">{row.type}</p>
                      <p className="text-[12px] text-[var(--color-brand-text-secondary)]">{row.target}</p>
                    </div>
                  )},
                  { header: 'SOLICITANTE', accessor: 'requester', render: (val) => (
                    <div className="flex items-center gap-2">
                      <Avatar name={val} size="xs" />
                      <span className="text-[13px] font-medium">{val}</span>
                    </div>
                  )},
                  { header: 'SLA', accessor: 'sla', render: (val) => <SLABar progress={val} /> },
                  { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> },
                  { header: 'AÇÕES', accessor: 'actions', render: (_, row) => (
                    <Button variant="ghost" size="icon" title="Ver detalhes" aria-label="Ver detalhes" onClick={() => onNavigate('request-detail', row.id)}>
                      <ChevronRight size={16} />
                    </Button>
                  )}
                ]}
                data={recentRequests}
              />
            ) : (
              <EmptyState 
                icon={<Clock size={40} />}
                title="Sem solicitações recentes"
                description="Não há atividades recentes para exibir no momento."
                className="border-none bg-white rounded-none py-12"
              />
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Vagas por Departamento">
              <div className="space-y-4">
                {Object.entries(
                  config.vagas.reduce((acc, job) => {
                    acc[job.department] = (acc[job.department] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([dept, count], i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[13px] font-bold text-[var(--color-brand-text-primary)]">{dept}</span>
                      <span className="text-[12px] font-medium text-[var(--color-brand-text-secondary)]">{count} abertas</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-brand-primary)] rounded-full" style={{ width: `${Math.min((count / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Próximos Eventos">
              <div className="space-y-4">
                {[
                  ...config.colaboradores
                    .filter(c => {
                      const birthday = new Date(c.birthDate);
                      const today = new Date();
                      return birthday.getMonth() === today.getMonth();
                    })
                    .map(c => ({ title: `Aniversário: ${c.name}`, date: `${new Date(c.birthDate).getDate()}/${new Date(c.birthDate).getMonth() + 1}`, type: 'Comemoração' })),
                  ...config.colaboradores
                    .filter(c => {
                      const admission = new Date(c.admissionDate);
                      const today = new Date();
                      return admission.getMonth() === today.getMonth();
                    })
                    .map(c => ({ title: `Aniversário de Empresa: ${c.name}`, date: `${new Date(c.admissionDate).getDate()}/${new Date(c.admissionDate).getMonth() + 1}`, type: 'Carreira' }))
                ].slice(0, 4).map((event, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-[6px] bg-orange-50 text-[var(--color-brand-primary)] flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[var(--color-brand-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">{event.title}</p>
                      <p className="text-[12px] text-[var(--color-brand-text-secondary)] mt-0.5">{event.date} • {event.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: AI Insights & Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-[#1A1D21] border-none text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Zap size={20} fill="currentColor" />
                <span className="label-caps !text-orange-400">RH360 AI INSIGHTS</span>
              </div>
              <h4 className="text-lg font-bold leading-tight mb-4">Análise de Retenção Crítica</h4>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-6">
                Identificamos um aumento de 15% nas solicitações de desligamento no setor de Operações nas últimas 2 semanas. Sugerimos revisar o plano de benefícios e realizar pesquisas de clima.
              </p>
              <Button variant="primary" className="w-full bg-white !text-gray-900 hover:bg-gray-100 border-none">
                Ver Relatório Detalhado
              </Button>
            </div>
          </Card>

          <Card title="Minha Agenda">
            <div className="space-y-4">
              <div className="p-3 border border-[var(--color-brand-border)] rounded-[8px] space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="blue">Entrevista</Badge>
                  <span className="text-[12px] font-medium text-gray-500">10:30 - 11:30</span>
                </div>
                <p className="font-bold text-[14px]">Desenvolvedor Frontend Sênior</p>
                <div className="flex items-center gap-2">
                  <Avatar name="Tiago Oliveira" size="xs" />
                  <span className="text-[12px] font-medium text-gray-500">Candidato: Tiago Oliveira</span>
                </div>
              </div>
              <div className="p-3 border border-dashed border-[var(--color-brand-border)] rounded-[8px] flex items-center justify-center py-6 text-center">
                <div>
                  <p className="text-[13px] font-medium text-gray-500">Nenhum outro compromisso hoje</p>
                  <Button variant="ghost" size="sm" className="mt-2">Ver agenda completa</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Acesso Rápido">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Relatórios', icon: <BarChart3 size={18} />, view: 'reports' },
                { label: 'Processos', icon: <Building2 size={18} />, view: 'hr-processes' },
                { label: 'Consulta Global', icon: <Search size={18} />, view: 'global-query' },
                { label: 'Colaboradores', icon: <Users size={18} />, view: 'employees' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => onNavigate(action.view)}
                  className="p-4 rounded-[8px] bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] hover:border-[var(--color-brand-primary)] hover:bg-orange-50 transition-all text-center group"
                >
                  <div className="text-gray-500 group-hover:text-[var(--color-brand-primary)] flex justify-center mb-2 transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-[12px] font-bold text-gray-600 group-hover:text-[var(--color-brand-text-primary)] transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
