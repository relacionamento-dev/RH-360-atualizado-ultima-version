import React from 'react';

// CAMPO SOMENTE-LEITURA — regra visual única do app
//
// Fundo BRANCO = você digita. Fundo CINZA = o sistema trouxe (origin 'F'),
// calculou (origin 'K') ou o campo está em modo leitura. Sem essa regra o
// usuário não sabe onde pode escrever: antes cada tela escolhia o próprio
// cinza — o formulário usava `text-gray-700`, o zoom tinha a própria cópia da
// classe, e os blocos de resumo mostravam dado de cadastro em preto, do mesmo
// jeito que um campo editável.
//
// Tom do texto: `gray-600` (#4B5563) sobre `gray-50` (#F9FAFB) dá ~7:1, bem
// acima dos 4.5:1 do WCAG AA que a auditoria de UX cobra (item V06), e ainda
// assim lê como secundário ao lado do `gray-900` dos campos editáveis. Não
// trocar por gray-400/gray-500 sem refazer essa conta.

/** Fundo + borda. Sem cor de texto: quem compõe decide o tom (ver CALC). */
export const READONLY_SURFACE = 'bg-gray-50 border-gray-200';

/** Tom de texto padrão do campo em leitura. */
export const READONLY_TEXT = 'text-gray-600';

/**
 * `<input>`/`<select>`/`<textarea>` em leitura. Não traz borda/raio próprios:
 * entra somando à classe base do campo, que já os define.
 */
export const READONLY_INPUT = `${READONLY_SURFACE} ${READONLY_TEXT} cursor-not-allowed`;

/** Caixa de valor sem `<input>` — já com borda, raio e tipografia. */
export const READONLY_BOX = `${READONLY_SURFACE} ${READONLY_TEXT} border rounded-[12px] px-4 py-2.5 text-[13px] font-bold`;

/** Mesma caixa, em linhas densas (cabeçalho do solicitante, zoom). */
export const READONLY_BOX_SM = `${READONLY_SURFACE} ${READONLY_TEXT} border rounded-[10px] px-3 py-1.5 text-[12px] font-bold`;

/**
 * Rótulo + valor de um dado que veio do cadastro. Use em bloco de leitura
 * ("Identificação do Solicitante", "Resumo da Solicitação") — o equivalente,
 * fora do formulário, de um campo origin 'F'.
 */
export function ReadOnlyField({
  label,
  value,
  size = 'md',
  multiline = false,
  className = '',
  title
}: {
  label: string;
  value?: React.ReactNode;
  size?: 'sm' | 'md';
  /** Texto longo (motivo, justificativa): quebra linha em vez de truncar. */
  multiline?: boolean;
  className?: string;
  /** Tooltip do valor — útil onde ele trunca. */
  title?: string;
}) {
  const vazio = value === undefined || value === null || value === '';
  const caixa = size === 'sm' ? READONLY_BOX_SM : READONLY_BOX;

  return (
    <div className={`space-y-1.5 min-w-0 ${className}`}>
      <span className="label-caps block">{label}</span>
      <div
        className={`${caixa} ${multiline ? 'whitespace-pre-line leading-relaxed' : 'truncate'} ${vazio ? 'text-gray-300' : ''}`}
        title={title ?? (typeof value === 'string' ? value : undefined)}
      >
        {vazio ? '—' : value}
      </div>
    </div>
  );
}
