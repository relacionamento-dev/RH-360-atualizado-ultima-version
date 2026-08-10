import { AccessProfile, Company, Employee, EscopoDeDados, RHRequest, User } from '../types';
import { escopoDoUsuario, isSuperAdmin, perfilDoUsuario, podeExecutarAcao, ACOES_DE_TELA } from './permissions';
import { colaboradorDoUsuario, gestorDe, porId, resolverAlvo } from './hierarquia';
import { colaboradorDaEmpresa, solicitacaoDaEmpresa } from './empresa';

// ESCOPO DE DADOS — o filtro que faltava
//
// O menu já decidia QUAIS TELAS cada perfil alcança. Faltava a outra metade:
// QUAIS REGISTROS cada tela mostra. Sem ela, um Gestor abria o Perfil 360 de
// qualquer pessoa da empresa e via a remuneração — o menu deixava ele entrar na
// tela e a tela não perguntava mais nada.
//
// Aqui mora a resposta de "este usuário alcança este registro?", para
// colaboradores, solicitações e tudo que é derivado deles.

export interface ContextoDeEscopo {
  colaboradores: Employee[];
  usuarios: User[];
  perfis: AccessProfile[];
  /** Empresa ativa — o limite do escopo 'empresa'. */
  empresaAtual?: Company;
}

/**
 * O contexto a partir do estado da aplicação. Uma função só, para nenhuma tela
 * montar o objeto pela metade — esquecer `perfis`, por exemplo, faria todo
 * escopo cair no do usuário e o filtro perderia o sentido.
 */
export const contextoDeEscopoDoConfig = (config: {
  colaboradores: Employee[];
  usuariosDemo: User[];
  perfis: AccessProfile[];
  empresaAtual: Company;
}): ContextoDeEscopo => ({
  colaboradores: config.colaboradores,
  usuarios: config.usuariosDemo,
  perfis: config.perfis,
  empresaAtual: config.empresaAtual
});

/**
 * Subordinados diretos e indiretos. Percorre a árvore para baixo com um
 * `visitados` porque cadastro com ciclo (A chefia B que chefia A) existe e não
 * pode travar a tela.
 */
export function subordinadosDe(gestor: Employee | undefined, colaboradores: Employee[]): Employee[] {
  if (!gestor) return [];
  const equipe: Employee[] = [];
  const visitados = new Set<string>([gestor.id]);
  let fronteira = [gestor];

  while (fronteira.length) {
    const proxima: Employee[] = [];
    for (const chefe of fronteira) {
      for (const e of colaboradores) {
        if (visitados.has(e.id)) continue;
        if (gestorDe(e, colaboradores)?.id === chefe.id) {
          visitados.add(e.id);
          equipe.push(e);
          proxima.push(e);
        }
      }
    }
    fronteira = proxima;
  }
  return equipe;
}

const mesmo = (a?: string, b?: string) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * O usuário alcança a ficha deste colaborador?
 *
 * A própria ficha SEMPRE entra, em qualquer escopo — inclusive 'proprio', que é
 * exatamente ela.
 */
export function alcancaColaborador(
  user: User | null | undefined,
  alvo: Employee | undefined,
  ctx: ContextoDeEscopo
): boolean {
  if (!user || !alvo) return false;

  // EMPRESA ATIVA primeiro, e vale para todo mundo — inclusive o Administrador
  // Geral. Escopo global é poder TROCAR de empresa, não ver as duas ao mesmo
  // tempo na mesma lista.
  if (!colaboradorDaEmpresa(alvo, ctx.empresaAtual as Company)) return false;

  if (isSuperAdmin(user)) return true;

  const escopo = escopoDoUsuario(user, ctx.perfis);
  if (escopo === 'global') return true;

  const eu = colaboradorDoUsuario(user.id, ctx.usuarios, ctx.colaboradores);
  if (eu && eu.id === alvo.id) return true;

  switch (escopo) {
    case 'proprio':
      return false;
    case 'equipe':
      // Subordinados (diretos e indiretos) e o próprio centro de custo: é o
      // recorte de quem responde por um time.
      return subordinadosDe(eu, ctx.colaboradores).some(e => e.id === alvo.id) ||
        mesmo(eu?.costCenter, alvo.costCenter);
    case 'setor':
      return mesmo(eu?.department, alvo.department);
    case 'centro-custo':
      return mesmo(eu?.costCenter, alvo.costCenter);
    case 'filial':
      return mesmo(eu?.branch, alvo.branch);
    case 'empresa':
      return !ctx.empresaAtual || mesmo(alvo.company, ctx.empresaAtual.name);
    default:
      return false;
  }
}

