import React, { useState, useMemo } from 'react';
import { 
  X, Check, CornerUpLeft, AlertCircle, FileText,
  CheckCircle2, Target, Activity, Users, Clock, Download, 
  User, List, Save, ChevronRight, Plus, Info, AlertTriangle, ArrowLeft,
  Building, MapPin, Briefcase, Hash, History, MessageSquare, DollarSign
} from 'lucide-react';
import { RHRequest, HistoryEntry } from '../types';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { PROCESS_DEFINITIONS } from '../processDefinitions';

interface RequestDetailProps {
  requestId: string;
  onBack: () => void;
}

const statusColors = {
  'Aberto': 'bg-blue-50 text-blue-700 border-blue-100',
  'Enviada': 'bg-blue-50 text-blue-700 border-blue-100',
  'Em Análise': 'bg-orange-50 text-orange-700 border-orange-100',
  'Em Aprovação': 'bg-orange-50 text-orange-700 border-orange-100',
  'Concluído': 'bg-green-50 text-green-700 border-green-100',
  'Concluída': 'bg-green-50 text-green-700 border-green-100',
  'Devolvido': 'bg-purple-50 text-purple-700 border-purple-100',
  'Devolvida': 'bg-purple-50 text-purple-700 border-purple-100',
  'Reprovado': 'bg-red-50 text-red-700 border-red-100',
  'Reprovada': 'bg-red-50 text-red-700 border-red-100',
  'Cancelado': 'bg-gray-50 text-gray-700 border-gray-100',
  'Rascunho': 'bg-gray-50 text-gray-700 border-gray-100',
  'Pendente de Aprovação': 'bg-orange-50 text-orange-700 border-orange-100'
};

