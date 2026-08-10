import { AccessProfile, EscopoDeDados, NomeDePerfil, ProcessPermission, SensitiveDataPermission, User } from '../types';

// REGRA CENTRAL DE ACESSO
//
// O perfil "Administrador Geral" (usuários @jynx.com.br) tem acesso irrestrito:
// qualquer checagem de permissão retorna verdadeiro, todo menu aparece e o
// escopo de dados é global. Toda tela que precise decidir "pode ou não pode"
// deve passar por `isSuperAdmin` em vez de repetir listas de perfis.
//
// A checagem usa o usuário EFETIVO (`config.usuarioAtual`). Ao "Visualizar
// como" outro perfil, `usuarioAtual` passa a ser o perfil simulado (o real fica
// em `config.originalUser`), então valem as regras do perfil simulado — o
// bypass não vaza para a simulação.

export const SUPER_ADMIN_PROFILE: User['profile'] = 'Administrador Geral';

// Domínio interno: toda conta @jynx.com.br entra como Administrador Geral,
// independente de como foi cadastrada (usuário do sistema ou acesso liberado
// pela Gestão de Acessos, que antes rebaixava o perfil para 'Administrador').
export const JYNX_DOMAIN = '@jynx.com.br';

export const isJynxEmail = (email?: string | null): boolean =>
  !!email && email.trim().toLowerCase().endsWith(JYNX_DOMAIN);

export const isSuperAdmin = (user?: Pick<User, 'profile'> | null): boolean =>
  user?.profile === SUPER_ADMIN_PROFILE;

// Promove o usuário autenticado a Administrador Geral (perfil REAL, sem
// simulação): perfil, escopo global e a flag legada de gestão de acessos.
export const asSuperAdmin = (user: User): User => ({
  ...user,
  profile: SUPER_ADMIN_PROFILE,
  role: SUPER_ADMIN_PROFILE,
  scope: 'global',
  canManageAccesses: true
});

// Feed da Intranet: quem pode editar ou excluir uma publicação. É o mesmo
// critério da exclusão de comentário (comparação de id), mais o bypass do
// Administrador Geral. Comunicado sem `authorId` é post de conta institucional
// ou publicação anterior ao campo — aí só o nome do autor serve de comparação.
export const podeGerenciarComunicado = (
  user: Pick<User, 'id' | 'name' | 'profile'> | null | undefined,
  comunicado: { author: string; authorId?: string }
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return comunicado.authorId ? comunicado.authorId === user.id : comunicado.author === user.name;
};

// Escopo de dados: enxerga todas as empresas e filiais.
export const hasGlobalScope = (user?: Pick<User, 'profile' | 'scope'> | null): boolean =>
  isSuperAdmin(user) || user?.scope === 'global';

// Processos com entrada própria não entram no modal genérico "Nova
// Solicitação". A Admissão Digital ('3') só pode ser iniciada pelo botão
// "+ Nova Admissão" dentro da tela do processo, que dispara o link de admissão
// — abrir o formulário genérico criaria uma solicitação fora desse fluxo.
// Não afeta permissão ('solicitar' segue valendo), só a vitrine de abertura.
export const PROCESSOS_SEM_ABERTURA_GENERICA = ['3'];

export const podeAbrirPeloFluxoGenerico = (processId: string): boolean =>
  !PROCESSOS_SEM_ABERTURA_GENERICA.includes(processId);

export const PROCESSO_DESLIGAMENTO = '15';

/**
 * Ninguém aprova a própria solicitação — exceto o Administrador Geral e a conta
 * de demonstração ADMIN-001, que precisam conseguir percorrer o fluxo inteiro
 * sozinhos numa apresentação.
 *
 * A regra vale em dois lugares e precisa ser a MESMA: o botão Aprovar
 * (`approveRequest`) e a lista "Minhas Aprovações" (`isPendingApprover`).
 * Quando divergiam, a aba oferecia solicitações que o botão depois recusava.
 */
