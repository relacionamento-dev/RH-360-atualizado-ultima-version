/**
 * VERBAS RESCISÓRIAS POR TIPO DE DESLIGAMENTO — auditoria da etapa
 * "Benefícios e Encerramento"
 * ==================================================================
 *
 * Rodar:  npx tsx auditoria/simular-verbas-desligamento.ts
 *         npx tsx auditoria/simular-verbas-desligamento.ts --json
 *
 * Percorre os CINCO tipos de desligamento e confere, verba a verba, se a lista
 * exibida na etapa muda como a lei manda: o que é devido, o que se perde, e os
 * números que dependem do tempo de casa (aviso prévio proporcional) e da data
 * de término (prazo de pagamento).
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL: `calcularVerbas`, `diasAvisoPrevio`, `dataLimitePagamento`,
 *   `documentosPadrao`, `checklistPadrao` e `criarEncerramento` vêm inteiros de
 *   src/utils/desligamento.ts — é o mesmo código que a tela usa. Os tipos vêm de
 *   PROCESS_DEFINITIONS['15'] (src/processDefinitions.ts), então um tipo novo no
 *   formulário sem tabela de verbas aqui vira FALHA.
 * - ESPELHO: a tabela ESPERADO abaixo, escrita à mão a partir da CLT. É ela que
 *   torna o teste um teste — se a regra do módulo mudar sem querer, ela acusa.
 */

import { PROCESS_DEFINITIONS } from '../src/processDefinitions';
import { TipoDesligamento } from '../src/types';
import {
  PRAZO_PAGAMENTO_DIAS,
  TIPO_DESLIGAMENTO_LABELS,
  TIPOS_DESLIGAMENTO,
  calcularVerbas,
  checklistPadrao,
  criarEncerramento,
  daDireitoASeguroDesemprego,
  dataLimitePagamento,
  diasAvisoPrevio,
  documentosPadrao,
  totalVerbas
} from '../src/utils/desligamento';

// ---------------------------------------------------------------------------
// Espelho da CLT: o que cada tipo deve pagar (true) e o que perde (false)
// ---------------------------------------------------------------------------

type MapaVerbas = Record<string, boolean>;

const ESPERADO: Record<TipoDesligamento, MapaVerbas> = {
  sem_justa_causa: {
    saldo_salario: true,
    aviso_previo: true,
    decimo_terceiro: true,
    ferias_vencidas: true,
    ferias_proporcionais: true,
    multa_fgts: true,
    saque_fgts: true,
    seguro_desemprego: true
  },
  pedido_demissao: {
    saldo_salario: true,
    aviso_previo: true,
    decimo_terceiro: true,
    ferias_vencidas: true,
    ferias_proporcionais: true,
    multa_fgts: false,
    saque_fgts: false,
    seguro_desemprego: false
  },
  justa_causa: {
    saldo_salario: true,
    aviso_previo: false,
    decimo_terceiro: false,
    ferias_vencidas: true,
    ferias_proporcionais: false,
    multa_fgts: false,
    saque_fgts: false,
    seguro_desemprego: false
  },
  acordo: {
    saldo_salario: true,
    aviso_previo: true,
    decimo_terceiro: true,
    ferias_vencidas: true,
    ferias_proporcionais: true,
    multa_fgts: true,
    saque_fgts: true,
    seguro_desemprego: false
  },
  fim_contrato: {
    saldo_salario: true,
    aviso_previo: false,
    decimo_terceiro: true,
    ferias_vencidas: false,
    ferias_proporcionais: true,
    saque_fgts: true,
    multa_fgts: false,
    seguro_desemprego: false
  }
};

/** Trecho que precisa aparecer no detalhe da verba — é a regra escrita na tela. */
const DETALHE_ESPERADO: Partial<Record<TipoDesligamento, Record<string, string>>> = {
  sem_justa_causa: { multa_fgts: '40%', saque_fgts: 'integral' },
  acordo: { multa_fgts: '20%', saque_fgts: '80%', aviso_previo: 'metade' },
  pedido_demissao: { aviso_previo: 'descontado' },
  fim_contrato: { multa_fgts: 'termo final' }
};

// Colaborador do seed usado como base: admitido em 10/11/2020, desligado em
// 31/07/2026 → 5 anos completos → 30 + 15 = 45 dias de aviso prévio.
const CONTEXTO = { admissao: '2020-11-10', termino: '2026-07-31' };

// ---------------------------------------------------------------------------
// Verificações
// ---------------------------------------------------------------------------

type Severidade = 'OK' | 'FALHA';

