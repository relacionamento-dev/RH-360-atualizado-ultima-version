import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AccessProfile, AppConfig, Company, ParametrizacaoEmpresa, RHRequest, Task, Announcement, HistoryEntry, Job, User, AuditLog, EmployeeMovement, Employee, Sector, AdmissaoDigital, AdmissaoDisparo, EmployeeDocument, EncerramentoDesligamento } from '../types';
import { 
  INITIAL_RH_PROCESSES, 
  INITIAL_RH_REQUESTS, 
  INITIAL_EMPLOYEES,
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_TASKS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BENEFITS,
  INITIAL_ACCESS_PROFILES,
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
  TECHFLOW_BRANCHES,
  TECHFLOW_COST_CENTERS,
  TECHFLOW_ROLES,
  TECHFLOW_SECTORS,
  TODOS_OS_COLABORADORES,
  menuModules
} from '../data';
import { PROCESS_DEFINITIONS } from '../processDefinitions';
import { blocosComDadosDoDisparo, criarBlocosAdmissao, fotoDePerfilDaAdmissao } from '../utils/admissaoDigital';
import { hasGlobalScope, perfilDoUsuario, isSuperAdmin, isJynxEmail, asSuperAdmin, podeGerenciarComunicado, podePublicarComunicadoOficial, podeAprovarPropriaSolicitacao, FULL_PROCESS_PERMISSIONS, FULL_SENSITIVE_PERMISSIONS, PROCESSO_DESLIGAMENTO } from '../utils/permissions';
import { ETAPA_ENCERRAMENTO } from '../utils/desligamento';
import { matriculaDoCadastro } from '../utils/identidade';
import {
  buildApprovalChain,
  ensureApprovalChain,
  getCurrentLevelIndex,
  levelLabel,
  motivosDaCascata,
  organizacaoDoConfig,
  slaToMs
} from '../utils/approvalFlow';
import { colaboradorDoUsuario, resolverAlvo } from '../utils/hierarquia';
import { aplicarParametrizacao, parametrizacaoAtual, parametrizacaoInicial } from '../utils/empresa';

const STORAGE_KEY = 'RH360_DEMO_V2';

/**
 * Parametrização inicial das duas empresas do seed.
 *
 * A RH360 recebe a configuração que hoje é a única do produto; a TechFlow
 * recebe os MESMOS processos e perfis (é o que a torna operável) com estrutura
 * PRÓPRIA — cargos, centros de custo, setores e filiais dela. Copiar a
 * estrutura de uma para a outra seria levar dado de um cliente para outro.
 */
