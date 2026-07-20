import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RHProcess, Employee, TargetMode } from '../types';
import { 
  X, User, Search, Landmark, CheckCircle2, AlertCircle, 
  UserPlus, Flag, Palmtree, TrendingUp, Move, Activity, 
  UserMinus, GraduationCap, Target, DollarSign, CreditCard, 
  Users, Clock, Building2, Save, Send, AlertTriangle,
  FileText, ChevronRight, Check, List, Info, Plus, ArrowLeft,
  ChevronDown, HelpCircle, FileCheck
} from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';
import { FormRenderer } from './FormRenderer';
import { Button } from './ui/Button';
import RequesterCard from './RequesterCard';

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

interface RHRequestFormProps {
  requestId?: string | null;
  onBack: () => void;
}

export default function RHRequestForm({ requestId, onBack }: RHRequestFormProps) {
  const { config, updateConfig, createRequest, updateRequest } = useAppConfig();
  const { addToast } = useToast();

  const isEditing = !!requestId && requestId.startsWith('req-');
  const existingRequest = isEditing ? config.solicitacoes.find(r => r.id === requestId) : null;
  const processId = isEditing ? existingRequest?.processId : requestId;
  const process = config.processos.find(p => p.id === processId);
  const definition = config.processDefinitions[processId || ''];

  const [currentFormData, setCurrentFormData] = useState<any>(existingRequest?.data || {});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleMandatoryCount, setVisibleMandatoryCount] = useState(0);
  const [filledMandatoryCount, setFilledMandatoryCount] = useState(0);

  // A limpeza de campos ocultos é feita pelo FormRenderer, que percorre as
  // `condition` de todos os campos e apaga pela chave real (`id || name`). A
  // lista literal que existia aqui usava os `name` (setorRep, cargoNovo…),
  // enquanto os dados são gravados sob os `id` (setor, cargo), então não
  // limpava esses campos — e ainda competia com o mecanismo genérico.

  // Handle calculation of mandatory fields
  useEffect(() => {
    if (!definition) return;
    const fields = definition.steps[0].fields;
    let visibleTotal = 0;
    let filledTotal = 0;

    fields.forEach(field => {
      // Só conta o que está visível agora — mesma `condition` usada pelo FormRenderer
      const isVisible = !field.condition || field.condition(currentFormData);
      if (isVisible && field.required) {
        visibleTotal++;
        const fieldId = (field as any).id || (field as any).name;
        const value = currentFormData[fieldId];
        if (value !== undefined && value !== null && value !== '') {
          filledTotal++;
        }
      }
    });

    setVisibleMandatoryCount(visibleTotal);
    setFilledMandatoryCount(filledTotal);
  }, [currentFormData, definition]);

  // Handle Reposição and Transformação auto-fill logic
  useEffect(() => {
    if (processId === '1') {
      const isReposicao = currentFormData.tipoRequisicao === 'reposicao' || currentFormData.tipoRequisicao === 'substituicao';
      if (isReposicao && currentFormData.colaboradorSubstituido) {
        const emp = config.colaboradores.find(e => e.name === currentFormData.colaboradorSubstituido);
        if (emp) {
          setCurrentFormData(prev => {
            if (prev.cargo === emp.role && prev.setor === emp.department && prev.centroCusto === emp.costCenter) return prev;
            return {
              ...prev,
              cargo: emp.role,
              setor: emp.department,
              centroCusto: emp.costCenter
            };
          });
        }
      } else if (currentFormData.tipoRequisicao === 'transformacao' && currentFormData.colaboradorTransformacao) {
        const emp = config.colaboradores.find(e => e.name === currentFormData.colaboradorTransformacao);
        if (emp) {
          setCurrentFormData(prev => {
            if (prev.cargoAtual === emp.role && prev.ccAtual === emp.costCenter) return prev;
            return {
              ...prev,
              cargoAtual: emp.role,
              ccAtual: emp.costCenter
            };
          });
        }
      }
    }
  }, [currentFormData.tipoRequisicao, currentFormData.colaboradorSubstituido, currentFormData.colaboradorTransformacao, config.colaboradores, processId]);

  // Initialize target if editing
  useEffect(() => {
    if (isEditing && existingRequest) {
      setCurrentFormData(existingRequest.data || {});
    }
  }, [isEditing, existingRequest, config.colaboradores]);

  // Requester snapshot (current or from request)
  const requesterData = useMemo(() => {
    if (isEditing && existingRequest?.requesterSnapshot) {
      return { ...existingRequest.requesterSnapshot, requestedAt: existingRequest.createdAt };
    }
    const employee = config.colaboradores.find(e => e.id === config.usuarioAtual.employeeId);
    return {
      avatar: config.usuarioAtual.avatar,
      name: config.usuarioAtual.name,
      registration: employee?.registration || '00000',
      email: config.usuarioAtual.email,
      role: config.usuarioAtual.role,
      department: employee?.department || 'N/A',
      costCenter: employee?.costCenter || 'N/A',
      branch: employee?.branch || 'N/A',
      requestedAt: new Date().toISOString(),
    };
  }, [config.usuarioAtual, config.colaboradores, isEditing, existingRequest]);

  // Handle TargetMode logic
  useEffect(() => {
    if (isEditing || !process) return;

    const mode = process.targetMode || TargetMode.CURRENT_USER;
    const isColaborador = config.usuarioAtual?.profile === 'Colaborador';

    if (mode === TargetMode.CURRENT_USER || (mode === TargetMode.CONDITIONAL && isColaborador)) {
      const employee = config.colaboradores.find(e => e.id === config.usuarioAtual.employeeId);
      if (employee) {
        setCurrentFormData(prev => ({ 
          ...prev, 
          employeeId: employee.id,
          colaborador: employee.name,
          matricula: employee.registration,
          cargoAtual: employee.role,
          setorAtual: employee.department,
          salarioAtual: employee.salary,
          ccAtual: employee.costCenter,
          empresaAtual: employee.branch,
          gestorAtual: 'Ana Paula Lima' // Mock gestor for demo
        }));
      }
    }
  }, [process, config.usuarioAtual, config.colaboradores, isEditing]);

  const handleSave = async (isDraft: boolean, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('[RHRequestForm] handleSave called', { isDraft, processId, requestId, isEditing });
    
    if (!processId) {
      console.error('[RHRequestForm] Missing processId');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isEditing) {
        console.log('[RHRequestForm] Updating existing request', requestId);
        updateRequest(requestId!, {
          data: currentFormData,
          status: isDraft ? 'Rascunho' : 'Pendente de Aprovação',
          updatedAt: new Date().toISOString(),
          alvo: currentFormData.colaborador || currentFormData.nomeCandidato || currentFormData.alvo || 'N/A',
        });
        addToast(isDraft ? 'Rascunho atualizado!' : 'Solicitação enviada com sucesso!', 'success');
        
        if (!isDraft) {
          updateConfig({ activeView: 'request-detail', currentRequestId: requestId });
        }
      } else {
        console.log('[RHRequestForm] Creating new request', processId);
        createRequest(processId, currentFormData, isDraft);
        addToast(isDraft ? 'Rascunho salvo!' : 'Solicitação enviada com sucesso!', 'success');
      }
      
      if (isDraft) {
        onBack();
      }
    } catch (error) {
      console.error('[RHRequestForm] Error saving request:', error);
      addToast('Erro ao processar solicitação.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!process || !definition) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black">Processo não encontrado</h2>
        <p className="text-gray-500">O processo selecionado ({processId}) não possui uma definição válida.</p>
        <Button onClick={onBack} variant="outline">Voltar</Button>
      </div>
    );
  }

  // Etapas do painel lateral. Para o desligamento (processId '15') o fluxo reflete
  // o tipo escolhido: Justa Causa insere "Análise Jurídica" antes da aprovação.
  const flowSteps: { label: string; desc: string; group?: string }[] = (() => {
    if (processId === '15') {
      const isJustaCausa = currentFormData.tipoDesligamento === 'justa_causa';
      return [
        { label: 'Solicitação', desc: 'Preenchimento do formulário' },
        ...(isJustaCausa ? [{ label: 'Análise Jurídica', desc: 'Validação da justa causa' }] : []),
        { label: 'Aprovação', desc: 'Avaliação e aprovação' },
        { label: 'Cálculo de Benefícios', desc: 'Rescisão e verbas', group: 'Benefícios' },
        { label: 'Conclusão', desc: 'Finalização do processo' },
      ];
    }
    return [
      { label: 'Solicitação', desc: 'Preenchimento do formulário' },
      { label: 'Aprovação', desc: 'Validação pelo responsável' },
      { label: 'Conclusão', desc: 'Efetivação e auditoria' },
    ];
  })();

  // Aprovador e SLA derivados das etapas de aprovação do processo (não hardcoded).
  const approvals = process.approvals || [];
  const aprovadorLabel = approvals.length ? approvals.map(a => a.name).join(' → ') : 'RH / Gestor';
  const totalSlaHoras = approvals.reduce((acc, a) => acc + (a.slaUnit === 'd' ? a.sla * 24 : a.sla), 0);
  const slaLabel = totalSlaHoras > 0 ? `${totalSlaHoras}h` : '48h';
  const slaEstimadoLabel = totalSlaHoras > 0 ? `${totalSlaHoras} Horas Úteis` : '48 Horas Úteis';

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
              {React.cloneElement(iconMap[process.icon] || <Landmark />, { size: 24 })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{process.name}</h1>
                <Badge variant="orange" className="ml-2">Novo</Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{process.category}</span>
                <span className="text-gray-300">•</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isEditing ? `Editando ${existingRequest?.numero}` : 'Abertura de Solicitação'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-4 text-right">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SLA Estimado</span>
            <span className="text-[12px] font-black text-gray-900">{slaEstimadoLabel}</span>
          </div>
          <Button variant="outline" onClick={onBack} className="rounded-xl font-bold border-gray-200">Cancelar</Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            
            {/* Requester Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-gray-900 ml-1">
                <User size={16} className="text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-widest">Identificação do Solicitante</h3>
              </div>
              <RequesterCard data={requesterData} />
            </section>

            {/* Main Form */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-gray-900 ml-1">
                <FileText size={16} className="text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-widest">Dados da Solicitação</h3>
              </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <FormRenderer 
                definition={definition}
                initialData={currentFormData}
                onSubmit={() => handleSave(false)}
                onCancel={onBack}
                onDataChange={(data) => {
                  setCurrentFormData(data);
                }}
                onValidityChange={setIsFormValid}
                hideActions
              />
            </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto custom-scrollbar hidden lg:block shrink-0">
          <div className="space-y-8">
            {/* Process Info */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center justify-between">
                Fluxo do Processo
                <Info size={12} />
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                    Este processo segue o fluxo padrão de aprovação e conclusão após a abertura.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Categoria</span>
                    <span className="text-[11px] font-black text-gray-900 uppercase">{process.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Steps - Simplified to 3 steps */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Etapas</h4>
              <div className="space-y-4">
                {flowSteps.map((step, idx) => {
                  const isCurrent = idx === 0; // "Solicitação" é a etapa atual na abertura
                  return (
                    <div key={`${step.label}-${idx}`} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black z-10 ${
                          isCurrent ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        {idx < flowSteps.length - 1 && <div className="w-[1.5px] flex-1 bg-gray-100 my-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <p className={`text-[12px] font-black leading-tight ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                          {step.group && (
                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-wider bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">{step.group}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold tracking-tight mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Required Fields Checklist */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Dados do Processo</h4>
              <div className="space-y-2">
                 <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Aprovador</span>
                    <span className="text-[10px] font-black text-gray-900 text-right">{aprovadorLabel}</span>
                 </div>
                 <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase">SLA</span>
                    <span className="text-[10px] font-black text-gray-900">{slaLabel}</span>
                 </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer — empilha e usa botões full-width em telas pequenas */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 sticky bottom-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            leftIcon={<Save size={18} />}
            className="text-gray-500 font-bold w-full sm:w-auto"
          >
            Salvar Rascunho
          </Button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Campos Obrigatórios</span>
            <span className="text-[11px] font-black text-gray-900">{filledMandatoryCount} preenchidos de {visibleMandatoryCount}</span>
          </div>
          <Button
            onClick={(e) => {
              console.log('[RHRequestForm] Submit button clicked', { isFormValid });
              handleSave(false, e);
            }}
            disabled={isSaving || !isFormValid}
            className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 sm:px-10 h-12 font-black rounded-xl"
            rightIcon={<ChevronRight size={20} />}
          >
            {isSaving ? 'Enviando...' : 'Confirmar e Enviar'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children, variant = 'gray', className = '' }: { children: React.ReactNode, variant?: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'orange', className?: string }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-50 text-green-700 border border-green-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    red: 'bg-red-50 text-red-700 border border-red-100',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border border-orange-100',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
