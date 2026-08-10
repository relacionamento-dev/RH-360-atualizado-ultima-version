import { CostCenter, Employee, Sector, User } from '../types';

// A ESTRUTURA, LIDA COMO DADO
//
// Antes da alçada saber quem aprova, alguém precisa saber quem é o gestor de
// quem. O cadastro guardava isso só como texto (`manager: 'Marcos Vinicius'`) e
// ninguém lia — o roteamento usava um mapa fixo de tipo de alçada para usuário
// de demonstração, então "Gestor Direto" apontava sempre para a mesma pessoa,
// independente do alvo.
//
// Este módulo é a leitura da estrutura: gestor, setor, centro de custo, RH da
// filial e a posição de cada um na hierarquia. Ele não decide alçada (isso é do
// approvalFlow) — só responde perguntas sobre a estrutura.
//
// COMPATIBILIDADE: todo vínculo é lido primeiro por id e, se não houver, pelo
// nome. Registro antigo (e o que vem do localStorage de uma versão anterior)
// continua resolvendo.

/** Sentinela de topo: `managerId: 'BOARD'` é "não há gestor acima". */
export const TOPO_DA_HIERARQUIA = 'BOARD';

/** Nomes que o seed usa para dizer "ninguém"/"ainda não definido". */
const SEM_GESTOR = ['', 'board', 'a definir', 'conselho jynx', 'n/a'];

const normalizar = (v?: string) => (v || '').trim().toLowerCase();

export const porId = (id: string | undefined, colaboradores: Employee[]): Employee | undefined =>
  id ? colaboradores.find(e => e.id === id) : undefined;

export const porNome = (nome: string | undefined, colaboradores: Employee[]): Employee | undefined =>
  nome ? colaboradores.find(e => normalizar(e.name) === normalizar(nome)) : undefined;

/** Aceita id OU nome — é como as solicitações e os formulários referenciam gente. */
export const porIdOuNome = (ref: string | undefined, colaboradores: Employee[]): Employee | undefined =>
  porId(ref, colaboradores) || porNome(ref, colaboradores);

/**
 * O gestor direto do colaborador. `managerId` manda; sem ele, cai no nome —
 * é o que mantém os registros antigos resolvendo.
 */
export function gestorDe(emp: Employee | undefined, colaboradores: Employee[]): Employee | undefined {
  if (!emp) return undefined;
  if (emp.managerId && emp.managerId !== TOPO_DA_HIERARQUIA) {
    const porVinculo = porId(emp.managerId, colaboradores);
    if (porVinculo) return porVinculo;
  }
  if (emp.managerId === TOPO_DA_HIERARQUIA) return undefined;
  if (SEM_GESTOR.includes(normalizar(emp.manager))) return undefined;
  const encontrado = porNome(emp.manager, colaboradores);
  return encontrado?.id === emp.id ? undefined : encontrado;
}

/**
 * Está em condição de decidir agora? Afastado, de férias, inativo ou desligado
 * não estão — é o gatilho do substituto.
 */
export const estaDisponivel = (emp?: Employee): boolean =>
  !!emp && emp.status === 'Ativo' && emp.situacao !== 'PRE_ADMISSAO';

/**
 * Distância até o topo: 0 é quem não tem gestor acima. Menor = mais alto.
 * O `visitados` fecha ciclo de cadastro (A chefia B que chefia A) em vez de
 * estourar a pilha.
 */
export function profundidade(emp: Employee | undefined, colaboradores: Employee[]): number {
  let atual = emp;
  const visitados = new Set<string>();
  let nivel = 0;
  while (atual && !visitados.has(atual.id)) {
    visitados.add(atual.id);
    const chefe = gestorDe(atual, colaboradores);
    if (!chefe) return nivel;
    atual = chefe;
    nivel++;
  }
  return nivel;
}

/** `a` está acima de `b` na hierarquia? Empate NÃO conta como acima. */
export const estaAcimaDe = (a: Employee | undefined, b: Employee | undefined, colaboradores: Employee[]): boolean =>
  !!a && !!b && profundidade(a, colaboradores) < profundidade(b, colaboradores);

/**
 * `a` está ABAIXO de `b`? É esta a pergunta do "nunca aprovar para baixo" — e
 * não `!estaAcimaDe`. Par (mesma profundidade) não é inferior: quando o alvo
 * está no topo, quem aprova é um par, porque acima não existe ninguém.
 */
