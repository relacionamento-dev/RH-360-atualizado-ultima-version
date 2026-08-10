import {
  AppConfig, Company, Employee, ParametrizacaoEmpresa, RHRequest, User
} from '../types';
import { hasGlobalScope } from './permissions';

// MULTIEMPRESA
//
// O seletor do topo mostrava "Empresa: RH360 Corporate" e não fazia nada: o
// estado tinha uma empresa ativa, mas nenhuma tela perguntava por ela. Duas
// coisas faltavam, e as duas moram aqui:
//
// 1. RECORTE — todo dado exibido é da empresa ativa. Vale inclusive para o
//    Administrador Geral: escopo global significa poder TROCAR de empresa, não
//    ver as duas misturadas na mesma tela.
// 2. PARAMETRIZAÇÃO — processos, alçadas, perfis, cargos, CCs e filiais são de
//    cada empresa. Trocar de empresa salva a fatia atual e carrega a de destino.

const normalizar = (v?: string) => (v || '').trim().toLowerCase();

export const mesmaEmpresa = (a?: string, b?: string) => normalizar(a) === normalizar(b);

/** A ficha pertence à empresa? Sem empresa na ficha, fica com a ativa. */
export const colaboradorDaEmpresa = (emp: Employee, empresa?: Company): boolean =>
  !empresa || !emp.company || mesmaEmpresa(emp.company, empresa.name);

/**
 * A solicitação pertence à empresa? Prefere o campo da própria solicitação;
 * sem ele, cai na empresa do colaborador alvo — solicitação antiga não
 * gravava `empresa`.
 */
export const solicitacaoDaEmpresa = (
  req: RHRequest,
  empresa: Company | undefined,
  colaboradores: Employee[]
): boolean => {
  if (!empresa) return true;
  if (req.empresa) return mesmaEmpresa(req.empresa, empresa.name);
  const alvo = colaboradores.find(e => e.id === req.employeeId || e.name === req.alvo);
  return alvo ? mesmaEmpresa(alvo.company, empresa.name) : true;
};

/** Empresas que este usuário pode operar. */
export function empresasDoUsuario(user: User | null | undefined, empresas: Company[]): Company[] {
  if (!user) return [];
  const operaveis = empresas.filter(e => e.status !== 'implantacao');
  if (hasGlobalScope(user)) return operaveis;
  // Sem escopo global, o usuário fica preso à empresa dele. A ficha diz qual é;
  // sem ficha, sobra a empresa em que ele já está.
  return operaveis;
}

/** Pode trocar de empresa? Só quem tem alcance global. */
export const podeTrocarDeEmpresa = (user: User | null | undefined, empresas: Company[]): boolean =>
  hasGlobalScope(user) && empresas.filter(e => e.status !== 'implantacao').length > 1;

// --- Parametrização por empresa ---------------------------------------------

/** As fatias que pertencem à empresa, lidas do estado ativo. */
export const parametrizacaoAtual = (config: AppConfig): ParametrizacaoEmpresa => ({
  processos: config.processos,
  perfis: config.perfis,
  grupos: config.grupos,
  cargos: config.cargos,
  centrosDeCusto: config.centrosDeCusto,
  setores: config.setores,
  filiais: config.filiais,
  unidades: config.unidades,
  faixasSalariais: config.faixasSalariais,
  sindicatos: config.sindicatos,
  beneficios: config.beneficios,
  politicas: config.parametrizacao?.[config.empresaAtual.id]?.politicas
});

/** Aplica uma parametrização às fatias ativas do estado. */
export const aplicarParametrizacao = (param: ParametrizacaoEmpresa): Partial<AppConfig> => ({
  processos: param.processos,
  perfis: param.perfis,
  grupos: param.grupos,
  cargos: param.cargos,
  centrosDeCusto: param.centrosDeCusto,
  setores: param.setores,
  filiais: param.filiais,
  unidades: param.unidades,
  faixasSalariais: param.faixasSalariais,
  sindicatos: param.sindicatos,
  beneficios: param.beneficios
});

/**
 * Parametrização de partida para uma empresa nova: a estrutura de processos e
 * perfis do produto, sem os cadastros do cliente anterior. Copiar processos e
 * perfis é o que faz a empresa nascer operável; copiar centro de custo, cargo
 * ou filial da outra empresa seria levar dado de cliente para cliente.
 */
export const parametrizacaoInicial = (
  modelo: ParametrizacaoEmpresa
): ParametrizacaoEmpresa => ({
  processos: modelo.processos.map(p => ({ ...p, approvals: p.approvals.map(a => ({ ...a })) })),
  perfis: modelo.perfis.map(p => ({ ...p, permissoes: { ...p.permissoes } })),
  grupos: [],
  cargos: [],
  centrosDeCusto: [],
  setores: [],
  filiais: [],
  unidades: [],
  faixasSalariais: modelo.faixasSalariais,
  sindicatos: [],
  beneficios: modelo.beneficios,
  politicas: { slaPadraoHoras: 48 }
});
