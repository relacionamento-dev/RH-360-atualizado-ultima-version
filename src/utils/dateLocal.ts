// DATA LOCAL (dia de calendário, sem hora)
//
// Uma data sem hora — '2026-07-14' ou '14/07/2026' — é um dia de calendário,
// não um instante. Passar a string ISO direto para `new Date()` a faz ser lida
// como meia-noite UTC e, em fuso negativo (America/Sao_Paulo), a tela mostra o
// dia anterior. Por isso a construção aqui é sempre `new Date(ano, mês, dia)`,
// que o JS interpreta no fuso local.
//
// Este módulo existe porque a mesma lógica estava duplicada no FormRenderer e
// no RequestDetail, e as cópias divergiram: só a do formulário fazia o parse
// local, e o detalhe exibia todas as datas um dia antes.
//
// NÃO usar para timestamp completo ('2026-07-29T22:02:39.577Z'): esse traz o
// fuso na própria string e deve continuar indo para o `new Date()` nativo.

/**
 * Monta uma data local a partir das partes. `month` é 1-12 (não 0-11).
 * Devolve `null` para data inexistente (31/02), que o `Date` rolaria
 * silenciosamente para o mês seguinte.
 */
export function localDateFromParts(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

const DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A string TEM o formato de uma data sem hora? Diz respeito só ao formato — um
 * '2026-02-31' passa aqui e é rejeitado depois por `localDateFromString`.
 *
 * Serve para quem tem um fallback para `new Date()`: sem esta checagem, uma
 * data inexistente cairia no parse nativo, que a rola em silêncio para o mês
 * seguinte ('2026-02-31' vira 03/03/2026) em vez de ser recusada.
 */
export function isDateOnlyString(value: string): boolean {
  const str = String(value ?? '').trim();
  return DMY.test(str) || ISO_DATE.test(str);
}

/**
 * Faz o parse de uma data sem hora em 'dd/mm/aaaa' ou 'aaaa-mm-dd'.
 * Devolve `null` para qualquer outro formato — inclusive timestamp completo,
 * que é responsabilidade de quem chama (ver nota no topo).
 */
export function localDateFromString(value: string): Date | null {
  if (!value) return null;
  const str = String(value).trim();

  const dmY = str.match(DMY);
  if (dmY) return localDateFromParts(Number(dmY[3]), Number(dmY[2]), Number(dmY[1]));

  const iso = str.match(ISO_DATE);
  if (iso) return localDateFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  return null;
}
