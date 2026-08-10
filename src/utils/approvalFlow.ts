import {
  ApprovalResponsibilityType,
  ApprovalStep,
  CostCenter,
  Employee,
  Group,
  RHProcess,
  RHRequest,
  RequestApprovalLevel,
  ResolucaoAlcada,
  Sector,
  User
} from '../types';
import { podeAprovarPropriaSolicitacao } from './permissions';
import {
  cadeiaDeGestores,
  centroDeCustoDe,
  colaboradorDoUsuario,
  colaboradoresComPerfil,
  estaAbaixoDe,
  estaDisponivel,
  gestorDe,
  porId,
  porIdOuNome,
  profundidade,
  resolverAlvo,
  rhDaFilial,
  setorDe
} from './hierarquia';

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

// QUEM RESPONDE POR CADA TIPO DE ALÇADA
//
// Isto era um mapa fixo de tipo → usuário de demonstração ('gestor-direto' →
// sempre GEST-001), com um FALLBACK_APPROVER_ID silencioso quando não achava.
// Configurar "Gestor Direto" não apontava para o gestor daquela pessoa: apontava
// sempre para a mesma. Agora a resolução depende do ALVO da solicitação e lê a
// estrutura real (utils/hierarquia).
//
// Quatro regras, nesta ordem:
//   1. TITULAR pela estrutura (gestor do alvo, do setor, do CC, RH da filial);
//   2. SUBSTITUTO se o titular está ausente/inativo;
//   3. NUNCA PARA BAIXO: aprovador abaixo do alvo sobe para o próximo acima;
//   4. FALLBACK EXPLÍCITO quando não há vínculo — cai no RH da filial e o
//      motivo fica gravado no nível e vai para a trilha.

/** Tipos em que o responsável sai da hierarquia do alvo. */
const ALCADAS_HIERARQUICAS: ApprovalResponsibilityType[] = [
  'gestor-direto',
  'gestor-setor',
  'responsavel-cc'
];

/**
 * Perfis que respondem pelas alçadas institucionais. Diretoria e Presidência
 * são o topo: não têm gestor acima, então continuam resolvendo por perfil.
 */
const PERFIL_DA_ALCADA: Partial<Record<ApprovalResponsibilityType, User['profile']>> = {
  'diretoria': 'Diretoria',
  'presidencia': 'Diretoria',
  'rh-filial': 'RH/DP',
  'responsavel-cc': 'RH/DP'
};

/**
 * A estrutura da empresa: o que não muda de uma solicitação para outra. Sem ela
 * a cascata ainda é montada, mas cada nível fica marcado como fallback — nunca
 * com um aprovador inventado, que era o efeito do mapa fixo.
 */
export interface Organizacao {
  colaboradores: Employee[];
  setores: Sector[];
  centrosDeCusto: CostCenter[];
  usuarios: User[];
}

export interface ContextoDeAlcada extends Organizacao {
  /** O colaborador sobre quem a solicitação fala. É ele que define a cadeia. */
  alvo?: Employee;
  /**
   * Quem abriu o pedido. Entra na resolução porque ninguém aprova o próprio
   * pedido: sem isso, o gestor que abre uma solicitação para a própria equipe
   * cai como aprovador dela mesma e o item some das filas — ele não pode
   * aprovar e mais ninguém foi designado.
   */
  solicitante?: Employee;
}

/**
 * A estrutura a partir do estado da aplicação. Uma função só, para nenhuma tela
 * montar o objeto por conta própria e esquecer, digamos, os centros de custo —
 * o que faria a alçada de CC cair no fallback sem motivo.
 */
export const organizacaoDoConfig = (config: {
  colaboradores: Employee[];
  setores: Sector[];
  centrosDeCusto: CostCenter[];
  usuariosDemo: User[];
  empresaAtual?: { name: string };
}): Organizacao => ({
  // Só gente da empresa ativa. Sem este recorte, uma alçada institucional
  // ('diretoria', 'rh-filial') procuraria o responsável no ambiente inteiro e
  // poderia mandar o pedido de um cliente para o diretor de outro.
  colaboradores: config.empresaAtual
    ? config.colaboradores.filter(e => !e.company ||
        e.company.trim().toLowerCase() === config.empresaAtual!.name.trim().toLowerCase())
    : config.colaboradores,
  setores: config.setores,
  centrosDeCusto: config.centrosDeCusto,
  usuarios: config.usuariosDemo
});

