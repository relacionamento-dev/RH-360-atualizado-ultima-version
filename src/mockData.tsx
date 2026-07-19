import React from 'react';
import { 
  Users, DollarSign, Target, Activity, FileText, Send, 
  Search, ShieldCheck, HardHat, Headphones, Zap, Globe, 
  MessageSquare, Link as LinkIcon, Package, Truck, 
  CheckCircle2, Clock, Calendar, TrendingUp, AlertCircle, Triangle,
  Phone, Mail, MapPin
} from 'lucide-react';
import { ModuleKPI, ModuleTableColumn } from './components/ModuleView';

// CRM - Funil de Vendas
export const SALES_FUNNEL_KPIs: ModuleKPI[] = [
  { label: 'Oportunidades Ativas', value: '32', icon: <Target className="w-5 h-5" />, trend: '12%', trendUp: true },
  { label: 'Valor em Funil', value: 'R$ 1.487.600', icon: <DollarSign className="w-5 h-5" />, trend: '8%', trendUp: true },
  { label: 'Taxa de Conversão', value: '23,6%', icon: <Activity className="w-5 h-5" />, trend: '2%', trendUp: true },
  { label: 'Ciclo Médio', value: '18 dias', icon: <Clock className="w-5 h-5" />, trend: '1 dia', trendUp: false },
];

export const SALES_FUNNEL_COLUMNS: ModuleTableColumn[] = [
  { header: 'Etapa', accessor: 'step' },
  { header: 'Oportunidades', accessor: 'count' },
  { header: 'Valor Total', accessor: 'value' },
  { header: 'Conversão', accessor: 'conversion', render: (val) => <span className="text-green-600 font-black">{val}</span> },
];

export const SALES_FUNNEL_DATA = [
  { step: 'Novo Lead', count: 45, value: 'R$ 890.000,00', conversion: '100%' },
  { step: 'Qualificação', count: 32, value: 'R$ 640.000,00', conversion: '71%' },
  { step: 'Proposta Enviada', count: 18, value: 'R$ 412.000,00', conversion: '56%' },
  { step: 'Negociação', count: 9, value: 'R$ 215.000,00', conversion: '50%' },
  { step: 'Fechamento', count: 5, value: 'R$ 132.000,00', conversion: '55%' },
];

// CRM - Atividades Comerciais
export const ACTIVITIES_COLUMNS: ModuleTableColumn[] = [
  { header: 'Atividade', accessor: 'type' },
  { header: 'Cliente', accessor: 'customer' },
  { header: 'Responsável', accessor: 'responsible' },
  { header: 'Prazo', accessor: 'deadline' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Concluído' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
      {val}
    </span>
  )},
];

export const ACTIVITIES_DATA = [
  { type: 'Ligação de Follow-up', customer: 'Felipe Albuquerque', responsible: 'Ana Paula Lima', deadline: 'Hoje, 14:00', status: 'Pendente' },
  { type: 'Visita Técnica', customer: 'Mercado Bom Preço', responsible: 'Ricardo Silva', deadline: 'Amanhã, 09:30', status: 'Agendado' },
  { type: 'Envio de Proposta', customer: 'Condomínio Vila Verde', responsible: 'Ana Paula Lima', deadline: '25/06/2025', status: 'Concluído' },
  { type: 'Reunião de Fechamento', customer: 'João Martins', responsible: 'Ana Paula Lima', deadline: '26/06/2025', status: 'Pendente' },
];

// Engineering - Fila Técnica
export const ENG_FILA_KPIs: ModuleKPI[] = [
  { label: 'Processos em Fila', value: '12', icon: <Triangle className="w-5 h-5" /> },
  { label: 'Aguardando ART', value: '3', icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Prazo Médio', value: '4.2 dias', icon: <Clock className="w-5 h-5" /> },
  { label: 'Eficiência', value: '94%', icon: <Zap className="w-5 h-5" /> },
];

// Engineering - ART/TRT
export const ART_COLUMNS: ModuleTableColumn[] = [
  { header: 'Processo', accessor: 'project' },
  { header: 'Profissional', accessor: 'engineer' },
  { header: 'Tipo', accessor: 'type' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Emitida' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
      {val}
    </span>
  )},
  { header: 'Data', accessor: 'date' },
];

