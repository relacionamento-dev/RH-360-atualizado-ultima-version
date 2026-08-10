import {
  ApprovalResponsibilityType,
  ApprovalStep,
  Group,
  RHProcess,
  RHRequest,
  RequestApprovalLevel,
  User
} from '../types';
import { podeAprovarPropriaSolicitacao } from './permissions';

// CASCATA DE APROVAÇÃO
//
// O fluxo de uma solicitação é a lista de níveis configurados no processo
// (Central Adm > Processos > Aprovações), na ordem, filtrada pelas condições de
// acionamento. A cascata é materializada na abertura (`buildApprovalChain`) e
// guardada na própria solicitação, para que uma mudança posterior na
// configuração não altere o fluxo de um pedido já em andamento.

export const RESPONSIBILITY_LABELS: Record<ApprovalResponsibilityType, string> = {
  'pessoa': 'Pessoa Específica',
  'grupo': 'Grupo',
  'gestor-direto': 'Gestor Direto',
  'gestor-setor': 'Gestor do Setor',
  'responsavel-cc': 'Responsável do Centro de Custo',
  'rh-filial': 'RH da Filial',
  'diretoria': 'Diretoria',
  'presidencia': 'Presidência'
};

// Usuário demo que responde por cada tipo de alçada (a base não tem vínculo
// real de gestor/CC; em produção isto viria da hierarquia do colaborador).
const RESPONSIBILITY_USERS: Partial<Record<ApprovalResponsibilityType, string>> = {
  'gestor-direto': 'GEST-001',
  'gestor-setor': 'GEST-001',
  'responsavel-cc': 'RH-001',
  'rh-filial': 'RH-001',
  'diretoria': 'DIR-001',
  'presidencia': 'DIR-002'
};

const FALLBACK_APPROVER_ID = 'ADMIN-001';

// Quando o nível não diz QUAL campo comparar (a tela de configuração só oferece
// operador e valor), a condição numérica recai sobre o primeiro campo monetário
// da solicitação — que é o que "Se maior que 10000" quer dizer na prática.
export const VALUE_FIELD_PATTERN = /salario|salário|valor|remunera|custo|montante|total/i;

const toNumber = (value: any): number | null => {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return normalized !== '' && !Number.isNaN(parsed) ? parsed : null;
};

export function resolveConditionField(step: ApprovalStep, data: Record<string, any> = {}): string | undefined {
  if (step.conditionField) return step.conditionField;
  // Só faz sentido adivinhar em comparação numérica.
  if (!['>', '<', '>=', '<='].includes(step.conditionOperator || '')) return undefined;
  return Object.keys(data).find(key => VALUE_FIELD_PATTERN.test(key) && toNumber(data[key]) !== null);
}

export function isStepApplicable(step: ApprovalStep, data: Record<string, any> = {}): boolean {
  if (step.active === false) return false;
  if (!step.conditionOperator) return true;

  const field = resolveConditionField(step, data);
  // Condição incompleta (sem campo comparável): aciona o nível. Deixar de
  // acionar uma alçada por configuração pela metade é o pior dos erros.
  if (!field) return true;

  const rawValue = data[field];
  const left = toNumber(rawValue);
  const right = toNumber(step.conditionValue);

  switch (step.conditionOperator) {
    case '>': return left !== null && right !== null && left > right;
    case '<': return left !== null && right !== null && left < right;
    case '>=': return left !== null && right !== null && left >= right;
    case '<=': return left !== null && right !== null && left <= right;
    case '!=': return String(rawValue ?? '') !== String(step.conditionValue ?? '');
    case '==': return String(rawValue ?? '') === String(step.conditionValue ?? '');
    case 'contains':
      return String(rawValue ?? '').toLowerCase().includes(String(step.conditionValue ?? '').toLowerCase());
    default: return true;
  }
}

export function describeCondition(step: ApprovalStep, data: Record<string, any> = {}): string | undefined {
  if (!step.conditionOperator) return undefined;
  const field = resolveConditionField(step, data);
  const operatorLabel: Record<string, string> = {
    '>': 'maior que', '<': 'menor que', '>=': 'maior ou igual a',
    '<=': 'menor ou igual a', '==': 'igual a', '!=': 'diferente de', 'contains': 'contém'
  };
  const op = operatorLabel[step.conditionOperator] || step.conditionOperator;
  return `${field || 'valor da solicitação'} ${op} ${step.conditionValue}`;
}

