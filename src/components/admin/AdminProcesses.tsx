import React, { useState } from 'react';
import { 
  Target, Shield, Clock, Plus, Trash2, Edit3, 
  Search, ChevronRight, CheckCircle2, XCircle, 
  Zap, Power, Layout, Cpu, Share2, Save, 
  Info, AlertCircle, History, PlayCircle,
  Copy, RotateCcw, FileText, Settings2, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, Table } from '../ui/CardAndTable';
import { Badge } from '../ui/Badge';
import { Modal, Tabs } from '../ui/Misc';
import { Select } from '../ui/Select';
import { useAppConfig } from '../../contexts/AppConfigContext';
import { RHProcess, ApprovalStep, ApprovalResponsibilityType } from '../../types';
import { PROCESS_DEFINITIONS } from '../../processDefinitions';
import { RESPONSIBILITY_LABELS, VALUE_FIELD_PATTERN } from '../../utils/approvalFlow';

export default function AdminProcesses() {
  const { config, updateConfig } = useAppConfig();
  const [selectedProcessId, setSelectedProcessId] = useState<string>(config.processos[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'general' | 'permissions' | 'approvals' | 'sla' | 'handoff' | 'ai' | 'history'>('general');
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedProcess = config.processos.find(p => p.id === selectedProcessId);

  if (!selectedProcess) return null;

  const updateProcess = (updates: Partial<RHProcess>) => {
    updateConfig({
      processos: config.processos.map(p => p.id === selectedProcessId ? { ...p, ...updates } : p)
    });
  };

  const publishVersion = () => {
    if (confirm(`Deseja publicar a Versão ${selectedProcess.version + 1}? Novas solicitações usarão estas regras imediatamente.`)) {
      updateProcess({ version: selectedProcess.version + 1 });
      // In a real app we would log the snapshot here
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Process List */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="label-caps opacity-60 px-2 flex items-center justify-between">
          Processos Ativos
          <button className="p-1 hover:bg-gray-100 rounded-md text-orange-500">
            <Plus size={14} />
          </button>
        </h3>
        <div className="space-y-1 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
          {config.processos.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProcessId(p.id)}
              className={`w-full text-left px-4 py-3 rounded-[14px] font-bold text-[13px] transition-all border flex items-center justify-between ${
                selectedProcessId === p.id 
                  ? 'bg-gray-900 border-gray-900 text-white shadow-lg' 
                  : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{p.name}</span>
              {!p.ativo && <Badge variant="gray" size="sm">OFF</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel: Configuration */}
      <div className="lg:col-span-3 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-[16px] border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
              <Settings2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-black text-gray-900 tracking-tight">{selectedProcess.name}</h2>
                 <Badge variant="blue">v{selectedProcess.version}.0</Badge>
              </div>
              <p className="text-[13px] text-gray-500 font-medium">{selectedProcess.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" leftIcon={<PlayCircle size={16} />} onClick={() => setIsSimulating(true)}>Simular Trilha</Button>
             <Button variant="outline" size="sm" leftIcon={<History size={16} />}>Restaurar</Button>
             <Button size="sm" onClick={publishVersion}>Publicar</Button>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="bg-white p-2 rounded-[14px] border border-gray-100 flex flex-wrap gap-1 overflow-x-auto">
          {[
            { id: 'general', label: 'Geral', icon: <Info size={14} /> },
            { id: 'permissions', label: 'Permissões', icon: <Shield size={14} /> },
            { id: 'approvals', label: 'Aprovações', icon: <CheckCircle2 size={14} /> },
            { id: 'sla', label: 'SLA / Notif.', icon: <Clock size={14} /> },
            { id: 'handoff', label: 'Conclusão', icon: <ArrowRight size={14} /> },
            { id: 'ai', label: 'IA / Integ.', icon: <Cpu size={14} /> },
            { id: 'history', label: 'Histórico', icon: <History size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[12px] transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="animate-in fade-in duration-500">
           {activeTab === 'general' && <GeneralConfig process={selectedProcess} update={updateProcess} />}
           {activeTab === 'approvals' && <ApprovalsConfig process={selectedProcess} update={updateProcess} />}
           {activeTab === 'handoff' && <HandoffConfig process={selectedProcess} update={updateProcess} />}
           {activeTab === 'permissions' && <PermissionsConfig process={selectedProcess} update={updateProcess} />}
           {activeTab === 'ai' && <AIConfig process={selectedProcess} update={updateProcess} />}
           {activeTab === 'history' && <HistoryView process={selectedProcess} />}
           {activeTab === 'sla' && <SLAConfig process={selectedProcess} update={updateProcess} />}
        </div>
      </div>

      <TrailSimulator isOpen={isSimulating} onClose={() => setIsSimulating(false)} process={selectedProcess} />
    </div>
  );
}

function GeneralConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  return (
    <Card className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Status do Processo</label>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="text-[13px] font-bold text-gray-700">{process.ativo ? 'Processo Ativo' : 'Processo Inativo'}</span>
                <button 
                  onClick={() => update({ ativo: !process.ativo })}
                  className={`w-12 h-6 rounded-full relative transition-colors ${process.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${process.ativo ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Processo</label>
              <input 
                type="text" 
                value={process.name}
                onChange={(e) => update({ name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500" 
              />
           </div>
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
              <textarea 
                value={process.description}
                onChange={(e) => update({ description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500 h-24" 
              />
           </div>
        </div>
        <div className="space-y-6">
           <div className="bg-orange-50 p-6 rounded-[28px] border border-orange-100 space-y-4">
              <h4 className="label-caps opacity-60 flex items-center gap-2"><Zap size={14} /> Opções Avançadas</h4>
              <div className="space-y-3">
                 {[
                   { label: 'Permitir Rascunho', field: 'allowDraft' },
                   { label: 'Permitir Cancelamento', field: 'allowCancel' },
                   { label: 'Processo Sigiloso', field: 'isSensitive' },
                 ].map(opt => (
                   <label key={opt.field} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{opt.label}</span>
                      <input 
                        type="checkbox" 
                        checked={(process as any)[opt.field]}
                        onChange={(e) => update({ [opt.field]: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-0" 
                      />
                   </label>
                 ))}
              </div>
           </div>
           <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Grupo Executor (Backoffice)</label>
              <select 
                value={process.executorGroup || ''}
                onChange={(e) => update({ executorGroup: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-orange-500"
              >
                <option value="">Selecione um grupo...</option>
                <option value="RH/DP">RH/DP</option>
                <option value="TI">TI / Infra</option>
                <option value="Financeiro">Financeiro</option>
              </select>
           </div>
        </div>
      </div>
    </Card>
  );
}

// Input com a mesma altura, raio e tipografia do <Select> padronizado, para os
// campos livres ficarem alinhados aos dropdowns na mesma grade.
// Sem largura: quem usa define (w-full na grade, w-20 no SLA) — misturar duas
// classes de width no mesmo elemento deixa o resultado à mercê da ordem do CSS.
const FIELD_CLASS = 'bg-white border border-gray-200 rounded-[8px] px-3 py-2 text-[12px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 placeholder:text-gray-400 placeholder:font-medium';

// Os rótulos das alçadas vêm do motor de aprovação: a tela de configuração e a
// trilha da solicitação precisam chamar a mesma coisa pelo mesmo nome.
const RESPONSIBILITY_ORDER: ApprovalResponsibilityType[] = [
  'pessoa', 'grupo', 'gestor-direto', 'gestor-setor', 'responsavel-cc', 'rh-filial', 'diretoria', 'presidencia'
];

const RESPONSIBILITY_OPTIONS = RESPONSIBILITY_ORDER.map(value => ({
  value,
  label: RESPONSIBILITY_LABELS[value]
}));

const SLA_UNIT_OPTIONS = [
  { value: 'h', label: 'horas' },
  { value: 'd', label: 'dias' },
];

const RETURN_OPTIONS = [
  { value: 'anterior', label: 'Etapa anterior' },
  { value: 'inicio', label: 'Início do fluxo' },
];

// Modos de acionamento — em linguagem de negócio, não de banco de dados.
const TRIGGER_OPTIONS = [
  { value: 'sempre', label: 'Sempre' },
  { value: 'condicao', label: 'Quando uma condição for atendida' },
];

const OPERATOR_OPTIONS = [
  { value: '>', label: 'for maior que' },
  { value: '<', label: 'for menor que' },
  { value: '==', label: 'for igual a' },
  { value: 'contains', label: 'contiver' },
];

const OPERATOR_SHORT: Record<string, string> = {
  '>': 'maior que', '<': 'menor que', '>=': 'maior ou igual a',
  '<=': 'menor ou igual a', '==': 'igual a', '!=': 'diferente de', 'contains': 'contém'
};

function ApprovalsConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  // Só um nível fica aberto por vez: a tela mostra a cascata inteira e o detalhe
  // aparece quando o usuário quer editar.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Campos do formulário do processo que podem ser comparados numa condição.
  const conditionFields = (PROCESS_DEFINITIONS[process.id]?.steps?.[0]?.fields || [])
    .filter(f => ['currency', 'number', 'percent', 'select', 'radio', 'text', 'calc'].includes(f.type))
    .map(f => ({ name: (f as any).id || (f as any).name, label: f.label, type: f.type }))
    .filter(f => !!f.name);

  // Campo usado quando o nível não escolhe um: mesma regra do motor (primeiro
  // campo monetário do formulário), aqui só para descrever a condição.
  const autoField = conditionFields.find(f => VALUE_FIELD_PATTERN.test(f.name) && (f.type === 'currency' || f.type === 'number'));

  const fieldOf = (step: ApprovalStep) =>
    conditionFields.find(f => f.name === step.conditionField) || (step.conditionField ? undefined : autoField);

  const formatValue = (step: ApprovalStep) => {
    const raw = step.conditionValue;
    if (raw === undefined || raw === '') return '—';
    const field = fieldOf(step);
    const num = Number(String(raw).replace(',', '.'));
    if (field?.type === 'currency' && !Number.isNaN(num)) {
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }
    return String(raw);
  };

  // "Sempre" ou "Se Salário Sugerido for maior que R$ 10.000"
  const describeTrigger = (step: ApprovalStep) => {
    if (!step.conditionOperator) return 'Sempre';
    const fieldLabel = fieldOf(step)?.label || 'valor da solicitação';
    return `Se ${fieldLabel} for ${OPERATOR_SHORT[step.conditionOperator] || step.conditionOperator} ${formatValue(step)}`;
  };

  const describeSla = (step: ApprovalStep) => `${step.sla || 0}${step.slaUnit === 'd' ? 'd' : 'h'}`;

  // Frase de resumo do fluxo inteiro, no topo.
  const flowSummary = process.approvals.length === 0
    ? 'Nenhuma alçada configurada: uma única aprovação do RH conclui a solicitação.'
    : `Esta solicitação passa por ${process.approvals.length} ${process.approvals.length === 1 ? 'aprovação' : 'aprovações'}: ` +
      process.approvals
        .map(s => `${RESPONSIBILITY_LABELS[s.responsibilityType]}${s.conditionOperator ? ` (${describeTrigger(s).replace(/^Se /, 'se ')})` : ''}`)
        .join(' → ') + '.';

  const addStep = () => {
    if (process.approvals.length >= 5) return;
    const newStep: ApprovalStep = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Aprovação ${process.approvals.length + 1}`,
      order: process.approvals.length + 1,
      active: true,
      responsibilityType: 'gestor-direto',
      sla: 24,
      slaUnit: 'h',
      isMandatory: true,
      // "Sempre" é o padrão: o nível entra em todo pedido até que alguém
      // configure uma condição.
      conditionOperator: undefined,
      conditionField: undefined,
      conditionValue: undefined
    };
    update({ approvals: [...process.approvals, newStep] });
    setExpandedId(newStep.id); // já abre o nível recém-criado para configuração
  };

  const updateStep = (id: string, updates: Partial<ApprovalStep>) => {
    update({
      approvals: process.approvals.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  // Voltar para "Sempre" limpa campo e valor: sem operador eles não são
  // avaliados, e deixá-los preenchidos só confunde quem reabre a configuração.
  const setTrigger = (step: ApprovalStep, mode: string) => {
    updateStep(step.id, mode === 'condicao'
      ? { conditionOperator: step.conditionOperator || '>' }
      : { conditionOperator: undefined, conditionField: undefined, conditionValue: undefined }
    );
  };

  const removeStep = (id: string) => {
    update({ approvals: process.approvals.filter(s => s.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-6">
       {/* Cabeçalho + resumo do fluxo em uma frase */}
       <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div>
                <h3 className="text-[17px] font-black text-gray-900 tracking-tight">Níveis de Aprovação</h3>
                <p className="text-[13px] text-gray-500 font-medium">
                  Quem precisa aprovar esta solicitação, e em que ordem. Até 5 níveis.
                </p>
             </div>
             <Button
               variant="outline"
               size="sm"
               leftIcon={<Plus size={14} />}
               onClick={addStep}
               disabled={process.approvals.length >= 5}
               className="shrink-0"
             >
               Adicionar Nível
             </Button>
          </div>

          <div className="flex items-start gap-3 rounded-[12px] bg-gray-50 px-4 py-3">
             <Info size={15} className="text-gray-400 shrink-0 mt-0.5" />
             <p className="text-[13px] text-gray-600 font-medium leading-relaxed">{flowSummary}</p>
          </div>
       </div>

       <div className="space-y-3">
          {process.approvals.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-gray-200 px-6 py-10 text-center space-y-1">
               <p className="text-[13px] font-bold text-gray-500">Nenhum nível configurado</p>
               <p className="text-[12px] text-gray-400 font-medium">
                 Use "Adicionar Nível" para criar a primeira alçada de aprovação.
               </p>
            </div>
          ) : (
            process.approvals.map((step, i) => {
              const isOpen = expandedId === step.id;
              const hasCondition = !!step.conditionOperator;
              return (
              <div
                key={step.id}
                className={`bg-white rounded-[12px] border transition-colors ${isOpen ? 'border-gray-200 subtle-shadow' : 'border-gray-100 hover:border-gray-200'}`}
              >
                 {/* LINHA RESUMO — o essencial do nível, sem edição */}
                 <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : step.id)}
                      aria-expanded={isOpen}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    >
                       <span className="w-7 h-7 shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[12px] font-black">
                          {i + 1}
                       </span>
                       <span className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-[14px] font-bold text-gray-900 truncate">{step.name}</span>
                          {/* O responsável só repete quando o nível foi renomeado. */}
                          {step.name !== RESPONSIBILITY_LABELS[step.responsibilityType] && (
                            <span className="text-[12px] text-gray-500 font-medium truncate">
                              {RESPONSIBILITY_LABELS[step.responsibilityType]}
                            </span>
                          )}
                          <span className="text-[12px] text-gray-400 font-medium truncate">
                            · {describeTrigger(step)}
                          </span>
                       </span>
                       <span className="hidden sm:inline text-[12px] font-bold text-gray-400 tabular-nums shrink-0">
                          {describeSla(step)}
                       </span>
                       {!step.isMandatory && (
                         <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 shrink-0">
                           Opcional
                         </span>
                       )}
                       <ChevronRight
                         size={16}
                         className={`text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                       />
                    </button>
                    <button
                      type="button"
                      title="Remover nível"
                      aria-label={`Remover nível ${i + 1}`}
                      onClick={() => removeStep(step.id)}
                      className="p-1.5 rounded-[8px] text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                       <Trash2 size={15} />
                    </button>
                 </div>

                 {/* DETALHE — só quando o usuário abre para editar */}
                 {isOpen && (
                   <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1.5 min-w-0">
                            <label className="label-caps ml-1">Nome do nível</label>
                            <input
                              type="text"
                              value={step.name}
                              aria-label={`Nome do nível ${i + 1}`}
                              onChange={(e) => updateStep(step.id, { name: e.target.value })}
                              className={`${FIELD_CLASS} w-full`}
                            />
                         </div>
                         <div className="space-y-1.5 min-w-0">
                            <label className="label-caps ml-1">Quem aprova</label>
                            <Select
                              className="w-full"
                              ariaLabel="Quem aprova este nível"
                              value={step.responsibilityType}
                              onChange={(value) => updateStep(step.id, { responsibilityType: value as ApprovalResponsibilityType })}
                              options={RESPONSIBILITY_OPTIONS}
                            />
                         </div>
                      </div>

                      {/* Frase de acionamento: "Este nível é acionado [Sempre]" ou
                          "... [Quando uma condição] · Quando [campo] [for maior que] [valor]" */}
                      <div className="space-y-2">
                         <label className="label-caps ml-1">Quando este nível é acionado</label>
                         <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-600">
                            <span>Este nível é acionado</span>
                            <Select
                              className="min-w-[240px]"
                              ariaLabel="Quando este nível é acionado"
                              value={hasCondition ? 'condicao' : 'sempre'}
                              onChange={(value) => setTrigger(step, value)}
                              options={TRIGGER_OPTIONS}
                            />
                         </div>
                         {hasCondition && (
                           <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-600 pl-1">
                              <span>Quando</span>
                              <Select
                                className="min-w-[200px]"
                                ariaLabel="Campo avaliado na condição"
                                value={step.conditionField || ''}
                                onChange={(value) => updateStep(step.id, { conditionField: value || undefined })}
                                options={[
                                  { value: '', label: autoField ? `${autoField.label} (padrão)` : 'Valor da solicitação' },
                                  ...conditionFields.map(f => ({ value: f.name, label: f.label }))
                                ]}
                              />
                              <Select
                                className="min-w-[150px]"
                                ariaLabel="Comparação"
                                value={step.conditionOperator || '>'}
                                onChange={(value) => updateStep(step.id, { conditionOperator: value as ApprovalStep['conditionOperator'] })}
                                options={OPERATOR_OPTIONS}
                              />
                              <input
                                type="text"
                                value={step.conditionValue || ''}
                                aria-label="Valor da condição"
                                onChange={(e) => updateStep(step.id, { conditionValue: e.target.value })}
                                placeholder="10000"
                                className={`${FIELD_CLASS} w-28`}
                              />
                           </div>
                         )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1.5 min-w-0">
                            <label className="label-caps ml-1">Prazo para aprovar</label>
                            <div className="flex gap-2">
                               <input
                                 type="number"
                                 min={1}
                                 value={step.sla}
                                 aria-label="Prazo para aprovar"
                                 onChange={(e) => updateStep(step.id, { sla: parseInt(e.target.value) || 1 })}
                                 className={`${FIELD_CLASS} w-20 shrink-0`}
                               />
                               <Select
                                 className="flex-1 min-w-0"
                                 ariaLabel="Unidade do prazo"
                                 value={step.slaUnit}
                                 onChange={(value) => updateStep(step.id, { slaUnit: value as ApprovalStep['slaUnit'] })}
                                 options={SLA_UNIT_OPTIONS}
                               />
                            </div>
                         </div>
                         <div className="space-y-1.5 min-w-0">
                            <label className="label-caps ml-1">Se for devolvido, volta para</label>
                            <Select
                              className="w-full"
                              ariaLabel="Destino da devolução"
                              value={step.returnStep || 'anterior'}
                              onChange={(value) => updateStep(step.id, { returnStep: value })}
                              options={RETURN_OPTIONS}
                            />
                         </div>
                      </div>

                      <label className="flex items-center justify-between gap-4 pt-1 cursor-pointer">
                         <span className="text-[13px] font-medium text-gray-600">
                           Aprovação obrigatória
                           <span className="block text-[12px] text-gray-400">
                             Níveis opcionais podem ser dispensados sem bloquear o fluxo.
                           </span>
                         </span>
                         <button
                           type="button"
                           role="switch"
                           aria-checked={step.isMandatory}
                           onClick={() => updateStep(step.id, { isMandatory: !step.isMandatory })}
                           className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${step.isMandatory ? 'bg-emerald-500' : 'bg-gray-300'}`}
                         >
                           <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${step.isMandatory ? 'left-[22px]' : 'left-[3px]'}`} />
                         </button>
                      </label>
                   </div>
                 )}
              </div>
              );
            })
          )}
       </div>
    </div>
  );
}

function HandoffConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  const options = [
    { id: 'updateProfile', label: 'Atualizar Cadastro', desc: 'Sincroniza os novos dados com o Perfil 360.' },
    { id: 'createRecord360', label: 'Registrar no Histórico', desc: 'Cria uma entrada de evento na timeline do colaborador.' },
    { id: 'createTask', label: 'Criar Tarefa Manual', desc: 'Gera pendência no Hub caso a automação não finalize.' },
    { id: 'generateDoc', label: 'Gerar Documento PDF', desc: 'Cria arquivo com os dados da solicitação.' },
    { id: 'requireSignature', label: 'Exigir Assinatura', desc: 'Integra com ZapSign para coleta de rubricas.' },
  ];

  return (
    <Card className="p-8 space-y-8">
       <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Esteira de Conclusão</h3>
          <p className="text-[13px] text-gray-500 font-medium">O que o sistema deve fazer quando o processo for 100% aprovado?</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map(opt => (
            <label key={opt.id} className={`p-5 rounded-[24px] border transition-all cursor-pointer flex items-start gap-4 ${(process.handoffs as any)[opt.id] ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
               <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${(process.handoffs as any)[opt.id] ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}`}>
                 {(process.handoffs as any)[opt.id] && <CheckCircle2 size={14} />}
               </div>
               <input 
                 type="checkbox" 
                 hidden
                 checked={(process.handoffs as any)[opt.id]}
                 onChange={(e) => update({ handoffs: { ...process.handoffs, [opt.id]: e.target.checked } })}
               />
               <div>
                  <p className="font-bold text-[14px] text-gray-900">{opt.label}</p>
                  <p className="text-[12px] text-gray-500 mt-1">{opt.desc}</p>
               </div>
            </label>
          ))}
       </div>

       <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
             <h4 className="label-caps opacity-60">Tipo de Handoff</h4>
             <div className="flex gap-2">
                {['automatico', 'sugestao', 'manual', 'desativado'].map(t => (
                  <button 
                    key={t}
                    onClick={() => update({ handoffs: { ...process.handoffs, handoffType: t } })}
                    className={`flex-1 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${process.handoffs.handoffType === t ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white'}`}
                  >
                    {t}
                  </button>
                ))}
             </div>
          </div>
          <div className="space-y-3">
             <h4 className="label-caps opacity-60">Próximo Processo (Cadeia)</h4>
             <select 
               value={process.handoffs.nextProcessId || ''}
               onChange={(e) => update({ handoffs: { ...process.handoffs, nextProcessId: e.target.value } })}
               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold outline-none"
             >
                <option value="">Nenhum</option>
                <option value="3">Admissão</option>
                <option value="4">Onboarding</option>
                <option value="14">Treinamento</option>
             </select>
          </div>
       </div>
    </Card>
  );
}

function PermissionsConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  return (
    <Card className="p-8 space-y-8">
       <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Permissões de Acesso</h3>
          <p className="text-[13px] text-gray-500 font-medium">Quem pode visualizar ou interagir com este processo?</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h4 className="label-caps opacity-60 border-b border-gray-100 pb-2">Perfis Permitidos</h4>
             <div className="space-y-3">
                {[
                  { id: 'employee', label: 'Colaboradores' },
                  { id: 'manager', label: 'Gestores' },
                  { id: 'hr', label: 'RH / DP' },
                  { id: 'director', label: 'Diretoria' },
                ].map(p => (
                  <label key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer group">
                     <span className="text-[13px] font-bold text-gray-700 group-hover:text-gray-900">{p.label}</span>
                     <input 
                       type="checkbox" 
                       checked={(process.roles as any)[p.id]}
                       onChange={(e) => update({ roles: { ...process.roles, [p.id]: e.target.checked } })}
                       className="w-5 h-5 text-orange-500 rounded border-gray-300" 
                     />
                  </label>
                ))}
             </div>
          </div>
          <div className="space-y-4">
             <h4 className="label-caps opacity-60 border-b border-gray-100 pb-2">Escopo de Visualização</h4>
             <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[28px] space-y-4">
                <p className="text-[12px] text-indigo-900 font-medium leading-relaxed">
                  O escopo define se o usuário vê apenas o seu (Próprio), da sua (Equipe/Setor) ou de toda a (Empresa).
                </p>
                <p className="text-[11px] text-indigo-600 font-medium leading-relaxed">
                  Quando o processo define escopo, ele prevalece; em "Conforme Usuário", vale o escopo cadastrado no usuário.
                </p>
                <div className="space-y-2">
                   <select className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-[13px] font-black uppercase tracking-widest text-indigo-900">
                      <option>Conforme Usuário</option>
                      <option>Forçar Escopo Empresa</option>
                      <option>Forçar Escopo Global</option>
                   </select>
                </div>
             </div>
          </div>
       </div>
    </Card>
  );
}

function AIConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  return (
    <Card className="p-8 space-y-8">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                <Cpu size={18} />
             </div>
             <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Inteligência AI</h3>
                <p className="text-[13px] text-gray-500 font-medium">Configure assistentes virtuais para este processo.</p>
             </div>
          </div>
          <button 
            onClick={() => update({ aiConfig: { ...process.aiConfig, enabled: !process.aiConfig.enabled } })}
            className={`w-14 h-7 rounded-full relative transition-all ${process.aiConfig.enabled ? 'bg-pink-500 shadow-lg shadow-pink-500/20' : 'bg-gray-200'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${process.aiConfig.enabled ? 'left-8' : 'left-1'}`} />
          </button>
       </div>

       {process.aiConfig.enabled ? (
         <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Modelo de Linguagem</label>
                  <select 
                    value={process.aiConfig.model}
                    onChange={(e) => update({ aiConfig: { ...process.aiConfig, model: e.target.value } })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold"
                  >
                     <option value="gemini-1.5-pro">Gemini 1.5 Pro (Nativo)</option>
                     <option value="gemini-1.5-flash">Gemini 1.5 Flash (Veloz)</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Finalidade da IA</label>
                  <input 
                    type="text" 
                    value={process.aiConfig.purpose}
                    onChange={(e) => update({ aiConfig: { ...process.aiConfig, purpose: e.target.value } })}
                    placeholder="Ex: Triagem de candidatos, Auditoria..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold" 
                  />
               </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Shield size={24} className="text-gray-400" />
                  <div>
                     <p className="font-bold text-gray-900">Revisão Humana Obrigatória</p>
                     <p className="text-[11px] text-gray-500 font-medium">A IA apenas sugere, mas o humano deve confirmar o handoff.</p>
                  </div>
               </div>
               <button 
                 onClick={() => update({ aiConfig: { ...process.aiConfig, requireReview: !process.aiConfig.requireReview } })}
                 className={`w-12 h-6 rounded-full relative transition-colors ${process.aiConfig.requireReview ? 'bg-gray-900' : 'bg-gray-300'}`}
               >
                 <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${process.aiConfig.requireReview ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
         </div>
       ) : (
         <div className="py-20 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
            <Cpu size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">A inteligência artificial está desativada.</p>
            <p className="text-gray-400 text-xs mt-1">Este processo não contará com assistentes automáticos.</p>
         </div>
       )}
    </Card>
  );
}

function HistoryView({ process }: { process: RHProcess }) {
  return (
    <Card className="p-8 space-y-6">
       <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Histórico de Versões</h3>
          <Badge variant="blue">Publicado v{process.version}.0</Badge>
       </div>
       <div className="space-y-4">
          {[
            { v: process.version, date: 'Hoje, 10:30', user: 'Admin Demo', current: true },
            { v: process.version - 1, date: '12 Jul, 15:45', user: 'Ana Paula Lima', current: false },
            { v: 1, date: '01 Jul, 09:00', user: 'Sistema (Setup)', current: false },
          ].filter(v => v.v > 0).map((v, i) => (
            <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between ${v.current ? 'bg-white border-orange-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-sm">
                     {v.v}
                  </div>
                  <div>
                     <p className="font-bold text-gray-900">Versão {v.v}.0 {v.current && <span className="text-[10px] text-orange-500 ml-2">● ATUAL</span>}</p>
                     <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{v.date} • {v.user}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button variant="ghost" size="sm" leftIcon={<Copy size={14} />}>Duplicar</Button>
                  {!v.current && <Button variant="outline" size="sm" leftIcon={<RotateCcw size={14} />}>Restaurar</Button>}
               </div>
            </div>
          ))}
       </div>
    </Card>
  );
}

function SLAConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  return (
    <Card className="p-8 space-y-8">
       <div className="flex items-center justify-between">
          <div>
             <h3 className="text-lg font-black text-gray-900 tracking-tight">Acordos de Nível de Serviço (SLA)</h3>
             <p className="text-[13px] text-gray-500 font-medium">Tempo máximo esperado para conclusão total do processo.</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 border border-orange-200 shadow-sm">
                <Clock size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">SLA Total</p>
                <div className="flex items-center gap-1">
                   <input 
                     type="number" 
                     value={process.slaTotal || 72}
                     onChange={(e) => update({ slaTotal: parseInt(e.target.value) })}
                     className="w-12 bg-transparent font-black text-xl text-orange-900 outline-none p-0 border-none focus:ring-0" 
                   />
                   <span className="font-black text-xl text-orange-900">h</span>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h4 className="label-caps opacity-60 flex items-center gap-2"><AlertCircle size={14} /> Escalonamento</h4>
             <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 space-y-4">
                <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
                  Quando o SLA de uma etapa é atingido, para quem o sistema deve enviar o alerta?
                </p>
                <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-bold">
                   <option>Gestor do Responsável</option>
                   <option>Grupo de Backoffice</option>
                   <option>Diretoria do Setor</option>
                   <option>Não escalar</option>
                </select>
             </div>
          </div>
          <div className="space-y-4">
             <h4 className="label-caps opacity-60 flex items-center gap-2"><History size={14} /> Notificações</h4>
             <div className="space-y-3">
                {['Email ao Solicitante', 'Email ao Executor', 'Notificação Push App', 'Aviso via Integração'].map(n => (
                  <label key={n} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl cursor-pointer group hover:border-orange-200 transition-all">
                     <span className="text-[12px] font-bold text-gray-700 group-hover:text-gray-900">{n}</span>
                     <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-500 rounded border-gray-300" />
                  </label>
                ))}
             </div>
          </div>
       </div>
    </Card>
  );
}

function TrailSimulator({ isOpen, onClose, process }: { isOpen: boolean, onClose: () => void, process: RHProcess }) {
  const [testValues, setTestValues] = useState<Record<string, any>>({
    salario: 12000,
    quantidade: 4,
    custoAdicional: true
  });

  const getResult = () => {
    const steps = [];
    steps.push({ name: 'Solicitação', actor: 'Pessoa (Solicitante)', status: 'trigger', reason: 'Etapa inicial de abertura' });
    steps.push({ name: 'Análise RH', actor: 'Grupo (RH/DP)', status: 'active', reason: 'Validar dados da solicitação' });
    
    // Simulate approval levels based on process.approvals
    process.approvals.forEach(app => {
      let triggered = true;
      if (app.conditionOperator === '>') {
        triggered = testValues[app.conditionField || ''] > (app.conditionValue || 0);
      }
      
      if (triggered) {
        steps.push({ 
          name: app.name, 
          actor: app.responsibilityType, 
          status: 'active', 
          reason: app.conditionOperator ? `Incluído pois ${app.conditionField} ${app.conditionOperator} ${app.conditionValue}` : 'Aprovação obrigatória' 
        });
      }
    });

    steps.push({ name: 'Efetivação', actor: 'Sistema', status: 'final', reason: 'Handoff e encerramento' });
    return steps;
  };

  const results = getResult();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Simulador de Trilha: ${process.name}`} size="lg">
       <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-gray-50 p-6 rounded-[28px] border border-gray-100 space-y-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-lg">
                   <PlayCircle size={18} />
                </div>
                <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Dados de Teste</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Salário Previsto</label>
                   <input 
                     type="number" 
                     value={testValues.salario}
                     onChange={(e) => setTestValues({ ...testValues, salario: parseInt(e.target.value) })}
                     className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-bold outline-none" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Qtd. Vagas</label>
                   <input 
                     type="number" 
                     value={testValues.quantidade}
                     onChange={(e) => setTestValues({ ...testValues, quantidade: parseInt(e.target.value) })}
                     className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-bold outline-none" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custo Adicional</label>
                   <select 
                     value={testValues.custoAdicional ? 'sim' : 'nao'}
                     onChange={(e) => setTestValues({ ...testValues, custoAdicional: e.target.value === 'sim' })}
                     className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-bold outline-none"
                   >
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                   </select>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs ml-2">Resultado da Simulação</h4>
             <div className="space-y-0 relative pl-8 border-l-2 border-gray-100 ml-4">
                {results.map((res, i) => (
                  <div key={i} className="mb-8 relative group">
                     {/* Marker */}
                     <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${res.status === 'trigger' ? 'bg-orange-500' : res.status === 'final' ? 'bg-emerald-500' : 'bg-gray-900'}`} />
                     
                     <div className={`p-5 rounded-[24px] border transition-all ${res.status === 'trigger' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-2">
                           <h5 className="font-black text-gray-900 tracking-tight">{res.name}</h5>
                           <Badge variant={res.status === 'trigger' ? 'orange' : res.status === 'final' ? 'green' : 'blue'} size="sm">
                              {res.actor}
                           </Badge>
                        </div>
                        <p className="text-[12px] text-gray-500 font-medium italic">{res.reason}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
             <Button onClick={onClose}>Fechar Simulação</Button>
          </div>
       </div>
    </Modal>
  );
}