export const CONTA_DEMO_APROVA_TUDO = 'ADMIN-001';

export const podeAprovarPropriaSolicitacao = (user?: Pick<User, 'id' | 'profile'> | null): boolean =>
  !!user && (isSuperAdmin(user) || user.id === CONTA_DEMO_APROVA_TUDO);

// Etapa "Benefícios e Encerramento" do desligamento: quem executa é o RH/DP.
// Gestor e Diretoria aprovam a cascata, mas não lançam verba nem dão baixa em
// documento — por isso a checagem não usa a permissão genérica 'executar', que
// vale para os dois. Administradores entram porque tocam qualquer processo.
export const PERFIS_ENCERRAMENTO_DESLIGAMENTO: User['profile'][] = [
  'RH/DP',
  'Administrador',
  'Administrador Geral'
];

export const podeExecutarEncerramento = (user?: Pick<User, 'profile'> | null): boolean =>
  !!user && (isSuperAdmin(user) || PERFIS_ENCERRAMENTO_DESLIGAMENTO.includes(user.profile));

// Comunicado oficial da Intranet: o que entra no carrossel com o selo
// "COMUNICADO OFICIAL" e fala em nome da empresa. Mesma forma do encerramento
// de desligamento acima — lista de perfis exportada + predicado com o bypass do
// Administrador Geral —, para a regra não virar um `includes` solto dentro do
// componente.
//
// Não confundir com o post do feed ("Compartilhe algo com o time"): aquele é
// social, qualquer pessoa publica, e é justamente o que `podeGerenciarComunicado`
// pressupõe ao deixar o autor editar o próprio post.
export const PERFIS_COMUNICADO_OFICIAL: User['profile'][] = [
  'RH/DP',
  'Administrador',
  'Administrador Geral'
];

export const podePublicarComunicadoOficial = (user?: Pick<User, 'profile'> | null): boolean =>
  !!user && (isSuperAdmin(user) || PERFIS_COMUNICADO_OFICIAL.includes(user.profile));

// ACESSO ÀS TELAS (o que o menu lateral mostra)
//
// Fonte única da regra "este perfil alcança esta tela". Ela nasceu espalhada em
// cinco `filter` dentro do AppShell, e qualquer outro lugar que quisesse a
// mesma decisão — os atalhos da Intranet, por exemplo — tinha de reescrevê-la.
// Foi assim que o Colaborador ganhou cards para "Central de Tarefas" e "Minhas
// Aprovações", telas que o menu dele não tem.
//
// Cada entrada é a lista de perfis que alcançam a tela; `undefined` significa
// "todos os perfis". O Administrador Geral entra em tudo pelo `isSuperAdmin`.

/** Ids das telas do menu lateral. */
export type ViewDoMenu =
  | 'intranet' | 'dashboard'
  | 'tasks' | 'requests' | 'approvals'
  | 'employees' | 'profile-360' | 'portal-colaborador'
  | 'hr-processes' | 'global-query'
  | 'reports' | 'integrations' | 'admin' | 'access-management';

export const VIEWS_DO_MENU: ViewDoMenu[] = [
  'intranet', 'dashboard',
  'tasks', 'requests', 'approvals',
  'employees', 'profile-360', 'portal-colaborador',
  'hr-processes', 'global-query',
  'reports', 'integrations', 'admin', 'access-management'
];

export const ROTULO_DA_VIEW: Record<ViewDoMenu, string> = {
  intranet: 'Intranet',
  dashboard: 'Dashboard RH',
  tasks: 'Central de Tarefas',
  requests: 'Minhas Solicitações',
  approvals: 'Minhas Aprovações',
  employees: 'Colaboradores',
  'profile-360': 'Perfil 360',
  'portal-colaborador': 'Portal do Colaborador',
  'hr-processes': 'Hub de Processos',
  'global-query': 'Consulta Global',
  reports: 'Relatórios',
  integrations: 'Integrações',
  admin: 'Central Adm',
  'access-management': 'Gestão de Acessos'
};