const resolveResponsible = (step: ApprovalStep) => {
  if (step.responsibilityType === 'pessoa') {
    return { responsibleUserId: step.responsibilityId || FALLBACK_APPROVER_ID, responsibleGroupId: undefined };
  }
  if (step.responsibilityType === 'grupo') {
    return { responsibleUserId: undefined, responsibleGroupId: step.responsibilityId };
  }
  return { responsibleUserId: RESPONSIBILITY_USERS[step.responsibilityType] || FALLBACK_APPROVER_ID, responsibleGroupId: undefined };
};

// Nível implícito para processos sem alçadas configuradas: uma única aprovação
// do RH conclui o pedido.
const defaultLevel = (): RequestApprovalLevel => ({
  id: 'default-approval',
  name: 'Aprovação',
  order: 1,
  responsibilityType: 'rh-filial',
  responsibleLabel: 'RH / Gestor',
  responsibleUserId: FALLBACK_APPROVER_ID,
  sla: 48,
  slaUnit: 'h',
  isMandatory: true,
  status: 'pendente'
});

export function buildApprovalChain(
  process: RHProcess | undefined,
  data: Record<string, any> = {}
): RequestApprovalLevel[] {
  const steps = (process?.approvals || [])
    .filter(step => isStepApplicable(step, data))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (steps.length === 0) return [defaultLevel()];

  return steps.map((step, index) => {
    const { responsibleUserId, responsibleGroupId } = resolveResponsible(step);
    return {
      id: step.id,
      name: step.name || `Aprovação ${index + 1}`,
      order: index + 1,
      responsibilityType: step.responsibilityType,
      responsibleLabel: step.responsibilityType === 'pessoa' || step.responsibilityType === 'grupo'
        ? (step.responsibilityId || RESPONSIBILITY_LABELS[step.responsibilityType])
        : RESPONSIBILITY_LABELS[step.responsibilityType],
      responsibleUserId,
      responsibleGroupId,
      sla: step.sla ?? 24,
      slaUnit: step.slaUnit || 'h',
      isMandatory: step.isMandatory !== false,
      status: 'pendente',
      conditionLabel: describeCondition(step, data)
    };
  });
}

// Solicitações criadas antes da cascata (ou vindas do mock) não têm a trilha
// gravada: reconstrói a partir da configuração atual do processo, marcando como
// aprovados os níveis já vencidos pelo status.
export function ensureApprovalChain(req: RHRequest, process?: RHProcess): RequestApprovalLevel[] {
  if (req.approvalChain?.length) return req.approvalChain;

  const chain = buildApprovalChain(process, req.data || {});
  // 'Aguardando Encerramento' (desligamento) já passou por TODAS as alçadas: o
  // que falta é a etapa de Benefícios e Encerramento, não uma aprovação.
  const concluded = req.status === 'Concluída' || req.status === 'Concluído' ||
    req.status === 'Aprovada' || req.status === 'Aguardando Encerramento';
  if (concluded) return chain.map(level => ({ ...level, status: 'aprovado' as const }));
  if (req.status === 'Reprovada') {
    return chain.map((level, i) => ({ ...level, status: i === 0 ? ('reprovado' as const) : ('pendente' as const) }));
  }
  return chain;
}

export const getCurrentLevelIndex = (chain: RequestApprovalLevel[]): number => {
  const index = chain.findIndex(level => level.status === 'pendente');
  return index === -1 ? chain.length : index;
};

export const getCurrentLevel = (chain: RequestApprovalLevel[]): RequestApprovalLevel | undefined =>
  chain[getCurrentLevelIndex(chain)];

export const slaToMs = (level: Pick<RequestApprovalLevel, 'sla' | 'slaUnit'>): number =>
  (level.sla || 24) * (level.slaUnit === 'd' ? 24 : 1) * 3600000;

// Rótulo "Nível 2 de 3 — Diretoria" usado no histórico e nas tarefas.
export const levelLabel = (chain: RequestApprovalLevel[], index: number): string =>
  `Nível ${index + 1} de ${chain.length} — ${chain[index]?.name || 'Aprovação'}`;

// QUEM APROVA O NÍVEL ATUAL
//
// É o que separa "Minhas Aprovações" de "Consulta Global": a primeira lista só
// o que está parado NA MÃO de quem está logado. Antes a tela decidia isso por
// conta própria (e o Administrador Geral caía num `return true` que devolvia a
// base inteira, deixando as duas abas idênticas).

