/**
 * SIMULADOR DA CASCATA DE APROVAÇÃO — auditoria do motor parametrizado
 * =====================================================================
 *
 * Rodar:  npx tsx auditoria/simular-aprovacoes.ts
 *         npx tsx auditoria/simular-aprovacoes.ts --json   (saída JSON)
 *
 * Sem browser e sem React: abre uma solicitação em cada um dos 15 processos e
 * percorre a cascata de níveis configurada em Central Adm > Processos >
 * Aprovações, conferindo se o `approvalFlow.ts` respeita a condição de cada
 * nível ("Sempre" / "Se maior que") e se o status final e o histórico ficam
 * corretos.
 *
 * O QUE É REAL E O QUE É ESPELHO
 * ------------------------------
 * - REAL (importado de src/): `buildApprovalChain`, `isStepApplicable`,
 *   `resolveConditionField`, `getCurrentLevelIndex`, `levelLabel`, `slaToMs`,
 *   `ensureApprovalChain` — todo o motor de decisão vem de
 *   src/utils/approvalFlow.ts. A configuração dos processos vem de
 *   INITIAL_RH_PROCESSES (src/data.ts) e os formulários de PROCESS_DEFINITIONS
 *   (src/processDefinitions.ts).
 * - ESPELHO: `abrirSolicitacao` e `aprovarUmNivel` reproduzem as transições de
 *   estado de `createRequest` (AppConfigContext.tsx:363-501) e `approveRequest`
 *   (AppConfigContext.tsx:650-767), que hoje moram dentro do provider React e
 *   não são importáveis fora do browser. As linhas de origem estão citadas
 *   junto de cada transição. Se aquele arquivo mudar, este espelho precisa
 *   acompanhar.
 */

import { INITIAL_RH_PROCESSES } from '../src/data';
import { PROCESS_DEFINITIONS } from '../src/processDefinitions';
import {
  buildApprovalChain,
  ensureApprovalChain,
  getCurrentLevelIndex,
  isStepApplicable,
  levelLabel,
  resolveConditionField,
  slaToMs
} from '../src/utils/approvalFlow';
import { ApprovalStep, FormField, RHProcess, RequestApprovalLevel } from '../src/types';

// ---------------------------------------------------------------------------
// Espelho das transições de estado do AppConfigContext
// ---------------------------------------------------------------------------

interface SolicitacaoSimulada {
  numero: string;
  processId: string;
  status: string;
  etapaAtual: string;
  responsavelAtual: string;
  approvalChain: RequestApprovalLevel[];
  trail: string[];
  data: Record<string, any>;
  historico: { etapa?: string; action?: string; de?: string; para?: string; comentario?: string }[];
  tarefas: { title: string; assignedTo?: string }[];
}

/** Espelha createRequest (AppConfigContext.tsx:363-501), caminho não-rascunho. */
function abrirSolicitacao(process: RHProcess, data: Record<string, any>): SolicitacaoSimulada {
  const acknowledgement = PROCESS_DEFINITIONS[process.id]?.acknowledgement; // :372
  const approvalChain = acknowledgement ? [] : buildApprovalChain(process, data); // :376
  const firstLevel = approvalChain[0]; // :377

  const req: SolicitacaoSimulada = {
    numero: `RH-SIM-${process.id}`,
    processId: process.id,
    status: acknowledgement?.status || 'Pendente de Aprovação', // :414
    etapaAtual: acknowledgement?.etapa || firstLevel?.name || 'Aprovação', // :415
    responsavelAtual: acknowledgement ? 'Colaborador' : (firstLevel?.responsibleLabel || 'Administrador Demo'), // :416-418
    approvalChain,
    trail: acknowledgement?.trail || ['Solicitação', ...approvalChain.map(l => l.name), 'Conclusão'], // :423
    data,
    historico: [
      {
        etapa: 'Solicitação', // :434
        de: 'Novo',
        para: acknowledgement?.etapa || firstLevel?.name || 'Aprovação', // :436
        action: acknowledgement ? 'Confirmação' : 'Envio', // :439
        comentario:
          acknowledgement?.comment ||
          `Solicitação enviada. Fluxo com ${approvalChain.length} nível(is) de aprovação: ${approvalChain
            .map(l => l.name)
            .join(' → ')}.` // :442-443
      }
    ],
    tarefas: []
  };

  if (!acknowledgement) {
    // :449-475 — a tarefa nasce no responsável do PRIMEIRO nível.
    req.tarefas.push({
      title: `Aprovar ${process.name} — ${firstLevel?.name || 'Aprovação'}`,
      assignedTo: firstLevel?.responsibleUserId || 'ADMIN-001'
    });
  }
  // Só para exercitar o cálculo de SLA da abertura (:419).
  if (firstLevel) slaToMs(firstLevel);

  return req;
}

