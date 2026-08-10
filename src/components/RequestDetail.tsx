import React, { useState, useMemo } from 'react';
import {
  X, Check, CornerUpLeft, AlertCircle, FileText,
  CheckCircle2, Target, Activity, Users, Clock, Download,
  User, List, Save, ChevronRight, Plus, Info, AlertTriangle, ArrowLeft,
  Building, MapPin, Briefcase, Hash, History, MessageSquare, DollarSign,
  ClipboardCheck
} from 'lucide-react';
import { RHRequest, HistoryEntry } from '../types';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { PROCESS_DEFINITIONS } from '../processDefinitions';
import { getStatusVariant } from '../utils/requestStatus';
import { ensureApprovalChain, getCurrentLevelIndex } from '../utils/approvalFlow';
import { TrilhaAprovacoes, TrilhaContainer } from './request/TrilhaAprovacoes';
import {
  findFieldDef as findFieldDefinition,
  formatCurrencyBR,
  formatRequestDate,
  getOptionLabel
} from '../utils/requestFields';
import { PROCESSO_DESLIGAMENTO, podeExecutarEncerramento } from '../utils/permissions';
import { resolverSolicitante } from '../utils/identidade';
import { ReadOnlyField, READONLY_SURFACE } from './ui/ReadOnlyField';

