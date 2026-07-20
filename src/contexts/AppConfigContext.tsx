import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig, RHRequest, Task, Announcement, HistoryEntry, Job, User, AuditLog, EmployeeMovement, Employee } from '../types';
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
}

const INITIAL_STATE: AppConfig = {
  // Bump ao mudar o seed (novos colaboradores EMP-024..029 e vínculo employeeId dos
  // usuários JYNX): força a reidratação a descartar o localStorage antigo, senão os
  // colaboradores desatualizados persistidos sobrescrevem os novos e o solicitante
  // fica com matrícula 00000 / setor N/A.
  version: '1.0.2',
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
        return { ...INITIAL_STATE, ...parsed, processDefinitions: PROCESS_DEFINITIONS, activeView: 'login' };
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
    const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === normalized && u.password === password);
    if (demoUser) {
      setConfig(prev => ({ ...prev, usuarioAtual: demoUser, originalUserId: null, originalUser: null, activeView: 'intranet', currentAccessId: null }));
      return { success: true };
    }

    const access = config.accessos.find(a => a.email.toLowerCase() === normalized && a.password === password);
    if (!access) {
      return { success: false, message: 'Usuário ou senha incorretos.' };
    }

    const today = new Date();
    const expiration = new Date(access.expirationDate);
    if (access.blocked || expiration < today) {
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

    setConfig(prev => ({ ...prev, usuarioAtual: accessUser, activeView: 'intranet', currentAccessId: access.id }));
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

  const getNextRequestStatus = (status: string) => {
    switch (status) {
      case 'Pendente de Aprovação': return 'Em Análise';
      case 'Em Análise': return 'Em Aprovação';
      case 'Em Aprovação': return 'Concluída';
      case 'Enviada': return 'Em Análise';
      default: return 'Concluída';
    }
  };

  const isFinalRequestStatus = (status: string) => {
    return ['Concluída', 'Concluído', 'Reprovada', 'Reprovado', 'Cancelada', 'Cancelado'].includes(status);
  };

  const isAuthorized = (processId: string, action: keyof import('../types').ProcessPermission): boolean => {
    const perms = getEffectivePermissions(config.usuarioAtual.id, processId);
    return perms[action];
  };

  const createRequest = (processId: string, data: any, isDraft = false) => {
    const process = config.processos.find(p => p.id === processId);
    if (!process) return;

    const nextNumber = config.requestCounter + 1;
    const requestNumber = `RH-2026-${String(nextNumber).padStart(4, '0')}`;

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
      status: isDraft ? 'Rascunho' : 'Pendente de Aprovação',
      etapaAtual: isDraft ? 'Solicitação' : 'Aprovação',
      responsavelAtual: isDraft ? config.usuarioAtual.name : 'Administrador Demo',
      slaVencimento: new Date(Date.now() + 48 * 3600000).toISOString(),
      slaStatus: 'normal',
      trail: ['Solicitação', 'Aprovação', 'Conclusão'],
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
          para: isDraft ? 'Rascunho' : 'Aprovação', 
          dataHora: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          action: isDraft ? 'Rascunho' : 'Envio',
          comentario: isDraft ? 'Rascunho criado.' : 'Solicitação enviada para aprovação.'
        }
      ],
    };

    let newTarefas = config.tarefas;
    if (!isDraft) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: `Aprovar ${process.name}`,
        description: `Revisar solicitação ${newRequest.numero} de ${newRequest.solicitante}`,
        assignedTo: 'ADMIN-001',
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
        responsible: 'Administrador Demo',
        responsibleUserId: 'ADMIN-001',
        prazo: newRequest.slaVencimento
      };
      newTarefas = [newTask, ...config.tarefas];
    }

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: isDraft ? 'Criação de Rascunho' : 'Envio de Solicitação',
      module: 'Solicitações',
      targetId: newRequest.id,
      details: `${isDraft ? 'Rascunho' : 'Solicitação'} ${newRequest.numero} enviada para aprovação`,
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
      
      // If transitioning from Rascunho to Pendente de Aprovação
      const isSubmitting = oldReq.status === 'Rascunho' && updates.status === 'Pendente de Aprovação';
      
      const newReq = { 
        ...oldReq, 
        ...updates, 
        updatedAt: new Date().toISOString(),
        alvo: updates.data?.colaborador || updates.data?.alvo || updates.data?.candidatoId || oldReq.alvo || 'N/A',
        historico: isSubmitting ? [
          ...oldReq.historico,
          {
            id: `h-${Date.now()}`,
            autor: prev.usuarioAtual.name,
            userName: prev.usuarioAtual.name,
            userId: prev.usuarioAtual.id,
            etapa: 'Solicitação',
            de: 'Rascunho',
            para: 'Aprovação',
            dataHora: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            action: 'Envio',
            comentario: 'Rascunho enviado para aprovação.'
          }
        ] : oldReq.historico
      };
      requests[idx] = newReq;

      let newTarefas = [...prev.tarefas];
      if (isSubmitting) {
        const process = prev.processos.find(p => p.id === newReq.processId);
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: `Aprovar ${newReq.processName}`,
          description: `Revisar solicitação ${newReq.numero} de ${newReq.solicitante}`,
          assignedTo: 'ADMIN-001',
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
          responsible: 'Administrador Demo',
          responsibleUserId: 'ADMIN-001',
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

    // Rule: Cannot approve own request except Admin Demo
    if (req.solicitante === config.usuarioAtual.name && config.usuarioAtual.id !== 'ADMIN-001') {
      addNotification('Erro na Aprovação', 'Você não pode aprovar sua própria solicitação.', 'sistema');
      return;
    }

    const nextStatus = getNextRequestStatus(req.status);
    const isFinal = nextStatus === 'Concluída';
    const actionLabel = isFinal ? 'Aprovação Final' : 'Aprovação Parcial';
    const notificationMessage = isFinal
      ? 'Solicitação aprovada e concluída.'
      : `Solicitação aprovada e movida para ${nextStatus}.`;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      userName: config.usuarioAtual.name,
      etapa: 'Aprovação',
      de: req.status,
      para: nextStatus,
      comentario: comment || notificationMessage,
      action: actionLabel,
      timestamp: new Date().toISOString(),
      dataHora: new Date().toISOString()
    };

    const updatedRequest: Partial<RHRequest> = {
      status: nextStatus as RHRequest['status'],
      etapaAtual: nextStatus,
      historico: [...req.historico, historyEntry],
      responsavelAtual: isFinal ? '' : req.responsavelAtual,
      updatedAt: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: isFinal ? 'Aprovação e Conclusão' : 'Aprovação Parcial',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} ${isFinal ? 'aprovada e concluída' : `avançou para ${nextStatus.toLowerCase()}`} por ${config.usuarioAtual.name}`,
      timestamp: new Date().toISOString()
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

      if (!isFinal) {
        const nextTask: Task = {
          id: `task-${Date.now()}`,
          title: `${nextStatus === 'Em Aprovação' ? 'Aprovar' : 'Analisar'} ${req.processName}`,
          description: `Acompanhar solicitação ${req.numero} na etapa ${nextStatus}.`,
          assignedTo: nextStatus === 'Em Aprovação' ? 'DIR-001' : 'RH-001',
          dueDate: new Date(Date.now() + 24 * 3600000).toISOString(),
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
          responsible: nextStatus === 'Em Aprovação' ? 'Diretoria' : 'RH/DP',
          responsibleUserId: nextStatus === 'Em Aprovação' ? 'DIR-001' : 'RH-001',
          prazo: new Date(Date.now() + 24 * 3600000).toISOString()
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

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      etapa: req.etapaAtual,
      de: req.status,
      para: 'Reprovada',
      comentario: reason,
      motivo: reason,
      dataHora: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Reprovação',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} reprovada. Motivo: ${reason}`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => ({
      ...prev,
      solicitacoes: prev.solicitacoes.map(r => r.id === requestId ? { ...r, status: 'Reprovada', historico: [...r.historico, historyEntry] } : r),
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
      updateOnboardingTask
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