interface Achado {
  tipo: string;
  severidade: Severidade;
  verificacao: string;
  detalhe: string;
}

const achados: Achado[] = [];
const registrar = (tipo: string, severidade: Severidade, verificacao: string, detalhe: string) =>
  achados.push({ tipo, severidade, verificacao, detalhe });

const ok = (condicao: boolean): Severidade => (condicao ? 'OK' : 'FALHA');

/** Os tipos do formulário e os tipos com tabela de verbas têm de bater. */
function auditarCobertura() {
  const campo = PROCESS_DEFINITIONS['15'].steps[0].fields.find(f => f.name === 'tipoDesligamento');
  const doFormulario = (campo?.options || []).map((o: any) => (typeof o === 'object' ? o.value : o));

  const semTabela = doFormulario.filter((v: string) => !(TIPOS_DESLIGAMENTO as string[]).includes(v));
  const semCampo = TIPOS_DESLIGAMENTO.filter(t => !doFormulario.includes(t));

  registrar(
    'cobertura',
    ok(doFormulario.length === TIPOS_DESLIGAMENTO.length && semTabela.length === 0 && semCampo.length === 0),
    'todo tipo do formulário tem tabela de verbas',
    `formulário: ${doFormulario.length} tipos · tabela: ${TIPOS_DESLIGAMENTO.length}` +
      (semTabela.length ? ` · SEM TABELA: ${semTabela.join(', ')}` : '') +
      (semCampo.length ? ` · SEM CAMPO: ${semCampo.join(', ')}` : '')
  );
}

function auditarTipo(tipo: TipoDesligamento) {
  const verbas = calcularVerbas(tipo, CONTEXTO);
  const esperado = ESPERADO[tipo];

  // --- 1. Lista completa e na mesma ordem em todos os tipos ---
  registrar(
    tipo,
    ok(verbas.length === Object.keys(esperado).length),
    'lista com todas as verbas',
    `${verbas.length} verbas: ${verbas.map(v => v.id).join(', ')}`
  );

  // --- 2. Devido / não devido, verba a verba ---
  const divergentes = verbas.filter(v => v.devida !== esperado[v.id]);
  registrar(
    tipo,
    ok(divergentes.length === 0),
    'devido/não devido conforme a CLT',
    divergentes.length === 0
      ? `devidas: ${verbas.filter(v => v.devida).map(v => v.label).join(', ') || '(nenhuma)'}`
      : `DIVERGÊNCIA: ${divergentes
          .map(v => `${v.id} está ${v.devida ? 'devido' : 'não devido'}, esperado ${esperado[v.id] ? 'devido' : 'não devido'}`)
          .join(' | ')}`
  );

  // --- 3. Detalhe legal (percentuais e regra do aviso) ---
  const detalhes = DETALHE_ESPERADO[tipo] || {};
  const detalheErrado = Object.entries(detalhes).filter(([id, trecho]) => {
    const verba = verbas.find(v => v.id === id);
    return !verba || !verba.detalhe.toLowerCase().includes(trecho.toLowerCase());
  });
  if (Object.keys(detalhes).length > 0) {
    registrar(
      tipo,
      ok(detalheErrado.length === 0),
      'regra legal descrita na verba',
      detalheErrado.length === 0
        ? Object.keys(detalhes).map(id => `${id}: "${verbas.find(v => v.id === id)?.detalhe}"`).join(' | ')
        : `SEM O TRECHO ESPERADO: ${detalheErrado.map(([id, t]) => `${id} deveria citar "${t}"`).join(' | ')}`
    );
  }

  // --- 4. Seguro-desemprego é direito, não verba com valor ---
  const seguro = verbas.find(v => v.id === 'seguro_desemprego')!;
  registrar(
    tipo,
    ok(seguro.semValor === true && seguro.devida === daDireitoASeguroDesemprego(tipo)),
    'seguro-desemprego sem campo de valor',
    `devido: ${seguro.devida} · semValor: ${seguro.semValor === true}`
  );

  // --- 5. Aviso prévio proporcional (só onde é devido e não é o acordo) ---
  const aviso = verbas.find(v => v.id === 'aviso_previo')!;
  if (tipo === 'sem_justa_causa') {
    const dias = diasAvisoPrevio(CONTEXTO.admissao, CONTEXTO.termino);
    registrar(
      tipo,
      ok(dias === 45 && aviso.detalhe.includes('45')),
      'aviso prévio proporcional calculado da admissão',
      `${dias} dias (30 + 3×5 anos) · detalhe: "${aviso.detalhe}"`
    );
  }
  if (tipo === 'acordo') {
    registrar(
      tipo,
      ok(aviso.detalhe.includes('23') && aviso.detalhe.includes('45')),
      'aviso prévio pela metade no acordo',
      `detalhe: "${aviso.detalhe}"`
    );
  }

  // --- 6. Total soma só o que é devido e tem valor ---
  const comValores = verbas.map(v => (v.devida && !v.semValor ? { ...v, valor: 100 } : { ...v, valor: 999 }));
  const devidasComValor = verbas.filter(v => v.devida && !v.semValor).length;
  registrar(
    tipo,
    ok(totalVerbas(comValores) === devidasComValor * 100),
    'total soma só as verbas devidas',
    `${devidasComValor} verbas × R$ 100 = R$ ${totalVerbas(comValores)} (linhas não devidas ignoradas)`
  );

  // --- 7. Guia do seguro-desemprego só quando há direito ---
  const documentos = documentosPadrao(tipo);
  const temGuia = documentos.some(d => d.id === 'guia_seguro_desemprego');
  registrar(
    tipo,
    ok(temGuia === daDireitoASeguroDesemprego(tipo)),
    'guia do seguro-desemprego só quando dá direito',
    `${documentos.length} documentos${temGuia ? ' (com guia)' : ' (sem guia)'}: ${documentos.map(d => d.id).join(', ')}`
  );

  // --- 8. Estado inicial da etapa ---
  const encerramento = criarEncerramento(tipo, CONTEXTO);
  registrar(
    tipo,
    ok(
      encerramento.tipo === tipo &&
        encerramento.checklist.length === checklistPadrao().length &&
        encerramento.verbas.every(v => v.valor === undefined) &&
        encerramento.documentos.every(d => !d.anexo) &&
        (tipo === 'pedido_demissao') === (encerramento.avisoPrevioModo !== undefined)
    ),
    'etapa nasce vazia e com o modo de aviso certo',
    `checklist: ${encerramento.checklist.length} itens · documentos: ${encerramento.documentos.length} · ` +
      `avisoPrevioModo: ${encerramento.avisoPrevioModo ?? '(não se aplica)'}`
  );
}