/**
 * Contexto de uma solicitação específica: a estrutura mais o alvo dela. O alvo
 * chega de meia dúzia de formas diferentes conforme a origem do pedido, e é
 * `resolverAlvo` que unifica isso.
 */
export const contextoDaSolicitacao = (
  req: Pick<RHRequest, 'employeeId' | 'alvoId' | 'alvo' | 'colaborador' | 'data' | 'requesterId'>,
  org: Organizacao
): ContextoDeAlcada => ({
  ...org,
  alvo: resolverAlvo(req, org.colaboradores),
  solicitante: colaboradorDoUsuario(req.requesterId, org.usuarios, org.colaboradores)
});

export interface ResponsavelResolvido {
  employee?: Employee;
  userId?: string;
  groupId?: string;
  label: string;
  resolucao?: ResolucaoAlcada;
}

const usuarioDe = (emp: Employee | undefined, usuarios: User[]): string | undefined =>
  emp ? usuarios.find(u => u.employeeId === emp.id)?.id : undefined;

/** "está de férias", não "está férias" — a frase vai para a trilha. */
const situacaoPorExtenso = (emp: Employee): string =>
  emp.status === 'Férias' ? 'de férias'
  : emp.status === 'Afastado' ? 'afastado'
  : emp.status === 'Desligado' ? 'desligado'
  : emp.status === 'Pré-admissão' ? 'em pré-admissão'
  : 'inativo';

/** O titular do tipo, direto da estrutura — sem substituição nem escalonamento. */
function titularDaAlcada(
  tipo: ApprovalResponsibilityType,
  ctx: ContextoDeAlcada
): Employee | undefined {
  const { alvo, colaboradores, setores, centrosDeCusto, usuarios } = ctx;
  switch (tipo) {
    case 'gestor-direto':
      return gestorDe(alvo, colaboradores);
    case 'gestor-setor': {
      const setor = setorDe(alvo, setores);
      return porIdOuNome(setor?.managerId || setor?.manager, colaboradores);
    }
    case 'responsavel-cc': {
      const cc = centroDeCustoDe(alvo, centrosDeCusto);
      return porIdOuNome(cc?.responsibleId || cc?.responsible, colaboradores);
    }
    case 'rh-filial':
      return rhDaFilial(alvo, usuarios, colaboradores);
    case 'diretoria':
    case 'presidencia': {
      const candidatos = colaboradoresComPerfil('Diretoria', usuarios, colaboradores)
        .filter(estaDisponivel)
        .filter(e => e.id !== alvo?.id);
      // Presidência é o topo do topo: entre os diretores, quem está mais alto.
      const ordenados = [...candidatos].sort(
        (a, b) => profundidade(a, colaboradores) - profundidade(b, colaboradores)
      );
      return tipo === 'presidencia' ? ordenados[0] : ordenados[ordenados.length - 1];
    }
    default:
      return undefined;
  }
}

/** Quem cobre o titular ausente. Sai da estrutura, não de um campo de formulário. */
function substitutoDaAlcada(
  tipo: ApprovalResponsibilityType,
  titular: Employee | undefined,
  ctx: ContextoDeAlcada
): Employee | undefined {
  const { alvo, colaboradores, setores, centrosDeCusto, usuarios } = ctx;
  const candidato = (() => {
    switch (tipo) {
      case 'gestor-setor':
        return porId(setorDe(alvo, setores)?.substituteId, colaboradores);
      case 'responsavel-cc':
        return porId(centroDeCustoDe(alvo, centrosDeCusto)?.substituteId, colaboradores);
      case 'gestor-direto':
        // O substituto natural do gestor é o gestor dele.
        return gestorDe(titular, colaboradores);
      default: {
        // Institucional: outra pessoa do mesmo perfil que esteja disponível.
        const perfil = PERFIL_DA_ALCADA[tipo];
        if (!perfil) return undefined;
        return colaboradoresComPerfil(perfil, usuarios, colaboradores)
          .find(e => e.id !== titular?.id && e.id !== alvo?.id && estaDisponivel(e));
      }
    }
  })();
  return candidato && estaDisponivel(candidato) && candidato.id !== alvo?.id ? candidato : undefined;
}

/**
 * Alguém que NÃO seja inferior ao alvo, na melhor ordem disponível. É o que
 * impede a Prestação de Contas do Diretor Geral de cair na fila de um Gerente
 * de TI.
 *
 * A busca desce de preferência, não de exigência: gestor do alvo → Diretoria →
 * qualquer par de mesma altura. O último degrau existe porque o alvo pode estar
 * no topo, e aí "acima" não existe — mas um par ainda não é um inferior.
 */