/** A lista de colaboradores que este usuário pode ver. */
export const colaboradoresNoEscopo = (user: User | null | undefined, ctx: ContextoDeEscopo): Employee[] =>
  ctx.colaboradores.filter(e => alcancaColaborador(user, e, ctx));

/**
 * O usuário alcança esta solicitação?
 *
 * Vale por três caminhos, e basta um: ele abriu o pedido, o pedido é sobre
 * alguém que ele alcança, ou ele responde por uma alçada dele (o aprovador
 * precisa ver o que tem de decidir, mesmo fora do escopo — é o pedido que veio
 * até ele).
 */
export function alcancaSolicitacao(
  user: User | null | undefined,
  req: RHRequest,
  ctx: ContextoDeEscopo
): boolean {
  if (!user) return false;
  if (!solicitacaoDaEmpresa(req, ctx.empresaAtual as Company, ctx.colaboradores)) return false;
  if (isSuperAdmin(user)) return true;

  if (req.requesterId === user.id || req.solicitante === user.name) return true;

  const nivelPendente = (req.approvalChain || []).find(l => l.status === 'pendente');
  if (nivelPendente?.responsibleUserId === user.id) return true;
  if (nivelPendente?.responsibleEmployeeId && nivelPendente.responsibleEmployeeId === user.employeeId) return true;

  const escopo = escopoDoUsuario(user, ctx.perfis);
  if (escopo === 'proprio') {
    // Só o que é dele: aberto por ele (acima) ou sobre ele.
    const eu = colaboradorDoUsuario(user.id, ctx.usuarios, ctx.colaboradores);
    const alvo = resolverAlvo(req, ctx.colaboradores);
    return !!eu && !!alvo && eu.id === alvo.id;
  }

  const alvo = resolverAlvo(req, ctx.colaboradores);
  // Solicitação sem alvo no cadastro (requisição de vaga, por exemplo) fica
  // visível para quem alcança a empresa — não há ficha para recortar por ela.
  if (!alvo) return escopo === 'empresa' || escopo === 'global';
  return alcancaColaborador(user, alvo, ctx);
}

export const solicitacoesNoEscopo = (
  user: User | null | undefined,
  solicitacoes: RHRequest[],
  ctx: ContextoDeEscopo
): RHRequest[] => solicitacoes.filter(r => alcancaSolicitacao(user, r, ctx));

// DADO SENSÍVEL
//
// Remuneração, faixa salarial e histórico de cargo e salário. A regra é do
// PERFIL (ação `pessoas:ver-salario`) e não do escopo: o Gestor alcança a ficha
// do subordinado, mas não a remuneração dele — a menos que o perfil dele
// tenha a permissão explícita.

export function podeVerRemuneracao(
  user: User | null | undefined,
  ctx: Pick<ContextoDeEscopo, 'perfis'>
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  // A matriz de dado sensível do perfil também libera — é o caminho de quem
  // cria um perfil novo e marca "visualizar salário".
  if (perfilDoUsuario(user, ctx.perfis)?.dadosSensiveis?.visualizarSalario) return true;
  return podeExecutarAcao(user, ACOES_DE_TELA.VER_SALARIO, ctx.perfis);
}

/** Máscara de exibição para quem não pode ver o valor. */
export const REMUNERACAO_OCULTA = '••••••';

/** Escopos que a Central Adm oferece, com o rótulo que o cliente entende. */
export const ROTULO_DO_ESCOPO: Record<EscopoDeDados, string> = {
  proprio: 'Próprio — só os próprios registros',
  equipe: 'Equipe — subordinados e o próprio centro de custo',
  setor: 'Setor — o departamento inteiro',
  'centro-custo': 'Centro de custo',
  filial: 'Filial',
  empresa: 'Empresa — toda a empresa ativa',
  global: 'Global — todas as empresas'
};