interface RequestDetailProps {
  requestId: string;
  onBack: () => void;
}

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

  // Identidade de quem abriu: fonte única em utils/identidade, com o CADASTRO
  // na frente do snapshot. `requesterId` guarda o id do USUÁRIO e os dados
  // cadastrais vivem em Employee — namespaces disjuntos (GEST-001 vs EMP-005),
  // e é o resolver que faz a ponte.
  const requester = resolverSolicitante(request, config.usuariosDemo, config.colaboradores);
  const targetEmployee = config.colaboradores.find(e => e.id === request.employeeId);
  const processId = request.processId || '';
  const processDef = PROCESS_DEFINITIONS[processId];

  // 'Recebimento Confirmado' encerra o protocolo de VR/VA: não há o que aprovar.
  // 'Aguardando Encerramento' entra aqui porque a cascata já aprovou tudo — o
  // que falta é a etapa de Benefícios e Encerramento, não uma nova aprovação.
  const finalStatuses = ['Concluída', 'Concluído', 'Recebimento Confirmado', 'Reprovada', 'Cancelada', 'Cancelado', 'Aguardando Encerramento'] as const;
  const isFinalStatus = finalStatuses.includes(request.status as typeof finalStatuses[number]);
  const canTakeAction = !isFinalStatus;

  // Desligamento aprovado esperando o RH/DP: a tela ganha o acesso à etapa.
  const aguardandoEncerramento =
    (request.tipoProcesso || request.processId) === PROCESSO_DESLIGAMENTO &&
    request.status === 'Aguardando Encerramento';
  const podeEncerrar = podeExecutarEncerramento(config.usuarioAtual);
  const abrirEncerramento = () =>
    updateConfig({ activeView: 'desligamento-encerramento', currentRequestId: request.id });

  // Cascata de aprovação desta solicitação (reconstruída para pedidos antigos).
  const approvalProcess = config.processos.find(p => p.id === (request.tipoProcesso || request.processId));
  const approvalChain = ensureApprovalChain(request, approvalProcess);
  const currentLevelIndex = getCurrentLevelIndex(approvalChain);

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

  // Leitura dos dados salvos: rótulo, tipo e opções vêm da definição do
  // processo (utils/requestFields, compartilhado com a etapa de encerramento).
  const formatDate = formatRequestDate;
  const formatCurrency = formatCurrencyBR;
  const findFieldDef = (key: string) => findFieldDefinition(processDef, key, request.data);

  const renderValue = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') return <span className="text-gray-300">—</span>;

    const fieldDef = findFieldDef(key);

    if (fieldDef?.type === 'currency' || key.toLowerCase().includes('salario') || key.toLowerCase().includes('remuneracao') || key.toLowerCase().includes('valor')) {
      return <span className="font-mono font-bold text-gray-900">{formatCurrency(value)}</span>;
    }

    if (fieldDef?.type === 'date' || key.toLowerCase().includes('data') || key.toLowerCase().includes('vigencia')) {
      return <span className="font-bold text-gray-900">{formatDate(value)}</span>;
    }

    // Assinatura eletrônica: mostra quem assinou e quando, não o objeto cru.
    if (fieldDef?.type === 'signature' || (value && typeof value === 'object' && value.signed)) {
      return (
        <span className="font-bold text-green-700">
          {value.name}
          {value.registration ? ` (${value.registration})` : ''}
          {value.date ? ` — ${new Date(value.date).toLocaleString('pt-BR')}` : ''}
        </span>
      );
    }

    if (fieldDef?.type === 'boolean' || fieldDef?.type === 'checkbox' || typeof value === 'boolean') {
      return (
        <Badge className={value ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      );
    }

    if (fieldDef?.type === 'status' || key === 'status') {
      return <Badge variant={getStatusVariant(String(value))}>{value}</Badge>;
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
                <Badge variant={getStatusVariant(request.status)}>
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

      {/* Content — em telas &lt; xl vira coluna única (uma só rolagem); em xl, dois painéis */}
      <main className="flex-1 xl:overflow-hidden overflow-y-auto flex flex-col xl:flex-row">
        <div className="flex-1 xl:overflow-y-auto custom-scrollbar p-8 pb-24 xl:pb-12">
          <div className="max-w-5xl mx-auto space-y-8 pb-12">

            {/* 0. ETAPA PENDENTE DO RH/DP (desligamento aprovado) */}
            {aguardandoEncerramento && (
              <div className="bg-white rounded-[24px] border border-blue-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-12 h-12 shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                    <ClipboardCheck size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-black text-gray-900 tracking-tight">Etapa pendente: Benefícios e Encerramento</h2>
                    <p className="text-[13px] text-gray-500 font-medium leading-relaxed mt-1">
                      Todas as alçadas aprovaram. O RH/DP precisa lançar as verbas rescisórias, executar o
                      checklist de encerramento e anexar os documentos para concluir o desligamento.
                    </p>
                  </div>
                  <Button
                    className="shrink-0"
                    leftIcon={<ClipboardCheck size={16} />}
                    disabled={!podeEncerrar}
                    onClick={abrirEncerramento}
                  >
                    Abrir etapa
                  </Button>
                </div>
                {!podeEncerrar && (
                  <p className="px-6 sm:px-8 pb-6 -mt-2 text-[12px] font-medium text-gray-400">
                    Etapa restrita ao RH/DP — você pode acompanhar, mas não executar.
                  </p>
                )}
              </div>
            )}

            {/* 1. IDENTIFICAÇÃO DO SOLICITANTE */}
            <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
              <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                <User size={18} className="text-brand-primary" />
                <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Identificação do Solicitante</h2>
              </div>
              {/* Tudo aqui vem da ficha do solicitante, nada foi digitado na
                  solicitação: caixa cinza de leitura (ui/ReadOnlyField). */}
              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                <ReadOnlyField label="Matrícula" value={requester?.registration} />
                <ReadOnlyField label="Cargo" value={requester?.role} />
                <ReadOnlyField label="Setor / Departamento" value={requester?.department} />
                <ReadOnlyField label="Centro de Custo" value={requester?.costCenter} />
                <ReadOnlyField label="Filial / Unidade" value={requester?.branch} />
                <ReadOnlyField label="Gestor Direto" value={requester?.manager} />
              </div>
            </div>

            {/* 2. ALVO DA SOLICITAÇÃO (se houver colaborador alvo) */}
            {targetEmployee && (
              <div className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm">
                <div className="px-8 py-4 bg-gray-50 border-b border-brand-border flex items-center gap-3">
                  <Target size={18} className="text-brand-primary" />
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-gray-900">Alvo da Solicitação</h2>
                </div>
                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                  <ReadOnlyField label="Colaborador" value={targetEmployee.name} />
                  <ReadOnlyField label="Matrícula" value={targetEmployee.registration} />
                  <ReadOnlyField label="Cargo Atual" value={targetEmployee.role} />
                  <ReadOnlyField label="Setor" value={targetEmployee.department} />
                  <ReadOnlyField label="Filial" value={targetEmployee.branch} />
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

                    // Campo origin 'F' foi o sistema que trouxe (cargo, setor,
                    // admissão): mesma caixa cinza do formulário, para o leitor
                    // distinguir num relance o que o solicitante de fato digitou.
                    if (field?.origin === 'F' && !isTextArea) {
                      return <ReadOnlyField key={key} label={label} value={renderValue(key, value)} />;
                    }

                    return (
                      <div key={key} className={`space-y-1.5 ${isTextArea ? 'md:col-span-full' : ''}`}>
                        <span className="label-caps">{label}</span>
                        <div className={`text-[15px] ${isTextArea ? `${READONLY_SURFACE} p-5 rounded-2xl border font-medium italic leading-relaxed` : ''}`}>
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

        {/* Sidebar — abaixo do conteúdo em telas menores, painel lateral em xl */}
        <aside className="w-full xl:w-96 bg-white border-t xl:border-t-0 xl:border-l border-brand-border flex flex-col shrink-0">
          <div className="p-8 xl:flex-1 xl:overflow-y-auto custom-scrollbar space-y-10">
            {/* AUDIT TRAIL */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Trilha de Auditoria</h3>
                <History size={16} className="text-gray-400" />
              </div>

              <TrilhaContainer>
                {/* Initial Creation */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-green-500 shadow-sm ring-4 ring-white z-10"></div>
                  <div className="pl-8">
                    <p className="text-[13px] font-black text-gray-900">Solicitação Criada</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">{formatDate(request.createdAt)} • {requester?.name}</p>
                    <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">"Solicitação iniciada via portal RH360"</p>
                  </div>
                </div>

                {/* Cascata de alçadas: um item por nível configurado que se aplica
                    a esta solicitação, na ordem em que precisam aprovar. */}
                <TrilhaAprovacoes
                  chain={approvalChain}
                  currentLevelIndex={currentLevelIndex}
                  encerrada={isFinalStatus}
                />

                {/* Desligamento: a etapa do RH/DP entra na trilha depois das alçadas. */}
                {aguardandoEncerramento && (
                  <div className="relative flex items-start gap-4">
                    <div className="absolute left-0 mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm ring-4 ring-white z-10"></div>
                    <div className="pl-8">
                      <p className="text-[13px] font-black text-gray-900">Benefícios e Encerramento</p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">RH / DP</p>
                      <p className="text-[10px] mt-2 font-bold uppercase tracking-widest text-blue-500">Aguardando execução</p>
                    </div>
                  </div>
                )}

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
              </TrilhaContainer>
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
          ) : aguardandoEncerramento && podeEncerrar ? (
            <>
              <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl text-[11px] font-black uppercase tracking-widest" onClick={onBack}>Fechar</Button>
              <Button className="w-full sm:w-auto h-12 rounded-xl text-[10px] font-black uppercase tracking-widest" leftIcon={<ClipboardCheck size={16} />} onClick={abrirEncerramento}>
                Benefícios e Encerramento
              </Button>
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