function primeiroNaoInferiorAoAlvo(ctx: ContextoDeAlcada, excluir?: Employee): Employee | undefined {
  const { alvo, colaboradores, solicitante } = ctx;
  const elegivel = (e: Employee) =>
    estaDisponivel(e) && e.id !== alvo?.id && e.id !== solicitante?.id && e.id !== excluir?.id;

  const naCadeia = cadeiaDeGestores(alvo, colaboradores).find(elegivel);
  if (naCadeia) return naCadeia;

  const naDiretoria = colaboradoresComPerfil('Diretoria', ctx.usuarios, colaboradores)
    .filter(e => elegivel(e) && !estaAbaixoDe(e, alvo, colaboradores))
    .sort((a, b) => profundidade(a, colaboradores) - profundidade(b, colaboradores))[0];
  if (naDiretoria) return naDiretoria;

  // Alvo no topo: o par mais alto disponível.
  return colaboradores
    .filter(e => elegivel(e) && !estaAbaixoDe(e, alvo, colaboradores))
    .sort((a, b) => profundidade(a, colaboradores) - profundidade(b, colaboradores))[0];
}

/**
 * O responsável de um nível, resolvido pela estrutura.
 *
 * `pessoa` e `grupo` passam direto: são escolha explícita de quem configurou o
 * processo, e sobrescrevê-las seria ignorar a configuração.
 */