/** Espelha approveRequest (AppConfigContext.tsx:650-767). Retorna false se não há nível pendente. */
function aprovarUmNivel(req: SolicitacaoSimulada, process: RHProcess, aprovador = 'Administrador Demo'): boolean {
  const chain = ensureApprovalChain(req as any, process); // :664
  const levelIndex = getCurrentLevelIndex(chain); // :665
  const approvedLevel = chain[levelIndex]; // :666
  if (!approvedLevel) return false; // :668-671

  const newChain = chain.map((level, i) =>
    i === levelIndex ? { ...level, status: 'aprovado' as const, decidedBy: aprovador } : level
  ); // :674-683

  const nextLevel = newChain[levelIndex + 1]; // :685
  const isFinal = !nextLevel; // :686
  const currentLabel = levelLabel(newChain, levelIndex); // :688

  req.historico.push({
    etapa: approvedLevel.name, // :698
    de: req.status,
    para: isFinal ? 'Concluída' : nextLevel.name, // :700
    action: isFinal ? 'Aprovação Final' : `Aprovação — ${currentLabel}` // :689
  });

  req.status = isFinal ? 'Concluída' : 'Em Aprovação'; // :687
  req.etapaAtual = isFinal ? 'Conclusão' : nextLevel.name; // :709
  req.approvalChain = newChain; // :710
  req.responsavelAtual = isFinal ? '' : nextLevel.responsibleLabel; // :712
  req.trail = ['Solicitação', ...newChain.map(l => l.name), 'Conclusão']; // :714

  if (!isFinal) {
    // :743-766 — abre a tarefa do PRÓXIMO nível.
    req.tarefas.push({
      title: `Aprovar ${process.name} — ${nextLevel.name}`,
      assignedTo: nextLevel.responsibleUserId || 'ADMIN-001'
    });
  }
  return true;
}

// ---------------------------------------------------------------------------
// Geração de dados de formulário plausíveis, a partir de PROCESS_DEFINITIONS
// ---------------------------------------------------------------------------

/** Chave usada no `data` da solicitação — mesma regra do FormRenderer (:194). */
const chaveDoCampo = (f: FormField) => (f as any).id || (f as any).name;

const primeiraOpcao = (f: FormField): any => {
  const opt = f.options?.[0];
  if (opt === undefined) return 'Opção';
  return typeof opt === 'object' ? opt.value : opt;
};

/**
 * Preenche todos os campos visíveis do formulário. `valorMonetario` define
 * quanto vale cada campo do tipo currency — é o que faz uma alçada condicional
 * "Se maior que X" disparar ou não.
 */