const TODOS_OS_PERFIS = undefined;

/**
 * O acesso a tela por perfil COMO ESTAVA no código. Deixou de ser a regra e
 * passou a ser o SEED dos perfis de sistema (`AppConfig.perfis`): quem decide é
 * o registro do perfil, que a Central Adm edita. Esta tabela sobrevive por dois
 * motivos — semear os seis perfis que acompanham o produto e responder quando a
 * pergunta chega sem a lista de perfis em mãos.
 */
const ACESSO_POR_VIEW: Record<ViewDoMenu, NomeDePerfil[] | undefined> = {
  intranet: TODOS_OS_PERFIS,
  dashboard: ['Administrador', 'Diretoria', 'RH/DP', 'Gestor'],

  tasks: ['Administrador', 'Diretoria', 'RH/DP', 'Gestor'],
  requests: TODOS_OS_PERFIS,
  approvals: ['Administrador', 'Diretoria', 'RH/DP', 'Gestor'],

  employees: ['Administrador', 'RH/DP'],
  'profile-360': ['Administrador', 'RH/DP', 'Gestor'],
  'portal-colaborador': ['Administrador', 'RH/DP'],

  'hr-processes': ['Administrador', 'Diretoria', 'RH/DP', 'Gestor'],
  'global-query': ['Administrador', 'Diretoria', 'RH/DP'],

  reports: ['Administrador', 'Diretoria', 'RH/DP'],
  integrations: ['Administrador'],
  admin: ['Administrador'],
  // Não é perfil: é a flag do próprio usuário (ver `podeAcessarView`).
  'access-management': []
};

/** Telas que a tabela acima concede a um perfil de sistema. */
export const telasDoPerfilPadrao = (nome: NomeDePerfil): ViewDoMenu[] => {
  // O Administrador Geral passa por  e alcança tudo. O registro
  // dele precisa DIZER isso: um perfil que lista 2 telas e na prática abre 14
  // é exatamente o tipo de regra invisível que esta migração veio remover.
  if (nome === SUPER_ADMIN_PROFILE) return [...VIEWS_DO_MENU];
  return VIEWS_DO_MENU.filter(v => {
    const perfis = ACESSO_POR_VIEW[v];
    return perfis === undefined || perfis.includes(nome);
  });
};

/** O registro do perfil, pelo nome que o usuário carrega. */
export const perfilDoUsuario = (
  user: Pick<User, 'profile'> | null | undefined,
  perfis: AccessProfile[] = []
): AccessProfile | undefined => perfis.find(p => p.nome === user?.profile);

/**
 * O perfil alcança a tela? É o que o menu lateral pergunta para montar os
 * grupos, e o que qualquer atalho precisa perguntar antes de oferecer o caminho.
 *
 * Com a lista de perfis (`config.perfis`), quem responde é o REGISTRO — é isso
 * que faz um perfil criado na Central Adm valer sem passar por aqui. Sem ela,
 * cai na tabela de origem, que descreve os seis perfis de fábrica.
 */
export function podeAcessarView(
  user: Pick<User, 'profile' | 'canManageAccesses'> | null | undefined,
  view: ViewDoMenu,
  perfis?: AccessProfile[]
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  // Gestão de Acessos nunca dependeu de perfil, e sim da liberação individual.
  if (view === 'access-management') return user.canManageAccesses === true;

  const registro = perfilDoUsuario(user, perfis);
  if (registro) return registro.ativo && registro.telas.includes(view);

  const daTabela = ACESSO_POR_VIEW[view];
  return daTabela === undefined || daTabela.includes(user.profile);
}