/**
 * Status em que ainda existe alçada esperando decisão. 'Devolvida' e
 * 'Rascunho' voltaram para o solicitante; 'Aguardando Encerramento' já passou
 * por todas as alçadas e espera o RH/DP — nenhum dos três é aprovação pendente.
 */
export const AWAITING_APPROVAL_STATUSES = [
  'Pendente de Aprovação',
  'Em Análise',
  'Em Aprovação',
  'Enviada'
] as const;

export const isAwaitingApproval = (status?: string): boolean =>
  !!status && (AWAITING_APPROVAL_STATUSES as readonly string[]).includes(status);

/**
 * Perfil que responde por cada tipo de alçada. A base de demonstração não tem
 * hierarquia real (o gestor do colaborador não é um usuário do sistema), então
 * quando o nível não aponta para uma pessoa específica quem identifica o
 * responsável é o perfil — é assim que a Diretoria vê as alçadas de diretoria.
 */
const PERFIS_POR_ALCADA: Partial<Record<ApprovalResponsibilityType, User['profile'][]>> = {
  'gestor-direto': ['Gestor'],
  'gestor-setor': ['Gestor'],
  'responsavel-cc': ['RH/DP'],
  'rh-filial': ['RH/DP'],
  'diretoria': ['Diretoria'],
  'presidencia': ['Diretoria']
};

/** O usuário é o responsável pela alçada que está pendente agora? */
export function isPendingApprover(
  req: RHRequest,
  process: RHProcess | undefined,
  user: Pick<User, 'id' | 'name' | 'profile' | 'groups'>,
  grupos: Group[] = []
): boolean {
  if (!isAwaitingApproval(req.status)) return false;

  // Pedido do próprio usuário: o botão Aprovar recusa (só Administrador Geral e
  // a conta de demonstração passam), então listar aqui seria oferecer uma ação
  // que trava no clique seguinte.
  const ehMeuPedido = req.requesterId === user.id || req.solicitante === user.name;
  if (ehMeuPedido && !podeAprovarPropriaSolicitacao(user)) return false;

  const nivel = getCurrentLevel(ensureApprovalChain(req, process));
  if (!nivel) return false;

  // 1. Pessoa específica configurada no nível.
  if (nivel.responsibleUserId && nivel.responsibleUserId === user.id) return true;

  // 2. Grupo responsável — por id do grupo ou pelo nome que o usuário carrega.
  if (nivel.responsibleGroupId) {
    const grupo = grupos.find(g => g.id === nivel.responsibleGroupId || g.nome === nivel.responsibleGroupId);
    const nomesDoUsuario = user.groups || [];
    if (grupo && (grupo.membros.includes(user.id) || nomesDoUsuario.includes(grupo.nome))) return true;
    if (nomesDoUsuario.includes(nivel.responsibleGroupId)) return true;
  }

  // 3. Perfil que responde pelo tipo de alçada.
  return (PERFIS_POR_ALCADA[nivel.responsibilityType] || []).includes(user.profile);
}

/**
 * Mesma pergunta de `isPendingApprover`, mas resolvendo o processo a partir da
 * lista — `tipoProcesso` com fallback em `processId`. Sem isso é fácil chamar a
 * função com `undefined` e cair sempre na cascata padrão.
 */
export function ehMinhaAprovacao(
  req: RHRequest,
  processos: RHProcess[],
  user: Pick<User, 'id' | 'name' | 'profile' | 'groups'>,
  grupos: Group[] = []
): boolean {
  const processo = processos.find(p => p.id === (req.tipoProcesso || req.processId));
  return isPendingApprover(req, processo, user, grupos);
}

/**
 * O recorte exato da tela "Minhas Aprovações". Todo contador de aprovações
 * pendentes (atalho da Intranet, sino de notificações) sai daqui: o número do
 * atalho e o número de linhas da tela que ele abre têm que ser o mesmo — contar
 * "tudo em aberto" mostrava a base inteira para quem só aprova uma alçada.
 */
export function listarMinhasAprovacoes(
  solicitacoes: RHRequest[],
  processos: RHProcess[],
  user: Pick<User, 'id' | 'name' | 'profile' | 'groups'>,
  grupos: Group[] = []
): RHRequest[] {
  return solicitacoes.filter(req => ehMinhaAprovacao(req, processos, user, grupos));
}
