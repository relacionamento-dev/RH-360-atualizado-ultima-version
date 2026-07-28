import { ProcessPermission, SensitiveDataPermission, User } from '../types';

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

// Escopo de dados: enxerga todas as empresas e filiais.
export const hasGlobalScope = (user?: Pick<User, 'profile' | 'scope'> | null): boolean =>
  isSuperAdmin(user) || user?.scope === 'global';

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
