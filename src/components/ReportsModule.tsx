import React, { useState } from 'react';
import { 
  BarChart3, Clock, Users, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, TrendingUp,
  PieChart as PieIcon, Activity, CheckCircle2, AlertCircle, FileDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { SLABar } from './ui/Misc';

const TURNOVER_DATA = [
  { month: 'Jul/25', rate: 2.1 },
  { month: 'Ago/25', rate: 1.8 },
  { month: 'Set/25', rate: 2.4 },
  { month: 'Out/25', rate: 2.0 },
  { month: 'Nov/25', rate: 1.5 },
  { month: 'Dez/25', rate: 1.2 },
  { month: 'Jan/26', rate: 1.9 },
  { month: 'Fev/26', rate: 2.2 },
  { month: 'Mar/26', rate: 2.5 },
  { month: 'Abr/26', rate: 2.1 },
  { month: 'Mai/26', rate: 1.7 },
  { month: 'Jun/26', rate: 1.6 },
];

const HIRING_TIME_DATA = [
  { dept: 'Tecnologia', days: 42 },
  { dept: 'Comercial', days: 28 },
  { dept: 'Financeiro', days: 35 },
  { dept: 'RH', days: 25 },
  { dept: 'Operações', days: 38 },
];

const RECRUITMENT_FUNNEL = [
  { step: 'Candidatos', count: 1250, fill: '#3b82f6' },
  { step: 'Triagem', count: 450, fill: '#60a5fa' },
  { step: 'Entrevistas', count: 120, fill: '#93c5fd' },
  { step: 'Propostas', count: 45, fill: '#bfdbfe' },
  { step: 'Contratações', count: 38, fill: '#10b981' },
];

const SLA_BY_PROCESS = [
  { process: 'Admissão Digital', sla: 98 },
  { process: 'Férias', sla: 95 },
  { process: 'Recrutamento', sla: 78 },
  { process: 'Benefícios', sla: 99 },
  { process: 'Desligamento', sla: 88 },
];

const STAGE_DISTRIBUTION = [
  { name: 'Em Análise', value: 45, color: '#3b82f6' },
  { name: 'Aguardando Aprovação', value: 30, color: '#f59e0b' },
  { name: 'Em Processamento', value: 20, color: '#10b981' },
  { name: 'Pendência Colab.', value: 5, color: '#ef4444' },
];

export default function ReportsModule() {
  const { config } = useAppConfig();
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Derived metrics from real state
  const totalEmployees = config.colaboradores.length;
  const inactiveEmployees = config.colaboradores.filter(e => e.status === 'Inativo').length;
  const turnoverRate = ((inactiveEmployees / totalEmployees) * 100).toFixed(2);
  
  const completedAdmissions = config.solicitacoes.filter(r => r.tipoProcesso === '3' && r.status === 'Concluída');
  const avgHiringTime = completedAdmissions.length > 0 ? 32 : 34; // Simulated avg but based on presence

  const absenteismoRate = (config.solicitacoes.filter(r => r.tipoProcesso === '10').length * 0.15).toFixed(1);

  const stageDistribution = Object.entries(
    config.solicitacoes.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], i) => ({
    name,
    value,
    color: ['#F26522', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'][i % 7]
  }));

  const slaByProcess = config.processos.map(p => {
    const pRequests = config.solicitacoes.filter(r => r.tipoProcesso === p.id);
    if (pRequests.length === 0) return { process: p.name, sla: 100 };
    const onTime = pRequests.filter(r => r.slaStatus === 'normal').length;
    return {
      process: p.name,
      sla: Math.round((onTime / pRequests.length) * 100)
    };
  }).slice(0, 5);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      addToast('Relatório exportado com sucesso para PDF.', 'success');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Inteligência de Dados" 
        subtitle="Analise indicadores de performance, turnover e eficiência operacional em tempo real."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" leftIcon={<Filter size={16} />}>Filtrar Período</Button>
            <Button 
              leftIcon={isExporting ? <Activity className="w-4 h-4 animate-spin" /> : <FileDown size={16} />} 
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'TURNOVER MÉDIO (REAL)', value: `${turnoverRate}%`, trend: '-0.2%', icon: <Users size={20} />, color: 'blue', trendType: 'pos' },
          { label: 'TEMPO MÉDIO CONTRATAÇÃO', value: `${avgHiringTime} dias`, trend: '+2 dias', icon: <Clock size={20} />, color: 'orange', trendType: 'neg' },
          { label: 'ÍNDICE ABSENTEÍSMO', value: `${absenteismoRate}%`, trend: '-0.1%', icon: <Calendar size={20} />, color: 'purple', trendType: 'pos' },
        ].map((kpi, i) => (
          <Card key={i} className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-[16px] bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center`}>
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                kpi.trendType === 'pos' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {kpi.trendType === 'pos' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {kpi.trend}
              </div>
            </div>
            <div>
              <p className="label-caps opacity-60 mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 tabular-nums">{kpi.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8" title="Evolução do Turnover">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[12px] text-gray-500">Acompanhamento mensal da taxa de rotatividade.</p>
            <Badge variant="amber" size="sm">Meta: &lt; 2.5%</Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TURNOVER_DATA}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Area type="monotone" dataKey="rate" stroke="var(--color-brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8" title="Funil de Recrutamento (Acumulado)">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[12px] text-gray-500">Conversão de candidatos por etapa do processo.</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RECRUITMENT_FUNNEL} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="step" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                  {RECRUITMENT_FUNNEL.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8" title="SLA Médio por Tipo de Processo">
          <div className="space-y-6 mt-4">
            {slaByProcess.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold text-gray-700">{item.process}</span>
                  <span className={`text-[12px] font-black ${item.sla >= 90 ? 'text-green-600' : item.sla >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {item.sla}%
                  </span>
                </div>
                <SLABar progress={item.sla} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8" title="Distribuição por Etapa">
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: 10, fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-[var(--color-brand-border)] flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-gray-900">Motivos de Absenteísmo</h3>
          <Badge variant="blue">Mês Atual</Badge>
        </div>
        <Table 
          columns={[
            { header: 'MOTIVO', accessor: 'reason', render: (val) => <span className="text-[13px] font-bold text-gray-900">{val}</span> },
            { header: 'OCORRÊNCIAS (MÊS)', accessor: 'count', render: (val) => <span className="text-[12px] font-bold text-gray-500 tabular-nums">{val}</span> },
            { header: 'HORAS PERDIDAS', accessor: 'hours', render: (val) => <span className="text-[12px] font-bold text-gray-500 tabular-nums">{val}h</span> },
            { header: 'IMPACTO ESTIMADO', accessor: 'cost', render: (val) => <span className="text-[13px] font-bold text-green-600 tabular-nums">{val}</span> }
          ]}
          data={[
            { reason: 'Atestado Médico (Doença)', count: 45, hours: 360, cost: 'R$ 18.500,00' },
            { reason: 'Assuntos Particulares', count: 12, hours: 48, cost: 'R$ 2.400,00' },
            { reason: 'Consulta Médica / Exames', count: 28, hours: 84, cost: 'R$ 4.200,00' },
            { reason: 'Atrasos sem justificativa', count: 65, hours: 32, cost: 'R$ 1.600,00' },
          ]}
        />
      </Card>
    </div>
  );
}
