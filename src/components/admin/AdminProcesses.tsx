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
import { SectionHeader, Field, InfoNote, RowIndex, ADMIN_FIELD_CLASS } from './AdminUI';

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
                  ? 'bg-gray-900 border-gray-900 text-white' 
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
                  ? 'bg-gray-900 text-white' 
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
  const options = [
    { field: 'allowDraft', label: 'Permitir salvar rascunho', desc: 'A pessoa pode preencher aos poucos antes de enviar.' },
    { field: 'allowCancel', label: 'Permitir cancelar', desc: 'A solicitação pode ser cancelada depois de enviada.' },
    { field: 'isSensitive', label: 'Processo sigiloso', desc: 'Só quem tem permissão para dados sigilosos consegue ver.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dados do processo"
        description="Nome, descrição e como ele se comporta na abertura de solicitações."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="space-y-5">
           <div className="flex items-center justify-between gap-4">
              <div>
                 <p className="text-[13px] font-bold text-gray-900">
                   {process.ativo ? 'Processo disponível' : 'Processo indisponível'}
                 </p>
                 <p className="text-[12px] text-gray-500 font-medium">
                   {process.ativo
                     ? 'Aparece no hub e pode receber novas solicitações.'
                     : 'Fica oculto e não aceita novas solicitações.'}
                 </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={process.ativo}
                aria-label="Processo disponível"
                onClick={() => update({ ativo: !process.ativo })}
                className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${process.ativo ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${process.ativo ? 'left-[22px]' : 'left-[3px]'}`} />
              </button>
           </div>

           <Field label="Nome do processo">
              <input
                type="text"
                value={process.name}
                onChange={(e) => update({ name: e.target.value })}
                className={`${FIELD_CLASS} w-full`}
              />
           </Field>

           <Field label="Descrição" hint="Aparece no hub, abaixo do nome.">
              <textarea
                value={process.description}
                onChange={(e) => update({ description: e.target.value })}
                className={`${FIELD_CLASS} w-full h-24 resize-none`}
              />
           </Field>

           <Field label="Time que executa as tarefas" hint="Quem cuida das etapas internas depois da aprovação.">
              <Select
                className="w-full"
                ariaLabel="Time que executa as tarefas"
                value={process.executorGroup || ''}
                onChange={(value) => update({ executorGroup: value })}
                options={[
                  { value: '', label: 'Nenhum time definido' },
                  { value: 'RH/DP', label: 'RH / DP' },
                  { value: 'TI', label: 'TI / Infraestrutura' },
                  { value: 'Financeiro', label: 'Financeiro' },
                ]}
              />
           </Field>
        </Card>

        <Card className="space-y-4">
           <div>
             <p className="text-[14px] font-bold text-gray-900">Como a solicitação se comporta</p>
             <p className="text-[12px] text-gray-500 font-medium">Vale para todas as solicitações deste processo.</p>
           </div>
           <div className="space-y-3">
              {options.map(opt => (
                <label key={opt.field} className="flex items-start justify-between gap-4 cursor-pointer">
                   <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-gray-700">{opt.label}</span>
                      <span className="block text-[12px] text-gray-400 font-medium">{opt.desc}</span>
                   </span>
                   <input
                     type="checkbox"
                     checked={!!(process as any)[opt.field]}
                     onChange={(e) => update({ [opt.field]: e.target.checked })}
                     aria-label={opt.label}
                     className="w-4 h-4 mt-0.5 accent-orange-500 rounded border-gray-300 shrink-0"
                   />
                </label>
              ))}
           </div>
        </Card>
      </div>
    </div>
  );
}

// Mesma classe de input do resto da Central Adm. Sem largura: quem usa define
// (w-full na grade, w-20 no prazo) — misturar duas classes de width no mesmo
// elemento deixa o resultado à mercê da ordem do CSS.
const FIELD_CLASS = ADMIN_FIELD_CLASS;

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
    { id: 'updateProfile', label: 'Atualizar o cadastro do colaborador', desc: 'Leva os novos dados para o Perfil 360.' },
    { id: 'createRecord360', label: 'Registrar no histórico da pessoa', desc: 'Adiciona o evento à linha do tempo dela.' },
    { id: 'createTask', label: 'Criar uma tarefa de acompanhamento', desc: 'Gera pendência para alguém conferir depois.' },
    { id: 'generateDoc', label: 'Gerar documento em PDF', desc: 'Monta um arquivo com os dados da solicitação.' },
    { id: 'requireSignature', label: 'Pedir assinatura', desc: 'Envia o documento para assinatura eletrônica.' },
  ];

  const handoffTypes = [
    { value: 'automatico', label: 'Automático', desc: 'O sistema executa sozinho.' },
    { value: 'sugestao', label: 'Sugerido', desc: 'O sistema sugere e alguém confirma.' },
    { value: 'manual', label: 'Manual', desc: 'Alguém faz o próximo passo.' },
    { value: 'desativado', label: 'Nada', desc: 'O processo termina aqui.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="O que acontece quando termina"
        description="Ações executadas assim que a última aprovação é concluída."
      />

      <Card className="space-y-4">
         <p className="text-[14px] font-bold text-gray-900">Ao concluir, o sistema deve</p>
         <div className="space-y-3">
            {options.map(opt => (
              <label key={opt.id} className="flex items-start justify-between gap-4 cursor-pointer">
                 <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-700">{opt.label}</span>
                    <span className="block text-[12px] text-gray-400 font-medium">{opt.desc}</span>
                 </span>
                 <input
                   type="checkbox"
                   checked={!!(process.handoffs as any)[opt.id]}
                   onChange={(e) => update({ handoffs: { ...process.handoffs, [opt.id]: e.target.checked } })}
                   aria-label={opt.label}
                   className="w-4 h-4 mt-0.5 accent-orange-500 rounded border-gray-300 shrink-0"
                 />
              </label>
            ))}
         </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="space-y-4">
           <div>
             <p className="text-[14px] font-bold text-gray-900">Como as ações são executadas</p>
             <p className="text-[12px] text-gray-500 font-medium">Define quanto o sistema faz sozinho.</p>
           </div>
           <div className="grid grid-cols-2 gap-2">
              {handoffTypes.map(t => {
                const selected = process.handoffs.handoffType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ handoffs: { ...process.handoffs, handoffType: t.value } })}
                    className={`text-left px-3 py-2.5 rounded-[8px] border transition-colors ${
                      selected ? 'bg-orange-50/60 border-orange-200' : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className={`block text-[13px] font-bold ${selected ? 'text-orange-900' : 'text-gray-700'}`}>{t.label}</span>
                    <span className="block text-[12px] text-gray-400 font-medium">{t.desc}</span>
                  </button>
                );
              })}
           </div>
        </Card>

        <Card className="space-y-4">
           <div>
             <p className="text-[14px] font-bold text-gray-900">Encadear com outro processo</p>
             <p className="text-[12px] text-gray-500 font-medium">Abre uma nova solicitação logo após a conclusão.</p>
           </div>
           <Field label="Processo seguinte">
              <Select
                className="w-full"
                ariaLabel="Processo seguinte"
                value={process.handoffs.nextProcessId || ''}
                onChange={(value) => update({ handoffs: { ...process.handoffs, nextProcessId: value } })}
                options={[
                  { value: '', label: 'Nenhum' },
                  { value: '3', label: 'Admissão' },
                  { value: '4', label: 'Onboarding' },
                  { value: '14', label: 'Treinamento' },
                ]}
              />
           </Field>
        </Card>
      </div>
    </div>
  );
}

function PermissionsConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  // O seletor de abrangência já era decorativo (sem destino no estado do
  // processo); mantido como estava, apenas com o componente padronizado.
  const [visibilityScope, setVisibilityScope] = useState('usuario');

  const profiles = [
    { id: 'employee', label: 'Colaboradores', desc: 'Qualquer pessoa da empresa.' },
    { id: 'manager', label: 'Gestores', desc: 'Quem tem equipe sob responsabilidade.' },
    { id: 'hr', label: 'RH / DP', desc: 'Time de recursos humanos e pessoal.' },
    { id: 'director', label: 'Diretoria', desc: 'Direção da empresa.' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Quem usa este processo"
        description="Perfis que podem abrir e acompanhar solicitações deste tipo."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="space-y-4">
           <p className="text-[14px] font-bold text-gray-900">Quem pode solicitar</p>
           <div className="space-y-3">
              {profiles.map(p => (
                <label key={p.id} className="flex items-start justify-between gap-4 cursor-pointer">
                   <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-gray-700">{p.label}</span>
                      <span className="block text-[12px] text-gray-400 font-medium">{p.desc}</span>
                   </span>
                   <input
                     type="checkbox"
                     checked={!!(process.roles as any)[p.id]}
                     onChange={(e) => update({ roles: { ...process.roles, [p.id]: e.target.checked } })}
                     aria-label={p.label}
                     className="w-4 h-4 mt-0.5 accent-orange-500 rounded border-gray-300 shrink-0"
                   />
                </label>
              ))}
           </div>
        </Card>

        <Card className="space-y-4">
           <div>
             <p className="text-[14px] font-bold text-gray-900">Quais solicitações cada um enxerga</p>
             <p className="text-[12px] text-gray-500 font-medium">
               Vale para a lista de solicitações e para a consulta global.
             </p>
           </div>
           <Field label="Abrangência">
              <Select
                className="w-full"
                ariaLabel="Abrangência da visualização"
                value={visibilityScope}
                onChange={setVisibilityScope}
                options={[
                  { value: 'usuario', label: 'Conforme o cadastro de cada pessoa' },
                  { value: 'empresa', label: 'Todas as solicitações da empresa' },
                  { value: 'global', label: 'Todas as empresas' },
                ]}
              />
           </Field>
           <InfoNote>
             Na primeira opção vale o que está no cadastro da pessoa (só as próprias, da equipe, do setor, da empresa). As outras duas ampliam a visão para todo mundo que participa deste processo.
           </InfoNote>
        </Card>
      </div>
    </div>
  );
}

function AIConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  const enabled = process.aiConfig.enabled;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ajuda da inteligência artificial"
        description="Se a IA deve apoiar este processo e de que forma."
      />

      <Card className="space-y-5">
         <div className="flex items-center justify-between gap-4">
            <div>
               <p className="text-[13px] font-bold text-gray-900">
                 {enabled ? 'IA ativada neste processo' : 'IA desativada neste processo'}
               </p>
               <p className="text-[12px] text-gray-500 font-medium">
                 {enabled
                   ? 'As solicitações passam pela análise automática configurada abaixo.'
                   : 'As solicitações seguem apenas com análise humana.'}
               </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Ativar IA neste processo"
              onClick={() => update({ aiConfig: { ...process.aiConfig, enabled: !enabled } })}
              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${enabled ? 'left-[22px]' : 'left-[3px]'}`} />
            </button>
         </div>

         {enabled && (
           <div className="space-y-5 pt-1 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Field label="Modelo usado">
                    <Select
                      className="w-full"
                      ariaLabel="Modelo usado"
                      value={process.aiConfig.model || 'gemini-1.5-pro'}
                      onChange={(value) => update({ aiConfig: { ...process.aiConfig, model: value } })}
                      options={[
                        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro — análise mais profunda' },
                        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash — resposta mais rápida' },
                      ]}
                    />
                 </Field>
                 <Field label="Para que serve aqui">
                    <input
                      type="text"
                      value={process.aiConfig.purpose}
                      onChange={(e) => update({ aiConfig: { ...process.aiConfig, purpose: e.target.value } })}
                      placeholder="Ex.: avaliar candidatos, conferir documentos..."
                      className={`${FIELD_CLASS} w-full`}
                    />
                 </Field>
              </div>

              <label className="flex items-center justify-between gap-4 cursor-pointer pt-1 border-t border-gray-100 mt-1 pt-4">
                 <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-gray-700">Sempre confirmar com uma pessoa</span>
                    <span className="block text-[12px] text-gray-400 font-medium">
                      A IA apenas sugere; alguém precisa aprovar antes de o sistema seguir.
                    </span>
                 </span>
                 <button
                   type="button"
                   role="switch"
                   aria-checked={!!process.aiConfig.requireReview}
                   aria-label="Sempre confirmar com uma pessoa"
                   onClick={() => update({ aiConfig: { ...process.aiConfig, requireReview: !process.aiConfig.requireReview } })}
                   className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${process.aiConfig.requireReview ? 'bg-emerald-500' : 'bg-gray-300'}`}
                 >
                   <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${process.aiConfig.requireReview ? 'left-[22px]' : 'left-[3px]'}`} />
                 </button>
              </label>
           </div>
         )}
      </Card>
    </div>
  );
}

function HistoryView({ process }: { process: RHProcess }) {
  const versions = [
    { v: process.version, date: 'Hoje, 10:30', user: 'Admin Demo', current: true },
    { v: process.version - 1, date: '12 Jul, 15:45', user: 'Ana Paula Lima', current: false },
    { v: 1, date: '01 Jul, 09:00', user: 'Configuração inicial', current: false },
  ].filter(v => v.v > 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Versões deste processo"
        description="Cada publicação gera uma versão. Solicitações em andamento seguem as regras da versão em que foram abertas."
        actions={<Badge variant="gray">Em uso: versão {process.version}.0</Badge>}
      />

      <div className="space-y-2">
        {versions.map((v, i) => (
          <div
            key={i}
            className={`bg-white rounded-[12px] border flex flex-wrap items-center gap-3 px-4 py-3 ${v.current ? 'border-gray-200' : 'border-gray-100'}`}
          >
             <RowIndex>{v.v}</RowIndex>
             <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900 truncate">Versão {v.v}.0</p>
                <p className="text-[12px] text-gray-400 font-medium truncate">{v.date} · por {v.user}</p>
             </div>
             {v.current && <Badge variant="green" size="sm">Em uso</Badge>}
             <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="text-gray-500" leftIcon={<Copy size={14} />}>Duplicar</Button>
                {!v.current && <Button variant="outline" size="sm" leftIcon={<RotateCcw size={14} />}>Restaurar</Button>}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SLAConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
  // Seletor de escalonamento seguia decorativo; mantido, agora padronizado.
  const [escalation, setEscalation] = useState('gestor');

  const notifications = [
    { id: 'solicitante', label: 'Avisar quem abriu a solicitação' },
    { id: 'executor', label: 'Avisar quem precisa agir' },
    { id: 'push', label: 'Enviar notificação no aplicativo' },
    { id: 'integracao', label: 'Avisar sistemas integrados' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prazos e avisos"
        description="Em quanto tempo o processo deve terminar e quem é avisado quando o prazo aperta."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="space-y-5">
           <Field label="Prazo total do processo" hint="Tempo esperado da abertura até a conclusão.">
              <div className="flex items-center gap-2">
                 <input
                   type="number"
                   min={1}
                   value={process.slaTotal || 72}
                   onChange={(e) => update({ slaTotal: parseInt(e.target.value) || 1 })}
                   aria-label="Prazo total do processo em horas"
                   className={`${FIELD_CLASS} w-24`}
                 />
                 <span className="text-[13px] font-medium text-gray-500">horas</span>
              </div>
           </Field>

           <Field label="Se o prazo estourar, avisar" hint="Cada nível de aprovação tem o próprio prazo, definido na aba Aprovações.">
              <Select
                className="w-full"
                ariaLabel="Se o prazo estourar, avisar"
                value={escalation}
                onChange={setEscalation}
                options={[
                  { value: 'gestor', label: 'O gestor de quem está devendo' },
                  { value: 'backoffice', label: 'O time de backoffice' },
                  { value: 'diretoria', label: 'A diretoria do setor' },
                  { value: 'ninguem', label: 'Ninguém' },
                ]}
              />
           </Field>
        </Card>

        <Card className="space-y-4">
           <div>
             <p className="text-[14px] font-bold text-gray-900">Quem recebe avisos</p>
             <p className="text-[12px] text-gray-500 font-medium">A cada mudança de etapa da solicitação.</p>
           </div>
           <div className="space-y-3">
              {notifications.map(n => (
                <label key={n.id} className="flex items-center justify-between gap-4 cursor-pointer">
                   <span className="text-[13px] font-medium text-gray-600">{n.label}</span>
                   <input
                     type="checkbox"
                     defaultChecked
                     aria-label={n.label}
                     className="w-4 h-4 accent-orange-500 rounded border-gray-300 shrink-0"
                   />
                </label>
              ))}
           </div>
        </Card>
      </div>
    </div>
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
          <div className="bg-gray-50 p-5 rounded-[12px] border border-gray-100 space-y-5">
             <p className="text-[14px] font-bold text-gray-900">Dados de teste</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Salário previsto">
                   <input
                     type="number"
                     value={testValues.salario}
                     onChange={(e) => setTestValues({ ...testValues, salario: parseInt(e.target.value) })}
                     aria-label="Salário previsto"
                     className={`${FIELD_CLASS} w-full`}
                   />
                </Field>
                <Field label="Quantidade de vagas">
                   <input
                     type="number"
                     value={testValues.quantidade}
                     onChange={(e) => setTestValues({ ...testValues, quantidade: parseInt(e.target.value) })}
                     aria-label="Quantidade de vagas"
                     className={`${FIELD_CLASS} w-full`}
                   />
                </Field>
                <Field label="Gera custo adicional">
                   <Select
                     className="w-full"
                     ariaLabel="Gera custo adicional"
                     value={testValues.custoAdicional ? 'sim' : 'nao'}
                     onChange={(value) => setTestValues({ ...testValues, custoAdicional: value === 'sim' })}
                     options={[
                       { value: 'sim', label: 'Sim' },
                       { value: 'nao', label: 'Não' },
                     ]}
                   />
                </Field>
             </div>
          </div>

          <div className="space-y-4">
             <p className="text-[14px] font-bold text-gray-900">Caminho que a solicitação seguiria</p>
             <div className="space-y-0 relative pl-8 border-l-2 border-gray-100 ml-4">
                {results.map((res, i) => (
                  <div key={i} className="mb-8 relative group">
                     {/* Marker */}
                     <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${res.status === 'trigger' ? 'bg-orange-500' : res.status === 'final' ? 'bg-emerald-500' : 'bg-gray-900'}`} />
                     
                     <div className={`p-4 rounded-[12px] border transition-colors ${res.status === 'trigger' ? 'bg-orange-50/60 border-orange-100' : 'bg-white border-gray-100'}`}>
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