export const ART_DATA = [
  { project: 'PROC-2025-0432', engineer: 'Eng. Roberto Silva', type: 'ART de Processo', status: 'Emitida', date: '11/05/2025' },
  { project: 'PROC-1893', engineer: 'Eng. Roberto Silva', type: 'ART de Instalação', status: 'Pendente', date: '-' },
  { project: 'PROC-1872', engineer: 'Eng. Roberto Silva', type: 'TRT', status: 'Emitida', date: '08/05/2025' },
];

// Work - Time de Campo
export const TEAM_COLUMNS: ModuleTableColumn[] = [
  { header: 'Colaborador', accessor: 'name' },
  { header: 'Função', accessor: 'role' },
  { header: 'Time', accessor: 'team' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Disponível' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
      {val}
    </span>
  )},
  { header: 'Última Implantação', accessor: 'lastWork' },
];

export const TEAM_DATA = [
  { name: 'José Santos', role: 'Analista Pleno', team: 'Time Alfa', status: 'Em Implantação', lastWork: 'PROC-1861' },
  { name: 'Mário Oliveira', role: 'Analista Júnior', team: 'Time Alfa', status: 'Em Implantação', lastWork: 'PROC-1861' },
  { name: 'Pedro Souza', role: 'Analista Pleno', team: 'Time Beta', status: 'Disponível', lastWork: 'PROC-1849' },
  { name: 'Lucas Lima', role: 'Analista Júnior', team: 'Time Beta', status: 'Disponível', lastWork: 'PROC-1849' },
];

// Financial - Comissões
export const COMMISSION_COLUMNS: ModuleTableColumn[] = [
  { header: 'Vendedor', accessor: 'seller' },
  { header: 'Processo', accessor: 'project' },
  { header: 'Valor Venda', accessor: 'saleValue' },
  { header: 'Comissão', accessor: 'commission', render: (val) => <span className="font-black text-gray-900">{val}</span> },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Pago' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
      {val}
    </span>
  )},
];

export const COMMISSION_DATA = [
  { seller: 'Ana Paula Lima', project: 'PROC-2025-0432', saleValue: 'R$ 31.250,00', commission: 'R$ 937,50', status: 'A pagar' },
  { seller: 'Ana Paula Lima', project: 'PROC-1872', saleValue: 'R$ 132.450,00', commission: 'R$ 3.973,50', status: 'Paga' },
  { seller: 'Ana Paula Lima', project: 'PROC-1861', saleValue: 'R$ 67.900,00', commission: 'R$ 2.037,00', status: 'Paga' },
];