function montarDados(processId: string, valorMonetario: number): Record<string, any> {
  const fields = PROCESS_DEFINITIONS[processId]?.steps?.[0]?.fields || [];
  const data: Record<string, any> = {};

  // Duas passadas: campos condicionais só aparecem depois que o campo que os
  // controla (ex.: tipoDesligamento) já tem valor.
  for (let passada = 0; passada < 2; passada++) {
    for (const f of fields) {
      const key = chaveDoCampo(f);
      if (!key || f.type === 'info') continue;
      if (f.condition && !f.condition(data)) continue;
      if (data[key] !== undefined) continue;

      switch (f.type) {
        case 'currency':
        case 'number':
          data[key] = f.type === 'currency' ? valorMonetario : (f.defaultValue ?? 10);
          break;
        case 'select':
        case 'radio':
          data[key] = primeiraOpcao(f);
          break;
        case 'date':
          data[key] = '2026-08-01';
          break;
        case 'boolean':
        case 'checkbox':
          data[key] = true;
          break;
        case 'signature':
          data[key] = { signed: true };
          break;
        case 'zoom':
          data[key] = 'EMP-001';
          break;
        case 'file':
          data[key] = 'arquivo.pdf';
          break;
        case 'calc':
          if (f.calculate) data[key] = f.calculate(data);
          break;
        default:
          data[key] = `${f.label} (simulado)`;
      }
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Verificações
// ---------------------------------------------------------------------------

type Severidade = 'OK' | 'ALERTA' | 'FALHA';

interface Achado {
  processo: string;
  cenario: string;
  severidade: Severidade;
  verificacao: string;
  detalhe: string;
}

const achados: Achado[] = [];
const registrar = (
  processo: string,
  cenario: string,
  severidade: Severidade,
  verificacao: string,
  detalhe: string
) => achados.push({ processo, cenario, severidade, verificacao, detalhe });

/**
 * Confere se o `conditionField` de cada nível existe de fato no formulário do
 * processo. Um campo inexistente faz a comparação numérica cair em `null` e o
 * nível NUNCA disparar (approvalFlow.ts:70-78) — falha silenciosa.
 */
function auditarCamposDeCondicao(process: RHProcess) {
  const fields = PROCESS_DEFINITIONS[process.id]?.steps?.[0]?.fields || [];
  const chaves = new Set(fields.map(chaveDoCampo).filter(Boolean));

  for (const step of process.approvals as ApprovalStep[]) {
    if (!step.conditionField) continue;
    if (chaves.has(step.conditionField)) {
      registrar(
        process.id,
        'config',
        'OK',
        'conditionField existe no formulário',
        `Nível "${step.name}" compara "${step.conditionField}".`
      );
    } else {
      registrar(
        process.id,
        'config',
        'FALHA',
        'conditionField inexistente no formulário',
        `Nível "${step.name}" compara "${step.conditionField}", que não é campo de PROCESS_DEFINITIONS['${process.id}']. ` +
          `Campos monetários disponíveis: ${
            fields
              .filter(f => f.type === 'currency')
              .map(chaveDoCampo)
              .join(', ') || '(nenhum)'
          }. Com operador numérico o nível nunca dispara.`
      );
    }
  }
}

/** Confere a lista `etapas` do processo contra a trilha real gerada pela cascata. */
function auditarEtapas(process: RHProcess, req: SolicitacaoSimulada) {
  const nomesDaCascata = req.approvalChain.map(l => l.name);
  const etapasComAprovacao = process.etapas.filter(e => /aprova|valida|audit|board/i.test(e));

  if (process.approvals.length === 0 && etapasComAprovacao.length > 0) {
    registrar(
      process.id,
      'etapas',
      'ALERTA',
      'etapas prometem aprovação que não existe',
      `etapas = [${process.etapas.join(' → ')}] cita ${etapasComAprovacao.length} etapa(s) de aprovação, ` +
        `mas approvals = [] (o motor injeta o nível implícito "Aprovação", approvalFlow.ts:110-121).`
    );
  } else if (etapasComAprovacao.length !== nomesDaCascata.length && process.approvals.length > 0) {
    registrar(
      process.id,
      'etapas',
      'ALERTA',
      'nº de etapas de aprovação ≠ nº de níveis da cascata',
      `etapas cita ${etapasComAprovacao.length} (${etapasComAprovacao.join(', ') || '—'}) e a cascata tem ` +
        `${nomesDaCascata.length} (${nomesDaCascata.join(', ') || '—'}).`
    );
  } else {
    registrar(process.id, 'etapas', 'OK', 'etapas coerentes com a cascata', `[${process.etapas.join(' → ')}]`);
  }
}

/** Abre uma solicitação e percorre a cascata inteira, verificando cada invariante. */
function simularProcesso(process: RHProcess, cenario: string, valorMonetario: number) {
  const data = montarDados(process.id, valorMonetario);
  const acknowledgement = PROCESS_DEFINITIONS[process.id]?.acknowledgement;

  // --- Cascata esperada: níveis ativos que passaram na condição, na ordem ---
  const esperados = (process.approvals as ApprovalStep[])
    .filter(s => isStepApplicable(s, data))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const req = abrirSolicitacao(process, data);

  // --- Protocolo (acknowledgement): nasce concluído, sem cascata e sem tarefa ---
  if (acknowledgement) {
    const ok =
      req.approvalChain.length === 0 &&
      req.status === acknowledgement.status &&
      req.tarefas.length === 0 &&
      JSON.stringify(req.trail) === JSON.stringify(acknowledgement.trail);
    registrar(
      process.id,
      cenario,
      ok ? 'OK' : 'FALHA',
      'protocolo sem aprovação',
      `status="${req.status}", cascata=${req.approvalChain.length} nível(is), tarefas=${req.tarefas.length}, ` +
        `trilha=[${req.trail.join(' → ')}].`
    );
    return;
  }

  // --- A cascata materializada bate com a configuração filtrada? ---
  const semAlcadas = process.approvals.length === 0;
  if (semAlcadas) {
    const ok = req.approvalChain.length === 1 && req.approvalChain[0].id === 'default-approval';
    registrar(
      process.id,
      cenario,
      ok ? 'OK' : 'FALHA',
      'processo sem alçadas usa nível implícito',
      `cascata = [${req.approvalChain.map(l => l.name).join(' → ')}] (approvalFlow.ts:110-121).`
    );
  } else {
    const obtido = req.approvalChain.map(l => l.id).join(',');
    const alvo = esperados.map(s => s.id).join(',');
    registrar(
      process.id,
      cenario,
      obtido === alvo ? 'OK' : 'FALHA',
      'cascata = níveis configurados que passaram na condição',
      `esperado [${esperados.map(s => s.name).join(' → ') || '—'}] · obtido [${
        req.approvalChain.map(l => l.name).join(' → ') || '—'
      }]`
    );

    // Cada nível condicional: o disparo bate com a leitura do dado?
    for (const step of process.approvals as ApprovalStep[]) {
      if (!step.conditionOperator) continue;
      const campo = resolveConditionField(step, data);
      const valorLido = campo ? data[campo] : undefined;
      const disparou = req.approvalChain.some(l => l.id === step.id);
      registrar(
        process.id,
        cenario,
        'OK',
        `condição do nível "${step.name}"`,
        `regra: ${step.conditionField || '(auto)'} ${step.conditionOperator} ${step.conditionValue} · ` +
          `campo resolvido: ${campo ?? 'NENHUM'} · valor lido: ${
            valorLido === undefined ? 'undefined' : JSON.stringify(valorLido)
          } · disparou: ${disparou ? 'SIM' : 'NÃO'}`
      );
    }
  }

  // --- Estado de abertura ---
  const primeiro = req.approvalChain[0];
  registrar(
    process.id,
    cenario,
    req.status === 'Pendente de Aprovação' && req.etapaAtual === primeiro?.name ? 'OK' : 'FALHA',
    'abertura: status e etapa iniciais',
    `status="${req.status}", etapaAtual="${req.etapaAtual}", responsável="${req.responsavelAtual}", ` +
      `tarefa para ${req.tarefas[0]?.assignedTo}.`
  );

  // --- Percorre a cascata até o fim ---
  const totalNiveis = req.approvalChain.length;
  let passos = 0;
  while (aprovarUmNivel(req, process)) {
    passos++;
    if (passos > 10) break; // trava contra laço infinito
    if (req.status === 'Concluída') break;
  }

  const todosAprovados = req.approvalChain.every(l => l.status === 'aprovado');
  registrar(
    process.id,
    cenario,
    passos === totalNiveis && req.status === 'Concluída' && todosAprovados ? 'OK' : 'FALHA',
    'cascata percorrida até a conclusão',
    `${passos}/${totalNiveis} aprovações · status final "${req.status}" · etapaAtual "${req.etapaAtual}" · ` +
      `todos os níveis aprovados: ${todosAprovados ? 'sim' : 'não'}`
  );

  // --- Histórico: 1 entrada de abertura + 1 por nível ---
  const esperadoHist = 1 + totalNiveis;
  registrar(
    process.id,
    cenario,
    req.historico.length === esperadoHist ? 'OK' : 'FALHA',
    'histórico completo',
    `${req.historico.length}/${esperadoHist} entradas: ${req.historico
      .map(h => `${h.etapa}→${h.para}`)
      .join(' | ')}`
  );

  // --- Tarefas: 1 por nível ---
  registrar(
    process.id,
    cenario,
    req.tarefas.length === totalNiveis ? 'OK' : 'FALHA',
    'uma tarefa por nível da cascata',
    `${req.tarefas.length}/${totalNiveis}: ${req.tarefas.map(t => t.assignedTo).join(', ')}`
  );
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const CENARIOS: { nome: string; valor: number }[] = [
  { nome: 'valor baixo (R$ 3.000)', valor: 3000 },
  { nome: 'valor alto (R$ 50.000)', valor: 50000 }
];

for (const process of INITIAL_RH_PROCESSES) {
  auditarCamposDeCondicao(process);
  for (const c of CENARIOS) {
    simularProcesso(process, c.nome, c.valor);
  }
  // Etapas: avaliadas uma vez, sobre o cenário de valor alto.
  const reqAlto = abrirSolicitacao(process, montarDados(process.id, 50000));
  if (!PROCESS_DEFINITIONS[process.id]?.acknowledgement) auditarEtapas(process, reqAlto);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(achados, null, 2));
} else {
  const nomeDoProcesso = (id: string) => INITIAL_RH_PROCESSES.find(p => p.id === id)?.name || id;
  let ultimo = '';
  for (const a of achados) {
    if (a.processo !== ultimo) {
      console.log(`\n${'='.repeat(78)}\nPROCESSO ${a.processo} — ${nomeDoProcesso(a.processo)}\n${'='.repeat(78)}`);
      ultimo = a.processo;
    }
    const marca = a.severidade === 'OK' ? '  ok  ' : a.severidade === 'ALERTA' ? 'ALERTA' : 'FALHA!';
    console.log(`[${marca}] (${a.cenario}) ${a.verificacao}`);
    console.log(`          ${a.detalhe}`);
  }

  const falhas = achados.filter(a => a.severidade === 'FALHA');
  const alertas = achados.filter(a => a.severidade === 'ALERTA');
  console.log(`\n${'='.repeat(78)}`);
  console.log(`RESUMO: ${achados.length} verificações · ${falhas.length} falhas · ${alertas.length} alertas`);
  console.log('='.repeat(78));
  for (const f of [...falhas, ...alertas]) {
    console.log(`  ${f.severidade === 'FALHA' ? 'FALHA ' : 'ALERTA'} · Processo ${f.processo} (${f.cenario}) · ${f.verificacao}`);
  }
  process.exitCode = falhas.length > 0 ? 1 : 0;
}
