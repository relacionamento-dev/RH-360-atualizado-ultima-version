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
import { useAppConfig } from '../../contexts/AppConfigContext';
import { RHProcess, ApprovalStep, ApprovalResponsibilityType } from '../../types';

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
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
        <div className="bg-white p-2 rounded-[18px] border border-gray-100 shadow-sm flex flex-wrap gap-1 overflow-x-auto">
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

function ApprovalsConfig({ process, update }: { process: RHProcess, update: (u: any) => void }) {
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
      isMandatory: true
    };
    update({ approvals: [...process.approvals, newStep] });
  };

  const updateStep = (id: string, updates: Partial<ApprovalStep>) => {
    update({
      approvals: process.approvals.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const removeStep = (id: string) => {
    update({
      approvals: process.approvals.filter(s => s.id !== id)
    });
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={18} />
             </div>
             <div>
                <h3 className="text-lg font-black text-gray-900">Níveis de Aprovação</h3>
                <p className="text-[13px] text-gray-500">Configure até 5 alçadas de decisão adicionais.</p>
             </div>
          </div>
          <Button 
            size="sm" 
            leftIcon={<Plus size={16} />} 
            onClick={addStep}
            disabled={process.approvals.length >= 5}
          >
            Adicionar Nível
          </Button>
       </div>

       <div className="space-y-4">
          {process.approvals.length === 0 ? (
            <div className="py-12 text-center bg-white border border-dashed border-gray-200 rounded-[24px]">
               <p className="text-gray-400 font-medium italic">Nenhuma aprovação adicional configurada.</p>
            </div>
          ) : (
            process.approvals.map((step, i) => (
              <div key={step.id} className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm group hover:border-orange-200 transition-all">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-black text-sm">
                          {i + 1}
                       </div>
                       <input 
                         type="text" 
                         value={step.name}
                         onChange={(e) => updateStep(step.id, { name: e.target.value })}
                         className="text-lg font-black text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 w-64" 
                       />
                    </div>
                    <div className="flex items-center gap-4">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Obrigatória</span>
                          <input 
                            type="checkbox" 
                            checked={step.isMandatory}
                            onChange={(e) => updateStep(step.id, { isMandatory: e.target.checked })}
                            className="w-4 h-4 text-orange-500 rounded" 
                          />
                       </label>
                       <button onClick={() => removeStep(step.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Responsável</label>
                       <select 
                         value={step.responsibilityType}
                         onChange={(e) => updateStep(step.id, { responsibilityType: e.target.value as ApprovalResponsibilityType })}
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-bold"
                       >
                          <option value="pessoa">Pessoa Específica</option>
                          <option value="grupo">Grupo</option>
                          <option value="gestor-direto">Gestor Direto</option>
                          <option value="gestor-setor">Gestor do Setor</option>
                          <option value="responsavel-cc">Responsável Centro Custo</option>
                          <option value="rh-filial">RH da Filial</option>
                          <option value="diretoria">Diretoria</option>
                          <option value="presidencia">Presidência</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Condição de Acionamento</label>
                       <div className="flex items-center gap-2">
                          <select 
                            value={step.conditionOperator || ''}
                            onChange={(e) => updateStep(step.id, { conditionOperator: e.target.value as any })}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold"
                          >
                             <option value="">Sempre</option>
                             <option value=">">Se Maior que</option>
                             <option value="<">Se Menor que</option>
                             <option value="==">Se Igual a</option>
                             <option value="contains">Se Contém</option>
                          </select>
                          {step.conditionOperator && (
                            <input 
                              type="text" 
                              value={step.conditionValue || ''}
                              onChange={(e) => updateStep(step.id, { conditionValue: e.target.value })}
                              placeholder="Valor..."
                              className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold outline-none focus:border-orange-500" 
                            />
                          )}
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">SLA e Devolução</label>
                       <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={step.sla}
                            onChange={(e) => updateStep(step.id, { sla: parseInt(e.target.value) })}
                            className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-bold outline-none" 
                          />
                          <select 
                            value={step.slaUnit}
                            onChange={(e) => updateStep(step.id, { slaUnit: e.target.value as any })}
                            className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-[13px] font-bold"
                          >
                             <option value="h">h</option>
                             <option value="d">d</option>
                          </select>
                          <select className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-[13px] font-bold text-gray-400">
                             <option>Devolve p/ etapa anterior</option>
                             <option>Devolve p/ início</option>
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
            ))
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