// IA - Documentos
export const IA_DOCS_COLUMNS: ModuleTableColumn[] = [
  { header: 'Documento', accessor: 'name' },
  { header: 'Tipo', accessor: 'type' },
  { header: 'Confiança', accessor: 'confidence', render: (val) => (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${val > 90 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${val}%` }}></div>
      </div>
      <span className="text-[10px] font-black">{val}%</span>
    </div>
  )},
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Confirmado' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
      {val}
    </span>
  )},
];

export const IA_DOCS_DATA = [
  { name: 'Conta_Energia_Felipe.pdf', type: 'Fatura', confidence: 98, status: 'Confirmado' },
  { name: 'Parecer_Acesso_PRJ432.pdf', type: 'Parecer', confidence: 85, status: 'Confirmado' },
  { name: 'NF_Kit_RH_PRJ432.pdf', type: 'Nota Fiscal', confidence: 99, status: 'Confirmado' },
];

// Integrations
export const INTEGRATIONS_DATA = [
  { name: 'WhatsApp API', provider: 'Twilio / Meta', status: 'Conectado', lastSync: 'Há 5 min', error: '-' },
  { name: 'Assinatura Eletrônica', provider: 'ZapSign', status: 'Conectado', lastSync: 'Hoje, 08:00', error: '-' },
  { name: 'Monitoramento Inversores', provider: 'RHView', status: 'Erro', lastSync: 'Ontem', error: 'Token expirado' },
  { name: 'ERP Fiscal', provider: 'Conta Azul', status: 'Conectado', lastSync: 'Hoje, 09:12', error: '-' },
];

export const INTEGRATIONS_COLUMNS: ModuleTableColumn[] = [
  { header: 'Conector', accessor: 'name' },
  { header: 'Provedor', accessor: 'provider' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Conectado' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {val}
    </span>
  )},
  { header: 'Última Sinc', accessor: 'lastSync' },
];

// Admin - Users
export const USERS_COLUMNS: ModuleTableColumn[] = [
  { header: 'Usuário', accessor: 'name' },
  { header: 'Perfil', accessor: 'role' },
  { header: 'Departamento', accessor: 'dept' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${val === 'Ativo' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
      {val}
    </span>
  )},
];

export const USERS_DATA = [
  { name: 'Ana Paula Lima', role: 'Vendedor', dept: 'Comercial', status: 'Ativo' },
  { name: 'Roberto Silva', role: 'Engenheiro', dept: 'Engenharia', status: 'Ativo' },
  { name: 'Juliana Costa', role: 'Compradora', dept: 'Suprimentos', status: 'Ativo' },
];

// 1. Alertas e Pendências
export const ALERTS_KPIs: ModuleKPI[] = [
  { label: 'Comercial', value: '3', icon: <Target className="w-5 h-5 text-orange-500" /> },
  { label: 'Homologação', value: '2', icon: <FileText className="w-5 h-5 text-blue-500" /> },
  { label: 'Implantação & Campo', value: '1', icon: <HardHat className="w-5 h-5 text-purple-500" /> },
  { label: 'Financeiro', value: '2', icon: <DollarSign className="w-5 h-5 text-red-500" /> },
];

export const ALERTS_COLUMNS: ModuleTableColumn[] = [
  { header: 'Severidade', accessor: 'severity', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
      val === 'Crítico' ? 'bg-red-50 text-red-700' : 
      val === 'Atenção' ? 'bg-orange-50 text-orange-700' : 
      'bg-blue-50 text-blue-700'
    }`}>
      {val}
    </span>
  )},
  { header: 'Alerta', accessor: 'title', render: (val, item) => (
    <div>
      <p className="text-sm font-bold text-gray-900">{val}</p>
      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.context}</p>
    </div>
  )},
  { header: 'Módulo', accessor: 'module' },
  { header: 'Data', accessor: 'date' },
];

export const ALERTS_DATA = [
  { severity: 'Crítico', title: 'Proposta PROP-2025-0432 aguarda assinatura', context: 'Felipe Albuquerque', module: 'Comercial', date: 'Há 2h' },
  { severity: 'Atenção', title: 'Homologação PROC-1893 em análise', context: 'João Martins', module: 'Homologação', date: 'Hoje' },
  { severity: 'Atenção', title: 'Pedido de compra PROC-1872 atrasado', context: 'Mercado Bom Preço', module: 'Compras', date: 'Hoje' },
  { severity: 'Informativo', title: 'Implantação agendada para amanhã', context: 'Condomínio Vila Verde / PROC-1861', module: 'Implantação', date: 'Amanhã' },
];

// 2. Indicadores Executivos
export const EXEC_KPIs: ModuleKPI[] = [
  { label: 'Faturamento Fechado', value: 'R$ 1.240.500', icon: <DollarSign className="w-5 h-5" />, trend: '15%', trendUp: true },
  { label: 'Potência Instalada', value: '245,6 kWp', icon: <Zap className="w-5 h-5" />, trend: '8%', trendUp: true },
  { label: 'Margem Média', value: '17,5%', icon: <Activity className="w-5 h-5" />, trend: '0.5%', trendUp: true },
  { label: 'Taxa de Conversão', value: '23,6%', icon: <Target className="w-5 h-5" />, trend: '2%', trendUp: true },
];

// 3. Funil de Vendas (Analítico)
export const FUNNEL_ANALYTIC_KPIs: ModuleKPI[] = [
  { label: 'Total Oportunidades', value: '84', icon: <Target className="w-5 h-5" /> },
  { label: 'Valor Potencial', value: 'R$ 2.840.000', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Ticket Médio', value: 'R$ 33.800', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Ciclo Médio', value: '18 dias', icon: <Clock className="w-5 h-5" /> },
];

export const FUNNEL_GARGALOS_COLUMNS: ModuleTableColumn[] = [
  { header: 'Etapa', accessor: 'step' },
  { header: 'Nº Parado', accessor: 'count' },
  { header: 'Tempo Médio', accessor: 'avgTime' },
  { header: 'Valor Retido', accessor: 'value', render: (val) => <span className="font-black text-gray-900">{val}</span> },
];