// AÇÕES DE TELA
//
// Ação que não pertence a um processo (aquelas têm a matriz por processo). Cada
// uma tem um id e um padrão por perfil, e o registro do perfil pode sobrescrever
// — é o mesmo caminho do "Novo Comunicado", agora como dado.

export const ACOES_DE_TELA = {
  COMUNICADO_OFICIAL: 'intranet:comunicado-oficial',
  VER_SALARIO: 'pessoas:ver-salario',
  EXPORTAR_RELATORIO: 'relatorios:exportar',
  GERIR_HIERARQUIA: 'organizacao:gerir-hierarquia'
} as const;

export type AcaoDeTela = typeof ACOES_DE_TELA[keyof typeof ACOES_DE_TELA];

export const ROTULO_DA_ACAO: Record<AcaoDeTela, string> = {
  [ACOES_DE_TELA.COMUNICADO_OFICIAL]: 'Publicar comunicado oficial',
  [ACOES_DE_TELA.VER_SALARIO]: 'Ver remuneração e faixa salarial',
  [ACOES_DE_TELA.EXPORTAR_RELATORIO]: 'Exportar relatórios',
  [ACOES_DE_TELA.GERIR_HIERARQUIA]: 'Editar estrutura de hierarquia'
};

/** Padrão de fábrica de cada ação, por perfil de sistema. */
const ACAO_POR_PERFIL: Record<AcaoDeTela, NomeDePerfil[]> = {
  [ACOES_DE_TELA.COMUNICADO_OFICIAL]: ['RH/DP', 'Administrador', 'Administrador Geral'],
  [ACOES_DE_TELA.VER_SALARIO]: ['RH/DP', 'Diretoria', 'Administrador', 'Administrador Geral'],
  [ACOES_DE_TELA.EXPORTAR_RELATORIO]: ['RH/DP', 'Diretoria', 'Administrador', 'Administrador Geral'],
  [ACOES_DE_TELA.GERIR_HIERARQUIA]: ['RH/DP', 'Administrador', 'Administrador Geral']
};

export const acoesDoPerfilPadrao = (nome: NomeDePerfil): Record<string, boolean> =>
  Object.fromEntries(
    (Object.keys(ACAO_POR_PERFIL) as AcaoDeTela[]).map(a => [a, ACAO_POR_PERFIL[a].includes(nome)])
  );

/**
 * O perfil pode executar esta ação de tela? Fonte única dos botões que não
 * pertencem a um processo.
 */
export function podeExecutarAcao(
  user: Pick<User, 'profile'> | null | undefined,
  acao: AcaoDeTela,
  perfis?: AccessProfile[]
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const registro = perfilDoUsuario(user, perfis);
  if (registro) return registro.ativo && registro.acoesDeTela?.[acao] === true;
  return ACAO_POR_PERFIL[acao].includes(user.profile);
}

/** Escopo efetivo: o do perfil manda; o do usuário é o que sobra. */
export function escopoDoUsuario(
  user: Pick<User, 'profile' | 'scope'> | null | undefined,
  perfis?: AccessProfile[]
): EscopoDeDados {
  if (!user) return 'proprio';
  if (isSuperAdmin(user)) return 'global';
  return perfilDoUsuario(user, perfis)?.escopo || user.scope || 'proprio';
}

export const FULL_PROCESS_PERMISSIONS: ProcessPermission = {
  ver: true,
  solicitar: true,
  executar: true,
  aprovar: true,
  devolver: true,
  cancelar: true,
  reabrir: true,
  verHistorico: true,
  verSigiloso: true
};

export const FULL_SENSITIVE_PERMISSIONS: SensitiveDataPermission = {
  visualizarSalario: true,
  editarSalario: true,
  visualizarCPF: true,
  visualizarDocumentosPessoais: true,
  visualizarDadosBancarios: true,
  visualizarASO: true,
  visualizarMedidaDisciplinar: true,
  visualizarDesligamento: true,
  visualizarJuridico: true,
  visualizarAuditoria: true
};