const PARAMETRIZACAO_INICIAL: Record<string, ParametrizacaoEmpresa> = {
  [COMPANIES[0].id]: {
    processos: INITIAL_RH_PROCESSES,
    perfis: INITIAL_ACCESS_PROFILES,
    grupos: INITIAL_GROUPS,
    cargos: ROLES,
    centrosDeCusto: COST_CENTERS,
    setores: SECTORS,
    filiais: BRANCHES,
    unidades: UNITS,
    faixasSalariais: SALARY_BANDS,
    sindicatos: UNIONS,
    beneficios: INITIAL_BENEFITS,
    politicas: { slaPadraoHoras: 48, exigirAnexoDespesa: true, tetoAprovacaoGestor: 10000 }
  },
  [COMPANIES[1].id]: {
    // Cópia PROFUNDA dos processos: é o que garante que mexer na alçada da
    // TechFlow não alcance a RH360 (as duas referenciariam o mesmo objeto).
    processos: INITIAL_RH_PROCESSES.map(p => ({
      ...p,
      approvals: p.approvals.map(a => ({ ...a })),
      etapas: [...p.etapas]
    })),
    perfis: INITIAL_ACCESS_PROFILES.map(p => ({
      ...p, telas: [...p.telas], permissoes: { ...p.permissoes },
      acoesDeTela: { ...p.acoesDeTela }, dadosSensiveis: { ...p.dadosSensiveis }
    })),
    grupos: [],
    cargos: TECHFLOW_ROLES,
    centrosDeCusto: TECHFLOW_COST_CENTERS,
    setores: TECHFLOW_SECTORS,
    filiais: TECHFLOW_BRANCHES,
    unidades: [],
    faixasSalariais: SALARY_BANDS,
    sindicatos: [],
    beneficios: INITIAL_BENEFITS,
    politicas: { slaPadraoHoras: 24, exigirAnexoDespesa: false, tetoAprovacaoGestor: 5000 }
  }
};

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
  editarComunicado: (comunicadoId: string, updates: Partial<Pick<Announcement, 'title' | 'content'>>) => void;
  excluirComunicado: (comunicadoId: string) => void;
  comentarComunicado: (comunicadoId: string, texto: string) => void;
  removerComentario: (comunicadoId: string, comentarioId: string) => void;
  addNotification: (titulo: string, mensagem: string, tipo: import('../types').Notificacao['tipo']) => void;
  resetDemo: () => void;
  /** Multiempresa. */
  trocarEmpresa: (empresaId: string) => void;
  criarEmpresa: (dados: { name: string; document: string }) => Company;
  atualizarParametrizacao: (empresaId: string, updates: Partial<ParametrizacaoEmpresa>) => void;
  importarColaboradores: (empresaId: string, novos: Employee[]) => void;
  publicarEmpresa: (empresaId: string) => { ok: boolean; motivo?: string };
  /** Perfis de acesso — CRUD da Central Adm. */
  salvarPerfil: (perfil: AccessProfile) => void;
  alternarPerfilAtivo: (perfilId: string) => void;
  excluirPerfil: (perfilId: string) => { ok: boolean; motivo?: string };
  isAuthorized: (processId: string, action: keyof import('../types').ProcessPermission) => boolean;
  getEffectivePermissions: (userId: string, processId: string) => import('../types').ProcessPermission;
  getSensitiveDataPermissions: (userId: string) => import('../types').SensitiveDataPermission;
  updateOnboardingTask: (requestId: string, section: keyof import('../types').OnboardingData, taskId: string, updates: Partial<import('../types').OnboardingTask>) => void;
  atualizarEncerramentoDesligamento: (requestId: string, encerramento: EncerramentoDesligamento) => void;
  concluirEncerramentoDesligamento: (requestId: string, encerramento: EncerramentoDesligamento) => void;
  anexarDocumentoColaborador: (employeeId: string, arquivo: { nome: string; tipo?: string }) => void;
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
  // 1.2.0 — processo '3' renomeado para "Admissão Digital" e disparo com Vaga
  // Aprovada + condições contratuais (os dois seeds ganharam esses campos).
  // 1.3.0 — acordeão do Portal do Colaborador: blocos ganharam `confirmado`,
  // que é o que acende a bolinha verde e libera o envio.
  // 1.4.0 — conjunto completo de blocos (foto, dados pessoais, título, certidão,
  // CNH, reservista, endereço, dependentes e certificados), com campos, listas
  // e condicionais Sim/Não.
  // 1.5.0 — Intranet: comunicados com banner, anexo e comentários (o carrossel
  // passou a ter 4 itens de exemplo em vez de 1).
  // 1.6.0 — Desligamento: etapa "Benefícios e Encerramento" (status
  // 'Aguardando Encerramento' + campo `encerramento` na solicitação) e o seed
  // RH-2026-0053, já aprovado, aguardando essa etapa.
  // 1.7.0 — Perfil 360: ficha completa derivada por colaborador (documentos,
  // exames, férias, benefícios, movimentações, treinamentos e auditoria), para
  // as abas não abrirem vazias.
  // 1.8.0 — Hub: solicitações próprias e aprovações pendentes para as contas
  // @jynx (RH-2026-0054 a 0069), para "Minhas Solicitações" e "Minhas
  // Aprovações" não abrirem zeradas na demonstração.
  // 1.9.0 — Matrícula derivada do id do cadastro (EMP-007 → 00007), snapshots
  // das solicitações montados a partir da ficha e vínculos usuário→colaborador
  // corrigidos. TODAS as matrículas do seed mudaram: sem o bump, o
  // localStorage antigo devolveria as duplicadas.
  // 1.10.0 — Aprovador resolvido pela hierarquia real: colaborador com gestor
  // por ID, setores com gestor titular e substituto por ID, centros de custo
  // com responsável, e a cascata das solicitações do seed já resolvida sobre o
  // alvo. Sem o bump, o localStorage antigo devolveria setores sem `managerId`
  // e toda alçada de setor cairia no fallback.
  // 1.11.0 — RBAC: perfil virou entidade configurável (AppConfig.perfis) com
  // escopo de dados, telas, ações de tela e matriz por processo. Sem o bump o
  // localStorage antigo viria sem `perfis` e toda checagem cairia na tabela de
  // fábrica — inclusive liberando telas para perfis que o cliente desativou.
  // 1.12.0 — Multiempresa: parametrização por empresa (AppConfig.parametrizacao),
  // troca de empresa ativa, recorte de dados por empresa e a base própria da
  // TechFlow. Sem o bump o localStorage antigo viria sem parametrizacao e sem o
  // quadro da segunda empresa, e o seletor trocaria de nome sem trocar de dados.
  // 1.13.0 — matriz de permissão por PAPEL nos perfis e grupos de fábrica:
  // Colaborador só abre os cinco processos de autosserviço e o Gestor aprova os
  // processos em que a hierarquia o designa. Sem o bump, o localStorage antigo
  // devolveria os perfis e grupos do laço genérico — Colaborador abrindo o
  // próprio desligamento e Gestor sem o botão "Aprovar" na fila dele.
  // 1.14.0 — vagas com empresa e filial REAIS (as antigas diziam "RH360
  // Holding" / "Escritório", que não são nem empresa nem filial do cadastro) e
  // quadro de vagas próprio da TechFlow. Sem o bump, o localStorage antigo
  // devolveria vagas de uma empresa que não existe e o recorte por empresa
  // esconderia todas elas.
  // 1.15.0 — `etapas` de cada processo derivada da cascata em vez de escrita à
  // mão. Sem o bump, o localStorage antigo devolveria a descrição velha, que
  // prometia alçadas inexistentes ("Aprovação Financeira" no processo 7, "Audit
  // RH" no 8) e omitia as que o motor roda.
  version: '1.15.0',
  empresaAtual: COMPANIES[0],
  parametrizacao: PARAMETRIZACAO_INICIAL,
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
  perfis: INITIAL_ACCESS_PROFILES,
  cargos: ROLES,
  modulos: menuModules.map(m => ({ id: m.id, label: m.label, ativo: m.active })),
  processos: INITIAL_RH_PROCESSES,
  processDefinitions: PROCESS_DEFINITIONS,
  intranet: INITIAL_INTRANET,
  solicitacoes: INITIAL_RH_REQUESTS,
  colaboradores: TODOS_OS_COLABORADORES,
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

/**
 * Handoff de cadastro: o que a CONCLUSÃO de uma solicitação muda na ficha do
 * colaborador. Mora fora do provider porque existem três caminhos que concluem
 * uma solicitação e os três precisam aplicar a mesma regra:
 *
 * - `approveRequest` — aprovação da última alçada da cascata (o caminho normal,
 *   pelo botão "Aprovar");
 * - `updateRequest`  — mudança direta de status (protocolo/acknowledgement e
 *   ajustes feitos pela tela de detalhe);
 * - `concluirEncerramentoDesligamento` — desligamento (15), que não conclui na
 *   aprovação: só na etapa de Benefícios e Encerramento do RH/DP.
 *
 * Puro de propósito: recebe a lista de colaboradores e devolve a nova lista com
 * as notificações a disparar, sem tocar em estado. Quem chama decide quando
 * notificar.
 */
/**
 * Gestão de Hierarquia (processo 13) aprovada → grava o vínculo na ESTRUTURA.
 *
 * É o que transforma o formulário em dado: sem isto, escolher gestor titular e
 * substituto ali não mudava nada no roteamento — a alçada 'gestor-setor'
 * continuava lendo o setor com o gestor antigo.
 */