export function resolverResponsavel(
  step: Pick<ApprovalStep, 'responsibilityType' | 'responsibilityId'>,
  ctx?: ContextoDeAlcada
): ResponsavelResolvido {
  const tipo = step.responsibilityType;
  const papel = RESPONSIBILITY_LABELS[tipo];

  if (tipo === 'pessoa') {
    const escolhido = ctx ? porIdOuNome(step.responsibilityId, ctx.colaboradores) : undefined;
    const usuario = ctx?.usuarios.find(u => u.id === step.responsibilityId);
    return {
      employee: escolhido,
      userId: step.responsibilityId,
      // O rótulo era o próprio id ('ADMIN-001') aparecendo na tela como
      // "responsável". Vira o papel de quem foi escolhido.
      label: escolhido?.role || usuario?.role || papel
    };
  }

  if (tipo === 'grupo') {
    return { groupId: step.responsibilityId, label: step.responsibilityId || papel };
  }

  // Sem contexto não há estrutura para ler. Marca o nível como fallback em vez
  // de devolver um aprovador plausível que ninguém pediu.
  if (!ctx) {
    return {
      label: papel,
      resolucao: { fallback: true, motivo: `${papel}: cascata montada sem a estrutura da organização.` }
    };
  }

  const { alvo, colaboradores, usuarios, solicitante } = ctx;
  const resolucao: ResolucaoAlcada = {};
  let escolhido = titularDaAlcada(tipo, ctx);
  let sufixo = '';

  // 2. Titular ausente → substituto.
  //
  // Se a estrutura não define substituto utilizável (ou ele é o próprio alvo),
  // o nível NÃO fica com o ausente: sobe para quem cobre a posição. Deixar o
  // item na fila de quem está afastado é o mesmo tipo de erro silencioso que a
  // resolução veio corrigir — só que agora com uma pessoa de verdade parada.
  if (escolhido && !estaDisponivel(escolhido)) {
    const titular = escolhido;
    const substituto = substitutoDaAlcada(tipo, titular, ctx) || primeiroNaoInferiorAoAlvo(ctx);
    if (substituto && substituto.id !== titular.id) {
      resolucao.substituicao = true;
      resolucao.titularId = titular.id;
      resolucao.motivo = `${papel}: ${titular.name} está ${situacaoPorExtenso(titular)}; assume ${substituto.name}.`;
      sufixo = ' (substituto)';
      escolhido = substituto;
    } else {
      // Ninguém disponível para cobrir: o nível vai para o fallback explícito
      // abaixo, com o motivo à vista, em vez de esperar por quem não está.
      resolucao.motivo = `${papel}: ${titular.name} está ${situacaoPorExtenso(titular)} e não há substituto disponível na estrutura.`;
      escolhido = undefined;
    }
  }

  // Ninguém decide o próprio pedido — nem como alvo, nem como solicitante. Vale
  // para qualquer tipo de alçada, inclusive 'pessoa' e 'grupo' não passam aqui
  // porque saíram antes (escolha explícita da configuração).
  const conflito = escolhido && ((alvo && escolhido.id === alvo.id) || (solicitante && escolhido.id === solicitante.id));
  if (conflito && escolhido) {
    const impedimento = alvo && escolhido.id === alvo.id ? 'o próprio alvo' : 'quem abriu o pedido';
    const acima = primeiroNaoInferiorAoAlvo(ctx, escolhido);
    resolucao.escalado = true;
    resolucao.motivo = `${papel}: o responsável seria ${impedimento} (${escolhido.name}); sobe para ${acima?.name || 'a alçada acima'}.`;
    escolhido = acima;
    sufixo = '';
  }

  // 3. NUNCA PARA BAIXO — nas alçadas que saem da hierarquia.
  //
  // Vale também quando não houve titular: o fallback para o RH da filial é o
  // certo para um analista, mas para o Diretor Geral colocaria um subordinado
  // decidindo o pedido do chefe. Por isso o escalonamento vem ANTES do
  // fallback, e não depois.
  //
  // 'rh-filial' e 'diretoria' ficam de fora: são papéis institucionais (o RH
  // processa o pedido do diretor sem estar acima dele) e 'rh-filial' é o fim de
  // linha do roteamento — fazê-la escalar não teria terminação.
  if (alvo && ALCADAS_HIERARQUICAS.includes(tipo) && (!escolhido || estaAbaixoDe(escolhido, alvo, colaboradores))) {
    const acima = primeiroNaoInferiorAoAlvo(ctx);
    if (acima && acima.id !== escolhido?.id) {
      resolucao.escalado = true;
      resolucao.motivo = escolhido
        ? `${papel}: ${escolhido.name} está abaixo de ${alvo.name} na hierarquia; sobe para ${acima.name}.`
        : `${papel}: ${alvo.name} não tem ${papel.toLowerCase()} vinculado; sobe para ${acima.name}.`;
      escolhido = acima;
      sufixo = '';
    }
  }

  // 4. Sem vínculo na estrutura → RH da filial, com o motivo à vista.
  if (!escolhido) {
    const rh = rhDaFilial(alvo, usuarios, colaboradores);
    resolucao.fallback = true;
    resolucao.motivo = resolucao.motivo
      ? `${resolucao.motivo} Encaminhado ao RH da filial.`
      : `${papel}: ${alvo ? `${alvo.name} não tem ${papel.toLowerCase()} vinculado na estrutura` : 'solicitação sem alvo no cadastro'}. Encaminhado ao RH da filial.`;
    escolhido = rh;
    sufixo = ' (fallback)';
  }

  return {
    employee: escolhido,
    userId: usuarioDe(escolhido, usuarios),
    label: `${papel}${sufixo}`,
    resolucao: Object.keys(resolucao).length ? resolucao : undefined
  };
}

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

// Nível implícito para processos sem alçadas configuradas: uma única aprovação
// do RH conclui o pedido. O responsável também sai da estrutura — antes era o
// FALLBACK_APPROVER_ID fixo.
const defaultLevel = (ctx?: ContextoDeAlcada): RequestApprovalLevel => {
  const resolvido = resolverResponsavel({ responsibilityType: 'rh-filial' }, ctx);
  return {
    id: 'default-approval',
    name: 'Aprovação',
    order: 1,
    responsibilityType: 'rh-filial',
    responsibleLabel: resolvido.label,
    responsibleUserId: resolvido.userId,
    responsibleEmployeeId: resolvido.employee?.id,
    responsibleName: resolvido.employee?.name,
    resolucao: resolvido.resolucao,
    sla: 48,
    slaUnit: 'h',
    isMandatory: true,
    status: 'pendente'
  };
};

export function buildApprovalChain(
  process: RHProcess | undefined,
  data: Record<string, any> = {},
  ctx?: ContextoDeAlcada
): RequestApprovalLevel[] {
  const steps = (process?.approvals || [])
    .filter(step => isStepApplicable(step, data))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (steps.length === 0) return [defaultLevel(ctx)];

  return steps.map((step, index) => {
    const resolvido = resolverResponsavel(step, ctx);
    return {
      id: step.id,
      name: step.name || `Aprovação ${index + 1}`,
      order: index + 1,
      responsibilityType: step.responsibilityType,
      responsibleLabel: resolvido.label,
      responsibleUserId: resolvido.userId,
      responsibleGroupId: resolvido.groupId,
      responsibleEmployeeId: resolvido.employee?.id,
      responsibleName: resolvido.employee?.name,
      resolucao: resolvido.resolucao,
      sla: step.sla ?? 24,
      slaUnit: step.slaUnit || 'h',
      isMandatory: step.isMandatory !== false,
      status: 'pendente',
      conditionLabel: describeCondition(step, data)
    };
  });
}

