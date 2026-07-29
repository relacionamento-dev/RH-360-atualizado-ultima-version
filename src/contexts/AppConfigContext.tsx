import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, RHRequest, Task, Announcement, HistoryEntry, Job, User, AuditLog, EmployeeMovement, Employee, AdmissaoDigital, AdmissaoDisparo, EmployeeDocument } from '../types';
import { 
  INITIAL_RH_PROCESSES, 
  INITIAL_RH_REQUESTS, 
  INITIAL_EMPLOYEES,
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_TASKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BENEFITS,
  INITIAL_GROUPS,
  COMPANIES,
  BRANCHES,
  UNITS,
  UNIONS,
  SALARY_BANDS,
  COST_CENTERS,
  SECTORS,
  ROLES,
  DEMO_USERS,
  INITIAL_INTRANET,
  INITIAL_REQUEST_COUNTER,
  INITIAL_INTEGRATIONS,
  INITIAL_ACCESSOS,
  menuModules 
} from '../data';
import { PROCESS_DEFINITIONS } from '../processDefinitions';
import { criarBlocosAdmissao } from '../utils/admissaoDigital';
import { isSuperAdmin, isJynxEmail, asSuperAdmin, FULL_PROCESS_PERMISSIONS, FULL_SENSITIVE_PERMISSIONS } from '../utils/permissions';
import {
  buildApprovalChain,
  ensureApprovalChain,
  getCurrentLevelIndex,
  levelLabel,
  slaToMs
} from '../utils/approvalFlow';

const STORAGE_KEY = 'RH360_DEMO_V2';

interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
  login: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  createRequest: (processId: string, data: any, isDraft?: boolean) => void;
  updateRequest: (requestId: string, updates: Partial<RHRequest>) => void;
  approveRequest: (requestId: string, comment?: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  returnRequest: (requestId: string, reason: string) => void;
  cancelRequest: (requestId: string, reason: string) => void;
  completeTask: (taskId: string) => void;
  createAnnouncement: (announcement: Partial<Announcement>) => void;
  addNotification: (titulo: string, mensagem: string, tipo: import('../types').Notificacao['tipo']) => void;
  resetDemo: () => void;
  isAuthorized: (processId: string, action: keyof import('../types').ProcessPermission) => boolean;
  getEffectivePermissions: (userId: string, processId: string) => import('../types').ProcessPermission;
  getSensitiveDataPermissions: (userId: string) => import('../types').SensitiveDataPermission;
  updateOnboardingTask: (requestId: string, section: keyof import('../types').OnboardingData, taskId: string, updates: Partial<import('../types').OnboardingTask>) => void;
  dispararAdmissaoDigital: (dados: Omit<AdmissaoDisparo, 'enviadoEm'>) => void;
  atualizarAdmissaoDigital: (employeeId: string, updates: Partial<AdmissaoDigital>) => void;
  enviarAdmissaoDigital: (employeeId: string) => void;
  aprovarAdmissaoDigital: (employeeId: string) => void;
  devolverAdmissaoDigital: (employeeId: string, blocoIds: string[], motivo: string) => void;
}