function aplicarHandoffHierarquia(
  setores: Sector[],
  colaboradores: Employee[],
  req: Pick<RHRequest, 'data'>,
  processId?: string
): { setores: Sector[]; notificacoes: { titulo: string; mensagem: string }[] } {
  if (processId !== '13') return { setores, notificacoes: [] };

  const dados = req.data || {};
  const idx = setores.findIndex(s => s.name === dados.setor);
  if (idx === -1) return { setores, notificacoes: [] };

  // Os campos guardam id de colaborador; nome ainda é aceito para o que foi
  // preenchido antes desta mudança.
  const acha = (ref?: string) =>
    ref ? colaboradores.find(c => c.id === ref || c.name === ref) : undefined;
  const titular = acha(dados.gestor_principal);
  const substituto = acha(dados.substituto);
  if (!titular && !substituto) return { setores, notificacoes: [] };

  const novos = [...setores];
  novos[idx] = {
    ...novos[idx],
    ...(titular ? { manager: titular.name, managerId: titular.id } : {}),
    ...(substituto ? { substitute: substituto.name, substituteId: substituto.id } : {})
  };

  return {
    setores: novos,
    notificacoes: [{
      titulo: 'Hierarquia Atualizada',
      mensagem: `${novos[idx].name}: ${titular ? `gestor ${titular.name}` : 'gestor mantido'}${substituto ? `, substituto ${substituto.name}` : ''}. As próximas aprovações do setor já seguem esta estrutura.`
    }]
  };
}