export const FUNNEL_GARGALOS_DATA = [
  { step: 'Orçamento em elaboração', count: 12, avgTime: '5 dias', value: 'R$ 380.000' },
  { step: 'Em negociação', count: 8, avgTime: '12 dias', value: 'R$ 245.000' },
  { step: 'Aguardando Aprovação Fin.', count: 4, avgTime: '3 dias', value: 'R$ 120.000' },
];

// 4. Atividades Comerciais
export const ACTIVITIES_DETAILED_KPIs: ModuleKPI[] = [
  { label: 'Hoje', value: '5', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Atrasadas', value: '2', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
  { label: 'Próximos 7 dias', value: '14', icon: <Clock className="w-5 h-5" /> },
  { label: 'Concluídas/Mês', value: '42', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
];

export const ACTIVITIES_DETAILED_COLUMNS: ModuleTableColumn[] = [
  { header: 'Tipo', accessor: 'type', render: (val) => {
    const icons: any = {
      'Ligação': <Phone className="w-4 h-4" />,
      'E-mail': <Mail className="w-4 h-4" />,
      'WhatsApp': <MessageSquare className="w-4 h-4" />,
      'Visita': <MapPin className="w-4 h-4" />,
      'Reunião': <Users className="w-4 h-4" />,
    };
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
          {icons[val] || <Activity className="w-4 h-4" />}
        </div>
        <span className="text-xs font-bold text-gray-700">{val}</span>
      </div>
    );
  }},
  { header: 'Título', accessor: 'title' },
  { header: 'Cliente / Oportunidade', accessor: 'customer', render: (val, item) => (
    <div>
      <p className="text-sm font-bold text-gray-900">{val}</p>
      <p className="text-[10px] text-[#F26522] font-black uppercase">{item.opportunity}</p>
    </div>
  )},
  { header: 'Responsável', accessor: 'responsible' },
  { header: 'Status', accessor: 'status', render: (val) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
      val === 'Concluída' ? 'bg-green-50 text-green-700' : 
      val === 'Atrasada' ? 'bg-red-50 text-red-700' : 
      'bg-orange-50 text-orange-700'
    }`}>
      {val}
    </span>
  )},
];

export const ACTIVITIES_DETAILED_DATA = [
  { type: 'Ligação', title: 'Follow-up da proposta', customer: 'Felipe Albuquerque', opportunity: 'OP-2025-0432', responsible: 'Ana Paula Lima', status: 'Pendente' },
  { type: 'WhatsApp', title: 'Enviar fotos da implantação', customer: 'Condomínio Vila Verde', opportunity: 'OP-2025-0398', responsible: 'Ana Paula Lima', status: 'Atrasada' },
  { type: 'Visita', title: 'Vistoria técnica local', customer: 'Mercado Bom Preço', opportunity: 'OP-2025-0410', responsible: 'Ricardo Gomes', status: 'Concluída' },
];

// 5. Motivos de Perda
export const LOSS_DETAILED_KPIs: ModuleKPI[] = [
  { label: 'Total Perdido (Nº)', value: '15', icon: <Target className="w-5 h-5 text-gray-400" /> },
  { label: 'Valor Perdido (R$)', value: 'R$ 512.400', icon: <DollarSign className="w-5 h-5 text-red-500" /> },
  { label: 'Principal Motivo', value: 'Preço', icon: <AlertCircle className="w-5 h-5" /> },
  { label: 'Taxa de Perda', value: '18,4%', icon: <Activity className="w-5 h-5" /> },
];

export const LOSS_DETAILED_COLUMNS: ModuleTableColumn[] = [
  { header: 'Cliente', accessor: 'customer' },
  { header: 'Valor', accessor: 'value' },
  { header: 'Vendedor', accessor: 'seller' },
  { header: 'Etapa Final', accessor: 'step' },
  { header: 'Motivo', accessor: 'reason', render: (val) => <span className="text-red-600 font-bold">{val}</span> },
];

export const LOSS_DETAILED_DATA = [
  { customer: 'Sacolão do Povo', value: 'R$ 45.000', seller: 'Ana Paula Lima', step: 'Em negociação', reason: 'Preço' },
  { customer: 'Posto Estrela', value: 'R$ 132.000', seller: 'Ricardo Gomes', step: 'Proposta enviada', reason: 'Concorrência' },
  { customer: 'Sítio Novo Horizonte', value: 'R$ 28.500', seller: 'Bruno Silveira', step: 'Qualificação', reason: 'Desistiu do investimento' },
];