const INITIAL_STATE: AppConfig = {
  // Bump ao mudar o seed: força a reidratação a descartar o localStorage antigo,
  // senão os colaboradores desatualizados persistidos sobrescrevem os novos e o
  // solicitante fica com matrícula 00000 / setor N/A.
  // 1.1.0 — seed da Admissão Digital (EMP-AD-DEMO-001 em análise e
  // EMP-AD-DEMO-002 em correção).
  version: '1.1.0',
  empresaAtual: COMPANIES[0],
  usuarioAtual: DEMO_USERS[0], // Admin by default
  usuariosDemo: DEMO_USERS,
  empresas: COMPANIES,
  filiais: BRANCHES,
  unidades: UNITS,
  sindicatos: UNIONS,
  faixasSalariais: SALARY_BANDS,
  centrosDeCusto: COST_CENTERS,
  setores: SECTORS,
  grupos: INITIAL_GROUPS,
  cargos: ROLES,
  modulos: menuModules.map(m => ({ id: m.id, label: m.label, ativo: m.active })),
  processos: INITIAL_RH_PROCESSES,
  processDefinitions: PROCESS_DEFINITIONS,
  intranet: INITIAL_INTRANET,
  solicitacoes: INITIAL_RH_REQUESTS,
  colaboradores: INITIAL_EMPLOYEES,
  vagas: INITIAL_JOBS,
  candidaturas: INITIAL_APPLICATIONS,
  tarefas: INITIAL_TASKS,
  comunicados: INITIAL_ANNOUNCEMENTS,
  beneficios: INITIAL_BENEFITS,
  integracoes: INITIAL_INTEGRATIONS,
  integracaoLogs: [],
  notificacoes: [],
  requestCounter: INITIAL_REQUEST_COUNTER,
  isNewRequestModalOpen: false,
  currentRequestId: null,
  selectedEmployeeId: null,
  appName: 'RH360',
  primaryColor: '#F26522',
  accessos: INITIAL_ACCESSOS,
  currentAccessId: null,
  originalUserId: null,
  originalUser: null,
  activeView: 'login',
  aiGlobalEnabled: false,
  auditTrail: []
};

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.version !== INITIAL_STATE.version) {
          return INITIAL_STATE;
        }
        // processDefinitions carrega funções (condition/calculate/validation) que o
        // JSON.stringify descarta. Reidratar do localStorage devolveria campos sem
        // `condition`, tornando todas as seções visíveis e obrigatórias — por isso
        // a definição vem sempre do código, que é a fonte da verdade.
        // A simulação de perfil ("Visualizar como") NUNCA sobrevive ao reload:
        // a sessão sempre recomeça na tela de login, e restaurar `originalUser`
        // fazia a faixa "Visualizando como..." aparecer sozinha no login
        // seguinte, com o usuário preso ao perfil simulado da sessão anterior.
        return {
          ...INITIAL_STATE,
          ...parsed,
          processDefinitions: PROCESS_DEFINITIONS,
          activeView: 'login',
          originalUser: null,
          originalUserId: null
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    // Não persistir processDefinitions: serializá-lo perde as funções e ainda
    // ocupa espaço à toa, já que a definição é sempre lida do código.
    const { processDefinitions: _processDefinitions, ...persistable } = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [config]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const login = (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    // Conta interna: entra sempre como Administrador Geral, com o perfil REAL
    // (nunca simulado) — vale tanto para usuário do sistema quanto para acesso
    // liberado pela Gestão de Acessos.
    const isInternal = isJynxEmail(normalized);

    const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === normalized && u.password === password);
    if (demoUser) {
      setConfig(prev => ({
        ...prev,
        usuarioAtual: isInternal ? asSuperAdmin(demoUser) : demoUser,
        originalUserId: null,
        originalUser: null,
        activeView: 'intranet',
        currentAccessId: null
      }));
      return { success: true };
    }

    const access = config.accessos.find(a => a.email.toLowerCase() === normalized && a.password === password);
    if (!access) {
      return { success: false, message: 'Usuário ou senha incorretos.' };
    }

    const today = new Date();
    const expiration = new Date(access.expirationDate);
    // Validade e bloqueio valem para acessos de cliente; contas internas não
    // são limitadas por prazo de acesso.
    if (!isInternal && (access.blocked || expiration < today)) {
      return { success: false, message: 'Seu acesso expirou. Fale com o administrador.' };
    }

    const accessUser: User = {
      id: access.id,
      name: access.client,
      role: `Acesso ${access.client}`,
      groups: ['Cliente'],
      profile: access.grantedProfile,
      scope: 'empresa',
      email: access.email,
      status: 'Ativo',
    };

    setConfig(prev => ({
      ...prev,
      usuarioAtual: isInternal ? asSuperAdmin(accessUser) : accessUser,
      // Qualquer login encerra uma simulação pendente: a faixa "Visualizando
      // como" só pode existir quando o próprio usuário escolhe simular.
      originalUser: null,
      originalUserId: null,
      activeView: 'intranet',
      currentAccessId: access.id
    }));
    return { success: true };
  };

  const logout = () => {
    setConfig(prev => ({ ...prev, activeView: 'login', currentAccessId: null, originalUserId: null, originalUser: null, usuarioAtual: DEMO_USERS[0] }));
  };

  const resetDemo = () => {
    setConfig(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getEffectivePermissions = (userId: string, processId: string): import('../types').ProcessPermission => {
    const user = config.usuariosDemo.find(u => u.id === userId) || config.usuarioAtual;

    // Administrador Geral: acesso irrestrito, inclusive a processos sem
    // definição de papéis (o retorno padrão abaixo negaria tudo).
    if (isSuperAdmin(user)) return { ...FULL_PROCESS_PERMISSIONS };

    const userGroups = config.grupos.filter(g => g.membros.includes(user.id) || user.groups.includes(g.nome));
    const process = config.processos.find(p => p.id === processId);

    const effective: import('../types').ProcessPermission = {
      ver: false,
      solicitar: false,
      executar: false,
      aprovar: false,
      devolver: false,
      cancelar: true,
      reabrir: false,
      verHistorico: true,
      verSigiloso: false
    };

    if (!process) {
      return effective;
    }

    const allowedByProfile = (profile: User['profile']) => {
      if (profile === 'Administrador Geral' || profile === 'Administrador') return true;
      if (profile === 'Diretoria') return process.roles.director || process.roles.manager || process.roles.hr || process.roles.employee;
      if (profile === 'RH/DP') return process.roles.hr || process.roles.manager || process.roles.employee;
      if (profile === 'Gestor') return process.roles.manager || process.roles.employee;
      if (profile === 'Colaborador') return process.roles.employee;
      return false;
    };

    const profileAllowed = allowedByProfile(user.profile);

    if (user.profile === 'Administrador Geral' || user.profile === 'Administrador') {
      Object.assign(effective, {
        ver: true,
        solicitar: true,
        executar: true,
        aprovar: true,
        devolver: true,
        cancelar: true,
        reabrir: true,
        verHistorico: true,
        verSigiloso: true
      });
    } else if (profileAllowed) {
      const canExecute = ['Gestor', 'RH/DP', 'Diretoria'].includes(user.profile);
      const canApprove = ['Gestor', 'RH/DP', 'Diretoria'].includes(user.profile);
      Object.assign(effective, {
        ver: true,
        solicitar: true,
        executar: canExecute,
        aprovar: canApprove,
        devolver: canApprove,
        cancelar: true,
        reabrir: false,
        verHistorico: true,
        verSigiloso: user.profile === 'Diretoria'
      });
    }

    userGroups.forEach(g => {
      const p = g.permissoes[processId];
      if (p) {
        Object.keys(effective).forEach(k => {
          if ((p as any)[k]) (effective as any)[k] = true;
        });
      }
    });

    return effective;
  };

  const getSensitiveDataPermissions = (userId: string): import('../types').SensitiveDataPermission => {
    const user = config.usuariosDemo.find(u => u.id === userId) || config.usuarioAtual;

    if (isSuperAdmin(user)) return { ...FULL_SENSITIVE_PERMISSIONS };

    const userGroups = config.grupos.filter(g => g.membros.includes(user.id) || user.groups.includes(g.nome));

    const effective: import('../types').SensitiveDataPermission = {
      visualizarSalario: false,
      editarSalario: false,
      visualizarCPF: false,
      visualizarDocumentosPessoais: false,
      visualizarDadosBancarios: false,
      visualizarASO: false,
      visualizarMedidaDisciplinar: false,
      visualizarDesligamento: false,
      visualizarJuridico: false,
      visualizarAuditoria: false
    };

    userGroups.forEach(g => {
      if (g.dadosSensiveis) {
        Object.keys(effective).forEach(k => {
          if ((g.dadosSensiveis as any)[k]) (effective as any)[k] = true;
        });
      }
    });

    return effective;
  };

  // A antiga escada fixa de status (Pendente → Em Análise → Em Aprovação →
  // Concluída) foi substituída pela cascata configurada no processo: quem
  // determina os passos é `approvalChain` (ver utils/approvalFlow).

  const isFinalRequestStatus = (status: string) => {
    return ['Concluída', 'Concluído', 'Recebimento Confirmado', 'Reprovada', 'Reprovado', 'Cancelada', 'Cancelado'].includes(status);
  };

  const isAuthorized = (processId: string, action: keyof import('../types').ProcessPermission): boolean => {
    // Bypass total do Administrador Geral. Usa o usuário efetivo: ao simular
    // outro perfil, `usuarioAtual` é o simulado e as regras dele valem.
    if (isSuperAdmin(config.usuarioAtual)) return true;
    const perms = getEffectivePermissions(config.usuarioAtual.id, processId);
    return perms[action];
  };

  const createRequest = (processId: string, data: any, isDraft = false) => {
    const process = config.processos.find(p => p.id === processId);
    if (!process) return;

    const nextNumber = config.requestCounter + 1;
    const requestNumber = `RH-2026-${String(nextNumber).padStart(4, '0')}`;

    // Processos de protocolo (ex.: Recebimento de VR/VA) não geram aprovação:
    // ao enviar já ficam no status final declarado na definição do processo.
    const acknowledgement = config.processDefinitions[processId]?.acknowledgement;

    // Cascata de alçadas: níveis configurados no processo que passaram na
    // condição de acionamento, congelados na solicitação.
    const approvalChain = acknowledgement ? [] : buildApprovalChain(process, data);
    const firstLevel = approvalChain[0];

    const employee = config.colaboradores.find(e => e.id === config.usuarioAtual.employeeId);

    const alvo = data.colaborador || 
                 data.alvo || 
                 data.candidatoId || 
                 data.vagaId || 
                 data.colaboradorId || 
                 data.nomeDependente || 
                 data.colaboradorSubstituido || 
                 (processId === '1' || processId === '2' ? 'Novo Registro' : 'N/A');

    const newRequest: RHRequest = {
      id: `req-${Date.now()}`,
      numero: requestNumber,
      tipoProcesso: processId,
      processId: processId,
      processName: process.name,
      category: process.category,
      origem: 'manual',
      solicitante: config.usuarioAtual.name,
      requesterId: config.usuarioAtual.id,
      requesterSnapshot: {
        avatar: config.usuarioAtual.avatar,
        name: config.usuarioAtual.name,
        registration: employee?.registration || '00000',
        email: config.usuarioAtual.email,
        role: config.usuarioAtual.role,
        department: employee?.department || 'N/A',
        costCenter: employee?.costCenter || 'N/A',
        branch: employee?.branch || 'N/A',
      },
      requestedAt: new Date().toISOString(),
      alvo: alvo,
      alvoId: data.employeeId || data.colaboradorId || data.candidatoIdId || data.vagaIdId,
      employeeId: data.employeeId || data.colaboradorId,
      status: isDraft ? 'Rascunho' : (acknowledgement?.status || 'Pendente de Aprovação'),
      etapaAtual: isDraft ? 'Solicitação' : (acknowledgement?.etapa || firstLevel?.name || 'Aprovação'),
      responsavelAtual: isDraft || acknowledgement
        ? config.usuarioAtual.name
        : (firstLevel?.responsibleLabel || 'Administrador Demo'),
      slaVencimento: new Date(Date.now() + (firstLevel ? slaToMs(firstLevel) : 48 * 3600000)).toISOString(),
      slaStatus: 'normal',
      approvalChain,
      // O stepper percorre todos os níveis aplicáveis, não um "Aprovação" genérico.
      trail: acknowledgement?.trail || ['Solicitação', ...approvalChain.map(l => l.name), 'Conclusão'],
      data: data,
      attachments: data.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      historico: [
        { 
          id: `h-${Date.now()}`, 
          autor: config.usuarioAtual.name, 
          userName: config.usuarioAtual.name,
          userId: config.usuarioAtual.id,
          etapa: 'Solicitação',
          de: 'Novo',
          para: isDraft ? 'Rascunho' : (acknowledgement?.etapa || firstLevel?.name || 'Aprovação'),
          dataHora: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          action: isDraft ? 'Rascunho' : (acknowledgement ? 'Confirmação' : 'Envio'),
          comentario: isDraft
            ? 'Rascunho criado.'
            : (acknowledgement?.comment ||
               `Solicitação enviada. Fluxo com ${approvalChain.length} nível(is) de aprovação: ${approvalChain.map(l => l.name).join(' → ')}.`)
        }
      ],
    };

    let newTarefas = config.tarefas;
    if (!isDraft && !acknowledgement) {
      // A tarefa nasce no responsável do PRIMEIRO nível da cascata.
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: `Aprovar ${process.name} — ${firstLevel?.name || 'Aprovação'}`,
        description: `Revisar solicitação ${newRequest.numero} de ${newRequest.solicitante} (${levelLabel(approvalChain, 0)})`,
        assignedTo: firstLevel?.responsibleUserId || 'ADMIN-001',
        dueDate: newRequest.slaVencimento,
        status: 'Pendente',
        priority: 'Média',
        relatedRequestId: newRequest.id,
        createdAt: new Date().toISOString(),

        // Workflow metadata
        requestId: newRequest.id,
        requestNumber: newRequest.numero,
        processId: processId,
        process: process.name,
        solicitante: newRequest.solicitante,
        type: 'Aprovação',
        responsible: firstLevel?.responsibleLabel || 'Administrador Demo',
        responsibleUserId: firstLevel?.responsibleUserId || 'ADMIN-001',
        responsibleGroupId: firstLevel?.responsibleGroupId,
        prazo: newRequest.slaVencimento
      };
      newTarefas = [newTask, ...config.tarefas];
    }

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: isDraft ? 'Criação de Rascunho' : (acknowledgement ? 'Confirmação de Recebimento' : 'Envio de Solicitação'),
      module: 'Solicitações',
      targetId: newRequest.id,
      details: isDraft
        ? `Rascunho ${newRequest.numero} criado`
        : acknowledgement
          ? `${acknowledgement.comment} Protocolo ${newRequest.numero}`
          : `Solicitação ${newRequest.numero} enviada para aprovação`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => ({
      ...prev,
      requestCounter: nextNumber,
      solicitacoes: [newRequest, ...prev.solicitacoes],
      tarefas: newTarefas,
      auditTrail: [auditEntry, ...prev.auditTrail],
      activeView: isDraft ? prev.activeView : 'request-detail',
      currentRequestId: isDraft ? prev.currentRequestId : newRequest.id
    }));
  };

  const addNotification = (titulo: string, mensagem: string, tipo: import('../types').Notificacao['tipo'] = 'sistema') => {
    const newNotif: import('../types').Notificacao = {
      id: `notif-${Date.now()}`,
      userId: config.usuarioAtual.id,
      titulo,
      mensagem,
      lida: false,
      dataHora: new Date().toISOString(),
      tipo
    };
    setConfig(prev => ({
      ...prev,
      notificacoes: [newNotif, ...prev.notificacoes]
    }));
  };

  const updateRequest = (requestId: string, updates: Partial<RHRequest>) => {
    setConfig(prev => {
      const requests = [...prev.solicitacoes];
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx === -1) return prev;

      const oldReq = requests[idx];
      
      // Saída do rascunho (ou reenvio de uma solicitação devolvida): vale tanto
      // para o envio à aprovação quanto para os processos de protocolo, que vão
      // direto ao status final.
      const wasOpen = oldReq.status === 'Rascunho' || oldReq.status === 'Devolvida' || oldReq.status === 'Devolvido';
      const isSubmitting = !!updates.status && wasOpen && updates.status !== 'Rascunho';
      const acknowledgement = prev.processDefinitions[oldReq.processId]?.acknowledgement;

      // No reenvio a cascata é recalculada sobre os dados atuais — se o valor
      // mudou, uma alçada condicional pode passar a valer (ou deixar de valer).
      // Níveis já aprovados que continuam aplicáveis mantêm a aprovação.
      let resubmitChain = oldReq.approvalChain;
      if (isSubmitting && !acknowledgement) {
        const submitProcess = prev.processos.find(p => p.id === (oldReq.tipoProcesso || oldReq.processId));
        const previousChain = oldReq.approvalChain || [];
        resubmitChain = buildApprovalChain(submitProcess, updates.data || oldReq.data).map(level => {
          const previous = previousChain.find(p => p.id === level.id);
          return previous?.status === 'aprovado' ? { ...level, ...previous } : level;
        });
      }
      const submitLevel = resubmitChain?.[getCurrentLevelIndex(resubmitChain || [])];

      const newReq = {
        ...oldReq,
        ...updates,
        updatedAt: new Date().toISOString(),
        alvo: updates.data?.colaborador || updates.data?.alvo || updates.data?.candidatoId || oldReq.alvo || 'N/A',
        ...(isSubmitting && !acknowledgement ? {
          approvalChain: resubmitChain,
          etapaAtual: submitLevel?.name || updates.etapaAtual || 'Aprovação',
          responsavelAtual: submitLevel?.responsibleLabel || 'RH / Gestor',
          trail: ['Solicitação', ...(resubmitChain || []).map(l => l.name), 'Conclusão'],
          slaVencimento: submitLevel
            ? new Date(Date.now() + slaToMs(submitLevel)).toISOString()
            : oldReq.slaVencimento
        } : {}),
        historico: isSubmitting ? [
          ...oldReq.historico,
          {
            id: `h-${Date.now()}`,
            autor: prev.usuarioAtual.name,
            userName: prev.usuarioAtual.name,
            userId: prev.usuarioAtual.id,
            etapa: 'Solicitação',
            de: oldReq.status,
            para: acknowledgement?.etapa || submitLevel?.name || 'Aprovação',
            dataHora: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            action: acknowledgement ? 'Confirmação' : 'Envio',
            comentario: acknowledgement?.comment ||
              `Solicitação enviada. Fluxo com ${(resubmitChain || []).length} nível(is) de aprovação: ${(resubmitChain || []).map(l => l.name).join(' → ')}.`
          }
        ] : oldReq.historico
      };
      requests[idx] = newReq;

      let newTarefas = [...prev.tarefas];
      // Protocolo de recebimento não gera tarefa de aprovação.
      if (isSubmitting && !acknowledgement) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: `Aprovar ${newReq.processName} — ${submitLevel?.name || 'Aprovação'}`,
          description: `Revisar solicitação ${newReq.numero} de ${newReq.solicitante}`,
          assignedTo: submitLevel?.responsibleUserId || 'ADMIN-001',
          dueDate: newReq.slaVencimento,
          status: 'Pendente',
          priority: 'Média',
          relatedRequestId: newReq.id,
          createdAt: new Date().toISOString(),
          requestId: newReq.id,
          requestNumber: newReq.numero,
          processId: newReq.processId,
          process: newReq.processName || '',
          solicitante: newReq.solicitante,
          type: 'Aprovação',
          responsible: submitLevel?.responsibleLabel || 'Administrador Demo',
          responsibleUserId: submitLevel?.responsibleUserId || 'ADMIN-001',
          responsibleGroupId: submitLevel?.responsibleGroupId,
          prazo: newReq.slaVencimento
        };
        newTarefas = [newTask, ...newTarefas];
      }

      let newColaboradores = [...prev.colaboradores];

      // CONCLUSION LOGIC
      if (newReq.status === 'Concluída' && oldReq.status !== 'Concluída') {
        const process = prev.processos.find(p => p.id === newReq.tipoProcesso);
        
        // Handoffs and special updates
        if (process?.id === '7' || process?.id === '11') { // Alteração Salarial ou Movimentação
          const empIdx = newColaboradores.findIndex(e => e.id === newReq.employeeId || e.name === newReq.colaborador);
          if (empIdx !== -1) {
            const emp = newColaboradores[empIdx];
            newColaboradores[empIdx] = {
              ...emp,
              role: newReq.data.novoCargo || emp.role,
              salary: newReq.data.novoSalario || emp.salary,
              department: newReq.data.setorDestino || emp.department,
              costCenter: newReq.data.ccDestino || emp.costCenter,
              manager: newReq.data.gestorDestino?.name || emp.manager,
              branch: newReq.data.filialDestino || emp.branch
            };
            addNotification('Cadastro Atualizado', `O perfil de ${emp.name} foi atualizado automaticamente.`);
          }
        }

        if (process?.id === '15') { // Desligamento
          const empIdx = newColaboradores.findIndex(e => e.id === newReq.employeeId || e.name === newReq.colaborador);
          if (empIdx !== -1) {
            newColaboradores[empIdx] = { ...newColaboradores[empIdx], status: 'Inativo' };
            addNotification('Colaborador Desligado', `${newColaboradores[empIdx].name} agora consta como Inativo.`);
          }
        }
      }

      return { 
        ...prev, 
        solicitacoes: requests,
        colaboradores: newColaboradores
      };
    });
  };

  const approveRequest = (requestId: string, comment?: string) => {
    const req = config.solicitacoes.find(r => r.id === requestId);
    if (!req) return;

    // Rule: Cannot approve own request except Admin Demo / Administrador Geral
    // (que tem bypass total e precisa conseguir percorrer o fluxo inteiro).
    if (req.solicitante === config.usuarioAtual.name && config.usuarioAtual.id !== 'ADMIN-001' && !isSuperAdmin(config.usuarioAtual)) {
      addNotification('Erro na Aprovação', 'Você não pode aprovar sua própria solicitação.', 'sistema');
      return;
    }

    // A aprovação avança UM nível da cascata configurada no processo. Só depois
    // do último nível aplicável a solicitação é concluída.
    const approvalProcess = config.processos.find(p => p.id === (req.tipoProcesso || req.processId));
    const chain = ensureApprovalChain(req, approvalProcess);
    const levelIndex = getCurrentLevelIndex(chain);
    const approvedLevel = chain[levelIndex];

    if (!approvedLevel) {
      addNotification('Erro na Aprovação', 'Esta solicitação não possui níveis de aprovação pendentes.', 'sistema');
      return;
    }

    const decidedAt = new Date().toISOString();
    const newChain = chain.map((level, i) => i === levelIndex
      ? {
          ...level,
          status: 'aprovado' as const,
          decidedBy: config.usuarioAtual.name,
          decidedAt,
          comment: comment || undefined
        }
      : level
    );

    const nextLevel = newChain[levelIndex + 1];
    const isFinal = !nextLevel;
    const nextStatus: RHRequest['status'] = isFinal ? 'Concluída' : 'Em Aprovação';
    const currentLabel = levelLabel(newChain, levelIndex);
    const actionLabel = isFinal ? 'Aprovação Final' : `Aprovação — ${currentLabel}`;
    const notificationMessage = isFinal
      ? `Última alçada aprovada (${approvedLevel.name}). Solicitação concluída.`
      : `${currentLabel} aprovado. Encaminhado para ${nextLevel.name} (${nextLevel.responsibleLabel}).`;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      userName: config.usuarioAtual.name,
      etapa: approvedLevel.name,
      de: req.status,
      para: isFinal ? 'Concluída' : nextLevel.name,
      comentario: comment || notificationMessage,
      action: actionLabel,
      timestamp: decidedAt,
      dataHora: decidedAt
    };

    const updatedRequest: Partial<RHRequest> = {
      status: nextStatus,
      etapaAtual: isFinal ? 'Conclusão' : nextLevel.name,
      approvalChain: newChain,
      historico: [...req.historico, historyEntry],
      responsavelAtual: isFinal ? '' : nextLevel.responsibleLabel,
      slaVencimento: isFinal ? req.slaVencimento : new Date(Date.now() + slaToMs(nextLevel)).toISOString(),
      trail: ['Solicitação', ...newChain.map(l => l.name), 'Conclusão'],
      updatedAt: decidedAt
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: isFinal ? 'Aprovação e Conclusão' : 'Aprovação de Alçada',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero}: ${currentLabel} aprovado por ${config.usuarioAtual.name}. ${
        isFinal ? 'Todas as alçadas aprovadas — solicitação concluída.' : `Aguardando ${nextLevel.name} (${nextLevel.responsibleLabel}).`
      }`,
      timestamp: decidedAt
    };

    setConfig(prev => {
      const newSolicitacoes = prev.solicitacoes.map(r => r.id === requestId ? { ...r, ...updatedRequest } : r);
      let newTarefas = prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t);
      let newColaboradores = [...prev.colaboradores];
      let newVagas = [...prev.vagas];
      let newCandidaturas = [...prev.candidaturas];
      let newRequestCounter = prev.requestCounter;
      const processId = req.tipoProcesso || req.processId;
      const process = prev.processos.find(p => p.id === processId);

      // Ainda há alçada pendente: abre a tarefa do PRÓXIMO nível para o
      // responsável configurado nele.
      if (!isFinal && nextLevel) {
        const nextDue = new Date(Date.now() + slaToMs(nextLevel)).toISOString();
        const nextTask: Task = {
          id: `task-${Date.now()}`,
          title: `Aprovar ${req.processName} — ${nextLevel.name}`,
          description: `Solicitação ${req.numero} aguardando ${levelLabel(newChain, levelIndex + 1)}.`,
          assignedTo: nextLevel.responsibleUserId || 'ADMIN-001',
          dueDate: nextDue,
          status: 'Pendente',
          priority: 'Média',
          relatedRequestId: req.id,
          createdAt: new Date().toISOString(),
          requestId: req.id,
          requestNumber: req.numero,
          processId: req.processId,
          process: req.processName,
          solicitante: req.solicitante,
          type: 'Aprovação',
          responsible: nextLevel.responsibleLabel,
          responsibleUserId: nextLevel.responsibleUserId,
          responsibleGroupId: nextLevel.responsibleGroupId,
          prazo: nextDue
        };
        newTarefas = [nextTask, ...newTarefas];
      }

      if (isFinal) {
        if (processId === '1') {
          const jobTitle = req.data.cargo || req.data.cargoRep || 'Nova Vaga';
          const newJob: import('../types').Job = {
            id: `job-${Date.now()}`,
            code: `VAGA-${String(Date.now()).slice(-6)}`,
            title: jobTitle,
            company: req.data.empresa || 'RH360 Holding',
            branch: req.data.filial || 'Matriz',
            department: req.data.setor || req.data.setorRep || 'Geral',
            sector: req.data.setor || 'Geral',
            costCenter: req.data.centroCusto || req.data.ccRep || '1010 - ADM',
            location: req.data.filial || 'Matriz',
            quantity: Number(req.data.quantidadeVagas || 1),
            status: 'Aberto',
            type: req.data.tipoContrato || 'CLT',
            salaryRange: req.data.salarioSugerido ? `R$ ${req.data.salarioSugerido}` : undefined,
            description: `Requisição de vaga aprovada: ${req.data.justificativa || 'Sem justificativa'}`,
            requirements: req.data.anexo ? [req.data.anexo] : undefined,
            requestId: req.id,
            createdAt: new Date().toISOString()
          };
          newVagas = [newJob, ...newVagas];

          const triageTask: Task = {
            id: `task-${Date.now() + 1}`,
            title: `Triagem de Candidatos - ${jobTitle}`,
            description: `Iniciar triagem de candidatos para a vaga ${jobTitle}.`,
            assignedTo: 'RH-001',
            dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
            status: 'Pendente',
            priority: 'Alta',
            relatedRequestId: req.id,
            createdAt: new Date().toISOString(),
            requestId: req.id,
            requestNumber: req.numero,
            processId: '2',
            process: 'Recrutamento e Seleção',
            solicitante: req.solicitante,
            type: 'Triagem',
            responsible: 'RH/DP',
            responsibleUserId: 'RH-001',
            prazo: new Date(Date.now() + 48 * 3600000).toISOString()
          };
          newTarefas = [triageTask, ...newTarefas];
          addNotification('Vaga Criada', `A vaga ${jobTitle} foi criada automaticamente e triagem iniciada.`);
        }

        if (processId === '2' && req.data.decisao === 'Aprovado') {
          const admissionProcess = prev.processos.find(p => p.id === '3');
          const targetTask: Task = {
            id: `task-${Date.now() + 2}`,
            title: `Iniciar Admissão - ${req.data.nomeCandidato || 'Candidato'}`,
            description: `Gerar admissão para o candidato aprovado na vaga ${req.data.vagaId || req.alvo}.`,
            assignedTo: 'RH-001',
            dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
            status: 'Pendente',
            priority: 'Alta',
            relatedRequestId: req.id,
            createdAt: new Date().toISOString(),
            requestId: req.id,
            requestNumber: req.numero,
            processId: admissionProcess?.ativo ? '3' : '2',
            process: admissionProcess?.ativo ? 'Admissão' : 'Recrutamento e Seleção',
            solicitante: req.solicitante,
            type: 'Onboarding',
            responsible: 'RH/DP',
            responsibleUserId: 'RH-001',
            prazo: new Date(Date.now() + 48 * 3600000).toISOString()
          };
          newTarefas = [targetTask, ...newTarefas];
          addNotification('Handoff de Admissão', `Admissão para o candidato aprovado foi encaminhada ao RH.`);
        }

        if (processId === '3') {
          const onboardingProcess = prev.processos.find(p => p.id === '4');
          const onboardingTask: Task = {
            id: `task-${Date.now() + 3}`,
            title: `Planejar Onboarding - ${req.data.nomeCandidato || req.data.candidatoId || 'Novo Colaborador'}`,
            description: `Preparar onboarding para o colaborador admitido.`,
            assignedTo: 'RH-001',
            dueDate: new Date(Date.now() + 72 * 3600000).toISOString(),
            status: 'Pendente',
            priority: 'Média',
            relatedRequestId: req.id,
            createdAt: new Date().toISOString(),
            requestId: req.id,
            requestNumber: req.numero,
            processId: onboardingProcess?.ativo ? '4' : '3',
            process: onboardingProcess?.ativo ? 'Onboarding' : 'Admissão',
            solicitante: req.solicitante,
            type: 'Onboarding',
            responsible: 'RH/DP',
            responsibleUserId: 'RH-001',
            prazo: new Date(Date.now() + 72 * 3600000).toISOString()
          };
          newTarefas = [onboardingTask, ...newTarefas];
          addNotification('Onboarding Alocado', 'O próximo passo de onboarding foi agendado para o RH.');
        }

        // Esteira: só sugere abrir Requisição de Vaga se o desligamento pediu reposição.
        // `reposicao` agora é radio 'Sim'/'Não' (antes era boolean) — cobre ambos.
        const pediuReposicao = req.data?.reposicao === 'Sim' || req.data?.reposicao === true;
        if (processId === '15' && pediuReposicao) {
          const replacementTask: Task = {
            id: `task-${Date.now() + 4}`,
            title: `Sugestão de Requisição de Vaga - ${req.colaborador || req.alvo || 'Colaborador'}`,
            description: `Desligamento concluído com reposição necessária. Abrir Requisição de Vaga (reposição).`,
            assignedTo: 'RH-001',
            dueDate: new Date(Date.now() + 72 * 3600000).toISOString(),
            status: 'Pendente',
            priority: 'Média',
            relatedRequestId: req.id,
            createdAt: new Date().toISOString(),
            requestId: req.id,
            requestNumber: req.numero,
            processId: '1',
            process: 'Requisição de Vaga',
            solicitante: req.solicitante,
            type: 'Reposição',
            responsible: 'RH/DP',
            responsibleUserId: 'RH-001',
            prazo: new Date(Date.now() + 72 * 3600000).toISOString()
          };
          newTarefas = [replacementTask, ...newTarefas];
          addNotification('Sugestão de Requisição de Vaga', 'O desligamento exige reposição — sugestão de abertura de vaga gerada para o RH.');
        }
      }

      return {
        ...prev,
        solicitacoes: newSolicitacoes,
        tarefas: newTarefas,
        colaboradores: newColaboradores,
        vagas: newVagas,
        candidaturas: newCandidaturas,
        auditTrail: [auditEntry, ...prev.auditTrail],
        highlightedRequestNumber: req.numero,
        requestCounter: newRequestCounter
      };
    });
  };

  const rejectRequest = (requestId: string, reason: string) => {
    const req = config.solicitacoes.find(r => r.id === requestId);
    if (!req) return;

    // A reprovação encerra o fluxo no nível em que estava — os níveis seguintes
    // nem chegam a ser acionados.
    const rejectProcess = config.processos.find(p => p.id === (req.tipoProcesso || req.processId));
    const rejectChain = ensureApprovalChain(req, rejectProcess);
    const rejectIndex = getCurrentLevelIndex(rejectChain);
    const rejectedChain = rejectChain.map((level, i) => i === rejectIndex
      ? { ...level, status: 'reprovado' as const, decidedBy: config.usuarioAtual.name, decidedAt: new Date().toISOString(), comment: reason }
      : level
    );
    const rejectedLevelName = rejectChain[rejectIndex]?.name || req.etapaAtual;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      etapa: rejectedLevelName,
      de: req.status,
      para: 'Reprovada',
      action: `Reprovação — ${rejectedLevelName}`,
      comentario: reason,
      motivo: reason,
      dataHora: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Reprovação',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} reprovada em ${rejectedLevelName}. Motivo: ${reason}`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => ({
      ...prev,
      solicitacoes: prev.solicitacoes.map(r => r.id === requestId
        ? { ...r, status: 'Reprovada' as const, approvalChain: rejectedChain, responsavelAtual: '', historico: [...r.historico, historyEntry] }
        : r),
      tarefas: prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t),
      auditTrail: [auditEntry, ...prev.auditTrail]
    }));
  };

  const returnRequest = (requestId: string, reason: string) => {
    const req = config.solicitacoes.find(r => r.id === requestId);
    if (!req) return;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      etapa: req.etapaAtual,
      de: req.status,
      para: 'Devolvida',
      comentario: reason,
      motivo: reason,
      dataHora: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Devolução',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} devolvida para correção. Motivo: ${reason}`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => {
      const updatedRequests = prev.solicitacoes.map(r => r.id === requestId ? { ...r, status: 'Devolvida' as const, etapaAtual: r.trail?.[0] || 'Abertura', responsavelAtual: r.solicitante, historico: [...r.historico, historyEntry] } as RHRequest : r);
      
      // Conclude old tasks
      const completedTasks = prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t);
      
      // Create new adjustment task for the solicitor
      const adjustTask: Task = {
        id: `task-adjust-${Date.now()}`,
        title: `Ajustar ${req.processName || 'Solicitação'}`,
        description: `Corrigir solicitação ${req.numero} devolvida. Motivo: ${reason}`,
        assignedTo: req.requesterId || 'USER-001',
        dueDate: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'Pendente',
        priority: 'Média',
        relatedRequestId: req.id,
        createdAt: new Date().toISOString(),
        
        // Workflow metadata
        requestId: req.id,
        requestNumber: req.numero,
        processId: req.tipoProcesso || req.processId || '',
        process: req.processName || 'Processo',
        solicitante: req.solicitante,
        type: 'Ajuste',
        responsible: req.solicitante,
        responsibleUserId: req.requesterId || 'USER-001',
        prazo: new Date(Date.now() + 24 * 3600000).toISOString()
      };

      const finalTarefas = [adjustTask, ...completedTasks];

      return {
        ...prev,
        solicitacoes: updatedRequests,
        tarefas: finalTarefas,
        auditTrail: [auditEntry, ...prev.auditTrail]
      };
    });
  };

  const cancelRequest = (requestId: string, reason: string) => {
    const req = config.solicitacoes.find(r => r.id === requestId);
    if (!req) return;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      etapa: req.etapaAtual,
      de: req.status,
      para: 'Cancelada',
      comentario: reason,
      motivo: reason,
      dataHora: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Cancelamento',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} cancelada. Motivo: ${reason}`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => ({
      ...prev,
      solicitacoes: prev.solicitacoes.map(r => r.id === requestId ? { ...r, status: 'Cancelada', historico: [...r.historico, historyEntry] } : r),
      tarefas: prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t),
      auditTrail: [auditEntry, ...prev.auditTrail]
    }));
  };

  const completeTask = (taskId: string) => {
    setConfig(prev => ({
      ...prev,
      tarefas: prev.tarefas.map(t => t.id === taskId ? { ...t, status: 'Concluída' } : t)
    }));
  };

  const createAnnouncement = (announcement: Partial<Announcement>) => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title: announcement.title || 'Novo Comunicado',
      content: announcement.content || '',
      author: config.usuarioAtual.name,
      date: new Date().toLocaleDateString('pt-BR'),
      category: announcement.category || 'RH',
      priority: announcement.priority || 'Normal',
      ...announcement
    };

    setConfig(prev => ({
      ...prev,
      comunicados: [newAnnouncement, ...prev.comunicados]
    }));
  };

  const updateOnboardingTask = (requestId: string, section: keyof import('../types').OnboardingData, taskId: string, updates: Partial<import('../types').OnboardingTask>) => {
    setConfig(prev => {
      const requests = [...prev.solicitacoes];
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx === -1) return prev;

      const req = { ...requests[idx] };
      const data = { ...req.data };
      const tasks = [...(data[section] || [])];
      const taskIdx = tasks.findIndex(t => t.id === taskId);
      
      if (taskIdx === -1) return prev;

      tasks[taskIdx] = { ...tasks[taskIdx], ...updates, date: updates.done ? new Date().toISOString() : undefined };
      data[section] = tasks;

      // Recalculate progress
      const allTasks = [...(data.rh || []), ...(data.ti || []), ...(data.facilities || []), ...(data.gestor || []), ...(data.colaborador || [])];
      const doneTasks = allTasks.filter(t => t.done).length;
      data.progress = allTasks.length > 0 ? (doneTasks / allTasks.length) * 100 : 0;

      req.data = data;
      req.updatedAt = new Date().toISOString();
      
      // Register history
      const historyEntry: HistoryEntry = {
        id: `h-${Date.now()}`,
        autor: config.usuarioAtual.name,
        userName: config.usuarioAtual.name,
        etapa: req.etapaAtual,
        action: 'Atualização Checklist',
        para: req.status,
        comentario: `Tarefa "${tasks[taskIdx].task}" ${updates.done ? 'concluída' : 'reaberta'}.`,
        dataHora: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      req.historico = [...(req.historico || []), historyEntry];

      requests[idx] = req;
      return { ...prev, solicitacoes: requests };
    });
  };

  // -------------------------------------------------------------------------
  // Admissão Digital (demonstração)
  // -------------------------------------------------------------------------

  const registrarAuditoriaAdmissao = (action: string, targetId: string, details: string): AuditLog => ({
    id: `audit-${Date.now()}`,
    userId: config.usuarioAtual.id,
    userName: config.usuarioAtual.name,
    action,
    module: 'Admissão Digital',
    targetId,
    details,
    timestamp: new Date().toISOString()
  });

  /**
   * Cria o colaborador já em Pré-admissão. Ele sai da contagem de Ativos
   * (status) e passa a existir para o Portal do Colaborador (admissaoDigital).
   */
  const dispararAdmissaoDigital = (dados: Omit<AdmissaoDisparo, 'enviadoEm'>) => {
    const agora = new Date();
    const previsaoAdmissao = new Date(agora.getTime() + dados.prazoDias * 86400000);

    const novo: Employee = {
      id: `EMP-AD-${agora.getTime()}`,
      name: dados.nome,
      email: dados.email,
      phone: '',
      address: '',
      city: '',
      state: '',
      department: 'A definir',
      role: 'A definir',
      branch: config.filiais[0] || 'Matriz SP',
      company: config.empresaAtual.name,
      status: 'Pré-admissão',
      situacao: 'PRE_ADMISSAO',
      admissionDate: previsaoAdmissao.toISOString().slice(0, 10),
      birthDate: '',
      salary: 0,
      manager: 'A definir',
      costCenter: 'A definir',
      registration: `AD-${String(agora.getTime()).slice(-5)}`,
      cpf: dados.cpf,
      documents: [],
      admissaoDigital: {
        estado: 'AGUARDANDO_PREENCHIMENTO',
        disparo: { ...dados, enviadoEm: agora.toISOString() },
        termoAceito: false,
        blocos: criarBlocosAdmissao()
      }
    };

    setConfig(prev => ({
      ...prev,
      colaboradores: [novo, ...prev.colaboradores],
      auditTrail: [
        registrarAuditoriaAdmissao(
          'Disparo de Admissão Digital',
          novo.id,
          `Link enviado para ${dados.nome} (${dados.email}) com prazo de ${dados.prazoDias} dias.`
        ),
        ...prev.auditTrail
      ]
    }));

    addNotification(
      'Link de admissão enviado',
      `${dados.nome} recebeu o link e tem ${dados.prazoDias} dias para enviar os documentos.`,
      'sistema'
    );
  };

  /** Merge parcial usado pelo portal (aceite do termo, anexos dos blocos). */
  const atualizarAdmissaoDigital = (employeeId: string, updates: Partial<AdmissaoDigital>) => {
    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(emp =>
        emp.id === employeeId && emp.admissaoDigital
          ? { ...emp, admissaoDigital: { ...emp.admissaoDigital, ...updates } }
          : emp
      )
    }));
  };

  /**
   * Envio do colaborador. Vale para o 1º envio e para o reenvio pós-correção —
   * neste, os blocos devolvidos voltam a PENDENTE e o motivo é limpo, senão o
   * portal continuaria mostrando o box "Motivo da revisão".
   */
  const enviarAdmissaoDigital = (employeeId: string) => {
    const emp = config.colaboradores.find(e => e.id === employeeId);
    if (!emp?.admissaoDigital) return;
    const eraCorrecao = emp.admissaoDigital.estado === 'EM_CORRECAO';
    const agora = new Date().toISOString();

    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(e =>
        e.id === employeeId && e.admissaoDigital
          ? {
              ...e,
              admissaoDigital: {
                ...e.admissaoDigital,
                estado: 'EM_ANALISE',
                enviadoEm: agora,
                mensagemRevisao: undefined,
                blocos: e.admissaoDigital.blocos.map(b => ({
                  ...b,
                  statusRevisao: 'PENDENTE' as const,
                  motivoRevisao: undefined
                }))
              }
            }
          : e
      ),
      auditTrail: [
        registrarAuditoriaAdmissao(
          eraCorrecao ? 'Reenvio de Documentos' : 'Envio de Documentos',
          employeeId,
          `${emp.name} ${eraCorrecao ? 'reenviou os documentos corrigidos' : 'enviou os documentos'} para análise do RH.`
        ),
        ...prev.auditTrail
      ]
    }));

    addNotification(
      eraCorrecao ? 'Documentos corrigidos' : 'Documentos recebidos',
      `${emp.name} enviou a documentação de admissão. Aguardando revisão do RH.`,
      'sistema'
    );
  };

  /**
   * Aprovação do RH: o colaborador vira Ativo, os anexos entram na ficha como
   * documentos e o registro de admissão digital é encerrado (some das filas do
   * portal e da revisão).
   */
  const aprovarAdmissaoDigital = (employeeId: string) => {
    const emp = config.colaboradores.find(e => e.id === employeeId);
    if (!emp?.admissaoDigital) return;

    const novosDocumentos: EmployeeDocument[] = emp.admissaoDigital.blocos.flatMap(bloco =>
      bloco.anexos.map(anexo => ({
        id: `doc-${bloco.id}-${anexo.id}`,
        type: bloco.titulo,
        number: anexo.nome,
        issueDate: anexo.enviadoEm.slice(0, 10),
        status: 'Válido' as const,
        attachmentUrl: anexo.nome,
        origin: 'Upload' as const
      }))
    );

    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(e =>
        e.id === employeeId
          ? {
              ...e,
              status: 'Ativo' as const,
              situacao: 'ATIVO' as const,
              admissionDate: new Date().toISOString().slice(0, 10),
              documents: [...novosDocumentos, ...(e.documents || [])],
              admissaoDigital: undefined
            }
          : e
      ),
      auditTrail: [
        registrarAuditoriaAdmissao(
          'Aprovação de Admissão Digital',
          employeeId,
          `Admissão de ${emp.name} aprovada. ${novosDocumentos.length} documento(s) anexado(s) à ficha.`
        ),
        ...prev.auditTrail
      ]
    }));

    addNotification(
      'Admissão aprovada',
      `${emp.name} agora consta como Ativo, com os documentos já na ficha.`,
      'sistema'
    );
  };

  /** Devolução com pendência: só os blocos escolhidos voltam ao portal. */
  const devolverAdmissaoDigital = (employeeId: string, blocoIds: string[], motivo: string) => {
    const emp = config.colaboradores.find(e => e.id === employeeId);
    if (!emp?.admissaoDigital || blocoIds.length === 0) return;

    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(e =>
        e.id === employeeId && e.admissaoDigital
          ? {
              ...e,
              admissaoDigital: {
                ...e.admissaoDigital,
                estado: 'EM_CORRECAO',
                mensagemRevisao: motivo,
                // O bloco devolvido perde os anexos recusados: o colaborador
                // precisa enviar de novo, e é isso que reabilita o botão de
                // reenvio no portal.
                blocos: e.admissaoDigital.blocos.map(b =>
                  blocoIds.includes(b.id)
                    ? { ...b, statusRevisao: 'AGUARDANDO_CORRECAO' as const, motivoRevisao: motivo, anexos: [] }
                    : { ...b, statusRevisao: 'APROVADO' as const, motivoRevisao: undefined }
                )
              }
            }
          : e
      ),
      auditTrail: [
        registrarAuditoriaAdmissao(
          'Devolução de Admissão Digital',
          employeeId,
          `Admissão de ${emp.name} devolvida com ${blocoIds.length} pendência(s). Motivo: ${motivo}`
        ),
        ...prev.auditTrail
      ]
    }));

    addNotification(
      'Admissão devolvida',
      `${emp.name} precisa corrigir ${blocoIds.length} documento(s) no portal.`,
      'sistema'
    );
  };

  return (
    <AppConfigContext.Provider value={{
      config,
      updateConfig, 
      resetConfig, 
      createRequest, 
      updateRequest, 
      approveRequest, 
      rejectRequest, 
      returnRequest, 
      cancelRequest,
      completeTask,
      createAnnouncement,
      addNotification,
      login,
      logout,
      resetDemo,
      isAuthorized,
      getEffectivePermissions,
      getSensitiveDataPermissions,
      updateOnboardingTask,
      dispararAdmissaoDigital,
      atualizarAdmissaoDigital,
      enviarAdmissaoDigital,
      aprovarAdmissaoDigital,
      devolverAdmissaoDigital
    }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
}