export default function RequestDetail({ requestId, onBack }: RequestDetailProps) {
  const { config, updateConfig, updateRequest, approveRequest, rejectRequest, returnRequest, cancelRequest } = useAppConfig();
  const { addToast } = useToast();
  const [comment, setComment] = useState('');

  const request = useMemo(() => config.solicitacoes.find(r => r.id === requestId), [config.solicitacoes, requestId]);

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
        <AlertCircle size={48} className="text-gray-300" />
        <h2 className="text-xl font-black">Solicitação não encontrada</h2>
        <Button onClick={onBack} variant="outline">Voltar</Button>
      </div>
    );
  }

  // `requesterId` guarda o id do USUÁRIO, mas os dados cadastrais (matrícula,
  // setor, CC, filial) vivem em Employee — comparar direto com `colaboradores`
  // nunca casava, pois os namespaces são disjuntos (JYNX-00x vs EMP-0xx).
  const requesterUser = config.usuariosDemo.find(u => u.id === request.requesterId);
  const requesterEmployee =
    config.colaboradores.find(e => e.id === requesterUser?.employeeId) ||
    config.colaboradores.find(e => e.id === request.requesterId);

  // Snapshots antigos gravaram sentinelas quando não havia colaborador vinculado
  const fromSnapshot = (v?: string) => (v && v !== 'N/A' && v !== '00000' ? v : undefined);
  const snap = request.requesterSnapshot;
  const requester = {
    name: snap?.name || requesterUser?.name || requesterEmployee?.name || request.solicitante,
    registration: fromSnapshot(snap?.registration) || requesterEmployee?.registration,
    role: fromSnapshot(snap?.role) || requesterEmployee?.role || requesterUser?.role,
    department: fromSnapshot(snap?.department) || requesterEmployee?.department,
    costCenter: fromSnapshot(snap?.costCenter) || requesterEmployee?.costCenter,
    branch: fromSnapshot(snap?.branch) || requesterEmployee?.branch,
    manager: requesterEmployee?.manager,
  };
  const targetEmployee = config.colaboradores.find(e => e.id === request.employeeId);
  const processId = request.processId || '';
  const processDef = PROCESS_DEFINITIONS[processId];

  const finalStatuses = ['Concluída', 'Concluído', 'Reprovada', 'Cancelada', 'Cancelado'] as const;
  const isFinalStatus = finalStatuses.includes(request.status as typeof finalStatuses[number]);
  const canTakeAction = !isFinalStatus;

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const handleAction = (action: 'approve' | 'reject' | 'return') => {
    if (action === 'approve') {
      approveRequest(request.id, comment);
      addToast('Solicitação aprovada com sucesso.', 'success');
      onBack();
    } else if (action === 'reject') {
      if (!comment.trim()) { addToast('Por favor, informe o motivo.', 'error'); return; }
      rejectRequest(request.id, comment);
      addToast('Solicitação reprovada.', 'error');
      setIsRejectModalOpen(false);
      onBack();
    } else if (action === 'return') {
      if (!comment.trim()) { addToast('Por favor, informe o motivo.', 'error'); return; }
      returnRequest(request.id, comment);
      addToast('Solicitação devolvida para ajuste.', 'success');
      setIsReturnModalOpen(false);
      onBack();
    }
  };

  const parseDateString = (dateString: string) => {
    if (!dateString) return null;
    const str = dateString.trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
    const dmYMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmYMatch) return new Date(`${dmYMatch[3]}-${dmYMatch[2]}-${dmYMatch[1]}`);
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = parseDateString(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: any) => {
    if (value === undefined || value === null) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  // A chave em `request.data` é `id || name`. Vários campos podem compartilhar o
  // mesmo `id` (cargo ↔ cargoRep ↔ cargoNovo), então desempata pela `condition`
  // avaliada sobre os próprios dados salvos — é o campo que estava visível.
  const findFieldDef = (key: string) => {
    if (!processDef) return null;
    const matches = processDef.steps
      .flatMap(step => step.fields)
      .filter(f => ((f as any).id || f.name) === key);
    if (matches.length === 0) return null;
    return matches.find(f => !f.condition || f.condition(request.data)) || matches[0];
  };

  // options aceita string[] ou { label, value }[] — exibe sempre o rótulo
  const getOptionLabel = (fieldDef: any, value: any): string => {
    const options = fieldDef?.options;
    if (!Array.isArray(options)) return String(value);
    const match = options.find((opt: any) => (opt && typeof opt === 'object' ? opt.value : opt) === value);
    if (match === undefined) return String(value);
    return typeof match === 'object' ? String(match.label ?? value) : String(match);
  };

  const renderValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return <span className="text-gray-300">—</span>;

    const fieldDef = findFieldDef(key);

    if (fieldDef?.type === 'currency' || key.toLowerCase().includes('salario') || key.toLowerCase().includes('remuneracao') || key.toLowerCase().includes('valor')) {
      return <span className="font-mono font-bold text-gray-900">{formatCurrency(value)}</span>;
    }

    if (fieldDef?.type === 'date' || key.toLowerCase().includes('data') || key.toLowerCase().includes('vigencia')) {
      return <span className="font-bold text-gray-900">{formatDate(value)}</span>;
    }

    if (fieldDef?.type === 'boolean' || typeof value === 'boolean') {
      return (
        <Badge className={value ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      );
    }

    if (fieldDef?.type === 'status' || key === 'status') {
      return <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}>{value}</Badge>;
    }

    // Selects guardam o valor técnico (aumento_quadro) — exibir o rótulo
    if (fieldDef?.type === 'select' || fieldDef?.type === 'radio' || fieldDef?.type === 'multiselect') {
      const labels = Array.isArray(value)
        ? value.map(v => getOptionLabel(fieldDef, v)).join(', ')
        : getOptionLabel(fieldDef, value);
      return <span className="font-bold text-gray-900">{labels}</span>;
    }

    return <span className="font-bold text-gray-900">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg">
      {/* Modals */}
      <AnimatePresence>
        {(isReturnModalOpen || isRejectModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">
                    {isReturnModalOpen ? 'Devolver para Ajuste' : 'Reprovar Solicitação'}
                  </h3>
                  <button onClick={() => { setIsReturnModalOpen(false); setIsRejectModalOpen(false); }} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>
                
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Informe o motivo detalhado..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                />

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setIsReturnModalOpen(false); setIsRejectModalOpen(false); }}>Cancelar</Button>
                  <Button 
                    className={`flex-1 ${isReturnModalOpen ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={() => handleAction(isReturnModalOpen ? 'return' : 'reject')}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-brand-border px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/5 rounded-2xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/10">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{request.processName || 'Processo Administrativo'}</h1>
                <Badge className={statusColors[request.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-600'}>
                  {request.status}
                </Badge>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Protocolo #{request.numero || request.id}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200">Imprimir</Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pb-24 xl:pb-12">
          <div className="max-w-5xl mx-auto space-y-8 pb-12">
            
            {/* 1. IDENTIFICAÇÃO DO SOLICITANTE */}
            <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
              <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                <User size={18} className="text-brand-primary" />
                <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Identificação do Solicitante</h2>
              </div>
              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-8">
                <div className="space-y-1">
                  <span className="label-caps">Matrícula</span>
                  <p className="text-[16px] font-black text-gray-900 tabular-nums">{requester?.registration || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="label-caps">Cargo</span>
                  <p className="text-[16px] font-black text-gray-900">{requester?.role || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="label-caps">Setor / Departamento</span>
                  <p className="text-[16px] font-black text-gray-900">{requester?.department || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="label-caps">Centro de Custo</span>
                  <p className="text-[16px] font-black text-gray-900">{requester?.costCenter || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="label-caps">Filial / Unidade</span>
                  <p className="text-[16px] font-black text-gray-900">{requester?.branch || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="label-caps">Gestor Direto</span>
                  <p className="text-[16px] font-black text-gray-900">{requester?.manager || '—'}</p>
                </div>
              </div>
            </div>

            {/* 2. ALVO DA SOLICITAÇÃO (se houver colaborador alvo) */}
            {targetEmployee && (
              <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
                <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                  <Target size={18} className="text-brand-primary" />
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Alvo da Solicitação</h2>
                </div>
                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-8">
                  <div className="space-y-1">
                    <span className="label-caps">Colaborador</span>
                    <p className="text-[16px] font-black text-gray-900">{targetEmployee.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="label-caps">Matrícula</span>
                    <p className="text-[16px] font-black text-gray-900 tabular-nums">{targetEmployee.registration}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="label-caps">Cargo Atual</span>
                    <p className="text-[16px] font-black text-gray-900">{targetEmployee.role}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="label-caps">Setor</span>
                    <p className="text-[16px] font-black text-gray-900">{targetEmployee.department}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="label-caps">Filial</span>
                    <p className="text-[16px] font-black text-gray-900">{targetEmployee.branch}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. DADOS PREENCHIDOS (DINÂMICO) */}
            <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
              <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                <List size={18} className="text-brand-primary" />
                <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Dados da Solicitação</h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12">
                  {Object.entries(request.data).map(([key, value]) => {
                    // Find label from process definition
                    let label = key;
                    let gridCols = 1;
                    const field = findFieldDef(key);
                    if (field) {
                      label = field.label;
                      gridCols = field.gridCols || 1;
                      if (field.type === 'section' || field.type === 'info') return null;
                    }

                    // Skip internal fields
                    if (key.endsWith('Id') || key === 'colaborador' || key === 'matricula') return null;

                    const isTextArea = gridCols === 3 || key === 'justificativa' || key === 'observacao' || key === 'parecer' || key === 'motivo';

                    return (
                      <div key={key} className={`space-y-1.5 ${isTextArea ? 'md:col-span-full' : ''}`}>
                        <span className="label-caps">{label}</span>
                        <div className={`text-[15px] ${isTextArea ? 'bg-gray-50/50 p-5 rounded-2xl border border-gray-100 font-medium text-gray-600 italic leading-relaxed' : ''}`}>
                          {renderValue(key, value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. ANEXOS */}
            {request.attachments && request.attachments.length > 0 && (
              <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
                <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                  <Save size={18} className="text-brand-primary" />
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Documentos e Anexos</h2>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-brand-primary/20 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-gray-900">{att}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF • 1.2MB</p>
                        </div>
                      </div>
                      <Download size={16} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-96 bg-white border-l border-brand-border flex flex-col shrink-0 hidden xl:flex">
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-10">
            {/* AUDIT TRAIL */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Trilha de Auditoria</h3>
                <History size={16} className="text-gray-400" />
              </div>

              <div className="relative space-y-10 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
                {/* Initial Creation */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-green-500 shadow-sm ring-4 ring-white z-10"></div>
                  <div className="pl-8">
                    <p className="text-[13px] font-black text-gray-900">Solicitação Criada</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">{formatDate(request.createdAt)} • {requester?.name}</p>
                    <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">"Solicitação iniciada via portal RH360"</p>
                  </div>
                </div>

                {/* Automation Step */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm ring-4 ring-white z-10"></div>
                  <div className="pl-8">
                    <p className="text-[13px] font-black text-gray-900">Encaminhado para Alçada</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">{formatDate(request.createdAt)} • Fluxo Automático</p>
                    <p className="text-[10px] text-blue-500 mt-2 font-bold uppercase tracking-widest">Aguardando Diretoria</p>
                  </div>
                </div>

                {/* History entries if any */}
                {request.historico?.map((h, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className={`absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ring-4 ring-white z-10 ${
                      h.para?.includes('Aprovada') ? 'bg-green-500' : 
                      h.para?.includes('Reprovada') ? 'bg-red-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="pl-8">
                      <p className="text-[13px] font-black text-gray-900">{h.action || h.para}</p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">{formatDate(h.timestamp || h.dataHora)} • {h.autor || h.userName}</p>
                      {h.comentario && (
                        <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">"{h.comentario}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA / INFO */}
            <div className="bg-brand-primary/5 rounded-2xl border border-brand-primary/10 p-6 space-y-4">
              <div className="flex items-center gap-3 text-brand-primary">
                <Clock size={20} />
                <h4 className="text-[12px] font-black uppercase tracking-widest">Indicadores de SLA</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gray-500">Tempo de Atendimento</span>
                    <span className="text-[11px] font-black text-brand-primary uppercase">Dentro do Prazo</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary w-2/3"></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                  Este processo tem um SLA total de <span className="font-bold">72 horas úteis</span>. Faltam <span className="font-bold">24 horas</span> para expirar a alçada atual.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="fixed right-4 bottom-4 z-50 w-[min(96vw,460px)] rounded-[28px] border border-gray-200 bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {canTakeAction ? (
            <>
              <Button variant="outline" className="w-full sm:w-auto text-purple-600 border-purple-100 hover:bg-purple-50 font-black text-[10px] tracking-widest uppercase h-12 rounded-xl" onClick={() => setIsReturnModalOpen(true)}>Devolver</Button>
              <Button variant="outline" className="w-full sm:w-auto text-red-500 border-red-100 hover:bg-red-50 font-black text-[10px] tracking-widest uppercase h-12 rounded-xl" onClick={() => setIsRejectModalOpen(true)}>Reprovar</Button>
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 font-black text-[10px] tracking-widest uppercase h-12 rounded-xl shadow-lg shadow-green-600/20" onClick={() => handleAction('approve')}>Aprovar</Button>
            </>
          ) : (
            <Button variant="outline" fullWidth className="h-12 rounded-xl text-[11px] font-black uppercase tracking-widest" onClick={onBack}>
              Fechar Visualização
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FileCheck({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>
    </svg>
  );
}