function aplicarHandoffCadastro(
  colaboradores: Employee[],
  req: Pick<RHRequest, 'employeeId' | 'colaborador' | 'alvo' | 'alvoId' | 'data'>,
  processId?: string
): { colaboradores: Employee[]; notificacoes: { titulo: string; mensagem: string }[] } {
  const notificacoes: { titulo: string; mensagem: string }[] = [];
  const HANDOFFS = ['7', '11', '15'];
  if (!processId || !HANDOFFS.includes(processId)) {
    return { colaboradores, notificacoes };
  }

  const dados = req.data || {};
  // O alvo pode chegar como id ou como nome, dependendo de por onde a
  // solicitação foi aberta: o zoom do formulário guarda o nome em
  // `colaboradorId` e o id real em `colaboradorIdId` (FormRenderer:557), e as
  // solicitações do seed usam `employeeId`/`colaborador`. Mesma leitura em dois
  // passos que o Perfil 360 já faz (Profile360Module:230).
  const referencias = [
    req.employeeId,
    req.alvoId,
    req.colaborador,
    req.alvo,
    dados.employeeId,
    dados.colaboradorIdId,
    dados.colaboradorId
  ].filter(Boolean);

  const idx = colaboradores.findIndex(e => referencias.some(ref => ref === e.id || ref === e.name));
  if (idx === -1) return { colaboradores, notificacoes };

  const novos = [...colaboradores];
  const emp = novos[idx];

  // Alteração de Cargos e Salários (7) e Movimentação de Pessoal (11) reescrevem
  // a ficha; cada campo só muda se a solicitação trouxe o valor novo.
  if (processId === '7' || processId === '11') {
    novos[idx] = {
      ...emp,
      role: dados.novoCargo || emp.role,
      salary: dados.novoSalario || emp.salary,
      department: dados.setorDestino || emp.department,
      costCenter: dados.ccDestino || emp.costCenter,
      manager: dados.gestorDestino?.name || emp.manager,
      // O vínculo de gestor precisa acompanhar por ID, senão a movimentação
      // troca o nome do gestor na ficha e a alçada continua roteando para o
      // gestor antigo.
      managerId: dados.gestorDestinoId || dados.gestorDestino?.id ||
        (dados.gestorDestino?.name
          ? colaboradores.find(c => c.name === dados.gestorDestino.name)?.id
          : undefined) || emp.managerId,
      branch: dados.filialDestino || emp.branch
    };
    notificacoes.push({
      titulo: 'Cadastro Atualizado',
      mensagem: `O perfil de ${emp.name} foi atualizado automaticamente.`
    });
  }

  // Desligamento (15) encerra o vínculo. O status é 'Desligado' (e não o
  // genérico 'Inativo') porque é por ele que a aba "Histórico de Desligamento"
  // do Perfil 360 (Profile360Module.tsx:840) e o contador de desligados da
  // lista de colaboradores (EmployeesModule.tsx:44) filtram.
  if (processId === '15') {
    novos[idx] = { ...emp, status: 'Desligado' };
    notificacoes.push({
      titulo: 'Colaborador Desligado',
      mensagem: `${emp.name} agora consta como Desligado.`
    });
  }

  return { colaboradores: novos, notificacoes };
}

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

  // EMPRESA ATIVA
  //
  // Trocar de empresa é: guardar a parametrização da atual, carregar a da
  // destino e apontar `empresaAtual` para ela. O recorte dos DADOS (quem
  // aparece em cada lista) é feito na leitura por `utils/empresa` — aqui só a
  // configuração troca de lugar.
  const trocarEmpresa = (empresaId: string) => {
    setConfig(prev => {
      const destino = prev.empresas.find(e => e.id === empresaId);
      if (!destino || destino.id === prev.empresaAtual.id) return prev;
      if (!hasGlobalScope(prev.usuarioAtual)) return prev;

      const parametrizacao = {
        ...prev.parametrizacao,
        // A fatia ativa pode ter sido editada desde a última troca: salva antes
        // de sair, senão a configuração da empresa que está saindo se perde.
        [prev.empresaAtual.id]: parametrizacaoAtual(prev)
      };
      const daDestino = parametrizacao[destino.id];

      return {
        ...prev,
        empresaAtual: destino,
        parametrizacao,
        ...(daDestino ? aplicarParametrizacao(daDestino) : {}),
        // A navegação volta para a Intranet: continuar na tela anterior com
        // outra empresa deixaria um registro da empresa antiga aberto.
        activeView: 'intranet',
        selectedEmployeeId: null,
        currentRequestId: null,
        auditTrail: [{
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: prev.usuarioAtual.id,
          userName: prev.usuarioAtual.name,
          action: 'Troca de empresa',
          module: 'Sessão',
          targetId: destino.id,
          details: `${prev.empresaAtual.name} → ${destino.name}`
        }, ...prev.auditTrail]
      };
    });
  };

  /** Cadastra uma empresa em implantação, com parametrização de partida. */
  const criarEmpresa = (dados: { name: string; document: string }): Company => {
    const nova: Company = {
      id: `emp-${Date.now()}`,
      name: dados.name.trim(),
      document: dados.document.trim(),
      status: 'implantacao',
      criadaEm: new Date().toISOString()
    };
    setConfig(prev => ({
      ...prev,
      empresas: [...prev.empresas, nova],
      parametrizacao: {
        ...prev.parametrizacao,
        [nova.id]: parametrizacaoInicial(prev.parametrizacao[COMPANIES[0].id] || parametrizacaoAtual(prev))
      }
    }));
    return nova;
  };

  /** Grava a parametrização de uma empresa que NÃO é a ativa (implantação). */
  const atualizarParametrizacao = (empresaId: string, updates: Partial<ParametrizacaoEmpresa>) => {
    setConfig(prev => ({
      ...prev,
      parametrizacao: {
        ...prev.parametrizacao,
        [empresaId]: { ...prev.parametrizacao[empresaId], ...updates } as ParametrizacaoEmpresa
      },
      // Se a empresa em edição É a ativa, as fatias do topo acompanham.
      ...(prev.empresaAtual.id === empresaId ? updates : {})
    }));
  };

  /** Importa colaboradores já validados para a empresa. */
  const importarColaboradores = (empresaId: string, novos: Employee[]) => {
    setConfig(prev => {
      const empresa = prev.empresas.find(e => e.id === empresaId);
      const comEmpresa = novos.map(e => ({ ...e, company: empresa?.name || e.company }));
      const idsNovos = new Set(comEmpresa.map(e => e.id));
      return {
        ...prev,
        // Reimportar substitui a ficha de mesmo id em vez de duplicar.
        colaboradores: [...prev.colaboradores.filter(e => !idsNovos.has(e.id)), ...comEmpresa],
        auditTrail: [{
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: prev.usuarioAtual.id,
          userName: prev.usuarioAtual.name,
          action: 'Importação de colaboradores',
          module: 'Implantação',
          targetId: empresaId,
          details: `${comEmpresa.length} ficha(s) para ${empresa?.name || empresaId}`
        }, ...prev.auditTrail]
      };
    });
  };

  /** Coloca a empresa no ar: ela passa a aparecer no seletor do topo. */
  const publicarEmpresa = (empresaId: string): { ok: boolean; motivo?: string } => {
    const empresa = config.empresas.find(e => e.id === empresaId);
    if (!empresa) return { ok: false, motivo: 'Empresa não encontrada.' };
    const param = config.parametrizacao[empresaId];
    const quadro = config.colaboradores.filter(e => e.company === empresa.name);
    if (quadro.length === 0) return { ok: false, motivo: 'Importe ao menos um colaborador antes de publicar.' };
    if (!param?.processos?.some(p => p.ativo)) return { ok: false, motivo: 'Nenhum processo ativo configurado.' };
    if (!param?.filiais?.length) return { ok: false, motivo: 'Cadastre ao menos uma filial.' };

    setConfig(prev => ({
      ...prev,
      empresas: prev.empresas.map(e =>
        e.id === empresaId ? { ...e, status: 'ativa' as const, publicadaEm: new Date().toISOString() } : e
      ),
      auditTrail: [{
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: prev.usuarioAtual.id,
        userName: prev.usuarioAtual.name,
        action: 'Empresa publicada',
        module: 'Implantação',
        targetId: empresaId,
        details: `${empresa.name} entrou no ar com ${quadro.length} colaborador(es)`
      }, ...prev.auditTrail]
    }));
    return { ok: true };
  };

  // PERFIS DE ACESSO
  //
  // Perfil virou dado: criar um novo aqui basta para ele valer no menu, no
  // escopo e nos botões — nenhuma tela tem lista de perfis escrita no código.

  const salvarPerfil = (perfil: AccessProfile) => {
    setConfig(prev => {
      const existe = prev.perfis.some(p => p.id === perfil.id);
      return {
        ...prev,
        perfis: existe
          ? prev.perfis.map(p => (p.id === perfil.id ? { ...p, ...perfil, sistema: p.sistema } : p))
          : [...prev.perfis, perfil],
        auditTrail: [{
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: prev.usuarioAtual.id,
          userName: prev.usuarioAtual.name,
          action: existe ? 'Perfil de acesso atualizado' : 'Perfil de acesso criado',
          module: 'Central Adm',
          targetId: perfil.id,
          details: `${perfil.nome} · escopo ${perfil.escopo} · ${perfil.telas.length} tela(s)`
        }, ...prev.auditTrail]
      };
    });
  };

  const alternarPerfilAtivo = (perfilId: string) => {
    setConfig(prev => ({
      ...prev,
      perfis: prev.perfis.map(p => (p.id === perfilId ? { ...p, ativo: !p.ativo } : p))
    }));
  };

  /**
   * Perfil de sistema não sai, e perfil em uso também não: apagar deixaria os
   * usuários apontando para um nome que não resolve mais — e sem registro a
   * checagem cairia na tabela de fábrica, liberando telas em silêncio.
   */
  const excluirPerfil = (perfilId: string): { ok: boolean; motivo?: string } => {
    const perfil = config.perfis.find(p => p.id === perfilId);
    if (!perfil) return { ok: false, motivo: 'Perfil não encontrado.' };
    if (perfil.sistema) return { ok: false, motivo: 'Perfis que acompanham o produto não podem ser excluídos — desative-o.' };
    const emUso = config.usuariosDemo.filter(u => u.profile === perfil.nome).length;
    if (emUso > 0) return { ok: false, motivo: `${emUso} usuário(s) usam este perfil. Troque o perfil deles antes de excluir.` };
    setConfig(prev => ({ ...prev, perfis: prev.perfis.filter(p => p.id !== perfilId) }));
    return { ok: true };
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

    // O REGISTRO DO PERFIL manda. É por aqui que um perfil criado na Central
    // Adm ganha (ou não) cada ação de cada processo, sem passar por código.
    // Perfil desativado não autoriza nada.
    const registro = perfilDoUsuario(user, config.perfis);
    if (registro) {
      if (!registro.ativo) return effective;
      const doPerfil = registro.permissoes[processId];
      if (doPerfil) Object.assign(effective, doPerfil);
      // Grupos ainda somam por cima — é como o cliente concede exceção
      // pontual sem criar um perfil novo.
      userGroups.forEach(g => {
        const p = g.permissoes[processId];
        if (p) Object.keys(effective).forEach(k => { if ((p as any)[k]) (effective as any)[k] = true; });
      });
      return effective;
    }

    // Sem registro (base antiga): a regra por papel do processo, como era.
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

    // O perfil é a base; os grupos somam por cima.
    const doPerfil = perfilDoUsuario(user, config.perfis)?.dadosSensiveis;
    const effective: import('../types').SensitiveDataPermission = doPerfil ? { ...doPerfil } : {
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
    //
    // O aprovador de cada nível sai da estrutura da empresa aplicada ao ALVO
    // deste pedido (utils/hierarquia): dois colaboradores de gestores
    // diferentes geram cascatas com aprovadores diferentes.
    const organizacao = organizacaoDoConfig(config);
    const alvoDoPedido = resolverAlvo({ data }, config.colaboradores);
    const approvalChain = acknowledgement
      ? []
      : buildApprovalChain(process, data, { ...organizacao, alvo: alvoDoPedido });
    const firstLevel = approvalChain[0];
    // Substituição, escalonamento e fallback ficam registrados na abertura —
    // "por que caiu comigo?" tem de ter resposta na própria trilha.
    const motivosDeRoteamento = motivosDaCascata(approvalChain);

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
      // Cópia do que a ficha dizia na abertura — histórico, não fonte: quem
      // exibe resolve pelo cadastro (utils/identidade). Sem sentinela: conta de
      // sistema não tem matrícula, e '00000' já foi confundido com uma.
      requesterSnapshot: {
        avatar: employee?.avatar || config.usuarioAtual.avatar,
        name: employee?.name || config.usuarioAtual.name,
        registration: employee?.registration,
        email: config.usuarioAtual.email,
        role: employee?.role || config.usuarioAtual.role,
        department: employee?.department,
        costCenter: employee?.costCenter,
        branch: employee?.branch,
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
               [
                 `Solicitação enviada. Fluxo com ${approvalChain.length} nível(is) de aprovação: ${approvalChain.map(l => l.name).join(' → ')}.`,
                 ...motivosDeRoteamento
               ].join(' '))
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
        // A tarefa nasce em quem a alçada resolveu — conta de usuário quando
        // existe, senão a ficha do colaborador responsável.
        assignedTo: firstLevel?.responsibleUserId || firstLevel?.responsibleEmployeeId || 'ADMIN-001',
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
        responsibleUserId: firstLevel?.responsibleUserId || firstLevel?.responsibleEmployeeId || 'ADMIN-001',
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
        const dadosDoReenvio = updates.data || oldReq.data;
        // O reenvio pode ter trocado o alvo (o formulário é editável na
        // devolução): a cascata é remontada com o alvo NOVO.
        const ctxReenvio = {
          ...organizacaoDoConfig(prev),
          alvo: resolverAlvo({ ...oldReq, ...updates, data: dadosDoReenvio }, prev.colaboradores)
        };
        resubmitChain = buildApprovalChain(submitProcess, dadosDoReenvio, ctxReenvio).map(level => {
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
          assignedTo: submitLevel?.responsibleUserId || submitLevel?.responsibleEmployeeId || 'ADMIN-001',
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
          responsibleUserId: submitLevel?.responsibleUserId || submitLevel?.responsibleEmployeeId || 'ADMIN-001',
          responsibleGroupId: submitLevel?.responsibleGroupId,
          prazo: newReq.slaVencimento
        };
        newTarefas = [newTask, ...newTarefas];
      }

      let newColaboradores = [...prev.colaboradores];

      // CONCLUSION LOGIC
      if (newReq.status === 'Concluída' && oldReq.status !== 'Concluída') {
        const handoff = aplicarHandoffCadastro(
          newColaboradores,
          newReq,
          newReq.tipoProcesso || newReq.processId
        );
        newColaboradores = handoff.colaboradores;
        handoff.notificacoes.forEach(n => addNotification(n.titulo, n.mensagem));
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

    // Ninguém aprova o próprio pedido. Mesma regra que a aba "Minhas
    // Aprovações" usa para decidir o que listar (utils/permissions).
    if (req.solicitante === config.usuarioAtual.name && !podeAprovarPropriaSolicitacao(config.usuarioAtual)) {
      addNotification('Erro na Aprovação', 'Você não pode aprovar sua própria solicitação.', 'sistema');
      return;
    }

    // A aprovação avança UM nível da cascata configurada no processo. Só depois
    // do último nível aplicável a solicitação é concluída.
    const approvalProcess = config.processos.find(p => p.id === (req.tipoProcesso || req.processId));
    const chain = ensureApprovalChain(req, approvalProcess, organizacaoDoConfig(config));
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
    // Desligamento: a última alçada NÃO conclui. Falta a etapa de Benefícios e
    // Encerramento (verbas, checklist e documentos), executada pelo RH/DP — é
    // ela que encerra o vínculo. Ver concluirEncerramentoDesligamento.
    const aprovacaoAbreEncerramento = isFinal && (req.tipoProcesso || req.processId) === PROCESSO_DESLIGAMENTO;
    const nextStatus: RHRequest['status'] = aprovacaoAbreEncerramento
      ? 'Aguardando Encerramento'
      : isFinal ? 'Concluída' : 'Em Aprovação';
    const currentLabel = levelLabel(newChain, levelIndex);
    const actionLabel = isFinal ? 'Aprovação Final' : `Aprovação — ${currentLabel}`;
    const proximaEtapa = aprovacaoAbreEncerramento
      ? ETAPA_ENCERRAMENTO
      : isFinal ? 'Conclusão' : nextLevel.name;
    const notificationMessage = aprovacaoAbreEncerramento
      ? `Última alçada aprovada (${approvedLevel.name}). Encaminhado ao RH/DP para ${ETAPA_ENCERRAMENTO}.`
      : isFinal
        ? `Última alçada aprovada (${approvedLevel.name}). Solicitação concluída.`
        : `${currentLabel} aprovado. Encaminhado para ${nextLevel.name} (${nextLevel.responsibleLabel}).`;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      userName: config.usuarioAtual.name,
      etapa: approvedLevel.name,
      de: req.status,
      para: aprovacaoAbreEncerramento ? ETAPA_ENCERRAMENTO : isFinal ? 'Concluída' : nextLevel.name,
      comentario: comment || notificationMessage,
      action: actionLabel,
      timestamp: decidedAt,
      dataHora: decidedAt
    };

    const updatedRequest: Partial<RHRequest> = {
      status: nextStatus,
      etapaAtual: proximaEtapa,
      approvalChain: newChain,
      historico: [...req.historico, historyEntry],
      responsavelAtual: aprovacaoAbreEncerramento ? 'RH / DP' : isFinal ? '' : nextLevel.responsibleLabel,
      slaVencimento: isFinal ? req.slaVencimento : new Date(Date.now() + slaToMs(nextLevel)).toISOString(),
      trail: [
        'Solicitação',
        ...newChain.map(l => l.name),
        ...((req.tipoProcesso || req.processId) === PROCESSO_DESLIGAMENTO ? [ETAPA_ENCERRAMENTO] : []),
        'Conclusão'
      ],
      updatedAt: decidedAt
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: aprovacaoAbreEncerramento
        ? 'Aprovação Final — Encerramento Pendente'
        : isFinal ? 'Aprovação e Conclusão' : 'Aprovação de Alçada',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero}: ${currentLabel} aprovado por ${config.usuarioAtual.name}. ${
        aprovacaoAbreEncerramento
          ? `Todas as alçadas aprovadas — aguardando ${ETAPA_ENCERRAMENTO} (RH/DP).`
          : isFinal
            ? 'Todas as alçadas aprovadas — solicitação concluída.'
            : `Aguardando ${nextLevel.name} (${nextLevel.responsibleLabel}).`
      }`,
      timestamp: decidedAt
    };

    setConfig(prev => {
      const newSolicitacoes = prev.solicitacoes.map(r => r.id === requestId ? { ...r, ...updatedRequest } : r);
      let newTarefas = prev.tarefas.map(t => t.relatedRequestId === requestId && t.status !== 'Concluída' ? { ...t, status: 'Concluída' as const } : t);
      let newColaboradores = [...prev.colaboradores];
      // A estrutura de setores também pode ser reescrita pela aprovação — é o
      // processo de Gestão de Hierarquia gravando gestor titular e substituto.
      let newSetores = [...prev.setores];
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
          assignedTo: nextLevel.responsibleUserId || nextLevel.responsibleEmployeeId || 'ADMIN-001',
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
        // Última alçada aprovada = solicitação concluída: é AQUI que a ficha do
        // colaborador é reescrita (promoção, transferência).
        // Mesma regra usada pela conclusão via updateRequest.
        //
        // Exceção: o desligamento não encerra o vínculo na aprovação. A ficha só
        // vira 'Desligado' quando o RH/DP conclui a etapa de Benefícios e
        // Encerramento (concluirEncerramentoDesligamento), que reaproveita este
        // mesmo handoff.
        if (!aprovacaoAbreEncerramento) {
          const handoff = aplicarHandoffCadastro(newColaboradores, req, processId);
          newColaboradores = handoff.colaboradores;
          handoff.notificacoes.forEach(n => addNotification(n.titulo, n.mensagem));
          // Gestão de Hierarquia grava gestor titular e substituto no setor: é
          // o que faz a alçada 'gestor-setor' dos PRÓXIMOS pedidos seguir a
          // decisão aprovada aqui.
          const hierarquia = aplicarHandoffHierarquia(newSetores, newColaboradores, req, processId);
          newSetores = hierarquia.setores;
          hierarquia.notificacoes.forEach(n => addNotification(n.titulo, n.mensagem));
        } else {
          // A etapa do RH/DP vira tarefa — é o que a coloca na Central de
          // Tarefas e em "Minhas Aprovações" de quem responde pelo DP.
          const encerramentoDue = new Date(Date.now() + 48 * 3600000).toISOString();
          const encerramentoTask: Task = {
            id: `task-${Date.now() + 5}`,
            title: `${ETAPA_ENCERRAMENTO} - ${req.colaborador || req.alvo || 'Colaborador'}`,
            description: `Desligamento aprovado. Lançar verbas rescisórias, executar o checklist e anexar os documentos da rescisão (${req.numero}).`,
            assignedTo: 'RH-001',
            dueDate: encerramentoDue,
            status: 'Pendente',
            priority: 'Alta',
            relatedRequestId: req.id,
            createdAt: new Date().toISOString(),
            requestId: req.id,
            requestNumber: req.numero,
            processId: PROCESSO_DESLIGAMENTO,
            process: req.processName,
            solicitante: req.solicitante,
            type: 'Encerramento',
            responsible: 'RH/DP',
            responsibleUserId: 'RH-001',
            prazo: encerramentoDue
          };
          newTarefas = [encerramentoTask, ...newTarefas];
          addNotification(
            'Desligamento aprovado',
            `${req.numero} liberado para a etapa de ${ETAPA_ENCERRAMENTO} pelo RH/DP.`
          );
        }

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
            title: `Iniciar Admissão Digital - ${req.data.nomeCandidato || 'Candidato'}`,
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
            process: admissionProcess?.ativo ? 'Admissão Digital' : 'Recrutamento e Seleção',
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
            process: onboardingProcess?.ativo ? 'Onboarding' : 'Admissão Digital',
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
        setores: newSetores,
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
    const rejectChain = ensureApprovalChain(req, rejectProcess, organizacaoDoConfig(config));
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
    // Comunicado OFICIAL é o que tem banner: é o `imagem` que o coloca no
    // carrossel com o selo "COMUNICADO OFICIAL" (o post do feed usa `anexo`).
    // Esconder o botão não basta — a regra vale aqui também, como já valia para
    // editar e excluir publicação.
    if (announcement.imagem && !podePublicarComunicadoOficial(config.usuarioAtual)) return;

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title: announcement.title || 'Novo Comunicado',
      content: announcement.content || '',
      author: config.usuarioAtual.name,
      // Sem o id, depois não dá para saber que o post é desta pessoa — é ele
      // que libera o menu de editar/excluir no feed.
      authorId: config.usuarioAtual.id,
      date: new Date().toLocaleDateString('pt-BR'),
      category: announcement.category || 'RH',
      priority: announcement.priority || 'Normal',
      comentarios: [],
      ...announcement
    };

    setConfig(prev => ({
      ...prev,
      comunicados: [newAnnouncement, ...prev.comunicados]
    }));
  };

  const editarComunicado = (comunicadoId: string, updates: Partial<Pick<Announcement, 'title' | 'content'>>) => {
    setConfig(prev => ({
      ...prev,
      comunicados: prev.comunicados.map(c =>
        // A data original fica: editar não republica o post no topo do feed.
        c.id === comunicadoId && podeGerenciarComunicado(prev.usuarioAtual, c) ? { ...c, ...updates } : c
      )
    }));
  };

  const excluirComunicado = (comunicadoId: string) => {
    setConfig(prev => ({
      ...prev,
      comunicados: prev.comunicados.filter(c => !(c.id === comunicadoId && podeGerenciarComunicado(prev.usuarioAtual, c)))
    }));
  };

  const comentarComunicado = (comunicadoId: string, texto: string) => {
    const limpo = texto.trim();
    if (!limpo) return;
    const novo: import('../types').ComentarioComunicado = {
      id: `com-${Date.now()}`,
      autor: config.usuarioAtual.name,
      // Guardar o id (e não só o nome) é o que permite saber, depois, se o
      // comentário é de quem está logado — quem decide o botão de apagar.
      autorId: config.usuarioAtual.id,
      texto: limpo,
      dataHora: new Date().toISOString()
    };
    setConfig(prev => ({
      ...prev,
      comunicados: prev.comunicados.map(c =>
        c.id === comunicadoId ? { ...c, comentarios: [...(c.comentarios || []), novo] } : c
      )
    }));
  };

  /** Só o autor apaga o próprio comentário — a regra vale no estado, não só na tela. */
  const removerComentario = (comunicadoId: string, comentarioId: string) => {
    setConfig(prev => ({
      ...prev,
      comunicados: prev.comunicados.map(c => {
        if (c.id !== comunicadoId) return c;
        const alvo = (c.comentarios || []).find(x => x.id === comentarioId);
        if (!alvo || alvo.autorId !== prev.usuarioAtual.id) return c;
        return { ...c, comentarios: (c.comentarios || []).filter(x => x.id !== comentarioId) };
      })
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
  // Desligamento — etapa "Benefícios e Encerramento"
  // -------------------------------------------------------------------------

  /** Rascunho da etapa: verbas, checklist, documentos e observação do DP. */
  const atualizarEncerramentoDesligamento = (requestId: string, encerramento: EncerramentoDesligamento) => {
    setConfig(prev => ({
      ...prev,
      solicitacoes: prev.solicitacoes.map(r =>
        // Depois de concluída a etapa é histórico: não se reescreve verba nem
        // checklist de um vínculo já encerrado.
        r.id === requestId && !r.encerramento?.concluidoEm
          ? { ...r, encerramento, updatedAt: new Date().toISOString() }
          : r
      )
    }));
  };

  /**
   * "Concluir desligamento": fecha a solicitação e encerra o vínculo. É o ponto
   * em que o handoff de cadastro roda para o processo 15 — o mesmo
   * `aplicarHandoffCadastro` usado pelos demais processos na aprovação final,
   * só que adiado até aqui.
   */
  const concluirEncerramentoDesligamento = (requestId: string, encerramento: EncerramentoDesligamento) => {
    const req = config.solicitacoes.find(r => r.id === requestId);
    if (!req || req.encerramento?.concluidoEm) return;

    const agora = new Date().toISOString();
    const finalizado: EncerramentoDesligamento = {
      ...encerramento,
      concluidoEm: agora,
      concluidoPor: config.usuarioAtual.name
    };
    const total = finalizado.verbas.reduce(
      (soma, v) => (v.devida && !v.semValor ? soma + (Number(v.valor) || 0) : soma),
      0
    );
    const totalLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    const documentosAnexados = finalizado.documentos.filter(d => !!d.anexo).length;
    const resumo =
      `Verbas rescisórias: ${totalLabel}. ` +
      `Checklist: ${finalizado.checklist.filter(i => i.concluido).length}/${finalizado.checklist.length}. ` +
      `Documentos: ${documentosAnexados}/${finalizado.documentos.length}.`;

    const historyEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      autor: config.usuarioAtual.name,
      userName: config.usuarioAtual.name,
      userId: config.usuarioAtual.id,
      etapa: ETAPA_ENCERRAMENTO,
      de: req.status,
      para: 'Concluída',
      action: 'Conclusão do Desligamento',
      comentario: finalizado.observacao ? `${resumo} ${finalizado.observacao}` : resumo,
      timestamp: agora,
      dataHora: agora
    };

    const auditEntry: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: config.usuarioAtual.id,
      userName: config.usuarioAtual.name,
      action: 'Conclusão de Desligamento',
      module: 'Solicitações',
      targetId: requestId,
      details: `Solicitação ${req.numero}: etapa de ${ETAPA_ENCERRAMENTO} concluída por ${config.usuarioAtual.name}. ${resumo}`,
      timestamp: agora
    };

    // O aviso sai FORA do setConfig: sob StrictMode o updater roda duas vezes, e
    // notificar lá dentro duplicaria o item na lista.
    aplicarHandoffCadastro(config.colaboradores, req, req.tipoProcesso || req.processId)
      .notificacoes.forEach(n => addNotification(n.titulo, n.mensagem));

    setConfig(prev => {
      // O handoff roda de novo sobre `prev` — é ele que reescreve a ficha, e a
      // base tem de ser o estado mais recente, não o do fechamento.
      const handoff = aplicarHandoffCadastro(
        prev.colaboradores,
        req,
        req.tipoProcesso || req.processId
      );

      return {
        ...prev,
        solicitacoes: prev.solicitacoes.map(r => r.id === requestId
          ? {
              ...r,
              status: 'Concluída' as const,
              etapaAtual: 'Conclusão',
              responsavelAtual: '',
              encerramento: finalizado,
              historico: [...r.historico, historyEntry],
              updatedAt: agora
            }
          : r),
        tarefas: prev.tarefas.map(t =>
          t.relatedRequestId === requestId && t.status !== 'Concluída'
            ? { ...t, status: 'Concluída' as const }
            : t
        ),
        colaboradores: handoff.colaboradores,
        auditTrail: [auditEntry, ...prev.auditTrail],
        highlightedRequestNumber: req.numero
      };
    });
  };

  /**
   * "Anexar" do Perfil 360: o arquivo entra na aba Documentos da ficha. Só o
   * nome é guardado — o config inteiro vai para o localStorage e o conteúdo
   * binário estouraria a cota, mesma regra do Portal do Colaborador.
   */
  const anexarDocumentoColaborador = (employeeId: string, arquivo: { nome: string; tipo?: string }) => {
    const emp = config.colaboradores.find(e => e.id === employeeId);
    if (!emp) return;

    const agora = new Date();
    const novoDocumento: EmployeeDocument = {
      id: `doc-${employeeId}-${agora.getTime()}`,
      // Sem tipo declarado, o nome do arquivo (sem extensão) vira o rótulo.
      type: arquivo.tipo || arquivo.nome.replace(/\.[^.]+$/, ''),
      number: '—',
      issueDate: agora.toISOString().slice(0, 10),
      status: 'Em validação',
      attachmentUrl: arquivo.nome,
      origin: 'Upload'
    };

    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(e =>
        e.id === employeeId ? { ...e, documents: [novoDocumento, ...(e.documents || [])] } : e
      ),
      auditTrail: [
        {
          id: `audit-${agora.getTime()}`,
          userId: prev.usuarioAtual.id,
          userName: prev.usuarioAtual.name,
          action: 'Anexo de Documento',
          module: 'Colaboradores',
          targetId: employeeId,
          details: `"${arquivo.nome}" anexado à ficha de ${emp.name}.`,
          timestamp: agora.toISOString()
        },
        ...prev.auditTrail
      ]
    }));
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
   * Cargo, setor, empresa/filial e centro de custo vêm da Vaga Aprovada
   * escolhida no disparo; salário, início e regime, das condições contratuais.
   */
  const dispararAdmissaoDigital = (dados: Omit<AdmissaoDisparo, 'enviadoEm'>) => {
    const agora = new Date();
    const vaga = config.vagas.find(v => v.id === dados.vagaId);
    // Sem data informada, cai no prazo do link — mantém o comportamento antigo.
    const previsaoAdmissao =
      dados.dataAdmissao || new Date(agora.getTime() + dados.prazoDias * 86400000).toISOString().slice(0, 10);

    const idDoCadastro = `EMP-AD-${agora.getTime()}`;
    const novo: Employee = {
      id: idDoCadastro,
      name: dados.nome,
      email: dados.email,
      phone: dados.telefone || '',
      address: '',
      city: '',
      state: '',
      department: vaga?.department || vaga?.sector || 'A definir',
      role: vaga?.title || dados.vagaTitulo || 'A definir',
      branch: vaga?.branch || config.filiais[0] || 'Matriz SP',
      company: vaga?.company || config.empresaAtual.name,
      status: 'Pré-admissão',
      situacao: 'PRE_ADMISSAO',
      admissionDate: previsaoAdmissao,
      birthDate: '',
      salary: dados.salario || 0,
      manager: 'A definir',
      costCenter: vaga?.costCenter || 'A definir',
      // Mesma regra do seed: a matrícula sai do id (utils/identidade), aqui
      // ainda com o prefixo AD- de quem não foi efetivado.
      registration: matriculaDoCadastro(idDoCadastro),
      cpf: dados.cpf,
      documents: [],
      admissaoDigital: {
        estado: 'AGUARDANDO_PREENCHIMENTO',
        disparo: { ...dados, enviadoEm: agora.toISOString() },
        termoAceito: false,
        // Nome e CPF já vieram do disparo: o bloco Dados Pessoais nasce com
        // eles preenchidos, para o colaborador só conferir.
        blocos: blocosComDadosDoDisparo(criarBlocosAdmissao(), { nome: dados.nome, cpf: dados.cpf })
      }
    };

    setConfig(prev => ({
      ...prev,
      colaboradores: [novo, ...prev.colaboradores],
      auditTrail: [
        registrarAuditoriaAdmissao(
          'Disparo de Admissão Digital',
          novo.id,
          `Link enviado para ${dados.nome} (${dados.email}) com prazo de ${dados.prazoDias} dias.` +
            (dados.vagaTitulo ? ` Vaga: ${dados.vagaTitulo}.` : '')
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

    // A foto anexada no bloco "Foto de Perfil" vira o avatar da ficha — o mesmo
    // campo que o feed, o Perfil 360 e o Gente & Celebrações já leem. Só o
    // upload de imagem real produz esse dado; com o "Tirar foto" simulado a
    // ficha continua sem foto e o Avatar mostra as iniciais.
    const fotoDePerfil = fotoDePerfilDaAdmissao(emp.admissaoDigital);

    setConfig(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(e =>
        e.id === employeeId
          ? {
              ...e,
              status: 'Ativo' as const,
              situacao: 'ATIVO' as const,
              // Vale a data prevista de início combinada no disparo; sem ela
              // (registro antigo), a admissão passa a valer a partir de hoje.
              admissionDate: emp.admissaoDigital?.disparo.dataAdmissao || new Date().toISOString().slice(0, 10),
              avatar: fotoDePerfil || e.avatar,
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
                // O bloco devolvido perde os anexos recusados e a confirmação
                // da etapa: volta ao portal com o anel laranja, e o colaborador
                // precisa reanexar e confirmar de novo para liberar o reenvio.
                blocos: e.admissaoDigital.blocos.map(b =>
                  blocoIds.includes(b.id)
                    ? {
                        ...b,
                        statusRevisao: 'AGUARDANDO_CORRECAO' as const,
                        motivoRevisao: motivo,
                        anexos: [],
                        confirmado: false
                      }
                    : { ...b, statusRevisao: 'APROVADO' as const, motivoRevisao: undefined, confirmado: true }
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
      editarComunicado,
      excluirComunicado,
      comentarComunicado,
      removerComentario,
      addNotification,
      login,
      logout,
      resetDemo,
      trocarEmpresa,
      criarEmpresa,
      atualizarParametrizacao,
      importarColaboradores,
      publicarEmpresa,
      salvarPerfil,
      alternarPerfilAtivo,
      excluirPerfil,
      isAuthorized,
      getEffectivePermissions,
      getSensitiveDataPermissions,
      updateOnboardingTask,
      atualizarEncerramentoDesligamento,
      concluirEncerramentoDesligamento,
      anexarDocumentoColaborador,
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