/** Prazo legal: 10 dias corridos a partir do término do contrato. */
function auditarPrazoPagamento() {
  const limite = dataLimitePagamento(CONTEXTO.termino);
  const esperado = '10/08/2026'; // 31/07/2026 + 10 dias corridos
  registrar(
    'prazo',
    ok(PRAZO_PAGAMENTO_DIAS === 10 && limite?.toLocaleDateString('pt-BR') === esperado),
    'prazo de pagamento de 10 dias corridos',
    `término ${CONTEXTO.termino} → limite ${limite?.toLocaleDateString('pt-BR')} (esperado ${esperado})`
  );

  registrar(
    'prazo',
    ok(dataLimitePagamento(undefined) === null && diasAvisoPrevio(undefined) === null),
    'sem data não inventa cálculo',
    'admissão/término ausentes devolvem null — a tela mostra só a regra'
  );

  // Teto de 90 dias: 25 anos de casa daria 30 + 75 = 105.
  registrar(
    'prazo',
    ok(diasAvisoPrevio('1998-01-10', '2026-07-31') === 90),
    'aviso prévio limitado a 90 dias',
    `28 anos de casa → ${diasAvisoPrevio('1998-01-10', '2026-07-31')} dias`
  );
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

auditarCobertura();
for (const tipo of TIPOS_DESLIGAMENTO) auditarTipo(tipo);
auditarPrazoPagamento();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(achados, null, 2));
} else {
  let ultimo = '';
  for (const a of achados) {
    if (a.tipo !== ultimo) {
      const titulo = TIPO_DESLIGAMENTO_LABELS[a.tipo as TipoDesligamento] || a.tipo.toUpperCase();
      console.log(`\n${'='.repeat(78)}\n${titulo}\n${'='.repeat(78)}`);
      ultimo = a.tipo;
    }
    console.log(`[${a.severidade === 'OK' ? '  ok  ' : 'FALHA!'}] ${a.verificacao}`);
    console.log(`          ${a.detalhe}`);
  }

  const falhas = achados.filter(a => a.severidade === 'FALHA');
  console.log(`\n${'='.repeat(78)}`);
  console.log(`RESUMO: ${achados.length} verificações · ${falhas.length} falhas`);
  console.log('='.repeat(78));
  for (const f of falhas) console.log(`  FALHA · ${f.tipo} · ${f.verificacao}`);
  process.exitCode = falhas.length > 0 ? 1 : 0;
}