/** Motivos de roteamento da cascata, para a trilha da abertura. */
export const motivosDaCascata = (chain: RequestApprovalLevel[]): string[] =>
  chain.map(l => l.resolucao?.motivo).filter((m): m is string => !!m);

// Solicitações criadas antes da cascata (ou vindas do mock) não têm a trilha
// gravada: reconstrói a partir da configuração atual do processo, marcando como
// aprovados os níveis já vencidos pelo status.
export function ensureApprovalChain(
  req: RHRequest,
  process?: RHProcess,
  org?: Organizacao
): RequestApprovalLevel[] {
  if (req.approvalChain?.length) return req.approvalChain;

  // O alvo sai da PRÓPRIA solicitação: reconstruir a cascata de um pedido antigo
  // com o alvo de outro daria o aprovador errado.
  const chain = buildApprovalChain(process, req.data || {}, org && contextoDaSolicitacao(req, org));
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

export type UsuarioParaAprovacao = Pick<User, 'id' | 'name' | 'profile' | 'groups'> & {
  employeeId?: string;
};

/** O usuário é o responsável pela alçada que está pendente agora? */
export function isPendingApprover(
  req: RHRequest,
  process: RHProcess | undefined,
  user: UsuarioParaAprovacao,
  grupos: Group[] = [],
  org?: Organizacao
): boolean {
  if (!isAwaitingApproval(req.status)) return false;

  // Pedido do próprio usuário: o botão Aprovar recusa (só Administrador Geral e
  // a conta de demonstração passam), então listar aqui seria oferecer uma ação
  // que trava no clique seguinte.
  const ehMeuPedido = req.requesterId === user.id || req.solicitante === user.name;
  if (ehMeuPedido && !podeAprovarPropriaSolicitacao(user)) return false;

  const nivel = getCurrentLevel(ensureApprovalChain(req, process, org));
  if (!nivel) return false;

  // 1. Pessoa resolvida para o nível — por conta de usuário ou por ficha. Com a
  //    resolução real, o nível aponta para UMA pessoa; ela é o critério.
  if (nivel.responsibleUserId && nivel.responsibleUserId === user.id) return true;
  if (nivel.responsibleEmployeeId && nivel.responsibleEmployeeId === user.employeeId) return true;

  // 2. Grupo responsável — por id do grupo ou pelo nome que o usuário carrega.
  if (nivel.responsibleGroupId) {
    const grupo = grupos.find(g => g.id === nivel.responsibleGroupId || g.nome === nivel.responsibleGroupId);
    const nomesDoUsuario = user.groups || [];
    if (grupo && (grupo.membros.includes(user.id) || nomesDoUsuario.includes(grupo.nome))) return true;
    if (nomesDoUsuario.includes(nivel.responsibleGroupId)) return true;
  }

  // 3. Perfil que responde pelo tipo de alçada — SÓ quando o nível não resolveu
  //    para ninguém. Enquanto o aprovador vinha de um mapa fixo, o perfil era o
  //    que fazia a alçada aparecer para alguém; agora, aplicá-lo por cima de um
  //    nível já resolvido devolveria o pedido para TODOS os gestores e apagaria
  //    justamente a diferença entre o gestor de um e o de outro.
  const nivelResolvido = !!(nivel.responsibleUserId || nivel.responsibleEmployeeId || nivel.responsibleGroupId);
  if (nivelResolvido) return false;
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
  user: UsuarioParaAprovacao,
  grupos: Group[] = [],
  org?: Organizacao
): boolean {
  const processo = processos.find(p => p.id === (req.tipoProcesso || req.processId));
  return isPendingApprover(req, processo, user, grupos, org);
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
  user: UsuarioParaAprovacao,
  grupos: Group[] = [],
  org?: Organizacao
): RHRequest[] {
  return solicitacoes.filter(req => ehMinhaAprovacao(req, processos, user, grupos, org));
}
