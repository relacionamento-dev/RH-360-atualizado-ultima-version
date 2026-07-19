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
  menuModules 
} from '../data';
import { PROCESS_DEFINITIONS } from '../processDefinitions';

const STORAGE_KEY = 'RH360_DEMO_V2';

interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
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
  version: '1.0.1',
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
        return { ...INITIAL_STATE, ...parsed, activeView: 'login' };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const resetDemo = () => {
    setConfig(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getEffectivePermissions = (userId: string, processId: string): import('../types').ProcessPermission => {
    const user = config.usuariosDemo.find(u => u.id === userId) || config.usuarioAtual;
    const userGroups = config.grupos.filter(g => g.membros.includes(user.id) || user.groups.includes(g.nome));
    
    // Base Profile Permissions (simplified mapping)
    const basePerms: import('../types').ProcessPermission = {
      ver: user.profile !== 'Colaborador',
      solicitar: true,
      executar: user.profile === 'RH/DP' || user.profile === 'Administrador',
      aprovar: user.profile !== 'Colaborador',
      devolver: user.profile !== 'Colaborador',
      cancelar: true,
      reabrir: user.profile === 'Administrador',
      verHistorico: true,
      verSigiloso: user.profile === 'Administrador' || user.profile === 'Diretoria'
    };

    const effective: import('../types').ProcessPermission = { ...basePerms };

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

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      userName: config.usuarioAtual.name,
      etapa: 'Aprovação',
      de: req.status,
      para: 'Concluída',
      comentario: comment || 'Solicitação aprovada e concluída.',
      action: 'Aprovação Final',
      timestamp: new Date().toISOString(),
      dataHora: new Date().toISOString()
    };

    const updatedRequest: Partial<RHRequest> = {
      status: 'Concluída',
      etapaAtual: 'Concluída',
      historico: [...req.historico, historyEntry],
      responsavelAtual: '',
      updatedAt: new Date().toISOString()
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Aprovação e Conclusão',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero} aprovada e concluída por ${config.usuarioAtual.name}`,
      timestamp: new Date().toISOString()
    };

    setConfig(prev => {
      const newSolicitacoes = prev.solicitacoes.map(r => r.id === requestId ? { ...r, ...updatedRequest } : r);
      const newTarefas = prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t);
      
      // SIDE EFFECTS
      let newColaboradores = [...prev.colaboradores];
      let newVagas = [...prev.vagas];
      let newCandidaturas = [...prev.candidaturas];
      const processId = req.tipoProcesso || req.processId;

      if (processId === '2') { // Recrutamento e Seleção
        if (req.data.decisao === 'Aprovado') {
          const candIdx = newCandidaturas.findIndex(c => c.id === req.data.candidatoId);
          if (candIdx !== -1) {
            newCandidaturas[candIdx] = { ...newCandidaturas[candIdx], status: 'Aprovado' };
          }
          const vagaIdx = newVagas.findIndex(v => v.id === req.data.vagaId);
          if (vagaIdx !== -1) {
            // Optional: reduce quantity or close if quantity reached
            // For demo, just mark as 'Em Admissão' status if we had one, or keep open
          }
          addNotification('Candidato Aprovado', `${req.data.candidato} foi aprovado. Iniciando Admissão.`);
        }
      }

      if (processId === '3') { // Contratação e Admissão
        // Create new collaborator
        const newReg = `00${Math.floor(1000 + Math.random() * 9000)}`;
        const newEmp: Employee = {
          id: `emp-${Date.now()}`,
          registration: newReg,
          name: req.data.candidatoId, 
          email: 'colaborador@exemplo.com',
          phone: '(00) 00000-0000',
          address: 'Endereço não informado',
          city: 'Não informada',
          state: 'XX',
          birthDate: '2000-01-01',
          cpf: '000.000.000-00',
          role: req.data.cargo,
          department: 'Geral',
          company: req.data.empresa,
          branch: req.data.filial,
          admissionDate: req.data.dataAdmissao,
          salary: req.data.salario,
          status: 'Ativo',
          manager: 'Ana Paula Lima',
          costCenter: '1010 - ADM'
        };
        newColaboradores = [newEmp, ...newColaboradores];
        addNotification('Novo Colaborador', `${newEmp.name} foi admitido com matrícula ${newReg}.`);
      }

      if (processId === '7' || processId === '11') {
        const empIdx = newColaboradores.findIndex(e => e.id === req.employeeId || e.name === req.colaborador);
        if (empIdx !== -1) {
          const emp = newColaboradores[empIdx];
          newColaboradores[empIdx] = {
            ...emp,
            role: req.data.novoCargo || emp.role,
            salary: req.data.novoSalario || emp.salary,
            department: req.data.setorDestino || emp.department,
            costCenter: req.data.ccDestino || emp.costCenter,
            manager: req.data.gestorDestino?.name || emp.manager,
            branch: req.data.filialDestino || emp.branch
          };
        }
      }

      if (processId === '15') {
        const empIdx = newColaboradores.findIndex(e => e.id === req.employeeId || e.name === req.colaborador);
        if (empIdx !== -1) {
          newColaboradores[empIdx] = { ...newColaboradores[empIdx], status: 'Inativo' };
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
        highlightedRequestNumber: req.numero
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
