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
import { computeDerivedFields } from '../utils/computedFields';
import { isEmptyFieldValue } from '../utils/formValues';
import { buildApprovalChain, organizacaoDoConfig } from '../utils/approvalFlow';
import { ETAPA_ENCERRAMENTO } from '../utils/desligamento';
import { resolverSolicitante } from '../utils/identidade';
import { resolverAlvo } from '../utils/hierarquia';
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

  // Abertura nova pode chegar com campos já preenchidos (ver `prefillSolicitacao`
  // em types.ts): é assim que o Perfil 360 abre o desligamento com o
  // colaborador escolhido.
  const [currentFormData, setCurrentFormData] = useState<any>(
    existingRequest?.data || config.prefillSolicitacao || {}
  );
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
        // Mesma regra da validação: checkbox desmarcado e assinatura ausente
        // contam como não preenchidos.
        if (!isEmptyFieldValue(field, currentFormData[fieldId])) {
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

  // O prefill é de uso único: consumido no estado inicial acima, é apagado aqui
  // para não reaparecer na próxima solicitação aberta do zero.
  useEffect(() => {
    if (config.prefillSolicitacao) updateConfig({ prefillSolicitacao: null });
    // Só na montagem: o estado inicial já leu o valor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cabeçalho "Identificação do Solicitante". Em edição, resolve pelo cadastro
  // (utils/identidade) em vez de reexibir o snapshot congelado; em pedido novo,
  // é a ficha de quem está logado. Nada de sentinela '00000'/'N/A': campo sem
  // ficha mostra "—", que é o que o ReadOnlyField já faz com valor vazio.
  const requesterData = useMemo(() => {
    if (isEditing && existingRequest) {
      return {
        ...resolverSolicitante(existingRequest, config.usuariosDemo, config.colaboradores),
        requestedAt: existingRequest.createdAt
      };
    }
    const employee = config.colaboradores.find(e => e.id === config.usuarioAtual.employeeId);
    return {
      avatar: employee?.avatar || config.usuarioAtual.avatar,
      name: employee?.name || config.usuarioAtual.name,
      registration: employee?.registration,
      email: config.usuarioAtual.email,
      role: employee?.role || config.usuarioAtual.role,
      department: employee?.department,
      costCenter: employee?.costCenter,
      branch: employee?.branch,
      requestedAt: new Date().toISOString(),
    };
  }, [config.usuarioAtual, config.usuariosDemo, config.colaboradores, isEditing, existingRequest]);

  // A prévia de "Fluxo de Aprovação" tem de mostrar os aprovadores REAIS deste
  // pedido — resolvidos sobre o alvo que está no formulário agora. Recalcula a
  // cada digitação, junto com as condições de acionamento.
  const ctxDaAlcada = useMemo(
    () => ({
      ...organizacaoDoConfig(config),
      alvo: resolverAlvo({ data: currentFormData }, config.colaboradores)
    }),
    [config, currentFormData]
  );

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

  // Processos de protocolo (ex.: Recebimento de VR/VA) não têm aprovação: ao
  // confirmar e assinar, a solicitação já é registrada no status final.
  const acknowledgement = definition?.acknowledgement;
  const submittedStatus = acknowledgement?.status || 'Pendente de Aprovação';
  const submitSuccessMessage = acknowledgement
    ? 'Recebimento confirmado e assinado com sucesso!'
    : 'Solicitação enviada com sucesso!';

  const handleSave = async (isDraft: boolean, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('[RHRequestForm] handleSave called', { isDraft, processId, requestId, isEditing });
    
    if (!processId) {
      console.error('[RHRequestForm] Missing processId');
      return;
    }
    
    setIsSaving(true);

    // Campos CALC não vivem no estado do formulário — são recalculados aqui, no
    // envio, para compor o payload persistido.
    const payloadData = computeDerivedFields(definition, currentFormData);

    try {
      if (isEditing) {
        console.log('[RHRequestForm] Updating existing request', requestId);
        updateRequest(requestId!, {
          data: payloadData,
          status: isDraft ? 'Rascunho' : submittedStatus,
          etapaAtual: isDraft ? 'Solicitação' : acknowledgement?.etapa || 'Aprovação',
          updatedAt: new Date().toISOString(),
          alvo: currentFormData.colaborador || currentFormData.nomeCandidato || currentFormData.alvo || 'N/A',
        });
        addToast(isDraft ? 'Rascunho atualizado!' : submitSuccessMessage, 'success');
        
        if (!isDraft) {
          updateConfig({ activeView: 'request-detail', currentRequestId: requestId });
        }
      } else {
        console.log('[RHRequestForm] Creating new request', processId);
        createRequest(processId, payloadData, isDraft);
        addToast(isDraft ? 'Rascunho salvo!' : submitSuccessMessage, 'success');
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
    // Protocolo de recebimento: sem aprovação — o RH credita, o colaborador
    // confere e assina, e o registro é concluído na hora.
    if (processId === '5') {
      return [
        { label: 'Crédito Lançado', desc: 'Valores informados pelo RH' },
        { label: 'Confirmação e Assinatura', desc: 'Aceite do colaborador' },
        { label: 'Recebimento Registrado', desc: 'Protocolo arquivado' },
      ];
    }
    // Demais processos: as etapas são as alçadas configuradas no processo que se
    // aplicam a ESTES dados. Como a cascata é recalculada a cada digitação, um
    // nível condicional ("Se maior que 10000") aparece assim que o valor entra.
    const chain = buildApprovalChain(process, currentFormData, ctxDaAlcada);
    const approvalSteps = chain.map(level => ({
      label: level.name,
      desc: level.conditionLabel
        ? `${level.responsibleLabel} • ${level.conditionLabel}`
        : level.responsibleLabel,
    }));

    if (processId === '15') {
      const isJustaCausa = currentFormData.tipoDesligamento === 'justa_causa';
      return [
        { label: 'Solicitação', desc: 'Preenchimento do formulário' },
        ...(isJustaCausa ? [{ label: 'Análise Jurídica', desc: 'Validação da justa causa' }] : []),
        ...approvalSteps,
        // Etapa do RH/DP que só abre depois da aprovação final: verbas
        // rescisórias, checklist de encerramento e documentos da rescisão.
        { label: ETAPA_ENCERRAMENTO, desc: 'Verbas, checklist e documentos (RH/DP)', group: 'Benefícios' },
        { label: 'Conclusão', desc: 'Finalização do processo' },
      ];
    }
    return [
      { label: 'Solicitação', desc: 'Preenchimento do formulário' },
      ...approvalSteps,
      { label: 'Conclusão', desc: 'Efetivação e auditoria' },
    ];
  })();

  // Aprovadores e SLA derivados das alçadas que realmente vão rodar para estes
  // dados (condições avaliadas sobre o formulário atual), não hardcoded.
  const applicableChain = acknowledgement ? [] : buildApprovalChain(process, currentFormData, ctxDaAlcada);
  const aprovadorLabel = acknowledgement
    ? 'Não se aplica'
    : applicableChain.map(l => l.name).join(' → ') || 'RH / Gestor';
  // Em processos de protocolo a primeira etapa já foi cumprida pelo RH.
  const currentStepIndex = acknowledgement ? 1 : 0;
  const fluxoDescricao = acknowledgement
    ? 'Protocolo de recebimento: o RH efetua o crédito e o colaborador apenas confirma e assina. Não há etapa de aprovação.'
    : `Esta solicitação passa por ${applicableChain.length} nível(is) de aprovação, na ordem: ${applicableChain.map(l => l.name).join(' → ')}. A conclusão só ocorre após o último.`;
  // SLA total = soma das alçadas aplicáveis (não de todas as configuradas).
  const totalSlaHoras = applicableChain.reduce((acc, l) => acc + (l.slaUnit === 'd' ? l.sla * 24 : l.sla), 0);
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
                    {fluxoDescricao}
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
                  const isCurrent = idx === currentStepIndex;
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
            {isSaving
              ? (acknowledgement ? 'Registrando...' : 'Enviando...')
              : (acknowledgement ? 'Confirmar e Assinar' : 'Confirmar e Enviar')}
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
