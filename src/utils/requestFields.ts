import { ProcessDefinition } from '../types';
import { isDateOnlyString, localDateFromString } from './dateLocal';

// LEITURA DOS DADOS DE UMA SOLICITAÇÃO
//
// `request.data` guarda valores crus, com a chave sendo `id || name` do campo
// (FormRenderer). Para exibir é preciso voltar à definição do processo: é ela
// que tem o rótulo, o tipo e — nos selects — o texto de cada opção.
//
// Estas funções eram privadas do RequestDetail. Saíram para cá quando a etapa
// de Benefícios e Encerramento passou a mostrar o mesmo resumo do módulo de
// leitura: duas cópias da mesma leitura divergiriam.

/**
 * Definição do campo que gravou esta chave. Vários campos podem compartilhar o
 * mesmo `id` (cargo ↔ cargoRep ↔ cargoNovo, motivo ↔ motivoJustaCausa), então o
 * desempate é pela `condition` avaliada sobre os próprios dados salvos — é o
 * campo que estava visível quando a solicitação foi preenchida.
 */
export function findFieldDef(
  processDef: ProcessDefinition | undefined,
  key: string,
  data: Record<string, any> = {}
) {
  if (!processDef) return null;
  const matches = processDef.steps
    .flatMap(step => step.fields)
    .filter(f => ((f as any).id || f.name) === key);
  if (matches.length === 0) return null;
  return matches.find(f => !f.condition || f.condition(data)) || matches[0];
}

/** `options` aceita string[] ou { label, value }[] — exibe sempre o rótulo. */
export function getOptionLabel(fieldDef: any, value: any): string {
  const options = fieldDef?.options;
  if (!Array.isArray(options)) return String(value);
  const match = options.find((opt: any) => (opt && typeof opt === 'object' ? opt.value : opt) === value);
  if (match === undefined) return String(value);
  return typeof match === 'object' ? String(match.label ?? value) : String(match);
}

export function parseRequestDate(dateString: string): Date | null {
  if (!dateString) return null;
  const str = String(dateString).trim();
  // Data sem hora ('2026-07-14' / '14/07/2026'): o resultado local é final,
  // inclusive quando é null (31/02) — deixar cair no parse nativo faria o
  // Date rolar em silêncio para 03/03.
  if (isDateOnlyString(str)) return localDateFromString(str);
  // Timestamp completo (createdAt, decidedAt, histórico): já traz fuso, então
  // o parse nativo é o correto aqui.
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRequestDate(dateString?: string): string {
  if (!dateString) return '—';
  const date = parseRequestDate(dateString);
  if (!date) return dateString;
  return date.toLocaleDateString('pt-BR');
}

export function formatCurrencyBR(value: any): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}