export const estaAbaixoDe = (a: Employee | undefined, b: Employee | undefined, colaboradores: Employee[]): boolean =>
  !!a && !!b && profundidade(a, colaboradores) > profundidade(b, colaboradores);

/** A cadeia de gestores do colaborador, do mais próximo ao topo. */
export function cadeiaDeGestores(emp: Employee | undefined, colaboradores: Employee[]): Employee[] {
  const cadeia: Employee[] = [];
  const visitados = new Set<string>();
  let atual = gestorDe(emp, colaboradores);
  while (atual && !visitados.has(atual.id)) {
    visitados.add(atual.id);
    cadeia.push(atual);
    atual = gestorDe(atual, colaboradores);
  }
  return cadeia;
}

/** O setor do colaborador — casa pelo nome do departamento na ficha. */
export const setorDe = (emp: Employee | undefined, setores: Sector[]): Sector | undefined =>
  emp ? setores.find(s => normalizar(s.name) === normalizar(emp.department)) : undefined;

/** O centro de custo do colaborador — a ficha guarda o código ('TI-001'). */
export const centroDeCustoDe = (emp: Employee | undefined, centros: CostCenter[]): CostCenter | undefined =>
  emp
    ? centros.find(c => normalizar(c.code) === normalizar(emp.costCenter) ||
                        normalizar(c.name) === normalizar(emp.costCenter))
    : undefined;

/**
 * A ficha por trás de um id de USUÁRIO (ou de colaborador). Mesma ponte que
 * `utils/identidade` faz para exibir o solicitante — aqui ela serve para a
 * resolução saber quem abriu o pedido.
 */
export const colaboradorDoUsuario = (
  id: string | undefined,
  usuarios: User[],
  colaboradores: Employee[]
): Employee | undefined => {
  if (!id) return undefined;
  const usuario = usuarios.find(u => u.id === id);
  return porId(usuario?.employeeId, colaboradores) || porId(id, colaboradores);
};

/** Perfil de acesso de um colaborador, quando ele tem conta de usuário. */
export const perfilDe = (emp: Employee | undefined, usuarios: User[]): User['profile'] | undefined =>
  emp ? usuarios.find(u => u.employeeId === emp.id)?.profile : undefined;

/** Colaboradores que respondem por um perfil de acesso. */
export const colaboradoresComPerfil = (
  perfil: User['profile'],
  usuarios: User[],
  colaboradores: Employee[]
): Employee[] =>
  usuarios
    .filter(u => u.profile === perfil && u.employeeId)
    .map(u => porId(u.employeeId, colaboradores))
    .filter((e): e is Employee => !!e);

/**
 * O RH que responde pela filial do colaborador. Prefere quem está na MESMA
 * filial; sem ninguém lá, qualquer RH/DP serve — é o destino de última
 * instância do roteamento, e ficar sem ele é pior que atravessar filial.
 */
export function rhDaFilial(
  alvo: Employee | undefined,
  usuarios: User[],
  colaboradores: Employee[]
): Employee | undefined {
  const equipeRH = colaboradoresComPerfil('RH/DP', usuarios, colaboradores).filter(estaDisponivel);
  if (equipeRH.length === 0) return undefined;
  const mesmaFilial = equipeRH.find(e => normalizar(e.branch) === normalizar(alvo?.branch));
  return mesmaFilial || equipeRH[0];
}

/**
 * O alvo da solicitação, a partir das várias formas com que ele é referenciado:
 * o zoom do formulário guarda o nome em `colaboradorId` e o id em
 * `colaboradorIdId` (FormRenderer), enquanto o seed usa `employeeId`/`alvo`.
 */
export function resolverAlvo(
  origem: {
    employeeId?: string; alvoId?: string; alvo?: string; colaborador?: string;
    data?: Record<string, any>;
  },
  colaboradores: Employee[]
): Employee | undefined {
  const d = origem.data || {};
  const referencias = [
    origem.employeeId, origem.alvoId, origem.colaborador, origem.alvo,
    d.employeeId, d.colaboradorIdId, d.colaboradorId, d.colaborador
  ];
  for (const ref of referencias) {
    const achado = porIdOuNome(typeof ref === 'string' ? ref : undefined, colaboradores);
    if (achado) return achado;
  }
  return undefined;
}
