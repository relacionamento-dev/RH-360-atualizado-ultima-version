import { Employee, RHRequest, User } from '../types';

// MATRÍCULA E IDENTIDADE DE QUEM APARECE NA TELA
//
// A matrícula é o número que o RH usa para dizer "esta pessoa". Enquanto ela
// era digitada em cada lugar, o seed acumulou colisões — '00001' era o Diretor
// Geral no cadastro e o "Administrador Demo" no card do solicitante, e o mesmo
// Marcos Vinicius aparecia como '00003 / Gerente de TI' numa tela e
// '00102 / Gerente Comercial' na solicitação RH-2026-0052.
//
// Duas regras resolvem isso, e as duas moram aqui:
// 1. a matrícula é DERIVADA do id do cadastro, nunca escrita à mão;
// 2. quem exibe cargo/setor/matrícula resolve pelo cadastro; o snapshot gravado
//    na solicitação é apenas o que sobra para quem não tem ficha.

/**
 * Matrícula a partir do id do cadastro — `EMP-007` → `00007`.
 *
 * Amarrar a matrícula ao id torna a duplicidade impossível por construção: dois
 * colaboradores só colidiriam se tivessem o mesmo id, que é a chave primária.
 * Pré-admissão mantém o prefixo `AD-` (`EMP-AD-DEMO-002` → `AD-00002`): quem
 * ainda não foi efetivado não tem matrícula definitiva, e é o mesmo prefixo que
 * o cadastro de novas pré-admissões gera em AppConfigContext.
 */
export function matriculaDoCadastro(employeeId: string): string {
  const numero = employeeId.match(/(\d+)\s*$/)?.[1];
  if (!numero) return employeeId;
  const sequencial = String(Number(numero)).padStart(5, '0');
  return /(^|-)AD(-|$)/i.test(employeeId) ? `AD-${sequencial}` : sequencial;
}

/**
 * A ficha por trás de um id que pode ser de USUÁRIO ou de colaborador — os dois
 * namespaces são disjuntos (`GEST-001` vs `EMP-005`), e quase toda tela recebe
 * o primeiro querendo os dados do segundo.
 */
export function colaboradorDoUsuario(
  id: string | undefined,
  usuarios: User[],
  colaboradores: Employee[]
): Employee | undefined {
  if (!id) return undefined;
  const usuario = usuarios.find(u => u.id === id);
  return (
    colaboradores.find(e => e.id === usuario?.employeeId) ||
    colaboradores.find(e => e.id === id)
  );
}

export interface IdentidadeExibida {
  name: string;
  registration?: string;
  role?: string;
  department?: string;
  costCenter?: string;
  branch?: string;
  manager?: string;
  avatar?: string;
  /** A ficha encontrada, quando existe — telas que precisam do resto usam daqui. */
  employee?: Employee;
}

// Snapshots antigos gravaram sentinela em vez de deixar o campo vazio.
const doSnapshot = (v?: string) => (v && v !== 'N/A' && v !== '00000' ? v : undefined);

/**
 * Quem abriu a solicitação, como deve aparecer na tela.
 *
 * O CADASTRO TEM PRECEDÊNCIA sobre o `requesterSnapshot`. Era o contrário, e
 * era isso que deixava a mesma matrícula com cargos diferentes conforme a tela:
 * o detalhe da solicitação lia o snapshot congelado na abertura, enquanto
 * Colaboradores e Perfil 360 liam a ficha. Com o cadastro na frente, promoção,
 * transferência ou correção de matrícula aparecem em todo lugar de uma vez.
 *
 * O snapshot continua sendo o que responde por conta de sistema sem ficha (o
 * "Administrador Demo" não é um colaborador) e por solicitação importada cujo
 * colaborador não está mais na base.
 */
export function resolverSolicitante(
  request: Pick<RHRequest, 'requesterId' | 'solicitante' | 'requesterSnapshot'>,
  usuarios: User[],
  colaboradores: Employee[]
): IdentidadeExibida {
  const usuario = usuarios.find(u => u.id === request.requesterId);
  const ficha = colaboradorDoUsuario(request.requesterId, usuarios, colaboradores);
  const snap = request.requesterSnapshot;

  return {
    name: ficha?.name || usuario?.name || snap?.name || request.solicitante,
    registration: ficha?.registration || doSnapshot(snap?.registration),
    role: ficha?.role || doSnapshot(snap?.role) || usuario?.role,
    department: ficha?.department || doSnapshot(snap?.department),
    costCenter: ficha?.costCenter || doSnapshot(snap?.costCenter),
    branch: ficha?.branch || doSnapshot(snap?.branch),
    manager: ficha?.manager,
    avatar: ficha?.avatar || usuario?.avatar || snap?.avatar,
    employee: ficha
  };
}
